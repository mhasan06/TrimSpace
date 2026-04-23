"use client";

import { useState } from "react";
import styles from "../app/dashboard/page.module.css";
import { flagDisputeAction } from "../app/dashboard/ledger/actions";

interface LedgerEvent {
  id: string;
  bookingId: string;
  date: string;
  serviceDate: string;
  type: 'BOOKING_PAYMENT' | 'CANCELLATION_FEE' | 'REFUND' | 'PAYOUT' | 'ADJUSTMENT';
  status: 'PENDING' | 'SETTLED' | 'REFUNDED' | 'FAILED';
  customer: string;
  serviceName: string;
  servicePrice: number;
  cancellationAmount: number;
  grossAmount: number;
  commissionFee: number;
  processingFee: number;
  priorityFee: number;
  tax: number;
  netPayable: number;
  netPlatform: number;
  isFuture: boolean;
  isDisputed?: boolean;
  disputeReason?: string | null;
  disputeStatus?: string | null;
  disputeResolvedAt?: string | null;
  disputeResolutionMemo?: string | null;
}

export default function ComprehensiveLedger({ data }: { data: LedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'settled' | 'future' | 'disputes'>('settled');
  const [selectedEvent, setSelectedEvent] = useState<LedgerEvent | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [disputeReason, setDisputeReason] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);

  const handleFlagDispute = async () => {
    if (!selectedEvent || !disputeReason) return;
    setIsFlagging(true);
    const res = await flagDisputeAction(selectedEvent.id, disputeReason);
    if (res.success) {
      alert("Dispute raised successfully. Payout for this item is now frozen.");
      setSelectedEvent({ ...selectedEvent, isDisputed: true, disputeReason, disputeStatus: 'PENDING' });
      setDisputeReason("");
    } else {
      alert(res.error);
    }
    setIsFlagging(false);
  };

  const filteredData = data.filter(event => {
    const eventDate = new Date(event.serviceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isBeforeToday = eventDate < today;

    if (activeTab === 'disputes') {
      return event.isDisputed || (event.disputeStatus && event.disputeStatus.startsWith('RESOLVED'));
    }

    // Exclude currently active disputes from normal tabs to avoid confusion about frozen funds
    if (event.isDisputed && activeTab !== 'disputes') return false;

    if (activeTab === 'settled') {
      if (!isBeforeToday) return false;
      if (selectedYear !== "all" && eventDate.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth !== "all" && eventDate.getMonth().toString() !== selectedMonth) return false;
    } else {
      if (isBeforeToday) return false;
    }
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
      {/* Modal Backdrop */}
      {selectedEvent && (
        <div 
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="glass"
            style={{
              width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '32px',
              border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setSelectedEvent(null)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}
            >
              ✕
            </button>

            <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '1rem', letterSpacing: '0.1em' }}>Detailed Reconciliation</div>
            
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)' }}>{selectedEvent.serviceName}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>{selectedEvent.customer}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--foreground)', opacity: 0.3 }}></span>
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>{new Date(selectedEvent.serviceDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'rgba(0,0,0,0.03)', padding: '2rem', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ opacity: 0.6 }}>Original Service Price</span>
                <span style={{ fontWeight: 800 }}>${selectedEvent.servicePrice.toFixed(2)}</span>
              </div>

              {selectedEvent.type === 'CANCELLATION_FEE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#f59e0b' }}>
                  <span style={{ opacity: 0.8 }}>Cancellation Retention</span>
                  <span style={{ fontWeight: 800 }}>-${(selectedEvent.servicePrice - selectedEvent.cancellationAmount).toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ opacity: 0.6 }}>Priority Booking Fee</span>
                <span style={{ fontWeight: 800 }}>+${selectedEvent.priorityFee.toFixed(2)}</span>
              </div>
              
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 900 }}>
                <span style={{ opacity: 0.7 }}>Gross Amount Collected</span>
                <span>${selectedEvent.grossAmount.toFixed(2)}</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444' }}>
                <span style={{ opacity: 0.8 }}>Marketplace Commission</span>
                <span style={{ fontWeight: 800 }}>-${selectedEvent.commissionFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444' }}>
                <span style={{ opacity: 0.8 }}>Payment Processing (Stripe)</span>
                <span style={{ fontWeight: 800 }}>-${selectedEvent.processingFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444' }}>
                <span style={{ opacity: 0.8 }}>Priority Fee Deduction</span>
                <span style={{ fontWeight: 800 }}>-${selectedEvent.priorityFee.toFixed(2)}</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontWeight: 900, fontSize: '1rem' }}>Final Shop Payout</span>
                   <span style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700 }}>
                     {selectedEvent.isDisputed ? 'PAYOUT FROZEN' : 'PAID TO YOUR BANK'}
                   </span>
                </div>
                <span style={{ fontWeight: 900, fontSize: '2rem', color: selectedEvent.isDisputed ? '#f59e0b' : 'var(--primary)' }}>
                  ${selectedEvent.netPayable.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Dispute Section (Integrated Audit Trail) */}
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: selectedEvent.isDisputed || selectedEvent.disputeStatus?.startsWith('RESOLVED') ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.03)', borderRadius: '16px', border: `1px dashed ${selectedEvent.isDisputed ? '#f59e0b' : 'rgba(255,255,255,0.1)'}` }}>
              {selectedEvent.disputeStatus?.startsWith('RESOLVED') ? (
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 900, 
                      color: selectedEvent.disputeStatus === 'RESOLVED_PAYOUT' ? '#10b981' : '#ef4444',
                      background: selectedEvent.disputeStatus === 'RESOLVED_PAYOUT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      padding: '0.3rem 0.6rem', borderRadius: '6px'
                    }}>
                      VERDICT: {selectedEvent.disputeStatus.replace('RESOLVED_', '')}
                    </span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                      {selectedEvent.disputeResolvedAt ? new Date(selectedEvent.disputeResolvedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <span style={{ opacity: 0.4, fontSize: '0.65rem', display: 'block', fontWeight: 900, textTransform: 'uppercase' }}>Resolution Note:</span>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{selectedEvent.disputeResolutionMemo}</div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', fontSize: '0.75rem', opacity: 0.5 }}>
                    <span style={{ fontWeight: 800 }}>Your Reason:</span> "{selectedEvent.disputeReason}"
                  </div>
                </div>
              ) : selectedEvent.isDisputed ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ⚠️ Active Dispute Under Review
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, fontStyle: 'italic' }}>
                    "{selectedEvent.disputeReason}"
                  </div>
                  <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '0.8rem', fontWeight: 700 }}>
                    Payout for this item is frozen until the App Admin provides a verdict.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.8rem' }}>Raise a Financial Dispute</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Reason for dispute (e.g. Incorrect fee)..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      style={{ 
                        flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', 
                        border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1rem', 
                        borderRadius: '10px', fontSize: '0.8rem', outline: 'none'
                      }}
                    />
                    <button 
                      onClick={handleFlagDispute}
                      disabled={isFlagging || !disputeReason}
                      style={{ 
                        background: '#ef4444', color: 'white', border: 'none', 
                        padding: '0.6rem 1rem', borderRadius: '10px', fontWeight: 900, 
                        fontSize: '0.7rem', cursor: 'pointer', opacity: isFlagging || !disputeReason ? 0.5 : 1
                      }}
                    >
                      {isFlagging ? "WAIT..." : "FLAG"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', fontSize: '0.75rem', opacity: 0.4, textAlign: 'center', fontWeight: 600 }}>
              REFERENCE: {selectedEvent.id.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Summary Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
            {activeTab === 'settled' ? 'Total Finalized Volume' : 'Expected Pipeline Volume'}
          </h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.gross.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--secondary)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
            {activeTab === 'settled' ? 'Net Paid to Shop' : 'Projected Net Payout'}
          </h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'settled', label: 'Settled Transactions', icon: '✅', sub: 'Completed up to yesterday' },
            { id: 'disputes', label: 'Disputes & Claims', icon: '⚠️', sub: 'Active and Resolved' },
            { id: 'future', label: 'Future & Today', icon: '📅', sub: 'In-progress and upcoming' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? (tab.id === 'disputes' ? '#f59e0b' : 'var(--primary)') : 'transparent',
                color: activeTab === tab.id ? (tab.id === 'disputes' ? 'black' : 'white') : 'var(--foreground)',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.2rem',
                transition: 'all 0.2s',
                opacity: activeTab === tab.id ? 1 : 0.6,
                flex: 1,
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                 <span>{tab.icon}</span> {tab.label}
                 {tab.id === 'disputes' && data.filter(e => e.isDisputed || (e.disputeStatus && e.disputeStatus.startsWith('RESOLVED'))).length > 0 && (
                   <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                     {data.filter(e => e.isDisputed || (e.disputeStatus && e.disputeStatus.startsWith('RESOLVED'))).length}
                   </span>
                 )}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>{tab.sub}</div>
            </button>
          ))}
        </div>

        {activeTab === 'settled' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', animation: 'fadeIn 0.3s ease-out' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>Filter Period:</span>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', 
                border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px',
                fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Years</option>
              {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>

            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', 
                border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px',
                fontWeight: 700, outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="all">All Months</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                <option key={m} value={i.toString()}>{m}</option>
              ))}
            </select>

            <button 
              onClick={() => { setSelectedYear("all"); setSelectedMonth("all"); }}
              style={{ 
                background: 'transparent', border: '1px dashed var(--border)', 
                padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.75rem',
                fontWeight: 700, cursor: 'pointer', opacity: 0.6
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
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
                  <th style={{ width: '20%' }}>Booking Status</th>
                  <th style={{ width: '30%' }}>Financial Breakdown</th>
                  <th style={{ textAlign: 'right' }}>Net Payout</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event: LedgerEvent) => (
                  <tr key={event.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                          {event.type === 'CANCELLATION_FEE' ? `CANCELLATION FEE: $${event.cancellationAmount.toFixed(2)}` : `SERVICE FEE: $${event.servicePrice.toFixed(2)}`}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{event.customer}</div>
                        <div 
                          onClick={() => setSelectedEvent(event)}
                          style={{ fontSize: '0.7rem', opacity: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          REF: {event.id.slice(-8).toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                         <div style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                            padding: '0.3rem 0.8rem', borderRadius: '8px',
                            background: event.type === 'CANCELLATION_FEE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: event.type === 'CANCELLATION_FEE' ? '#ef4444' : '#10b981',
                            fontSize: '0.75rem', fontWeight: 900, width: 'fit-content'
                         }}>
                            {event.type === 'CANCELLATION_FEE' ? 'CANCELLED' : 'COMPLETED'}
                         </div>
                         <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700 }}>
                            {new Date(event.serviceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                      </div>
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
