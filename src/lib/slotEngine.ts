import { prisma } from "./prisma";
import { AU_TIMEZONE } from "./date-utils";

/**
 * Enterprise Absolute UTC Engine (V6)
 * Fixes timezone drift "for life" by using pure UTC timestamps anchored to Sydney.
 */
export async function getAvailableSlots(
  tenantId: string, 
  requestedDateStr: string, 
  serviceGroups: number[][],
  preferredBarberId?: string
) {
  // 1. Resolve Sydney Day to Absolute UTC Window
  // requestedDateStr is "YYYY-MM-DD"
  // We need to know when this day starts and ends in Sydney, as UTC.
  const getSydneyEdge = (dateStr: string, timeStr: string) => {
    return new Date(new Date(`${dateStr}T${timeStr}`).toLocaleString('en-US', { timeZone: AU_TIMEZONE }));
  };

  // This gives us the exact UTC moments for the Sydney business day
  const [businessDay, override, barbers] = await Promise.all([
    prisma.businessHours.findFirst({ 
      where: { 
        tenantId, 
        dayOfWeek: new Date(new Date(`${requestedDateStr}T12:00:00`).toLocaleString('en-US', { timeZone: AU_TIMEZONE })).getDay() 
      } 
    }),
    prisma.scheduleOverride.findFirst({ where: { tenantId, date: requestedDateStr, isClosed: true } }),
    prisma.user.findMany({ where: { tenantId, role: "BARBER", isActive: true } })
  ]);

  if (override) return { availableSlots: [], reason: override.reason || "Shop is closed." };
  if (!businessDay) return { availableSlots: [], reason: "No business hours." };

  // Generate the absolute UTC start and end for the shop's day
  const shopOpenUTC = new Date(`${requestedDateStr}T${businessDay.openTime}:00`).toLocaleString('en-US', { timeZone: AU_TIMEZONE });
  const shopCloseUTC = new Date(`${requestedDateStr}T${businessDay.closeTime}:00`).toLocaleString('en-US', { timeZone: AU_TIMEZONE });
  
  const startMoment = new Date(shopOpenUTC);
  const endMoment = new Date(shopCloseUTC);

  // 2. Fetch Appointments for the Expanded Window
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(startMoment.getTime() - 24*60*60*1000), lte: new Date(endMoment.getTime() + 24*60*60*1000) }
    }
  });

  // 3. Resolve Durations
  const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
  const maxIndivDuration = Math.max(0, ...personDurations);
  const lanesNeeded = personDurations.length;

  if (lanesNeeded > barbers.length) {
    return { availableSlots: [], reason: `Party size exceeds total specialists.` };
  }

  // 4. Generate Slots
  const availableSlots: { time: string, finishTime: string }[] = [];
  const stepMs = 30 * 60 * 1000;
  const durationMs = maxIndivDuration * 60 * 1000;

  const lunchS = businessDay.lunchStart ? new Date(new Date(`${requestedDateStr}T${businessDay.lunchStart}:00`).toLocaleString('en-US', { timeZone: AU_TIMEZONE })).getTime() : null;
  const lunchE = businessDay.lunchEnd ? new Date(new Date(`${requestedDateStr}T${businessDay.lunchEnd}:00`).toLocaleString('en-US', { timeZone: AU_TIMEZONE })).getTime() : null;

  for (let currentMs = startMoment.getTime(); currentMs + durationMs <= endMoment.getTime(); currentMs += stepMs) {
    // Lunch Collision
    if (lunchS && lunchE) {
      if (currentMs < lunchE && currentMs + durationMs > lunchS) continue;
    }

    const freeBarbers = barbers.filter(b => {
      if (preferredBarberId && b.id !== preferredBarberId) return false;
      
      return !appointments.some(a => {
        if (a.barberId !== b.id) return false;
        // PURE UTC COLLISION DETECTION
        const aStart = a.startTime.getTime();
        const aEnd = a.endTime.getTime();
        return (currentMs < aEnd && currentMs + durationMs > aStart);
      });
    });

    if (freeBarbers.length >= lanesNeeded) {
      const timeStr = new Date(currentMs).toLocaleTimeString('en-AU', { timeZone: AU_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
      const finishStr = new Date(currentMs + durationMs).toLocaleTimeString('en-AU', { timeZone: AU_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
      
      availableSlots.push({ time: timeStr, finishTime: finishStr });
    }
  }

  return { availableSlots, reason: null };
}
