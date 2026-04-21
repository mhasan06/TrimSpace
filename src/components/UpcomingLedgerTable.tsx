"use client";

import styles from "../app/dashboard/page.module.css";

interface UpcomingLedgerTableProps {
  appointments: any[];
  currentPeriod?: string;
  startDate?: Date;
  endDate?: Date;
}

export default function UpcomingLedgerTable({ appointments, currentPeriod, startDate, endDate }: UpcomingLedgerTableProps) {
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
                totalRetention: 0
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
          retentionFee
        });
        g.totalPrice += app.service.price;
        g.totalRetention += (retentionFee !== null ? retentionFee : app.service.price);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['week', 'month', 'year'].map(p => (
            <button 
              key={p}
              onClick={() => handlePeriodChange(p)}
              style={{ 
                background: currentPeriod === p || (!currentPeriod && p === 'week') ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                color: currentPeriod === p || (!currentPeriod && p === 'week') ? 'black' : 'white',
                border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', fontSize: '0.75rem' 
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Custom Range:</span>
          <input 
            type="date" 
            defaultValue={startDate?.toISOString().split('T')[0]} 
            onChange={(e) => handleDateChange(e.target.value, endDate?.toISOString().split('T')[0] || e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
          />
          <span style={{ opacity: 0.3 }}>to</span>
          <input 
            type="date" 
            defaultValue={endDate?.toISOString().split('T')[0]} 
            onChange={(e) => handleDateChange(startDate?.toISOString().split('T')[0] || e.target.value, e.target.value)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div className={`${styles.tableContainer} glass`}>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Booking Reference</th>
            <th>Client Name</th>
            <th>Session Details (Services & Barbers)</th>
            <th>Original Total</th>
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
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 700 }}>
                {group.customer.name}
              </td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.services.map((s: any) => (
                        <div key={s.id} style={{ background: s.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: s.status === 'CANCELLED' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.status === 'CANCELLED' ? '#ef4444' : 'white', textDecoration: s.status === 'CANCELLED' ? 'line-through' : 'none' }}>{s.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
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
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 900, color: 'var(--secondary)', fontSize: '1.2rem' }}>
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
  );
}
