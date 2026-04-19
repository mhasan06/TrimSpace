"use client";

import { useState } from "react";
import BookingDetailModal, { type BookingDetail } from "@/components/BookingDetailModal";
import ReviewModal from "@/components/ReviewModal";

export default function SessionHistoryTable({ rows }: { rows: BookingDetail[] }) {
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [reviewApp, setReviewApp] = useState<BookingDetail | null>(null);

  return (
    <>
      {selected && <BookingDetailModal booking={selected} onClose={() => setSelected(null)} />}
      
      {reviewApp && (
        <ReviewModal 
          isOpen={true}
          onClose={() => setReviewApp(null)}
          appointmentId={reviewApp.id}
          serviceName={reviewApp.serviceName}
          barberName={reviewApp.barberName || "your barber"}
        />
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {["Booking ID", "Date", "Shop", "Service", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "0.6rem 1rem", textAlign: "left", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.8px", opacity: 0.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseOut={e  => (e.currentTarget.style.background = "transparent")}
              >
                {/* Clickable Booking ID */}
                <td style={{ padding: "0.8rem 1rem", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setSelected(row)}
                    title="Click to view booking details"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "#D4AF37",
                      background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: "6px",
                      padding: "0.25rem 0.55rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.5px",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(212,175,55,0.22)"; e.currentTarget.style.borderColor = "#D4AF37"; }}
                    onMouseOut={e  => { e.currentTarget.style.background = "rgba(212,175,55,0.1)";  e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; }}
                  >
                    #{row.id.slice(-8).toUpperCase()}
                  </button>
                </td>

                <td style={{ padding: "0.8rem 1rem", whiteSpace: "nowrap", opacity: 0.85 }}>
                  {new Date(row.startTime).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "0.8rem 1rem" }}>{row.tenantName}</td>
                <td style={{ padding: "0.8rem 1rem" }}>{row.serviceName ?? "—"}</td>
                <td style={{ padding: "0.8rem 1rem", whiteSpace: "nowrap" }}>
                  <span style={{
                    padding: "0.22rem 0.55rem",
                    borderRadius: "20px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    background: row.status === "CANCELLED" ? "rgba(255,68,68,0.1)"   : "rgba(16,185,129,0.1)",
                    color:      row.status === "CANCELLED" ? "#ff4444"               : "#10b981",
                    border:     `1px solid ${row.status === "CANCELLED" ? "#ff4444" : "#10b981"}`,
                  }}>
                    {row.status === "CANCELLED" ? "CANCELLED" : "COMPLETED"}
                  </span>
                </td>
                <td style={{ padding: "0.8rem 1rem", display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {row.invoiceUrl && (
                    <a
                      href={row.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "#D4AF37", fontWeight: 700, textDecoration: "none", padding: "0.25rem 0.6rem", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "6px" }}
                    >
                      📄 Invoice
                    </a>
                  )}
                  {row.status !== "CANCELLED" && !row.hasReview && (
                    <button
                      onClick={() => setReviewApp(row)}
                      style={{ fontSize: "0.78rem", background: "var(--primary)", color: "white", fontWeight: 700, border: "none", padding: "0.3rem 0.8rem", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Leave Review
                    </button>
                  )}
                  {!row.invoiceUrl && row.status === "CANCELLED" && (
                    <span style={{ fontSize: "0.78rem", opacity: 0.3 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
