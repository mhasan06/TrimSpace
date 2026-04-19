import { prisma } from "./prisma";
import { getSydneyTodayStr, toSydneyTime, getSydneyDayOfWeek } from "./date-utils";

/**
 * Enterprise Time Engine
 * Dynamically resolves Shop constraints + Barbers limit + Breaks to calculate available interval slots.
 */
export async function getAvailableSlots(tenantId: string, requestedDateStr: string, totalServiceDurationMinutes: number) {
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
  // Ensure we treat the input string as a local Sydney date
  const targetDate = new Date(`${requestedDateStr}T00:00:00`); 
  const dayOfWeek = getSydneyDayOfWeek(targetDate);

  const businessDay = await prisma.businessHours.findFirst({
    where: { tenantId, dayOfWeek }
  });

  if (!businessDay) {
    return { availableSlots: [], reason: "No business hours configured for this day." };
  }

  // 4. Resolve maximum simultaneous capacity based on Today's exact activeStaff configuration
  const staffCount = businessDay.activeStaff || 1;

  if (staffCount === 0) {
    return { availableSlots: [], reason: "No staff assigned to work on this day." };
  }

  // 4. Fetch all existing appointments for this exact date (UTC Bounds)
  // we use midnight to midnight in Sydney localized to UTC for the query
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

  // 5. Build Slot Engine Logic
  // Convert HH:mm to minutes from midnight for easy math
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

  // Iterate over 30 minute chunks
  for (let currentSlot = openMins; currentSlot + totalServiceDurationMinutes <= closeMins; currentSlot += 30) {
    const projectedEndTime = currentSlot + totalServiceDurationMinutes;

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

    // Check concurrency capacity against existing appointments
    let concurrentBookingsForSlot = 0;
    
    for (const appt of existingAppointments) {
      // Use Sydney Time conversion for overlap checks
      const sStart = toSydneyTime(appt.startTime);
      const sEnd = toSydneyTime(appt.endTime);
      
      const apptStart = sStart.hours * 60 + sStart.minutes;
      const apptEnd = sEnd.hours * 60 + sEnd.minutes;

      // Overlap calculation
      if (Math.max(currentSlot, apptStart) < Math.min(projectedEndTime, apptEnd)) {
        concurrentBookingsForSlot++;
      }
    }

    // Is there a Barber available to take this new slot block?
    if (concurrentBookingsForSlot < staffCount) {
       availableSlots.push(minsToTime(currentSlot));
    }
  }

  return { 
    availableSlots, 
    reason: null, 
    debug: { capacity: staffCount, baseSlots: availableSlots.length }
  };
}
