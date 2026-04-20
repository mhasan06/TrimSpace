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
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E9EDF7" }}>
              {["Booking ID", "Date", "Shop", "Service", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "1.2rem 1rem", textAlign: "left", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", color: "#A3AED0", letterSpacing: "1px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                style={{ borderBottom: "1px solid #F4F7FE", transition: "all 0.2s" }}
                onMouseOver={e => (e.currentTarget.style.background = "#F4F7FE")}
                onMouseOut={e  => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "1.2rem 1rem" }}>
                   <span style={{ fontWeight: 800, color: '#4318FF', fontSize: '0.85rem' }}>#{row.id.slice(-8).toUpperCase()}</span>
                </td>
                <td style={{ padding: "1.2rem 1rem", color: "#707EAE", fontWeight: 700 }}>
                  {new Date(row.startTime).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "1.2rem 1rem", fontWeight: 800, color: "#1B2559" }}>{row.tenantName}</td>
                <td style={{ padding: "1.2rem 1rem", color: "#707EAE" }}>{row.serviceName ?? "—"}</td>
                <td style={{ padding: "1.2rem 1rem" }}>
                  <span style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "12px",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    background: row.status === "CANCELLED" ? "#FFEEF2" : "#E6FAF5",
                    color:      row.status === "CANCELLED" ? "#EE5D50" : "#05CD99"
                  }}>
                    {row.status === "CANCELLED" ? "CANCELLED" : "COMPLETED"}
                  </span>
                </td>
                <td style={{ padding: "1.2rem 1rem" }}>
                  {row.invoiceUrl && (
                    <a
                      href={row.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: "0.8rem", 
                        color: "#4318FF", 
                        fontWeight: 800, 
                        textDecoration: "none", 
                        padding: "0.5rem 1rem", 
                        border: "1px solid #E9EDF7", 
                        borderRadius: "10px",
                        background: 'white'
                      }}
                    >
                      View Invoice
                    </a>
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
