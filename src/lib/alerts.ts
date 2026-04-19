import { prisma } from "./prisma";

export type AlertType = 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'GIFT_CARD_REDEEMED' | 'SETTLEMENT_PROCESSED';

/**
 * Creates a persistent alert for the merchant dashboard.
 */
export async function createMerchantAlert(tenantId: string, type: AlertType, message: string, metadata?: any) {
  try {
    await prisma.merchantAlert.create({
      data: {
        tenantId,
        type,
        message,
        metadata: metadata || null,
        isRead: false
      } as any
    });
    console.log(`[ALERT] Persistent notification created for Tenant ${tenantId}: ${type}`);
  } catch (err) {
    console.error("Failed to create merchant alert:", err);
  }
}
