'use client';

import { useState } from "react";
import { handleRefundAndCancel } from "@/app/my-bookings/actions";

export default function CancelButton({ 
  appointmentId, 
  amountPaidStripe, 
  amountPaidGift,
  label = "Cancel Appointment",
  small = false
}: {
  appointmentId: string;
  amountPaidStripe?: number;
  amountPaidGift?: number;
  label?: string;
  small?: boolean;
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
    const result = (await handleRefundAndCancel(appointmentId)) as any;
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
        background: small ? 'transparent' : '#fff1f2',
        color: '#e11d48',
        border: small ? 'none' : '1px solid #fecdd3',
        padding: small ? '0.4rem 0.8rem' : '0.6rem 1.2rem',
        borderRadius: '12px',
        fontSize: small ? '0.75rem' : '0.85rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 800,
        transition: 'all 0.2s ease',
        opacity: loading ? 0.6 : 1,
        boxShadow: small ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
      }}
      onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#e11d48'; e.currentTarget.style.color = 'white'; } }}
      onMouseOut={e => { e.currentTarget.style.background = small ? 'transparent' : '#fff1f2'; e.currentTarget.style.color = '#e11d48'; }}
    >
      {loading ? "⏳..." : label}
    </button>
  );
}
