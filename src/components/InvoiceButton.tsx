"use client";

import { useState } from "react";

export default function InvoiceButton({ appointmentId, bookingId, invoiceUrl }: { appointmentId: string, bookingId: string, invoiceUrl?: string | null }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, "_blank");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`/api/invoice/${appointmentId}`);
      if (!resp.ok) throw new Error("Failed to generate invoice");
      
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${bookingId.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error generating invoice. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        color: '#1e293b', 
        padding: '0.6rem 1rem', 
        borderRadius: '12px', 
        fontSize: '0.85rem', 
        fontWeight: 700, 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease'
      }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      {loading ? "Generating..." : "Invoice"}
    </button>
  );
}
