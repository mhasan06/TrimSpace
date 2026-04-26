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
     * DYNAMIC LANE SIMULATION
     * We simulate assigning each person to the next available lane.
     */
    const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
    
    // Tracks when each barber lane becomes free for THIS group
    let laneFreeTimes = new Array(staffCount).fill(currentSlot);
    
    // Sort people by duration (descending) to pack efficiently
    const sortedPeople = [...personDurations].sort((a, b) => b - a);

    let isPossible = true;
    for (const duration of sortedPeople) {
      // Find the lane that becomes free EARLIEST for this person
      // But we must also account for existingAppointments in that lane!
      
      let bestLaneIdx = -1;
      let earliestStartTime = Infinity;

      for (let l = 0; l < staffCount; l++) {
        let candidateStart = laneFreeTimes[l];
        
        // Find the first window in this lane that can take the duration
        // (Simplified: We just push it until a window is free)
        let foundWindow = false;
        while (candidateStart + duration <= closeMins) {
           let overlap = false;
           // In Group mode without specific barbers, we assume we can find A lane.
           // To be safe, we check if at least ONE lane is free at any given moment.
           // However, to calculate Finish Time, we need to pick a lane.
           
           // Check if this specific lane segment is busy with an existing appt
           // (This is a simplification: we check total occupancy at each segment)
           let laneOccupancyMax = 0;
           for (let seg = candidateStart; seg < candidateStart + duration; seg += 5) {
              let busyAtSeg = 0;
              for (const a of existingAppointments) {
                const s = toSydneyTime(a.startTime);
                const e = toSydneyTime(a.endTime);
                if (seg >= (s.hours*60+s.minutes) && seg < (e.hours*60+e.minutes)) busyAtSeg++;
              }
              laneOccupancyMax = Math.max(laneOccupancyMax, busyAtSeg);
           }

           if (laneOccupancyMax < staffCount) {
             foundWindow = true;
             break;
           }
           candidateStart += 5;
        }

        if (foundWindow && candidateStart < earliestStartTime) {
          earliestStartTime = candidateStart;
          bestLaneIdx = l;
        }
      }

      if (bestLaneIdx === -1) {
        isPossible = false;
        break;
      }

      laneFreeTimes[bestLaneIdx] = earliestStartTime + duration;
    }

    if (isPossible) {
      const maxFinish = Math.max(...laneFreeTimes);
      if (maxFinish <= closeMins) {
        slotObjects.push({ 
          time: minsToTime(currentSlot), 
          finishTime: minsToTime(maxFinish) 
        });
      }
    }
  }

  return { 
    availableSlots: slotObjects, 
    reason: null, 
    debug: { capacity: staffCount, mode: isGroup ? "GROUP" : "SOLO", count: serviceGroups.length }
  };
}
