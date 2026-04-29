"use client";

import { useEffect, useRef } from "react";
import { calculateServiceFees } from "@/lib/pricing";

export type BookingDetail = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  amountPaidStripe: number;
  amountPaidGift: number;
  tenantName: string;
  tenantSlug: string;
  tenantAddress?: string | null;
  serviceName: string;
  servicePrice: number;
  barberName?: string | null;
  invoiceUrl?: string | null;
  hasReview?: boolean;
};

interface Props {
  booking: BookingDetail | null;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  CONFIRMED:        { bg: "rgba(16,185,129,0.1)",  color: "#10b981", border: "#10b981" },
  COMPLETED:        { bg: "rgba(16,185,129,0.1)",  color: "#10b981", border: "#10b981" },
  CANCELLED:        { bg: "rgba(255,68,68,0.1)",   color: "#ff4444", border: "#ff4444" },
  PENDING:          { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", border: "#fbbf24" },
  PARTIAL_REFUNDED: { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24", border: "#fbbf24" },
  PAID:             { bg: "rgba(16,185,129,0.1)",  color: "#10b981", border: "#10b981" },
  UNPAID:           { bg: "rgba(255,68,68,0.1)",   color: "#ff4444", border: "#ff4444" },
};

function Badge({ label }: { label: string }) {
  const style = STATUS_COLORS[label] ?? { bg: "rgba(255,255,255,0.05)", color: "white", border: "rgba(255,255,255,0.2)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "0.25rem 0.7rem",
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: 800,
      letterSpacing: "0.5px",
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
    }}>
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "0.8rem", opacity: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", flexShrink: 0, marginRight: "1rem" }}>{label}</span>
      <span style={{ fontSize: "0.9rem", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function BookingDetailModal({ booking, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!booking) return null;

  const bookingIdShort = `#${booking.id.slice(-8).toUpperCase()}`;
  const startDate = new Date(booking.startTime);
  const endDate   = new Date(booking.endTime);

  const fmt = (d: Date) => d.toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const fmtTime = (d: Date) => d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true });

  const totalPaid = (Number(booking.amountPaidStripe) + Number(booking.amountPaidGift)).toFixed(2);
  const methodLabel: Record<string, string> = {
    CARD_ONLINE: "Credit / Debit Card (Online)",
    CARD_INSTORE: "Card (In-Store)",
    CASH: "Cash",
    GIFT_CARD: "Gift Card",
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div style={{
        width: "100%", maxWidth: "500px",
        background: "#111",
        border: "1px solid rgba(212,175,55,0.25)",
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
        animation: "slideUp 0.2s ease",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "1.5rem 1.8rem 1rem", background: "rgba(212,175,55,0.05)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.7rem", opacity: 0.4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "0.3rem" }}>Booking Details</p>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#D4AF37", fontFamily: "monospace", margin: 0 }}>{bookingIdShort}</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, color: "white", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Status bar */}
        <div style={{ padding: "0.9rem 1.8rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
          <Badge label={booking.status} />
          <Badge label={booking.paymentStatus} />
        </div>

        {/* Body */}
        <div style={{ padding: "0.5rem 1.8rem 1.5rem", color: "white" }}>

          {/* Shop */}
          <div style={{ padding: "1rem 0 0.5rem", marginBottom: "0.25rem" }}>
            <p style={{ fontSize: "0.7rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.2rem" }}>Shop</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 800 }}>{booking.tenantName}</p>
            {booking.tenantAddress && <p style={{ fontSize: "0.82rem", opacity: 0.5, marginTop: "0.2rem" }}>📍 {booking.tenantAddress}</p>}
          </div>

          <Row label="Service"    value={booking.serviceName} />
          <Row label="Barber / Stylist" value={booking.barberName ?? "—"} />
          <Row label="Date"       value={fmt(startDate)} />
          <Row label="Time"       value={`${fmtTime(startDate)} – ${fmtTime(endDate)}`} />

          {/* Payment */}
          <div style={{ marginTop: "1.2rem", padding: "1.1rem", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: "0.7rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.8rem" }}>Payment Breakdown</p>

            {(() => {
              const fees = calculateServiceFees(Number(booking.servicePrice));
              const totalFees = fees.totalCustomerPrice - fees.basePrice;
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>Secure Processing & Platform Fees</span>
                    <span style={{ fontWeight: 700 }}>${totalFees.toFixed(2)}</span>
                  </div>
                </>
              );
            })()}

            {Number(booking.amountPaidStripe) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>💳 Card</span>
                <span style={{ fontWeight: 700 }}>${Number(booking.amountPaidStripe).toFixed(2)}</span>
              </div>
            )}
            {Number(booking.amountPaidGift) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>🎁 Gift Credit</span>
                <span style={{ fontWeight: 700 }}>${Number(booking.amountPaidGift).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.6rem", marginTop: "0.3rem" }}>
              <span style={{ fontWeight: 800 }}>Total Paid</span>
              <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#D4AF37" }}>${totalPaid}</span>
            </div>
            <p style={{ fontSize: "0.75rem", opacity: 0.4, marginTop: "0.5rem" }}>
              via {methodLabel[booking.paymentMethod] ?? booking.paymentMethod}
            </p>
          </div>

          {/* Invoice */}
          {booking.invoiceUrl && (
            <a
              href={booking.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", marginTop: "1.2rem", padding: "0.9rem", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "10px", color: "#D4AF37", textDecoration: "none", fontSize: "0.85rem", fontWeight: 700, textAlign: "center" }}
            >
              📄 View / Print Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
