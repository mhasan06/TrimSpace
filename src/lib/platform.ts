
import { prisma } from "@/lib/prisma";

/**
 * Resolves the effective platform fee for a specific point in time.
 * This ensures historical accuracy when generating reports or settlements.
 */
export async function getEffectivePlatformFee(targetDate: Date) {
  // 1. Check for specific scheduled overrides first (highest priority)
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

  // 2. Lookup the Global Settings & Cutover
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_global' }
  });

  if (!settings) return 0.017; // Critical Fallback

  // 3. If a cutover date is set, check if we are before it
  if (settings.defaultFeeEffectiveFrom && targetDate < settings.defaultFeeEffectiveFrom) {
    return 0.017; // Legacy Rules
  }

  return Number(settings.defaultPlatformFee);
}
