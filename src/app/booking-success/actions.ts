import { fulfillBooking } from "@/lib/fulfillment";

export async function finalizeStripeBooking(sessionId: string): Promise<{ success: boolean; error?: string; tenantSlug?: string; targetDate?: string; selectedTime?: string }> {
  const result = await fulfillBooking(sessionId);
  if (result.success) {
      return { 
          success: true, 
          tenantSlug: (result as any).tenantSlug, 
          targetDate: (result as any).targetDate, 
          selectedTime: (result as any).selectedTime,
      };
  }
  return { success: false, error: (result as any).error || "Unknown Error" };
}
