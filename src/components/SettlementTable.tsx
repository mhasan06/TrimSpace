"use client";

import styles from "../app/dashboard/page.module.css";

interface SettlementTableProps {
  appointments: any[];
}

export default function SettlementTable({ appointments }: SettlementTableProps) {
  
  const downloadCSV = () => {
    const headers = ["Booking ID", "Date", "Customer", "Service", "Original Price", "Final Take", "Digital (Stripe)", "Credit (Gift)", "Status (Actual)"];
    const rows = appointments.map(app => {
        const finalTake = app.paymentStatus === 'PARTIAL_REFUNDED' ? (app.service.price * 0.5) : app.service.price;
        return [
            app.id.substring(app.id.length - 8).toUpperCase(),
            new Date(app.startTime).toISOString().split('T')[0],
            app.customer.name || "Unknown",
            app.service.name,
            `$${app.service.price.toFixed(2)}`,
            `$${finalTake.toFixed(2)}`,
            `$${Number(app.amountPaidStripe || 0).toFixed(2)}`,
            `$${Number(app.amountPaidGift || 0).toFixed(2)}`,
            app.status === 'CANCELLED' ? "CANCELLED" : app.paymentStatus
        ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `settlement-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              onClick={downloadCSV}
              style={{ 
                padding: '0.6rem 1.2rem', 
                background: 'var(--primary)', 
                color: 'black', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV Ledger
            </button>
        </div>
        
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '100px' }}>ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Shop Take</th>
                        <th>Digital Paid</th>
                        <th>Gift Credit</th>
                        <th>Status</th>
                        <th>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {appointments.map(app => {
                        const finalTake = app.paymentStatus === 'PARTIAL_REFUNDED' ? (app.service.price * 0.5) : app.service.price;
                        return (
                            <tr key={app.id}>
                                <td style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, letterSpacing: '1px' }}>
                                    #{app.id.substring(app.id.length - 6).toUpperCase()}
                                </td>
                                <td>{new Date(app.startTime).toISOString().split('T')[0]}</td>
                                <td>{app.customer.name}</td>
                                <td>
                                    {app.service.name}
                                    {(() => {
                                        const cluster = appointments.filter(a => a.customerId === app.customerId && a.startTime === app.startTime);
                                        if (cluster.length > 1) {
                                            return (
                                                <div style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginLeft: '0.5rem', fontWeight: 700, border: '1px solid #ef4444' }}>
                                                    GROUP CLUSTER
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </td>
                                <td style={{ opacity: 0.6 }}>${app.service.price.toFixed(2)}</td>
                                <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>${finalTake.toFixed(2)}</td>
                                <td style={{ opacity: 0.7 }}>${Number(app.amountPaidStripe || 0).toFixed(2)}</td>
                                <td style={{ color: 'var(--primary)', opacity: 0.9, fontSize: '0.85rem' }}>✨ ${Number(app.amountPaidGift || 0).toFixed(2)}</td>
                                <td>
                                    <span style={{ 
                                        padding: '0.2rem 0.5rem', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 800,
                                        background: app.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                        color: app.status === 'CANCELLED' ? '#ef4444' : '#10b981',
                                        border: app.status === 'CANCELLED' ? '1px solid #ef4444' : '1px solid #10b981'
                                    }}>
                                        {app.status === 'CANCELLED' ? "BOOKING CANCELLED" : app.paymentStatus}
                                    </span>
                                </td>
                                <td>
                                    {app.invoiceUrl ? (
                                        <a 
                                            href={app.invoiceUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ 
                                                color: 'var(--primary)', 
                                                textDecoration: 'none', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                            PDF
                                            {app.emailSent && (
                                                <span title="Email Sent" style={{ opacity: 0.6 }}>✉️</span>
                                            )}
                                        </a>
                                    ) : (
                                        <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>N/A</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {appointments.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '2rem' }}>No processed transactions found for this period.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
