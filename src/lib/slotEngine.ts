import { prisma } from "./prisma";
import { toSydneyTime, getSydneyDayOfWeek, getSydneyTodayStr } from "./date-utils";

/**
 * Enterprise Simple Specialist Engine (V5)
 * Simplified Block-Based Scheduling for maximum reliability.
 */
export async function getAvailableSlots(
  tenantId: string, 
  requestedDateStr: string, 
  serviceGroups: number[][], // [[30, 45], [30]]
  preferredBarberId?: string
) {
  // 1. Basic Checks
  const today = getSydneyTodayStr();
  if (requestedDateStr <= today) {
    return { availableSlots: [], reason: "Same-day bookings disabled." };
  }

  const targetDate = new Date(`${requestedDateStr}T00:00:00`); 
  const dayOfWeek = getSydneyDayOfWeek(targetDate);

  const [businessDay, override, barbers] = await Promise.all([
    prisma.businessHours.findFirst({ where: { tenantId, dayOfWeek } }),
    prisma.scheduleOverride.findFirst({ where: { tenantId, date: requestedDateStr, isClosed: true } }),
    prisma.user.findMany({ where: { tenantId, role: "BARBER", isActive: true } })
  ]);

  if (override) return { availableSlots: [], reason: override.reason || "Shop is closed." };
  if (!businessDay) return { availableSlots: [], reason: "No business hours." };

  const timeToMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const minsToTime = (m: number) => {
    const hh = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openMins = timeToMins(businessDay.openTime);
  const closeMins = timeToMins(businessDay.closeTime);
  const lunchS = businessDay.lunchStart ? timeToMins(businessDay.lunchStart) : null;
  const lunchE = businessDay.lunchEnd ? timeToMins(businessDay.lunchEnd) : null;

  // 2. Resolve Person Blocks
  const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
  const maxIndivDuration = Math.max(0, ...personDurations);
  const lanesNeeded = personDurations.length;

  if (lanesNeeded > barbers.length) {
    return { availableSlots: [], reason: `Party size exceeds total specialists (${barbers.length}).` };
  }

  // 3. Fetch Appointments (Wide Window)
  const windowStart = new Date(`${requestedDateStr}T00:00:00Z`);
  windowStart.setHours(windowStart.getHours() - 14);
  const windowEnd = new Date(`${requestedDateStr}T23:59:59Z`);
  windowEnd.setHours(windowEnd.getHours() + 11);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: windowStart, lte: windowEnd }
    }
  });

  // 4. Main Slot Loop
  const availableSlots: { time: string, finishTime: string }[] = [];

  for (let currentSlot = openMins; currentSlot + maxIndivDuration <= closeMins; currentSlot += 30) {
    // Lunch Check
    if (lunchS !== null && lunchE !== null) {
      if (currentSlot < lunchE && currentSlot + maxIndivDuration > lunchS) continue;
    }

    // SIMULTANEOUS START CHECK
    // We need 'lanesNeeded' barbers to EACH be free for their person's duration.
    // For simplicity, we check if EACH person can be assigned to a unique free barber at 'currentSlot'.
    
    const freeBarbers = barbers.filter(b => {
       if (preferredBarberId && b.id !== preferredBarberId) return false;
       
       // Check if this specific barber has any conflict on the requested day/time
       return !appointments.some(a => {
          if (a.barberId !== b.id) return false;
          
          // ISO Date Check (Sydney)
          const isoADate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(a.startTime);
          if (isoADate !== requestedDateStr) return false;

          const s = toSydneyTime(a.startTime);
          const e = toSydneyTime(a.endTime);
          const aStart = s.hours * 60 + s.minutes;
          const aEnd = e.hours * 60 + e.minutes;

          // Standard Overlap: [start, end) intersects [aStart, aEnd)
          return (currentSlot < aEnd && currentSlot + maxIndivDuration > aStart);
       });
    });

    if (freeBarbers.length >= lanesNeeded) {
      availableSlots.push({
        time: minsToTime(currentSlot),
        finishTime: minsToTime(currentSlot + maxIndivDuration)
      });
    }
  }

  return { availableSlots, reason: null };
}
