'use client';

import { useState } from "react";
import { handleRefundAndCancel } from "@/app/my-bookings/actions";

export default function CancelButton({ appointmentId, amountPaidStripe, amountPaidGift }: {
  appointmentId: string;
  amountPaidStripe?: number;
  amountPaidGift?: number;
}) {
  const [loading, setLoading] = useState(false);

  const stripeHalf = ((amountPaidStripe || 0) * 0.5).toFixed(2);
  const giftHalf   = ((amountPaidGift   || 0) * 0.5).toFixed(2);

  const confirmMsg = [
    "Cancel this booking? As per shop policy, a 50% admin fee applies.",
    Number(stripeHalf) > 0 ? `  • $${stripeHalf} refunded to your card (Stripe)` : "",
    Number(giftHalf)   > 0 ? `  • $${giftHalf} restored to your gift card` : "",
  ].filter(Boolean).join("\n");

  const handleCancel = async () => {
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    const result = await handleRefundAndCancel(appointmentId);
    setLoading(false);

    if (result.success) {
      const parts: string[] = ["✅ Appointment cancelled."];
      if (result.refunded) {
        if (result.stripeRefundAmount && result.stripeRefundAmount > 0) {
          parts.push(`$${result.stripeRefundAmount.toFixed(2)} Stripe refund initiated.`);
        }
        if (result.giftRefundAmount && result.giftRefundAmount > 0) {
          parts.push(`$${result.giftRefundAmount.toFixed(2)} restored to gift card.`);
        }
        if (result.stripeError) {
          parts.push(`⚠️ Note: Stripe portion may need manual review (${result.stripeError}).`);
        }
      } else {
        parts.push("No payment was charged — booking removed.");
      }
      alert(parts.join("\n"));
      window.location.reload();
    } else {
      alert("❌ Error: " + result.error);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      style={{
        background: 'rgba(255, 68, 68, 0.1)',
        color: '#ff4444',
        border: '1px solid rgba(255,68,68,0.4)',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        fontSize: '0.8rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        opacity: loading ? 0.6 : 1,
      }}
      onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#ff4444'; e.currentTarget.style.color = 'white'; } }}
      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)'; e.currentTarget.style.color = '#ff4444'; }}
    >
      {loading ? "⏳ Processing refund..." : "Cancel Appointment"}
    </button>
  );
}
