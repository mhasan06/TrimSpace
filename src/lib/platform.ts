
import { prisma } from "@/lib/prisma";

/**
 * CUTOVER CONFIGURATION
 * Date from which the new Dynamic Fee Engine takes effect.
 * Before this date, we use the Legacy Fallback (1.7%).
 */
export const PLATFORM_CUTOVER_DATE = new Date("2026-04-30T00:00:00Z");

/**
 * Resolves the effective platform fee for a specific point in time.
 * This ensures historical accuracy when generating reports or settlements.
 */
export async function getEffectivePlatformFee(targetDate: Date) {
  // 1. If date is before cutover, return legacy fallback
  if (targetDate < PLATFORM_CUTOVER_DATE) {
    return 0.017; // Legacy 1.7%
  }

  // 2. Lookup the active schedule for this date
  const schedule = await prisma.platformFeeSchedule.findFirst({
    where: {
      effectiveFrom: {
        lte: targetDate
      }
    },
    orderBy: {
      effectiveFrom: 'desc'
    }
  });

  if (schedule) {
    return Number(schedule.feePercentage);
  }

  // 3. Fallback to Global Settings
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_global' }
  });

  return settings?.defaultPlatformFee ?? 0.017;
}
