import { prisma } from "./prisma";
import { AU_TIMEZONE } from "./date-utils";

/**
 * Enterprise Absolute Anchor Engine (V8)
 * Forces perfect alignment with the Sydney clock by using a verified UTC correction.
 */
export async function getAvailableSlots(
  tenantId: string, 
  requestedDateStr: string, 
  serviceGroups: number[][],
  preferredBarberId?: string
) {
  // HELPER: Convert Sydney "YYYY-MM-DD" + "HH:mm" to the TRUE UTC moment
  const getSydneyUTC = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    
    // 1. Create a UTC baseline assuming the components are UTC
    const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
    
    // 2. Find what the Sydney clock says for this UTC moment
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: AU_TIMEZONE,
      hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
    
    const parts = formatter.formatToParts(date);
    const sHour = parseInt(parts.find(p => p.type === 'hour')?.value || "0", 10);
    const sDay = parseInt(parts.find(p => p.type === 'day')?.value || "0", 10);
    
    // 3. Calculate the hour difference (Accounting for day wraps)
    // If goal is 9am (hh=9) and Sydney says 7pm (sHour=19) on the same day:
    // Difference is 10 hours.
    let diffHours = sHour - hh;
    if (sDay !== d) {
       // If Sydney is on a different day, adjust the diff
       diffHours += (sDay > d || (sDay === 1 && d > 27)) ? 24 : -24;
    }
    
    return new Date(date.getTime() - (diffHours * 3600000));
  };

  const [businessDay, override, barbers] = await Promise.all([
    prisma.businessHours.findFirst({ 
      where: { 
        tenantId, 
        dayOfWeek: getSydneyUTC(requestedDateStr, "12:00").getUTCDay() // getUTCDay on corrected date is safe
      } 
    }),
    prisma.scheduleOverride.findFirst({ where: { tenantId, date: requestedDateStr, isClosed: true } }),
    prisma.user.findMany({ where: { tenantId, role: "BARBER", isActive: true } })
  ]);

  if (override) return { availableSlots: [], reason: override.reason || "Shop is closed." };
  if (!businessDay) return { availableSlots: [], reason: "No business hours." };

  const startMoment = getSydneyUTC(requestedDateStr, businessDay.openTime);
  const endMoment = getSydneyUTC(requestedDateStr, businessDay.closeTime);

  // 2. Fetch Appointments (+/- 12h window is plenty for UTC drift)
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(startMoment.getTime() - 12*60*60*1000), lte: new Date(endMoment.getTime() + 12*60*60*1000) }
    }
  });

  // 3. Resolve Durations
  const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
  const maxIndivDuration = Math.max(0, ...personDurations);
  const lanesNeeded = personDurations.length;

  if (lanesNeeded > barbers.length) {
    return { availableSlots: [], reason: `Party size exceeds specialists.` };
  }

  // 4. Generate Slots
  const availableSlots: { time: string, finishTime: string }[] = [];
  const stepMs = 30 * 60 * 1000;
  const durationMs = maxIndivDuration * 60 * 1000;

  const lunchS = businessDay.lunchStart ? getSydneyUTC(requestedDateStr, businessDay.lunchStart).getTime() : null;
  const lunchE = businessDay.lunchEnd ? getSydneyUTC(requestedDateStr, businessDay.lunchEnd).getTime() : null;

  for (let currentMs = startMoment.getTime(); currentMs + durationMs <= endMoment.getTime(); currentMs += stepMs) {
    if (lunchS && lunchE) {
      if (currentMs < lunchE && currentMs + durationMs > lunchS) continue;
    }

    const freeBarbers = barbers.filter(b => {
      if (preferredBarberId && b.id !== preferredBarberId) return false;
      
      return !appointments.some(a => {
        if (a.barberId !== b.id) return false;
        const aStart = a.startTime.getTime();
        const aEnd = a.endTime.getTime();
        return (currentMs < aEnd && currentMs + durationMs > aStart);
      });
    });

    if (freeBarbers.length >= lanesNeeded) {
      const timeStr = new Date(currentMs).toLocaleTimeString('en-GB', { timeZone: AU_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
      const finishStr = new Date(currentMs + durationMs).toLocaleTimeString('en-GB', { timeZone: AU_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
      
      availableSlots.push({ time: timeStr, finishTime: finishStr });
    }
  }

  return { availableSlots, reason: null };
}
