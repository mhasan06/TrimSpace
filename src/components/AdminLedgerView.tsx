"use client";

import React, { useState } from "react";
import styles from "../app/dashboard/page.module.css";

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
}

export default function AdminLedgerView({ data }: { data: AdminLedgerEvent[] }) {
  const [activeTab, setActiveTab] = useState<'settled' | 'future'>('settled');
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isTriggering, setIsTriggering] = useState(false);

  const filteredData = data.filter(event => {
    const eventDate = new Date(event.serviceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isBeforeToday = eventDate < today;

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

  // Group by SHOP
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
      {/* Admin Action Bar */}
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

      {/* Summary Header */}
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

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {[
            { id: 'settled', label: 'Merchant Payout Queue', icon: '🏧', sub: 'Batches ready for settlement' },
            { id: 'future', label: 'Pipeline Forecast', icon: '📈', sub: 'Upcoming revenue projections' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--foreground)',
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

      {/* MERCHANT TABLE */}
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
                               <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', opacity: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
                                  <th style={{ padding: '1rem' }}>Date</th>
                                  <th>Client</th>
                                  <th>Service</th>
                                  <th>Status</th>
                                  <th>Gross</th>
                                  <th>Platform</th>
                                  <th>Stripe</th>
                                  <th style={{ textAlign: 'right' }}>Shop Net</th>
                               </tr>
                            </thead>
                            <tbody>
                               {data.events.map((event: any) => (
                                 <tr key={event.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                    <td style={{ padding: '0.8rem' }}>{new Date(event.serviceDate).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 700 }}>{event.customer}</td>
                                    <td>{event.serviceName}</td>
                                    <td>
                                      <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{event.type}</span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>${event.grossAmount.toFixed(2)}</td>
                                    <td style={{ color: 'var(--secondary)' }}>${event.netPlatform.toFixed(2)}</td>
                                    <td style={{ opacity: 0.6 }}>${event.processingFee.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>${event.netPayable.toFixed(2)}</td>
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
