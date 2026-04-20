"use client";

import { useState } from "react";
import BookingDetailModal, { type BookingDetail } from "@/components/BookingDetailModal";
import ReviewModal from "@/components/ReviewModal";
import InvoiceButton from "@/components/InvoiceButton";

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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {["Booking ID", "Date", "Shop", "Service", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "1.2rem 1rem", textAlign: "left", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", letterSpacing: "1px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid #f8fafc", transition: "all 0.2s" }}
              >
                <td style={{ padding: "1.5rem 1rem" }}>
                   <span style={{ fontWeight: 800, color: '#6366f1', fontSize: '0.9rem' }}>#{row.id.slice(-8).toUpperCase()}</span>
                </td>
                <td style={{ padding: "1.5rem 1rem", color: "#1e293b", fontWeight: 700 }}>
                  {new Date(row.startTime).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "1.5rem 1rem", fontWeight: 800, color: "#1e293b" }}>{row.tenantName}</td>
                <td style={{ padding: "1.5rem 1rem", color: "#64748b", fontWeight: 600 }}>{row.serviceName ?? "—"}</td>
                <td style={{ padding: "1.5rem 1rem" }}>
                  <span style={{
                    padding: "0.5rem 1.2rem",
                    borderRadius: "14px",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    background: row.status === "CANCELLED" ? "#fff1f2" : "#f0fdf4",
                    color:      row.status === "CANCELLED" ? "#e11d48" : "#16a34a"
                  }}>
                    {row.status === "CANCELLED" ? "CANCELLED" : "DONE"}
                  </span>
                </td>
                <td style={{ padding: "1.5rem 1rem" }}>
                  <InvoiceButton appointmentId={row.id} bookingId={row.id.slice(-8)} invoiceUrl={row.invoiceUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
