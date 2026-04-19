"use client";

import { useState } from "react";
import { getShopSettlementReportAction } from "../app/admin/payouts/actions";
import styles from "../app/dashboard/page.module.css";

interface Settlement {
  id: string;
  tenantId: string;
  amount: number;
  grossAmount: number;
  feeAmount: number;
  status: string;
  weekLabel: string;
  adminComments: string | null;
  tenant: { name: string };
  createdAt: string;
}

export default function ShopSettlementLedger({ initialSettlements }: { initialSettlements: any[] }) {
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchingReport, setIsFetchingReport] = useState(false);

  const handleDetailedPrint = async (id: string) => {
    setIsFetchingReport(true);
    const res = await getShopSettlementReportAction(id);
    if ((res as any).error) alert("Report Error: " + (res as any).error);
    else setReportData(res);
    setIsFetchingReport(false);
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "SETTLED") return "#10b981";
    if (s === "INVESTIGATION" || s === "DISPUTE") return "#ef4444";
    return "var(--primary)";
  };

  return (
    <div className="shop-settlement-ledger">
      <div className="glass" style={{ overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '16px' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Day / Shop</th>
              <th>Volume (Net)</th>
              <th>Status</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {(initialSettlements || []).map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td>
                    <span style={{ fontWeight: 800 }}>{s.weekLabel}</span>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{s.tenant.name}</p>
                </td>
                <td>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>${s.amount.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                        Gross: ${s.grossAmount.toFixed(2)} 
                        <span style={{ marginLeft: '10px', color: 'var(--secondary)', fontWeight: 700 }}>
                            Fee Applied
                        </span>
                    </div>
                </td>
                <td>
                    <span style={{ 
                        border: `1px solid ${getStatusColor(s.status)}`,
                        color: getStatusColor(s.status),
                        padding: '0.3rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        textTransform: 'uppercase'
                    }}>
                        {s.status}
                    </span>
                </td>
                <td>
                    <button 
                        onClick={() => handleDetailedPrint(s.id)}
                        disabled={isFetchingReport}
                        style={{ padding: '0.4rem 1.2rem', background: 'white', color: 'black', border: '1px solid #000', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}>
                        PRINT
                    </button>
                </td>
              </tr>
            ))}
            {(!initialSettlements || initialSettlements.length === 0) && (
                <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                        No settlement batches finalized yet.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice PDF Preview (Reused from logic) */}
      {reportData && (
          <div className="print-report" style={{ position: 'fixed', inset: 0, background: 'white', color: 'black', zIndex: 9999, padding: '40px', overflowY: 'auto' }}>
            <style>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body * { visibility: hidden !important; }
                    .print-report, .print-report * { visibility: visible !important; }
                    .print-report { position: absolute !important; left: 0; top: 0; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; color: black !important; }
                    .no-print, .no-print * { display: none !important; visibility: hidden !important; }
                }
            `}</style>

            <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '20px', justifyContent: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <button 
                   onClick={() => window.print()}
                   style={{ padding: '0.8rem 1.5rem', background: '#000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>
                   PRINT SETTLEMENT INVOICE
                </button>
                <button 
                   onClick={() => setReportData(null)}
                   style={{ padding: '0.8rem 1.5rem', background: '#eee', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                   CLOSE PREVIEW
                </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid black', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '5px' }}>SETTLEMENT INVOICE</h1>
                    <p style={{ fontWeight: 800, color: '#666' }}>ID: {reportData.settlement.id.slice(-8).toUpperCase()}</p>
                    <p style={{ fontWeight: 800 }}>FOR: {reportData.settlement.weekLabel}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{reportData.platform.platformName}</h2>
                    <p>ABN: {reportData.platform.platformAbl}</p>
                    <p>{reportData.platform.platformAddress}</p>
                    <p>{reportData.platform.platformEmail}</p>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>ISSUED TO:</p>
                <h3 style={{ fontSize: '1.2rem' }}>{reportData.settlement.shopName}</h3>
                <p>{reportData.settlement.shopAddress}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                    <tr style={{ background: '#f5f5f5', borderBottom: '2px solid black' }}>
                        <th style={{ textAlign: 'left', padding: '10px' }}>BOOKING ID</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>DATE</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>CUSTOMER</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>SERVICE</th>
                        <th style={{ textAlign: 'center', padding: '10px' }}>PRIORITY FEE</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.appointments.map((a: any) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>
                                {a.bookingGroupId ? (
                                    <span style={{ color: 'var(--primary)', borderBottom: '1px dashed var(--primary)' }}>
                                        GRP-{a.bookingGroupId.slice(-6).toUpperCase()}
                                    </span>
                                ) : a.id.slice(-8).toUpperCase()}
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                                {new Date(a.startTime).toLocaleDateString("en-AU", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}<br/>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{new Date(a.startTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>{a.customerName}</td>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>{a.serviceName}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>${(a.priorityFee || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>${(a.totalWithFee || a.servicePrice).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                        <span>GROSS TOTAL:</span>
                        <span style={{ fontWeight: 800 }}>${reportData.settlement.grossAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid black' }}>
                        <span>PLATFORM FEES (INC. PRIORITY):</span>
                        <span style={{ fontWeight: 800 }}>-${reportData.settlement.feeAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '1.4rem', borderBottom: '3px double black' }}>
                        <span style={{ fontWeight: 900 }}>NET PAYOUT:</span>
                        <span style={{ fontWeight: 900 }}>${reportData.settlement.amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '0.8rem', opacity: 0.5 }}>
                <p>This is a system-generated financial document. For payment inquiries, please contact {reportData.platform.platformEmail}.</p>
            </div>
          </div>
      )}
    </div>
  );
}
