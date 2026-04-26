import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";
import { getSydneyTodayStr, toSydneyTime, getSydneyDayOfWeek } from "./date-utils";

/**
 * Enterprise Time Engine
 * Dynamically resolves Shop constraints + Barbers limit + Breaks to calculate available interval slots.
 */
/**
 * Enterprise Time Engine V3 - CONCURRENT & SEQUENTIAL
 * Dynamically resolves Shop constraints + Barbers limit + Breaks.
 * Now supports 'Group Mode' for simultaneous parallel bookings.
 */
export async function getAvailableSlots(
  tenantId: string, 
  requestedDateStr: string, 
  serviceGroups: number[][], // Grouped by person: [[30, 45], [30]]
  preferredBarberId?: string
) {
  const isGroup = serviceGroups.length > 1;
  // 1. Check for Same-Day Prevention (SYDNEY CONTEXT)
  const today = getSydneyTodayStr();
  console.log(`[SlotEngine] Checking ${requestedDateStr} (Today is ${today})`);
  console.log(`[SlotEngine] ServiceGroups:`, JSON.stringify(serviceGroups));

  if (requestedDateStr <= today) {
    return { availableSlots: [], reason: "Same-day bookings are disabled. Appointments must be secured by 11:59 PM the night before." };
  }

  // 2. Check for overrides (e.g. Public Holidays, Renovations)
  const override = await prisma.scheduleOverride.findFirst({
    where: { tenantId, date: requestedDateStr, isClosed: true }
  });

  if (override) {
    return { availableSlots: [], reason: override.reason || "Shop is closed today." };
  }

  // 3. Resolve target day of week (Sydney Context)
  const targetDate = new Date(`${requestedDateStr}T00:00:00`); 
  const dayOfWeek = getSydneyDayOfWeek(targetDate);

  const businessDay = await prisma.businessHours.findFirst({
    where: { tenantId, dayOfWeek }
  });

  if (!businessDay) {
    return { availableSlots: [], reason: "No business hours configured for this day." };
  }

  // 4. Resolve maximum simultaneous capacity
  let staffCount = businessDay.activeStaff || 1;
  if (preferredBarberId) {
    staffCount = 1; // Only one person at a time if a specific barber is chosen
  }

  console.log(`[SlotEngine] Day: ${dayOfWeek}, Staff: ${staffCount}`);

  if (staffCount === 0) {
    return { availableSlots: [], reason: "No staff assigned to work on this day." };
  }

  // 5. Fetch all existing appointments for this exact date (UTC Bounds)
  // Sydney 00:00 is 14 hours behind UTC (AEST). We fetch a wide window to cover the local day.
  const windowStart = new Date(`${requestedDateStr}T00:00:00Z`);
  windowStart.setHours(windowStart.getHours() - 14);
  const windowEnd = new Date(`${requestedDateStr}T23:59:59Z`);
  windowEnd.setHours(windowEnd.getHours() + 11);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: windowStart, lte: windowEnd },
      ...(preferredBarberId ? { barberId: preferredBarberId } : {})
    },
    select: { startTime: true, endTime: true }
  });

  console.log(`[SlotEngine] Found ${existingAppointments.length} existing appointments in window.`);

  // 6. Slot Calculation Setup
  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const openMins = timeToMins(businessDay.openTime);
  const closeMins = timeToMins(businessDay.closeTime);
  const lunchStartMins = businessDay.lunchStart ? timeToMins(businessDay.lunchStart) : null;
  const lunchEndMins = businessDay.lunchEnd ? timeToMins(businessDay.lunchEnd) : null;

  const availableSlots: string[] = [];

  /**
   * CONNOISSEUR-AWARE PACKING
   * We calculate the window needed by finding the person with the longest sequential job list.
   */
  const calculateRequiredWindow = (groups: number[][]) => {
    // Each person's services run sequentially
    const personDurations = groups.map(g => g.reduce((a, b) => a + b, 0));
    return Math.max(...personDurations);
  };

  const requiredWindow = calculateRequiredWindow(serviceGroups);
  const lanesNeeded = serviceGroups.length;

  const slotObjects: { time: string, finishTime: string }[] = [];

  // Iterate over 30 minute chunks
  for (let currentSlot = openMins; currentSlot <= closeMins - 15; currentSlot += 30) {
    // Check if overlaps with lunch strictly
    if (lunchStartMins !== null && lunchEndMins !== null) {
      if (currentSlot >= lunchStartMins && currentSlot < lunchEndMins) continue;
    }

    /**
     * SIMULTANEOUS START ENGINE
     * For a premium group experience, all connoisseurs must start at the same time.
     * We check if 'lanesNeeded' specialists are free at 'currentSlot'.
     */
    let isPossible = true;
    const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
    const maxIndivDuration = Math.max(...personDurations);

    // Check concurrency at the exact start of the slot
    // We need 'lanesNeeded' lanes free simultaneously for their entire respective durations.
    // To simplify and ensure they "start together", we check if we can fit each person's duration.
    
    // We'll track which lanes are busy to ensure we don't double count
    let laneOccupancyBySegment: Record<number, number> = {};
    
    // Check every 5 mins from currentSlot to (currentSlot + maxIndivDuration)
    for (let segment = currentSlot; segment < currentSlot + maxIndivDuration; segment += 5) {
      let busyCount = 0;
      for (const a of existingAppointments) {
        // Only count if it's the SAME local day as requested
        const aDateStr = a.startTime.toLocaleString('en-US', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' });
        // Format: MM/DD/YYYY to YYYY-MM-DD
        const [am, ad, ay] = aDateStr.split('/');
        const isoADate = `${ay}-${am}-${ad}`;
        if (isoADate !== requestedDateStr) continue;

        const s = toSydneyTime(a.startTime);
        const e = toSydneyTime(a.endTime);
        const start = s.hours * 60 + s.minutes;
        const end = e.hours * 60 + e.minutes;
        if (segment >= start && segment < end) busyCount++;
      }
      
      // At the START (segment === currentSlot), we MUST have lanesNeeded free.
      // Throughout the journey, we must ensure we don't exceed staffCount.
      // Actually, since people don't switch barbers, we just need to ensure 
      // that each person's lane is free for their specific duration.
      
      // Simpler: If at any point (busyCount + lanesNeeded) > staffCount, 
      // it means we don't have enough barbers to sustain the group.
      if (busyCount + lanesNeeded > staffCount) {
        isPossible = false;
        break;
      }
    }

    if (isPossible) {
      slotObjects.push({ 
        time: minsToTime(currentSlot), 
        finishTime: minsToTime(currentSlot + maxIndivDuration) 
      });
    }
  }

  return { 
    availableSlots: slotObjects, 
    reason: null, 
    debug: { capacity: staffCount, mode: isGroup ? "GROUP" : "SOLO", count: serviceGroups.length }
  };
}
