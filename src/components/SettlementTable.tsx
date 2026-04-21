"use client";

import styles from "../app/dashboard/page.module.css";

interface SettlementTableProps {
  appointments: any[];
}

export default function SettlementTable({ appointments }: SettlementTableProps) {
  
  const downloadCSV = () => {
    const headers = ["Booking ID", "Date", "Customer", "Service", "Original Price", "Final Take", "Digital (Stripe)", "Credit (Gift)", "Status (Actual)"];
    const rows = appointments.map(app => {
        const finalTake = app.status === 'CANCELLED' ? Number(app.cancellationFee || (app.service.price * 0.5)) : app.service.price;
        return [
            app.id.substring(app.id.length - 8).toUpperCase(),
            new Date(app.startTime).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }),
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

  const groupList = (list: any[]) => {
    const groups: any[] = [];
    const map = new Map();
    list.forEach(app => {
    const gid = app.bookingGroupId || `${app.tenantId}_${app.customerId}_${new Date(app.startTime).toISOString().split('T')[0]}`;
        if (!map.has(gid)) {
            map.set(gid, { 
                ...app, 
                services: [], 
                totalPrice: 0,
                totalDigital: 0,
                totalGift: 0,
                totalFinalTake: 0
            });
            groups.push(map.get(gid));
        }
        const g = map.get(gid);
        const finalTake = app.status === 'CANCELLED' ? Number(app.cancellationFee || (app.service.price * 0.5)) : app.service.price;
        g.services.push({ 
          ...app.service, 
          finalTake, 
          id: app.id, 
          status: app.status, 
          paymentStatus: app.paymentStatus, 
          invoiceUrl: app.invoiceUrl 
        });
        g.totalPrice += app.service.price;
        g.totalDigital += Number(app.amountPaidStripe || 0);
        g.totalGift += Number(app.amountPaidGift || 0);
        g.totalFinalTake += finalTake;
    });
    return groups;
  };

  const groupedData = groupList(appointments);

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
                        <th>Booking / Reference</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Services & Breakdown</th>
                        <th>Gross</th>
                        <th>Final Take</th>
                        <th>Digital</th>
                        <th>Gift</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedData.map(group => (
                        <tr key={group.id} style={{ borderBottom: '2px solid var(--border)' }}>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                <div style={{ fontSize: '0.7rem', background: '#6366f1', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.4rem', fontWeight: 900 }}>GROUP SESSION</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    {group.bookingGroupId ? `GROUP: ${group.bookingGroupId.toUpperCase()}` : `AUTO-GROUPED SESSION`}
                                </div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{group.id.slice(-8).toUpperCase()}</div>
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>{new Date(group.startTime).toLocaleDateString('en-AU')}</td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 700 }}>{group.customer.name}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ background: '#fbbf24', color: 'black', padding: '0.2rem 0.5rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900 }}>
                                            NEW: {(group.customer as any)?._count?.appointments ?? 0} VISITS
                                        </span>
                                    </div>
                                    {(group.customer as any)?.appointments?.[0] && (
                                        <p style={{ fontSize: '0.7rem', opacity: 1, color: '#fbbf24', fontWeight: 700, margin: 0 }}>
                                            LAST: {new Date((group.customer as any).appointments[0].startTime).toLocaleDateString('en-AU')}
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {group.services.map((s: any) => (
                                        <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{s.name}</div>
                                                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>
                                                    {s.status === 'CANCELLED' ? 'CANCELLED (50% Fee)' : s.paymentStatus}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 800 }}>${s.finalTake.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', opacity: 0.6 }}>${group.totalPrice.toFixed(2)}</td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 900, color: 'var(--secondary)' }}>${group.totalFinalTake.toFixed(2)}</td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', opacity: 0.7 }}>${group.totalDigital.toFixed(2)}</td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', color: 'var(--primary)', fontWeight: 700 }}>${group.totalGift.toFixed(2)}</td>
                            <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                                {group.services.some((s: any) => s.invoiceUrl) && (
                                    <a href={group.services.find((s: any) => s.invoiceUrl).invoiceUrl} target="_blank" rel="noreferrer" style={{ background: 'var(--primary)', color: 'black', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, textDecoration: 'none' }}>INV</a>
                                )}
                            </td>
                        </tr>
                    ))}
                    {groupedData.length === 0 && (
                        <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>No processed transactions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
