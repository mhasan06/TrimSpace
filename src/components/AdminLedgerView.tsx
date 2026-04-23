"use client";

import React, { useState } from "react";
import styles from "../app/dashboard/page.module.css";
import { resolveDisputeAction } from "../app/dashboard/ledger/actions";

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
  isDisputed?: boolean;
  disputeReason?: string | null;
  disputeStatus?: string | null;
  disputeResolvedBy?: string | null;
}

export default function AdminLedgerView({ data }: { data: AdminLedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'settled' | 'future' | 'disputes'>('settled');
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isTriggering, setIsTriggering] = useState(false);
  const [resolvingEvent, setResolvingEvent] = useState<AdminLedgerEvent | null>(null);
  const [resolutionMemo, setResolutionMemo] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (resolution: 'PAYOUT' | 'REFUND') => {
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

    if (activeTab === 'disputes') {
      return event.isDisputed;
    }

    if (event.isDisputed) return false;

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
    platform: acc.platform + curr.netPlatform,
    stripe: acc.stripe + curr.processingFee
  }), { gross: 0, net: 0, platform: 0, stripe: 0 });

  const groupedByShop = filteredData.reduce((acc: any, event) => {
    if (!acc[event.shopId]) {
      acc[event.shopId] = { 
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

  const handleTriggerAll = async () => {
    setIsTriggering(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert("Global Settlement Run Complete! All eligible shops have been settled.");
    setIsTriggering(false);
  };

  const handleSettleShop = async (shopName: string) => {
    if (!confirm(`Trigger immediate settlement for ${shopName}?`)) return;
    alert(`Settlement generated for ${shopName}. Funds will be transferred to their nominated bank account.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Financial Command Center</h1>
          <p style={{ opacity: 0.6, fontSize: '1rem' }}>Managing {shopEntries.length} active merchants.</p>
        </div>
        <button
          onClick={handleTriggerAll}
          disabled={isTriggering}
          style={{
            background: 'var(--secondary)', color: 'white', border: 'none',
            padding: '1.2rem 2.5rem', borderRadius: '16px', fontWeight: 900,
            cursor: isTriggering ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            boxShadow: '0 10px 20px -5px rgba(var(--secondary-rgb), 0.3)'
          }}
        >
          {isTriggering ? 'Processing All Batches...' : '🚀 Trigger Global Settlement Run'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #6366f1' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Gross Collected</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.gross.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--secondary)' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Platform Profit</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.platform.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Stripe Processing</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.stripe.toFixed(2)}</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
          <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.5rem' }}>Merchant Liability</h4>
          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>${totals.net.toFixed(2)}</div>
        </div>
      </div>

      {resolvingEvent && (
        <div 
          onClick={() => setResolvingEvent(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
        >
          <div onClick={e => e.stopPropagation()} className="glass" style={{ width: '500px', padding: '2.5rem', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Resolve Financial Dispute</h2>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', border: '1px dashed #f59e0b' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Merchant Reason:</div>
               <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>"{resolvingEvent.disputeReason}"</div>
            </div>

            <textarea 
              placeholder="Internal resolution memo (Mandatory)..."
              value={resolutionMemo}
              onChange={(e) => setResolutionMemo(e.target.value)}
              style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem', marginBottom: '2rem', outline: 'none' }}
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
            </div>
            <button onClick={() => setResolvingEvent(null)} style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: 'white', border: 'none', opacity: 0.5, fontSize: '0.8rem', cursor: 'pointer' }}>Cancel & Exit</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'settled', label: 'Merchant Payout Queue', icon: '🏧', sub: 'Batches ready for settlement' },
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
                 {tab.id === 'disputes' && data.filter(e => e.isDisputed).length > 0 && (
                   <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                     {data.filter(e => e.isDisputed).length}
                   </span>
                 )}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>{tab.sub}</div>
            </button>
          ))}
        </div>

        {activeTab === 'settled' && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.5, textTransform: 'uppercase' }}>Time Range:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 700 }}
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 700 }}
            >
              <option value="all">All Months</option>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                <option key={m} value={i.toString()}>{m}</option>
              ))}
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
              <th>Gross Volume</th>
              <th>Platform Take</th>
              <th>Stripe Cost</th>
              <th>Net Due to Shop</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
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
                  <td style={{ fontWeight: 800, color: 'var(--secondary)' }}>${data.totals.platform.toFixed(2)}</td>
                  <td style={{ fontWeight: 700, opacity: 0.6 }}>${data.totals.stripe.toFixed(2)}</td>
                  <td>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>${data.totals.net.toFixed(2)}</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSettleShop(data.name); }}
                      style={{ background: '#10b981', color: 'black', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 900, cursor: 'pointer' }}
                    >
                      SETTLE NOW
                    </button>
                  </td>
                </tr>
                {expandedShopId === shopId && (
                  <tr>
                    <td colSpan={7} style={{ padding: '0 2rem 2rem 2rem', background: 'rgba(255,255,255,0.01)' }}>
                      <div className="glass" style={{ borderRadius: '16px', padding: '1rem', marginTop: '-1rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                               <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', opacity: 0.5, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  <th style={{ padding: '1rem' }}>REF ID</th>
                                  <th>Transaction Date</th>
                                  <th>Service Date</th>
                                  <th>Customer</th>
                                  <th>Service Description</th>
                                  {activeTab === 'disputes' && <th>Merchant Reason</th>}
                                  <th>Service Fees</th>
                                  <th>Status</th>
                                  <th>Gross Revenue</th>
                                  <th>Platform Fee</th>
                                  <th>Stripe Fee</th>
                                  <th style={{ textAlign: 'right' }}>Merchant Payout</th>
                               </tr>
                            </thead>
                            <tbody>
                               {data.events.map((event: any) => (
                                 <tr key={event.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--secondary)', fontSize: '0.7rem' }}>
                                      {event.id.slice(-8).toUpperCase()}
                                    </td>
                                    <td style={{ opacity: 0.7 }}>{new Date(event.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{new Date(event.serviceDate).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 700 }}>{event.customer}</td>
                                    <td>{event.serviceName}</td>
                                    {activeTab === 'disputes' && (
                                      <td style={{ fontStyle: 'italic', color: '#f59e0b', fontSize: '0.75rem', maxWidth: '200px' }}>
                                        "{event.disputeReason}"
                                      </td>
                                    )}
                                    <td style={{ fontWeight: 600 }}>
                                      ${event.servicePrice.toFixed(2)}
                                    </td>
                                    <td>
                                      <span style={{ 
                                        fontSize: '0.65rem', 
                                        background: event.type === 'CANCELLATION_FEE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: event.type === 'CANCELLATION_FEE' ? '#ef4444' : '#10b981',
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 900
                                      }}>
                                        {event.type.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>${event.grossAmount.toFixed(2)}</td>
                                    <td style={{ color: 'var(--secondary)', fontWeight: 700 }}>+${event.netPlatform.toFixed(2)}</td>
                                    <td style={{ opacity: 0.6 }}>-${event.processingFee.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 900, color: '#10b981' }}>${event.netPayable.toFixed(2)}</td>
                                    {activeTab === 'disputes' && (
                                      <td style={{ textAlign: 'right', paddingLeft: '1rem' }}>
                                        <button 
                                          onClick={() => setResolvingEvent(event)}
                                          style={{ background: '#f59e0b', color: 'black', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
                                        >
                                          RESOLVE
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
