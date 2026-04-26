import { prisma } from "./prisma";
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
  serviceDurations: number[], 
  isGroup: boolean = false
) {
  // 1. Check for Same-Day Prevention (SYDNEY CONTEXT)
  const today = getSydneyTodayStr();
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
  const staffCount = businessDay.activeStaff || 1;

  if (staffCount === 0) {
    return { availableSlots: [], reason: "No staff assigned to work on this day." };
  }

  // 5. Fetch all existing appointments for this exact date (UTC Bounds)
  const startOfDay = new Date(targetDate.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  startOfDay.setHours(0,0,0,0);
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23,59,59,999);

  const existingAppointments: any[] = await prisma.$queryRaw`
    SELECT "startTime", "endTime" 
    FROM "Appointment" 
    WHERE "tenantId" = ${tenantId} 
    AND "status" != 'CANCELLED'
    AND "startTime" >= ${startOfDay} 
    AND "startTime" <= ${endOfDay}
  `;

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
   * SMART LANE PACKING ENGINE
   * We distribute services across staffCount lanes to find the minimum required duration.
   */
  const calculateRequiredWindow = (durations: number[], lanes: number, groupMode: boolean) => {
    if (!groupMode) return durations.reduce((a, b) => a + b, 0);
    
    // For groups: Distribute services into 'lanes' as evenly as possible (Greedy Packing)
    const laneLoads = new Array(lanes).fill(0);
    const sortedDurations = [...durations].sort((a, b) => b - a); // Big jobs first
    
    for (const d of sortedDurations) {
      // Find lane with current minimum load
      const minLaneIdx = laneLoads.indexOf(Math.min(...laneLoads));
      laneLoads[minLaneIdx] += d;
    }
    
    return Math.max(...laneLoads);
  };

  const requiredWindow = calculateRequiredWindow(serviceDurations, staffCount, isGroup);

  // Iterate over 30 minute chunks
  for (let currentSlot = openMins; currentSlot + requiredWindow <= closeMins; currentSlot += 30) {
    const projectedEndTime = currentSlot + requiredWindow;

    // Check if overlaps with lunch strictly
    let overlapsLunch = false;
    if (lunchStartMins !== null && lunchEndMins !== null) {
      if ((currentSlot >= lunchStartMins && currentSlot < lunchEndMins) || 
          (projectedEndTime > lunchStartMins && projectedEndTime <= lunchEndMins) ||
          (currentSlot <= lunchStartMins && projectedEndTime >= lunchEndMins)) {
        overlapsLunch = true;
      }
    }
    if (overlapsLunch) continue;

    // Concurrency Calculation
    // We check availability in 5-minute segments across the required window
    let isWindowFeasible = true;
    
    // For Smart Packing, we need 'staffCount' lanes available for the 'requiredWindow'.
    // Actually, we need to ensure that the SUM of availability across all lanes can take the workload.
    // Simpler: We need 'staffCount' lanes available simultaneously for the required duration.
    
    for (let segment = currentSlot; segment < projectedEndTime; segment += 5) {
      let activeBookingsAtSegment = 0;
      
      for (const appt of existingAppointments) {
        const sStart = toSydneyTime(appt.startTime);
        const sEnd = toSydneyTime(appt.endTime);
        const apptStart = sStart.hours * 60 + sStart.minutes;
        const apptEnd = sEnd.hours * 60 + sEnd.minutes;

        if (segment >= apptStart && segment < apptEnd) {
          activeBookingsAtSegment++;
        }
      }

      // If active bookings + our needed lanes > capacity, it's a fail.
      // In Group Mode, we are using 'staffCount' lanes for the 'requiredWindow'.
      // Wait, no! If we have 4 services (30m) and 2 barbers, we use 2 lanes for 60 mins.
      // So 'neededLanes' is always 'staffCount' in Group Mode? No.
      // It's the number of lanes that actually have a load.
      
      const laneLoads = new Array(staffCount).fill(0);
      const sortedDurations = [...serviceDurations].sort((a, b) => b - a);
      for (const d of sortedDurations) {
        const minLaneIdx = laneLoads.indexOf(Math.min(...laneLoads));
        laneLoads[minLaneIdx] += d;
      }
      const lanesNeeded = laneLoads.filter(l => l > 0).length;

      const neededLanes = isGroup ? lanesNeeded : 1;
      if (activeBookingsAtSegment + neededLanes > staffCount) {
        isWindowFeasible = false;
        break;
      }
    }

    if (isWindowFeasible) {
      availableSlots.push(minsToTime(currentSlot));
    }
  }

  return { 
    availableSlots, 
    reason: null, 
    debug: { capacity: staffCount, mode: isGroup ? "GROUP" : "SOLO", count: serviceDurations.length }
  };
}
