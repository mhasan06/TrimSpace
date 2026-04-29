"use client";

import React, { useState } from "react";
import styles from "../app/dashboard/page.module.css";
import { resolveDisputeAction, addDisputeNoteAction, settleMerchantBatchAction } from "../app/dashboard/ledger/actions";

interface AdminLedgerEvent {
  id: string;
  bookingId: string;
  date: string;
  serviceDate: string;
  type: 'BOOKING_PAYMENT' | 'CANCELLATION_FEE' | 'REFUND' | 'PAYOUT' | 'ADJUSTMENT';
  status: 'PENDING' | 'SETTLED' | 'REFUNDED' | 'FAILED';
  customer: string;
  shopName: string;
  shopId: string;
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

export default function AdminLedgerView({ data }: { data: AdminLedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'payout_queue' | 'settled_history' | 'disputes' | 'future'>('payout_queue');
  const [disputeSubTab, setDisputeSubTab] = useState<'pending' | 'resolved'>('pending');
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isTriggering, setIsTriggering] = useState(false);
  const [settlingShopId, setSettlingShopId] = useState<string | null>(null);
  const [resolvingEvent, setResolvingEvent] = useState<AdminLedgerEvent | null>(null);
  const [resolutionMemo, setResolutionMemo] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!resolvingEvent || !newComment) return;
    setIsAddingNote(true);
    const res = await addDisputeNoteAction(resolvingEvent.id, newComment);
    if (res.success) {
      setNewComment("");
    } else {
      alert(res.error);
    }
    setIsAddingNote(false);
  };

  const handleResolve = async (resolution: 'PAYOUT' | 'REFUND' | 'NO_ACTION') => {
    if (!resolvingEvent || !resolutionMemo) return;
    setIsResolving(true);
    const res = await resolveDisputeAction(resolvingEvent.id, resolution, resolutionMemo);
    if (res.success) {
      alert(`Dispute resolved as ${resolution}. Funds updated.`);
      setResolvingEvent(null);
      setResolutionMemo("");
    } else {
      alert(res.error);
    }
    setIsResolving(false);
  };

  const filteredData = data.filter(event => {
    const eventDate = new Date(event.serviceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isBeforeToday = eventDate < today;

    // 1. Disputes Tab logic
    if (activeTab === 'disputes') {
      if (disputeSubTab === 'pending') {
        return event.isDisputed && event.disputeStatus === 'PENDING';
      } else {
        return event.disputeStatus && (event.disputeStatus === 'RESOLVED_PAYOUT' || event.disputeStatus === 'RESOLVED_REFUND' || event.disputeStatus === 'RESOLVED_NO_ACTION');
      }
    }

    // Always exclude pending disputes from other tabs to avoid double-payouts
    if (event.isDisputed && event.disputeStatus === 'PENDING') return false;

    // 2. Payout Queue (Unsettled, completed transactions)
    if (activeTab === 'payout_queue') {
       return !event.isSettled && isBeforeToday && !event.isFuture;
    }

    // 3. Settled History (Transactions already paid to merchant)
    if (activeTab === 'settled_history') {
       if (!event.isSettled) return false;
       if (selectedYear !== "all" && eventDate.getFullYear().toString() !== selectedYear) return false;
       if (selectedMonth !== "all" && eventDate.getMonth().toString() !== selectedMonth) return false;
       return true;
    }

    // 4. Pipeline Forecast (Upcoming bookings)
    if (activeTab === 'future') {
       return event.isFuture || !isBeforeToday;
    }

    return true;
  });

  const totals = filteredData.reduce((acc, curr) => ({
    gross: acc.gross + curr.grossAmount,
    net: acc.net + curr.netPayable,
    platform: acc.platform + curr.netPlatform,
    stripe: acc.stripe + curr.processingFee
  }), { gross: 0, net: 0, platform: 0, stripe: 0 });

  const groupedByShop = filteredData.reduce((acc: any, event) => {
    if (!acc[event.shopId]) {
      acc[event.shopId] = { 
        id: event.shopId,
        name: event.shopName, 
        events: [], 
        totals: { gross: 0, net: 0, platform: 0, stripe: 0 } 
      };
    }
    acc[event.shopId].events.push(event);
    acc[event.shopId].totals.gross += event.grossAmount;
    acc[event.shopId].totals.net += event.netPayable;
    acc[event.shopId].totals.platform += event.netPlatform;
    acc[event.shopId].totals.stripe += event.processingFee;
    return acc;
  }, {});

  const shopEntries = Object.entries(groupedByShop).sort((a: any, b: any) => b[1].totals.net - a[1].totals.net);

  const handleSettleShop = async (shopId: string, shopName: string, amount: number, appointmentIds: string[]) => {
    if (!confirm(`Mark $${amount.toFixed(2)} as PAID to ${shopName}? This will move these items to history.`)) return;
    
    setSettlingShopId(shopId);
    const res = await settleMerchantBatchAction(shopId, amount, appointmentIds);
    if (res.success) {
       alert(`Batch payout for ${shopName} successful!`);
    } else {
       alert(res.error);
    }
    setSettlingShopId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Financial Command Center</h1>
          <p style={{ opacity: 0.6, fontSize: '1rem' }}>Managing {shopEntries.length} shops in this view.</p>
        </div>
        {activeTab === 'payout_queue' && shopEntries.length > 0 && (
           <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 2rem', borderRadius: '20px', border: '1px solid #10b981', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Pending Payouts</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
           </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #6366f1' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Total Customer Paid</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.gross.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Secure Processing & Platform Fees</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>-${(totals.platform + totals.stripe).toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Net Total Payout</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
        </div>
      </div>

      {resolvingEvent && (
        <div 
          onClick={() => { setResolvingEvent(null); setResolutionMemo(""); setNewComment(""); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
        >
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              {resolvingEvent.disputeStatus?.startsWith('RESOLVED') ? 'Dispute Audit Log' : 'Dispute Investigation'}
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
               <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px dashed #f59e0b' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Original Merchant Claim:</div>
                  <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>"{resolvingEvent.disputeReason}"</div>
               </div>
               <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Raised By Customer:</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>{resolvingEvent.customer}</div>
               </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Investigation Timeline:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {(resolvingEvent.disputeNotes || []).length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                    No investigation notes yet. Start the conversation below.
                  </div>
                )}
                {(resolvingEvent.disputeNotes || []).map((note, idx) => (
                  <div key={idx} style={{ 
                    alignSelf: note.authorRole === 'ADMIN' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: note.authorRole === 'ADMIN' ? '#6366f1' : 'rgba(255,255,255,0.07)',
                    padding: '1rem',
                    borderRadius: '16px',
                    borderBottomRightRadius: note.authorRole === 'ADMIN' ? '2px' : '16px',
                    borderBottomLeftRadius: note.authorRole === 'MERCHANT' ? '2px' : '16px',
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.8, marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>{note.authorName} ({note.authorRole})</span>
                      <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{note.content}</div>
                  </div>
                ))}
              </div>

              {!resolvingEvent.disputeStatus?.startsWith('RESOLVED') && (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <textarea 
                    placeholder="Post a status update or ask the merchant a question..."
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
                      {isAddingNote ? 'Posting...' : 'POST UPDATE'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {resolvingEvent.disputeStatus?.startsWith('RESOLVED') ? (
              <div style={{ 
                padding: '1.5rem', borderRadius: '20px', 
                background: resolvingEvent.disputeStatus === 'RESOLVED_PAYOUT' ? 'rgba(16, 185, 129, 0.1)' : (resolvingEvent.disputeStatus === 'RESOLVED_REFUND' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)'),
                border: `1px solid ${resolvingEvent.disputeStatus === 'RESOLVED_PAYOUT' ? '#10b981' : (resolvingEvent.disputeStatus === 'RESOLVED_REFUND' ? '#ef4444' : '#64748b')}`
              }}>
                <div style={{ fontWeight: 900, fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Final Resolution Summary:</div>
                <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {resolvingEvent.disputeResolutionMemo}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.8rem', color: resolvingEvent.disputeStatus === 'RESOLVED_PAYOUT' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                     VERDICT: {resolvingEvent.disputeStatus.replace('RESOLVED_', '')}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Closed by <span style={{ color: 'var(--primary)' }}>{resolvingEvent.disputeResolvedBy || 'System Admin'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase', marginBottom: '1rem' }}>Final Resolution Decision:</div>
                <textarea 
                  placeholder="Final decision memo (Visible to merchant)..."
                  value={resolutionMemo}
                  onChange={(e) => setResolutionMemo(e.target.value)}
                  style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleResolve('PAYOUT')}
                    disabled={isResolving || !resolutionMemo}
                    style={{ flex: 1, background: '#10b981', color: 'black', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', opacity: isResolving || !resolutionMemo ? 0.5 : 1 }}
                  >
                    RELEASE PAYOUT
                  </button>
                  <button 
                    onClick={() => handleResolve('REFUND')}
                    disabled={isResolving || !resolutionMemo}
                    style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', opacity: isResolving || !resolutionMemo ? 0.5 : 1 }}
                  >
                    REFUND CUSTOMER
                  </button>
                  <button 
                    onClick={() => handleResolve('NO_ACTION')}
                    disabled={isResolving || !resolutionMemo}
                    style={{ flex: 1, background: '#334155', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', opacity: isResolving || !resolutionMemo ? 0.5 : 1 }}
                  >
                    NO ACTION
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { setResolvingEvent(null); setResolutionMemo(""); setNewComment(""); }} 
              style={{ 
                width: '100%', marginTop: '2rem', background: '#334155', color: 'white', 
                border: 'none', padding: '1.2rem', borderRadius: '16px', fontWeight: 900, 
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              CLOSE COMMAND CENTER
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'payout_queue', label: 'Merchant Payout Queue', icon: '🏧', sub: 'Batches awaiting settlement' },
            { id: 'settled_history', label: 'Settled History', icon: '📜', sub: 'Completed payout runs' },
            { id: 'disputes', label: 'Active Disputes', icon: '⚠️', sub: 'Action required' },
            { id: 'future', label: 'Pipeline Forecast', icon: '📈', sub: 'Upcoming revenue projections' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? (tab.id === 'disputes' ? '#f59e0b' : 'var(--primary)') : 'transparent',
                color: activeTab === tab.id ? (tab.id === 'disputes' ? 'black' : 'white') : 'var(--foreground)',
                border: 'none', padding: '1rem 2rem', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', transition: 'all 0.2s', opacity: activeTab === tab.id ? 1 : 0.6, flex: 1, textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                 <span>{tab.icon}</span> {tab.label}
                 {tab.id === 'disputes' && data.filter(e => e.isDisputed && e.disputeStatus === 'PENDING').length > 0 && (
                   <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                     {data.filter(e => e.isDisputed && e.disputeStatus === 'PENDING').length}
                   </span>
                 )}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>{tab.sub}</div>
            </button>
          ))}
        </div>

        {activeTab === 'disputes' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolution Queue:</span>
            <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.4rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <button onClick={() => setDisputeSubTab('pending')} style={{ background: disputeSubTab === 'pending' ? '#f59e0b' : 'transparent', color: disputeSubTab === 'pending' ? 'white' : '#64748b', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem' }}>
                PENDING REVIEW ({data.filter(e => e.isDisputed && e.disputeStatus === 'PENDING').length})
              </button>
              <button onClick={() => setDisputeSubTab('resolved')} style={{ background: disputeSubTab === 'resolved' ? '#10b981' : 'transparent', color: disputeSubTab === 'resolved' ? 'white' : '#64748b', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.75rem' }}>
                RESOLVED HISTORY ({data.filter(e => e.disputeStatus?.startsWith('RESOLVED')).length})
              </button>
            </div>
          </div>
        )}

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
      </div>

      <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden' }}>
        <table className={styles.table}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1.5rem 2rem' }}>Merchant Name</th>
              <th>Transactions</th>
              <th>Total Customer Paid</th>
              <th>Secure Processing & Platform Fees</th>
              <th>Net Total Payout</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem' }}>{activeTab === 'payout_queue' ? 'Actions' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            {shopEntries.map(([shopId, data]: [string, any]) => (
              <React.Fragment key={shopId}>
                <tr style={{ cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setExpandedShopId(expandedShopId === shopId ? null : shopId)}>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{expandedShopId === shopId ? '▼' : '▶'}</span>
                      <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>{data.name}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{data.events.length} events</td>
                  <td style={{ fontWeight: 700 }}>${data.totals.gross.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--secondary)' }}>-${(data.totals.platform + data.totals.stripe).toFixed(2)}</td>
                  <td>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>${data.totals.net.toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                    {activeTab === 'payout_queue' ? (
                       <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           handleSettleShop(shopId, data.name, data.totals.net, data.events.map((ev: any) => ev.id)); 
                         }}
                         disabled={settlingShopId === shopId}
                         style={{ background: '#10b981', color: 'black', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', opacity: settlingShopId === shopId ? 0.5 : 1 }}
                       >
                         {settlingShopId === shopId ? 'SETTLING...' : 'MARK AS PAID'}
                       </button>
                    ) : (
                       <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 900, fontSize: '0.8rem' }}>
                          <span style={{ background: '#10b981', color: 'black', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>PAID & SETTLED</span>
                       </div>
                    )}
                  </td>
                </tr>
                {expandedShopId === shopId && (
                  <tr>
                    <td colSpan={6} style={{ padding: '0 2rem 2rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
                      <div className="glass" style={{ borderRadius: '16px', padding: '1rem', marginTop: '-1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                             <thead>
                                 <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '1rem' }}>REF ID</th>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Total Customer Paid</th>
                                    <th>Secure Processing & Platform Fees</th>
                                    <th style={{ textAlign: 'right' }}>Net Total Payout</th>
                                 </tr>
                             </thead>
                             <tbody>
                                {data.events.map((event: any) => (
                                  <tr key={event.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                     <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--secondary)', fontSize: '0.7rem' }}>{event.id.slice(-8).toUpperCase()}</td>
                                     <td style={{ opacity: 0.7 }}>{new Date(event.serviceDate).toLocaleDateString()}</td>
                                     <td style={{ fontWeight: 700 }}>{event.customer}</td>
                                     <td>{event.serviceName}</td>
                                     <td style={{ fontWeight: 700 }}>${event.grossAmount.toFixed(2)}</td>
                                     <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>-${(event.netPlatform + event.processingFee).toFixed(2)}</td>
                                     <td style={{ textAlign: 'right', fontWeight: 900, color: '#10b981' }}>${event.netPayable.toFixed(2)}</td>
                                       {activeTab === 'disputes' && (
                                         <td style={{ textAlign: 'right', paddingLeft: '1rem' }}>
                                           <button onClick={() => setResolvingEvent(event)} style={{ background: event.disputeStatus?.startsWith('RESOLVED') ? '#6366f1' : '#f59e0b', color: event.disputeStatus?.startsWith('RESOLVED') ? 'white' : 'black', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                                             {event.disputeStatus?.startsWith('RESOLVED') ? 'AUDIT' : 'RESOLVE'}
                                           </button>
                                         </td>
                                       )}
                                  </tr>
                                ))}
                             </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
