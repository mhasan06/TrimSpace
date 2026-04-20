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

      <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["Booking ID", "Date", "Shop", "Service", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "1.2rem 1rem", textAlign: "left", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s ease" }}
                onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseOut={e  => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "1.2rem 1rem", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setSelected(row)}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "#6366f1",
                      background: "#eef2ff",
                      border: "1px solid #e0e7ff",
                      borderRadius: "8px",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer"
                    }}
                  >
                    #{row.id.slice(-8).toUpperCase()}
                  </button>
                </td>
                <td style={{ padding: "1.2rem 1rem", color: "#475569", fontWeight: 600 }}>
                  {new Date(row.startTime).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "1.2rem 1rem", fontWeight: 700, color: "#0f172a" }}>{row.tenantName}</td>
                <td style={{ padding: "1.2rem 1rem", color: "#475569" }}>{row.serviceName ?? "—"}</td>
                <td style={{ padding: "1.2rem 1rem" }}>
                  <span style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    background: row.status === "CANCELLED" ? "#fff1f2" : "#f0fdf4",
                    color:      row.status === "CANCELLED" ? "#e11d48" : "#16a34a",
                    border:     `1px solid ${row.status === "CANCELLED" ? "#fecdd3" : "#bbf7d0"}`
                  }}>
                    {row.status === "CANCELLED" ? "CANCELLED" : "COMPLETED"}
                  </span>
                </td>
                <td style={{ padding: "1.2rem 1rem", display: 'flex', gap: '0.6rem' }}>
                  {row.invoiceUrl && (
                    <a
                      href={row.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: "0.85rem", 
                        background: "#ffffff",
                        color: "#475569", 
                        fontWeight: 700, 
                        textDecoration: "none", 
                        padding: "0.4rem 1rem", 
                        border: "1px solid #e2e8f0", 
                        borderRadius: "10px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                      }}
                    >
                      Invoice
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
</div>
    </>
  );
}
