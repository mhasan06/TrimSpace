"use client";

import { useState } from "react";
import styles from "../app/dashboard/page.module.css";

interface LedgerEvent {
  id: string;
  bookingId: string;
  date: string;
  serviceDate: string;
  type: 'BOOKING_PAYMENT' | 'CANCELLATION_FEE' | 'REFUND' | 'PAYOUT' | 'ADJUSTMENT';
  status: 'PENDING' | 'SETTLED' | 'REFUNDED' | 'FAILED';
  customer: string;
  grossAmount: number;
  commissionFee: number;
  processingFee: number;
  priorityFee: number;
  tax: number;
  netPayable: number;
  netPlatform: number;
  isFuture: boolean;
}

export default function ComprehensiveLedger({ data }: { data: LedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'settled' | 'pending' | 'future' | 'adjustments'>('settled');

  const filteredData = data.filter(event => {
    if (activeTab === 'settled') return event.status === 'SETTLED' && !event.isFuture;
    if (activeTab === 'pending') return event.status === 'PENDING' && !event.isFuture;
    if (activeTab === 'future') return event.isFuture;
    if (activeTab === 'adjustments') return event.type === 'REFUND' || event.type === 'ADJUSTMENT' || event.type === 'CANCELLATION_FEE';
    return true;
  });

  const totals = filteredData.reduce((acc, curr) => ({
    gross: acc.gross + curr.grossAmount,
    net: acc.net + curr.netPayable,
    platform: acc.platform + curr.netPlatform
  }), { gross: 0, net: 0, platform: 0 });

  // Group events by day
  const groupedByDay = filteredData.reduce((acc: any, event) => {
    const day = new Date(event.serviceDate).toDateString();
    if (!acc[day]) acc[day] = { events: [], totals: { gross: 0, net: 0 } };
    acc[day].events.push(event);
    acc[day].totals.gross += event.grossAmount;
    acc[day].totals.net += event.netPayable;
    return acc;
  }, {});

  const dayEntries = Object.entries(groupedByDay).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Summary Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Total Gross Volume</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.gross.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--secondary)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Net Payable to Shop</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Platform Revenue</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.platform.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        {[
          { id: 'settled', label: 'Settled Transactions', icon: '✅' },
          { id: 'pending', label: 'Pending Settlement', icon: '⏳' },
          { id: 'future', label: 'Future Bookings', icon: '📅' },
          { id: 'adjustments', label: 'Adjustments & Disputes', icon: '⚖️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--foreground)',
              border: 'none',
              padding: '0.8rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              opacity: activeTab === tab.id ? 1 : 0.6
            }}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Grouped Table View */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {dayEntries.map(([day, data]: [string, any]) => (
          <div key={day} className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: 900 }}>{day}</span>
                <span style={{ marginLeft: '1rem', fontSize: '0.75rem', opacity: 0.5, fontWeight: 700 }}>DAILY BATCH</span>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Gross</p>
                  <p style={{ fontWeight: 800 }}>${data.totals.gross.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Net Payout</p>
                  <p style={{ fontWeight: 900, color: 'var(--primary)' }}>${data.totals.net.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ width: '30%' }}>Event Details</th>
                  <th style={{ width: '20%' }}>Status</th>
                  <th style={{ width: '30%' }}>Financial Breakdown</th>
                  <th style={{ textAlign: 'right' }}>Net Payout</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event: any) => (
                  <tr key={event.id}>
                    <td>
                      <div style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.05)', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '0.4rem' }}>{event.type}</div>
                      <div style={{ fontWeight: 800 }}>{event.customer}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>REF: {event.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', 
                          background: event.status === 'SETTLED' ? '#10b981' : (event.status === 'FAILED' ? '#ef4444' : '#f59e0b') 
                        }}></span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{event.status}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{new Date(event.serviceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1.5rem', fontSize: '0.75rem' }}>
                        <span style={{ opacity: 0.6 }}>Gross Revenue:</span>
                        <span style={{ fontWeight: 800 }}>${event.grossAmount.toFixed(2)}</span>
                        <span style={{ opacity: 0.6 }}>Commission:</span>
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>-${event.commissionFee.toFixed(2)}</span>
                        <span style={{ opacity: 0.6 }}>Processing:</span>
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>-${event.processingFee.toFixed(2)}</span>
                        <span style={{ opacity: 0.6 }}>Priority Fee:</span>
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>-${event.priorityFee.toFixed(2)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>
                        ${event.netPayable.toFixed(2)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      {filteredData.length === 0 && (
        <div className="glass" style={{ textAlign: 'center', padding: '4rem', opacity: 0.4, fontStyle: 'italic', borderRadius: '20px' }}>
          No financial events found in this section.
        </div>
      )}

      <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed var(--primary)' }}>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>💡 Financial Insight</h4>
        <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5 }}>
          {activeTab === 'future' ? 
            "Future bookings represent expected inflows and deferred revenue. These figures are not realized until the service is marked as completed and the cooling-off period passes." :
            "Settled transactions have been verified and included in a payout batch. Platform fees include the $0.50 priority booking fee and standard marketplace commission."
          }
        </p>
      </div>
    </div>
  );
}
