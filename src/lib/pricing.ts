/**
 * TrimSpace Pricing Utility
 * 
 * Logic:
 * 1. Base Price (Set by Merchant)
 * 2. Payment Processing (1.7%)
 * 3. Processing Flat Fee (A$0.30)
 * 4. Platform Service Fee (A$0.50)
 */

export const PRICING_CONSTANTS = {
  STRIPE_PERCENT: 0.017,
  STRIPE_FLAT: 0.30,
  PLATFORM_FEE: 0.50,
};

export function calculateServiceFees(basePrice: number, customCommissionPercent?: number) {
  const commissionRate = customCommissionPercent !== undefined ? customCommissionPercent : PRICING_CONSTANTS.STRIPE_PERCENT;
  const stripePercentFee = basePrice * commissionRate;
  const totalFees = stripePercentFee + PRICING_CONSTANTS.STRIPE_FLAT + PRICING_CONSTANTS.PLATFORM_FEE;
  
  // Round to nearest $0.10
  const rawTotal = basePrice + totalFees;
  const totalCustomerPrice = Math.round(rawTotal * 10) / 10;
  
  return {
    basePrice,
    stripePercentFee,
    stripeFlatFee: PRICING_CONSTANTS.STRIPE_FLAT,
    platformFee: PRICING_CONSTANTS.PLATFORM_FEE,
    totalFees: totalCustomerPrice - basePrice, // Recalculate total fees based on rounded price
    totalCustomerPrice
  };
}

/**
 * Calculates the cancellation penalty based on dynamic platform settings.
 */
export function calculateCancellationPenalty(
  basePrice: number, 
  startTime: Date, 
  settings: {
    penaltyLongThreshold: number;
    penaltyShortThreshold: number;
    penaltyLongRate: number;
    penaltyMidRate: number;
    penaltyShortRate: number;
  }
) {
  const now = new Date();
  const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let penaltyRate = settings.penaltyShortRate; // Default to max penalty (under 24h)

  if (diffInHours > settings.penaltyLongThreshold) {
    penaltyRate = settings.penaltyLongRate; // Over 48h
  } else if (diffInHours > settings.penaltyShortThreshold) {
    penaltyRate = settings.penaltyMidRate; // Between 24h and 48h
  }

  return basePrice * penaltyRate;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}
