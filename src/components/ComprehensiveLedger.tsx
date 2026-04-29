"use client";

import { useState } from "react";
import styles from "../app/dashboard/page.module.css";
import { flagDisputeAction, addDisputeNoteAction } from "../app/dashboard/ledger/actions";

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
  isSettled: boolean;
  isDisputed?: boolean;
  disputeReason?: string | null;
  disputeStatus?: string | null;
  disputeResolvedAt?: string | null;
  disputeResolvedBy?: string | null;
  disputeResolutionMemo?: string | null;
  disputeNotes?: {
    id: string;
    content: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }[];
}

export default function ComprehensiveLedger({ data }: { data: LedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'payout_queue' | 'settled_history' | 'future' | 'disputes'>('payout_queue');
  const [disputeSubTab, setDisputeSubTab] = useState<'pending' | 'resolved'>('pending');
  const [selectedEvent, setSelectedEvent] = useState<LedgerEvent | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [disputeReason, setDisputeReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!selectedEvent || !newComment) return;
    setIsAddingNote(true);
    const res = await addDisputeNoteAction(selectedEvent.id, newComment);
    if (res.success) {
      setNewComment("");
      // Refresh handled by revalidatePath
    } else {
      alert(res.error);
    }
    setIsAddingNote(false);
  };

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

    // 1. Disputes Tab
    if (activeTab === 'disputes') {
      if (disputeSubTab === 'pending') {
        return event.isDisputed && event.disputeStatus === 'PENDING';
      } else {
        return event.disputeStatus && event.disputeStatus.startsWith('RESOLVED');
      }
    }

    // Exclude currently active disputes from normal tabs to avoid confusion about frozen funds
    if (event.isDisputed && event.disputeStatus === 'PENDING') return false;

    // 2. Payout Queue (Unsettled past items)
    if (activeTab === 'payout_queue') {
       return !event.isSettled && isBeforeToday && !event.isFuture;
    }

    // 3. Settled History (Actually paid items)
    if (activeTab === 'settled_history') {
      if (!event.isSettled) return false;
      if (selectedYear !== "all" && eventDate.getFullYear().toString() !== selectedYear) return false;
      if (selectedMonth !== "all" && eventDate.getMonth().toString() !== selectedMonth) return false;
      return true;
    }

    // 4. Future Forecast
    if (activeTab === 'future') {
      return event.isFuture || !isBeforeToday;
    }

    return true;
  });

  const totals = filteredData.reduce((acc, curr) => ({
    gross: acc.gross + curr.grossAmount,
    net: acc.net + curr.netPayable,
    platform: acc.platform + curr.commissionFee + curr.priorityFee,
    processing: acc.processing + curr.processingFee
  }), { gross: 0, net: 0, platform: 0, processing: 0 });

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
          onClick={() => { setSelectedEvent(null); setDisputeReason(""); setNewComment(""); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
        >
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
            <button 
              onClick={() => { setSelectedEvent(null); setDisputeReason(""); setNewComment(""); }}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.5 }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              {selectedEvent.disputeStatus?.startsWith('RESOLVED') ? 'Dispute Audit Trail' : 'Dispute Investigation'}
            </h2>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px dashed #f59e0b' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Your Original Reason:</div>
               <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>"{selectedEvent.disputeReason || 'No reason provided'}"</div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Investigation Timeline:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {(selectedEvent.disputeNotes || []).length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    No investigation notes yet. The platform admin will update this thread soon.
                  </div>
                )}
                {(selectedEvent.disputeNotes || []).map((note, idx) => (
                  <div key={idx} style={{ 
                    alignSelf: note.authorRole === 'MERCHANT' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: note.authorRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.07)',
                    padding: '1rem',
                    borderRadius: '16px',
                    borderBottomRightRadius: note.authorRole === 'MERCHANT' ? '2px' : '16px',
                    borderBottomLeftRadius: note.authorRole === 'ADMIN' ? '2px' : '16px',
                    border: note.authorRole === 'ADMIN' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.8, marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>{note.authorName} ({note.authorRole === 'ADMIN' ? 'Platform Support' : 'Your Team'})</span>
                      <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                  </div>
                ))}
              </div>

              {!selectedEvent.disputeStatus?.startsWith('RESOLVED') && selectedEvent.isDisputed && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <textarea 
                    placeholder="Provide additional evidence or reply to the admin..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ width: '100%', height: '80px', background: 'transparent', color: 'white', border: 'none', outline: 'none', resize: 'none', fontSize: '0.9rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handleAddNote}
                      disabled={isAddingNote || !newComment}
                      style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', opacity: isAddingNote || !newComment ? 0.5 : 1 }}
                    >
                      {isAddingNote ? 'Sending...' : 'REPLY TO CASE'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedEvent.disputeStatus?.startsWith('RESOLVED') && (
              <div style={{ 
                padding: '1.5rem', borderRadius: '20px', 
                background: selectedEvent.disputeStatus === 'RESOLVED_PAYOUT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${selectedEvent.disputeStatus === 'RESOLVED_PAYOUT' ? '#10b981' : '#ef4444'}`,
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 900, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Final Administrative Verdict:</div>
                <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {selectedEvent.disputeResolutionMemo}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: selectedEvent.disputeStatus === 'RESOLVED_PAYOUT' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                     VERDICT: {selectedEvent.disputeStatus.replace('RESOLVED_', '')}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    Resolved on {selectedEvent.disputeResolvedAt ? new Date(selectedEvent.disputeResolvedAt).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            )}

            {!selectedEvent.isDisputed && !selectedEvent.disputeStatus?.startsWith('RESOLVED') && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>If there is an issue with this transaction, you can flag it for administrative review.</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <textarea 
                    placeholder="Reason for dispute (e.g. incorrect amount, customer claim)..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    style={{ flex: 1, height: '100px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem', outline: 'none' }}
                  />
                </div>
                <button 
                  onClick={handleFlagDispute}
                  disabled={isFlagging || !disputeReason}
                  style={{ width: '100%', marginTop: '1rem', background: '#ef4444', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', opacity: isFlagging || !disputeReason ? 0.5 : 1 }}
                >
                  {isFlagging ? 'Flagging...' : 'FLAG FOR DISPUTE'}
                </button>
              </div>
            )}

            <button 
              onClick={() => { setSelectedEvent(null); setDisputeReason(""); setNewComment(""); }} 
              style={{ 
                width: '100%', marginTop: '2rem', background: '#334155', color: 'white', 
                border: 'none', padding: '1.2rem', borderRadius: '16px', fontWeight: 900, 
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              CLOSE CLAIM VIEW
            </button>
          </div>
        </div>
      )}
              

      {/* Summary Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #6366f1' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
            {activeTab === 'future' ? 'Projected Gross' : 'Total Customer Paid'}
          </h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.gross.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Secure Processing & Platform Fees</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>-${(totals.platform + totals.processing).toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>
            {activeTab === 'settled_history' ? 'Net Paid to Shop' : 'Net Total Payout'}
          </h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'payout_queue', label: 'Awaiting Payout', icon: '🏧', sub: 'Completed & ready to send' },
            { id: 'settled_history', label: 'Payout History', icon: '📜', sub: 'Funds settled to your bank' },
            { id: 'disputes', label: 'Disputes & Claims', icon: '⚠️', sub: 'Frozen or resolved' },
            { id: 'future', label: 'Future Forecast', icon: '📅', sub: 'Upcoming revenue' }
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
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>{tab.sub}</div>
            </button>
          ))}
        </div>

        {activeTab === 'settled_history' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>Filter History:</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 700 }}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 700 }}>
              <option value="all">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (<option key={m} value={i.toString()}>{m}</option>))}
            </select>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Claim Status:</span>
            <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setDisputeSubTab('pending')}
                style={{ 
                  background: disputeSubTab === 'pending' ? '#f59e0b' : 'transparent',
                  color: disputeSubTab === 'pending' ? 'white' : '#64748b',
                  border: 'none',
                  padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s',
                  boxShadow: disputeSubTab === 'pending' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                PENDING ({data.filter(e => e.isDisputed && e.disputeStatus === 'PENDING').length})
              </button>
              <button 
                onClick={() => setDisputeSubTab('resolved')}
                style={{ 
                  background: disputeSubTab === 'resolved' ? '#10b981' : 'transparent',
                  color: disputeSubTab === 'resolved' ? 'white' : '#64748b',
                  border: 'none',
                  padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s',
                  boxShadow: disputeSubTab === 'resolved' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                RESOLVED ({data.filter(e => e.disputeStatus && e.disputeStatus.startsWith('RESOLVED')).length})
              </button>
            </div>
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
                        <span style={{ opacity: 0.6 }}>Total Customer Paid:</span>
                        <span style={{ fontWeight: 800 }}>${event.grossAmount.toFixed(2)}</span>
                        <span style={{ opacity: 0.6 }}>Secure Processing & Platform Fees:</span>
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>-${(event.commissionFee + event.processingFee + event.priorityFee).toFixed(2)}</span>
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
            "Future bookings represent expected inflows. These figures are realized once the service is completed." :
            "Settled transactions have been verified and included in a payout batch. Platform fees include secure processing, priority booking, and standard marketplace commission."
          }
        </p>
      </div>
    </div>
  );
}
