"use client";

import styles from "../app/dashboard/page.module.css";
import { calculateServiceFees } from "@/lib/pricing";

interface UpcomingLedgerTableProps {
  appointments: any[];
  currentPeriod?: string;
  startDate?: Date;
  endDate?: Date;
}

export default function UpcomingLedgerTable({ appointments, currentPeriod, startDate, endDate }: UpcomingLedgerTableProps) {
  const [viewingInvoice, setViewingInvoice] = (require("react")).useState(null);

  const groupList = (list: any[]) => {
    const groups: any[] = [];
    const map = new Map();
    list.forEach(app => {
        const gid = app.bookingGroupId || `${app.tenantId}_${app.customerId}_${new Date(app.startTime).toISOString().split('T')[0]}`;
        const fees = calculateServiceFees(Number(app.service.price));
        
        if (!map.has(gid)) {
            map.set(gid, { 
                ...app, 
                services: [], 
                totalPrice: 0, 
                totalFees: 0,
                totalPayout: 0,
                totalRetention: 0,
                totalStripe: 0,
                totalGift: 0
            });
            groups.push(map.get(gid));
        }
        const g = map.get(gid);
        const retentionFee = app.status === 'CANCELLED' ? Number(app.cancellationFee || (app.service.price * 0.5)) : null;
        g.services.push({ 
          ...app.service, 
          barber: app.barber, 
          id: app.id, 
          startTime: app.startTime, 
          paymentStatus: app.paymentStatus, 
          paymentMethod: app.paymentMethod,
          status: app.status,
          retentionFee,
          fees
        });
        
        g.totalPrice += fees.totalCustomerPrice;
        g.totalFees += (fees.totalCustomerPrice - fees.basePrice);
        g.totalPayout += fees.basePrice;
        g.totalRetention += (retentionFee !== null ? retentionFee : fees.basePrice);
        g.totalStripe += Number(app.amountPaidStripe || 0);
        g.totalGift += Number(app.amountPaidGift || 0);
    });
    return groups;
  };

  const groupedData = groupList(appointments);

  const handlePeriodChange = (p: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('period', p);
    url.searchParams.delete('start');
    url.searchParams.delete('end');
    window.location.href = url.toString();
  };

  const handleDateChange = (start: string, end: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('period', 'custom');
    url.searchParams.set('start', start);
    url.searchParams.set('end', end);
    window.location.href = url.toString();
  };

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Filter By Period:</span>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {['week', 'month', 'year'].map(p => {
              const isActive = currentPeriod === p || (!currentPeriod && p === 'week');
              return (
                <button 
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  style={{ 
                    background: isActive ? '#6366f1' : 'rgba(0,0,0,0.05)', 
                    color: isActive ? 'white' : '#64748b',
                    border: isActive ? 'none' : '1px solid #e2e8f0', 
                    padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem',
                    transition: 'all 0.2s',
                    opacity: isActive ? 1 : 0.6
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px' }}>Date Range:</span>
          <input 
            type="date" 
            defaultValue={startDate?.toISOString().split('T')[0]} 
            onChange={(e) => handleDateChange(e.target.value, endDate?.toISOString().split('T')[0] || e.target.value)}
            style={{ background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', padding: '0.6rem', borderRadius: '12px', fontWeight: 800, outline: 'none' }}
          />
          <span style={{ opacity: 0.5, color: '#64748b', fontWeight: 900 }}>to</span>
          <input 
            type="date" 
            defaultValue={endDate?.toISOString().split('T')[0]} 
            onChange={(e) => handleDateChange(startDate?.toISOString().split('T')[0] || e.target.value, e.target.value)}
            style={{ background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', padding: '0.6rem', borderRadius: '12px', fontWeight: 800, outline: 'none' }}
          />
        </div>
      </div>

      <div className={`${styles.tableContainer} glass`}>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Booking Reference</th>
            <th>Client Name</th>
            <th>Session Details</th>
            <th>Original Total</th>
            <th>Fees</th>
            <th>Final Take</th>
            <th>Session Date</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map(group => (
            <tr key={group.id} style={{ borderBottom: '2px solid var(--border)' }}>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '0.7rem', background: group.services.some((s: any) => s.status === 'CANCELLED') ? '#ef4444' : '#6366f1', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.4rem', fontWeight: 900 }}>
                  {group.services.some((s: any) => s.status === 'CANCELLED') ? 'CANCELLED SESSION' : 'ACTIVE SESSION'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {group.bookingGroupId ? `GROUP: ${group.bookingGroupId.toUpperCase()}` : `SINGLE SESSION`}
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{group.id.slice(-8).toUpperCase()}</div>
                <div style={{ marginTop: '0.8rem' }}>
                    <button 
                        onClick={() => setViewingInvoice(group)}
                        style={{ 
                            background: '#6366f1', color: 'white', 
                            padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                            border: 'none', fontWeight: 800, fontSize: '0.65rem',
                            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
                        }}
                    >
                        VIEW
                    </button>
                </div>
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 700 }}>
                {group.customer.name}
              </td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.services.map((s: any) => (
                        <div key={s.id} style={{ background: s.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.02)', padding: '0.8rem', borderRadius: '8px', border: s.status === 'CANCELLED' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.status === 'CANCELLED' ? '#ef4444' : 'var(--foreground)', textDecoration: s.status === 'CANCELLED' ? 'line-through' : 'none' }}>{s.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6, color: 'var(--foreground)' }}>
                                    With <strong style={{ color: 'var(--primary)' }}>{s.barber?.name || "Any Staff"}</strong>
                                </div>
                                <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                                    <span style={{ 
                                        padding: '0.1rem 0.35rem', 
                                        borderRadius: '4px', 
                                        background: s.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.2)' : (s.paymentStatus === 'PAID' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)'),
                                        color: s.status === 'CANCELLED' ? '#ef4444' : (s.paymentStatus === 'PAID' ? '#4ade80' : '#fbbf24'),
                                        fontSize: '0.65rem',
                                        fontWeight: 800
                                    }}>
                                        {s.status === 'CANCELLED' ? 'CANCELLED (50% FEE)' : (s.paymentStatus === 'PAID' ? 'SETTLED' : 'UNPAID')}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                                    {s.status === 'CANCELLED' ? `$${s.retentionFee.toFixed(2)}` : `$${s.price.toFixed(2)}`}
                                </div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.4, textDecoration: 'line-through' }}>
                                    {s.status === 'CANCELLED' ? `$${s.price.toFixed(2)}` : ''}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', opacity: 0.5, fontSize: '0.9rem' }}>
                ${group.totalPrice.toFixed(2)}
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', opacity: 0.5, fontSize: '0.9rem', color: '#ef4444' }}>
                ${group.totalFees.toFixed(2)}
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 900, color: '#16a34a', fontSize: '1.2rem' }}>
                ${group.totalRetention.toFixed(2)}
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                {new Date(group.startTime).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
              </td>
            </tr>
          ))}
          {groupedData.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', opacity: 0.4, fontStyle: 'italic' }}>
                No future bookings found in the ledger.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>

    {viewingInvoice && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="printable-invoice" style={{ width: '100%', maxWidth: '600px', background: 'white', borderRadius: '32px', padding: '3rem', color: '#1e293b', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Business Standard Invoice</div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Transaction Summary</h2>
                    <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{viewingInvoice.bookingGroupId ? `Group Reference: ${viewingInvoice.bookingGroupId.toUpperCase()}` : `Session ID: ${viewingInvoice.id.toUpperCase()}`}</p>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '1.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '1.2rem', letterSpacing: '1px' }}>Customer & Session</h4>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.3rem' }}>{viewingInvoice.customer.name}</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{new Date(viewingInvoice.startTime).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                    <h4 style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Service Details</h4>
                    {viewingInvoice.services.map((s: any, idx: number) => {
                        const totalItemFees = s.fees.totalCustomerPrice - s.price;
                        return (
                            <div key={idx} style={{ padding: '1rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: s.status === 'CANCELLED' ? '#ef4444' : '#1e293b', textDecoration: s.status === 'CANCELLED' ? 'line-through' : 'none' }}>{s.name}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Service Charge</div>
                                    </div>
                                    <div style={{ fontWeight: 800 }}>${s.price.toFixed(2)}</div>
                                </div>
                                {!viewingInvoice.services.some((s: any) => s.status === 'CANCELLED') && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.6 }}>
                                        <span>Secure Processing & Platform Fees</span>
                                        <span>${totalItemFees.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 600, opacity: 0.5 }}>
                        <span>Method</span>
                        <span style={{ textTransform: 'uppercase' }}>{viewingInvoice.paymentMethod || "CASH / INSTORE"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 900, fontSize: '1.2rem', color: '#6366f1' }}>
                        <span>Total Paid by Customer</span>
                        <span>${viewingInvoice.totalPrice.toFixed(2)}</span>
                    </div>
                    {viewingInvoice.services.some((s: any) => s.status === 'CANCELLED') && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #ef4444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#ef4444' }}>
                                <span>Retention Held (50%)</span>
                                <span>${viewingInvoice.totalRetention.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="no-print" style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                    <button onClick={() => window.print()} style={{ flex: 1, background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Print Statement</button>
                    <button onClick={() => setViewingInvoice(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                </div>

                <style>{`
                    @media print {
                        .no-print { display: none !important; }
                        body * { visibility: hidden; }
                        .printable-invoice, .printable-invoice * { visibility: visible; }
                        .printable-invoice { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                    }
                `}</style>
            </div>
        </div>
    )}
    </>
  );
}
