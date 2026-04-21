"use client";

import styles from "../app/dashboard/page.module.css";

interface UpcomingLedgerTableProps {
  appointments: any[];
}

export default function UpcomingLedgerTable({ appointments }: UpcomingLedgerTableProps) {
  const groupList = (list: any[]) => {
    const groups: any[] = [];
    const map = new Map();
    list.forEach(app => {
        const gid = app.bookingGroupId || `${app.tenantId}_${app.customerId}_${new Date(app.startTime).toISOString().split('T')[0]}`;
        if (!map.has(gid)) {
            map.set(gid, { 
                ...app, 
                services: [], 
                totalPrice: 0
            });
            groups.push(map.get(gid));
        }
        const g = map.get(gid);
        g.services.push({ ...app.service, barber: app.barber, id: app.id, startTime: app.startTime, paymentStatus: app.paymentStatus, paymentMethod: app.paymentMethod });
        g.totalPrice += app.service.price;
    });
    return groups;
  };

  const groupedData = groupList(appointments);

  return (
    <div className={`${styles.tableContainer} glass`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Booking Reference</th>
            <th>Client Name</th>
            <th>Session Details (Services & Barbers)</th>
            <th>Total Revenue</th>
            <th>Session Date</th>
          </tr>
        </thead>
        <tbody>
          {groupedData.map(group => (
            <tr key={group.id} style={{ borderBottom: '2px solid var(--border)' }}>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {group.bookingGroupId ? `GROUP: ${group.bookingGroupId.toUpperCase()}` : `REF: ${group.id.slice(-8).toUpperCase()}`}
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>{group.bookingGroupId ? 'Multi-service session' : 'Single booking'}</div>
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 700 }}>{group.customer.name}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {group.services.map((s: any) => (
                        <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{s.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                    With <strong style={{ color: 'var(--primary)' }}>{s.barber?.name || "Any Staff"}</strong>
                                </div>
                                <div style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                                    <span style={{ 
                                        padding: '0.1rem 0.35rem', 
                                        borderRadius: '4px', 
                                        background: s.paymentStatus === 'PAID' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                        color: s.paymentStatus === 'PAID' ? '#4ade80' : '#fbbf24',
                                        fontSize: '0.65rem',
                                        fontWeight: 800
                                    }}>
                                        {s.paymentStatus === 'PAID' ? 'SETTLED' : 'UNPAID'}
                                    </span>
                                    <span style={{ marginLeft: '0.5rem', opacity: 0.4, fontSize: '0.65rem' }}>
                                        {s.paymentMethod === 'CARD_ONLINE' ? '🌐 Online' : '💵 Cash'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>${s.price.toFixed(2)}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </td>
              <td style={{ verticalAlign: 'top', paddingTop: '1.5rem', fontWeight: 900, color: 'var(--secondary)', fontSize: '1.2rem' }}>
                ${group.totalPrice.toFixed(2)}
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
  );
}
