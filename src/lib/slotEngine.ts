import { prisma } from "./prisma";
import { AU_TIMEZONE } from "./date-utils";

export async function getAvailableSlots(
  tenantId: string, 
  requestedDateStr: string, 
  serviceGroups: string[][], // Now passing Groups of Service IDs
  preferredBarberId?: string
) {
  const getSydneyUTC = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: AU_TIMEZONE,
      hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const sHour = parseInt(parts.find(p => p.type === 'hour')?.value || "0", 10);
    const sDay = parseInt(parts.find(p => p.type === 'day')?.value || "0", 10);
    let diffHours = sHour - hh;
    if (sDay !== d) diffHours += (sDay > d || (sDay === 1 && d > 27)) ? 24 : -24;
    return new Date(date.getTime() - (diffHours * 3600000));
  };

  const flatServiceIds = serviceGroups.flat();

  const [businessDay, override, barbers, services] = await Promise.all([
    prisma.businessHours.findFirst({ 
      where: { 
        tenantId, 
        dayOfWeek: getSydneyUTC(requestedDateStr, "12:00").getUTCDay()
      } 
    }),
    prisma.scheduleOverride.findFirst({ where: { tenantId, date: requestedDateStr, isClosed: true } }),
    prisma.user.findMany({ 
      where: { 
        tenantId, role: "BARBER", isActive: true,
        OR: flatServiceIds.map(sid => ({ services: { some: { id: sid } } })),
        OR: [
          { staffShifts: { some: { date: requestedDateStr, isDayOff: false } } },
          { AND: [
            { staffShifts: { none: { date: requestedDateStr } } },
            { staffSchedules: { some: { dayOfWeek: getSydneyUTC(requestedDateStr, "12:00").getUTCDay(), isActive: true } } }
          ]}
        ]
      },
      include: { services: { select: { id: true } } }
    }),
    prisma.service.findMany({ where: { id: { in: flatServiceIds } } })
  ]);

  if (override) return { availableSlots: [], reason: override.reason || "Shop is closed." };
  if (!businessDay) return { availableSlots: [], reason: "No business hours." };

  const startMoment = getSydneyUTC(requestedDateStr, businessDay.openTime);
  const endMoment = getSydneyUTC(requestedDateStr, businessDay.closeTime);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(startMoment.getTime() - 12*60*60*1000), lte: new Date(endMoment.getTime() + 12*60*60*1000) }
    }
  });

  // Calculate durations for each group
  const groupDurations = serviceGroups.map(group => {
    return group.reduce((acc, sid) => {
      const s = services.find(srv => srv.id === sid);
      return acc + (s?.durationMinutes || 45);
    }, 0);
  });

  const maxDuration = Math.max(15, ...groupDurations);
  const lanesNeeded = serviceGroups.length || 1;
  const stepMs = 30 * 60 * 1000;
  const durationMs = maxDuration * 60 * 1000;

  const lunchS = businessDay.lunchStart ? getSydneyUTC(requestedDateStr, businessDay.lunchStart).getTime() : null;
  const lunchE = businessDay.lunchEnd ? getSydneyUTC(requestedDateStr, businessDay.lunchEnd).getTime() : null;

  const formatHHmm = (ms: number) => {
    const d = new Date(ms);
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: AU_TIMEZONE, hour12: false, hour: 'numeric', minute: 'numeric' });
    const pts = formatter.formatToParts(d);
    const h = pts.find(p => p.type === 'hour')?.value.padStart(2, '0');
    const m = pts.find(p => p.type === 'minute')?.value.padStart(2, '0');
    return `${h}:${m}`;
  };

  const availableSlots: any[] = [];
  for (let currentMs = startMoment.getTime(); currentMs + durationMs <= endMoment.getTime(); currentMs += stepMs) {
    if (currentMs < Date.now() + (2 * 60 * 60 * 1000)) continue;
    if (lunchS && lunchE && currentMs < lunchE && currentMs + durationMs > lunchS) continue;

    const freeBarbers = barbers.filter(b => {
      if (preferredBarberId && b.id !== preferredBarberId) return false;
      const conflict = appointments.find(a => a.barberId === b.id && (currentMs < a.endTime.getTime() && currentMs + durationMs > a.startTime.getTime()));
      return !conflict;
    });

    const canAssignAll = () => {
      if (freeBarbers.length < lanesNeeded) return false;
      const usedBarberIds = new Set<string>();
      for (const groupIds of serviceGroups) {
        const assigned = freeBarbers.find(b => {
          if (usedBarberIds.has(b.id)) return false;
          const bServices = new Set(b.services.map((s:any) => s.id));
          return groupIds.every(sid => bServices.has(sid));
        });
        if (assigned) usedBarberIds.add(assigned.id);
        else return false;
      }
      return true;
    };

    if (canAssignAll()) {
      availableSlots.push({ 
        time: formatHHmm(currentMs), 
        finishTime: formatHHmm(currentMs + durationMs),
        availableBarberIds: freeBarbers.map(b => b.id)
      });
    }
  }

  return { availableSlots, reason: null };
}
