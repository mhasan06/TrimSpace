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
    prisma.user.findMany({ 
      where: { 
        tenantId, 
        role: "BARBER", 
        isActive: true,
        OR: [
          // 1. Explicit Shift for this date exists and is NOT a day off
          {
            staffShifts: {
              some: {
                date: requestedDateStr,
                isDayOff: false
              }
            }
          },
          // 2. NO explicit shift exists, so use the Weekly Template
          {
            AND: [
              {
                staffShifts: {
                  none: { date: requestedDateStr }
                }
              },
              {
                staffSchedules: {
                  some: {
                    dayOfWeek: getSydneyUTC(requestedDateStr, "12:00").getUTCDay(),
                    isActive: true
                  }
                }
              }
            ]
          }
        ]
      } 
    })
  ]);

  if (override) return { availableSlots: [], reason: override.reason || "Shop is closed." };
  if (!businessDay) return { availableSlots: [], reason: "No business hours." };

  const startMoment = getSydneyUTC(requestedDateStr, businessDay.openTime);
  const endMoment = getSydneyUTC(requestedDateStr, businessDay.closeTime);

  console.log(`[SlotEngine V8.1] --- DIAGNOSTIC START ---`);
  console.log(`[SlotEngine V8.1] Shop: ${requestedDateStr} | Goal: ${businessDay.openTime}`);
  console.log(`[SlotEngine V8.1] UTC Anchor: ${startMoment.toISOString()}`);

  // 2. Fetch Appointments
  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(startMoment.getTime() - 12*60*60*1000), lte: new Date(endMoment.getTime() + 12*60*60*1000) }
    }
  });

  // 3. Resolve Durations
  const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
  // FAIL-SAFE: Enforce a minimum 15-minute duration to prevent "Ghost Freedom"
  const maxIndivDuration = Math.max(15, ...personDurations);
  const lanesNeeded = personDurations.length || 1;

  // 4. Generate Slots
  const availableSlots: { time: string, finishTime: string }[] = [];
  const stepMs = 30 * 60 * 1000;
  const durationMs = maxIndivDuration * 60 * 1000;

  const lunchS = businessDay.lunchStart ? getSydneyUTC(requestedDateStr, businessDay.lunchStart).getTime() : null;
  const lunchE = businessDay.lunchEnd ? getSydneyUTC(requestedDateStr, businessDay.lunchEnd).getTime() : null;

  // V8.1 HARD-CODED FORMATTER: Zero browser locale dependence
  const formatHHmm = (ms: number) => {
    const d = new Date(ms);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: AU_TIMEZONE,
      hour12: false,
      hour: 'numeric',
      minute: 'numeric'
    });
    const pts = formatter.formatToParts(d);
    const h = pts.find(p => p.type === 'hour')?.value.padStart(2, '0');
    const m = pts.find(p => p.type === 'minute')?.value.padStart(2, '0');
    return `${h}:${m}`;
  };

  for (let currentMs = startMoment.getTime(); currentMs + durationMs <= endMoment.getTime(); currentMs += stepMs) {
    if (lunchS && lunchE) {
      if (currentMs < lunchE && currentMs + durationMs > lunchS) continue;
    }

    const freeBarbers = barbers.filter(b => {
      if (preferredBarberId && b.id !== preferredBarberId) return false;
      
      const conflict = appointments.find(a => {
        if (a.barberId !== b.id) return false;
        return (currentMs < a.endTime.getTime() && currentMs + durationMs > a.startTime.getTime());
      });
      return !conflict;
    });

    if (freeBarbers.length >= lanesNeeded) {
      availableSlots.push({ 
        time: formatHHmm(currentMs), 
        finishTime: formatHHmm(currentMs + durationMs),
        availableBarberIds: freeBarbers.map(b => b.id)
      });
    }
  }

  console.log(`[SlotEngine V8.1] Result: ${availableSlots.length} slots found. First: ${availableSlots[0]?.time || 'NONE'}`);
  return { availableSlots, reason: null };
}
