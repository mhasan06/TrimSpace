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

  // 3. Fetch Appointments (Expanded Window for Timezone Safety)
  // We fetch anything +/- 24h to be absolutely safe
  const windowStart = new Date(`${requestedDateStr}T00:00:00Z`);
  windowStart.setDate(windowStart.getDate() - 1);
  const windowEnd = new Date(`${requestedDateStr}T23:59:59Z`);
  windowEnd.setDate(windowEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: windowStart, lte: windowEnd }
    }
  });

  // Pre-calculate Sydney components for appointments to avoid repeated Intl calls
  const processedApps = appointments.map(a => {
    const s = toSydneyTime(a.startTime);
    const e = toSydneyTime(a.endTime);
    
    // Get Sydney YYYY-MM-DD components
    const dParts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(a.startTime);
    
    const y = dParts.find(p => p.type === 'year')?.value;
    const m = dParts.find(p => p.type === 'month')?.value;
    const d = dParts.find(p => p.type === 'day')?.value;
    const isoDate = `${y}-${m}-${d}`;

    return {
      barberId: a.barberId,
      isoDate,
      startMins: s.hours * 60 + s.minutes,
      endMins: e.hours * 60 + e.minutes
    };
  });

  // 4. Main Slot Loop
  const availableSlots: { time: string, finishTime: string }[] = [];

  for (let currentSlot = openMins; currentSlot + maxIndivDuration <= closeMins; currentSlot += 30) {
    // Lunch Check
    if (lunchS !== null && lunchE !== null) {
      if (currentSlot < lunchE && currentSlot + maxIndivDuration > lunchS) continue;
    }

    const freeBarbers = barbers.filter(b => {
       if (preferredBarberId && b.id !== preferredBarberId) return false;
       
       return !processedApps.some(a => {
          if (a.barberId !== b.id) return false;
          if (a.isoDate !== requestedDateStr) return false;

          // Standard Overlap
          return (currentSlot < a.endMins && currentSlot + maxIndivDuration > a.startMins);
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
