"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  updatePlatformSettingsAction, 
  deleteFeeScheduleAction,
  triggerWeeklyRunAction, 
  updateSettlementStatusAction,
  getSettlementDetailedReportAction 
} from "../app/admin/payouts/actions";
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

export default function SettlementManager({ 
  initialSettlements, 
  initialSettings 
}: { 
  initialSettlements: any[], 
  initialSettings: any 
}) {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>(initialSettlements);
  const [settings, setSettings] = useState(initialSettings);
  
  // Calculate if a schedule is active "right now"
  const activeSchedule = settings.schedules?.slice().reverse().find((s: any) => new Date(s.effectiveFrom) <= new Date());
  const effectiveFee = activeSchedule ? activeSchedule.feePercentage : settings.defaultPlatformFee;
  const isOverridden = !!activeSchedule;

  // Local states for inputs
  const [feeInput, setFeeInput] = useState((initialSettings.defaultPlatformFee * 100).toString());
  const [defaultFeeEffectiveDate, setDefaultFeeEffectiveDate] = useState("");
  
  const [futureFee, setFutureFee] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState("");

  // Detailed Report State
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchingReport, setIsFetchingReport] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setSettlements(initialSettlements);
    setSettings(initialSettings);
    setFeeInput((initialSettings.defaultPlatformFee * 100).toString());
    if (initialSettings.defaultFeeEffectiveFrom) {
      setDefaultFeeEffectiveDate(new Date(initialSettings.defaultFeeEffectiveFrom).toISOString().split('T')[0]);
    }
  }, [initialSettlements, initialSettings]);

  const handleUpdateIdentity = async (field: string, value: string) => {
    setIsUpdating(true);
    const res = await updatePlatformSettingsAction({ [field]: value } as any);
    if ((res as any).error) alert("Error: " + (res as any).error);
    else if ((res as any).settings) {
        setSettings((res as any).settings);
        router.refresh();
    }
    setIsUpdating(false);
  };

  const handleUpdateCurrentFee = async () => {
    const val = parseFloat(feeInput);
    if (isNaN(val)) return alert("Invalid fee value");
    setIsUpdating(true);
    const res = await updatePlatformSettingsAction({ 
        fee: val, 
        defaultFeeEffectiveFrom: defaultFeeEffectiveDate || undefined
    });
    if ((res as any).error) alert("Error: " + (res as any).error);
    else {
        if ((res as any).settings) {
            setSettings((res as any).settings);
            setFeeInput(((res as any).settings.defaultPlatformFee * 100).toString());
        }
        router.refresh();
        alert("Current commission updated!");
    }
    setIsUpdating(false);
  };

  const handleScheduleFee = async () => {
    const val = parseFloat(futureFee);
    if (isNaN(val) || !effectiveDate) return alert("Please provide both a fee and an effective date.");
    
    setIsUpdating(true);
    const res = await updatePlatformSettingsAction({ 
        fee: val, 
        effectiveFrom: effectiveDate 
    });
    
    if ((res as any).error) alert("Error: " + (res as any).error);
    else {
        alert("Fee change scheduled successfully!");
        setFutureFee("");
        setEffectiveDate("");
    }
    setIsUpdating(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Remove this scheduled change?")) return;
    setIsUpdating(true);
    const res = await deleteFeeScheduleAction(id);
    if ((res as any).error) alert("Error: " + (res as any).error);
    setIsUpdating(false);
  };

  const handleTriggerRun = async () => {
    if (!confirm("Run Daily Settlement? This will bundle all new bookings AND re-process any outstanding batches from your defined effective date onward.")) return;
    setIsRunning(true);
    const res = await triggerWeeklyRunAction();
    if ((res as any).error) alert("Error: " + (res as any).error);
    else if ((res as any).message) alert((res as any).message);
    else {
        alert(`Settlement run complete! New batches generated.`);
        router.refresh();
    }
    setIsRunning(false);
  };

  const handleDetailedPrint = async (id: string) => {
    setIsFetchingReport(true);
    const res = await getSettlementDetailedReportAction(id);
    if ((res as any).error) alert("Report Error: " + (res as any).error);
    else setReportData(res);
    setIsFetchingReport(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: string, comment?: string) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, adminComments: comment || s.adminComments } : s));
    const res = await updateSettlementStatusAction(id, newStatus, comment);
    if ((res as any).error) {
        alert("Error: " + (res as any).error);
        setSettlements(initialSettlements);
    }
    setCommentingId(null);
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "SETTLED") return "#10b981";
    if (s === "INVESTIGATION" || s === "DISPUTE") return "#ef4444";
    return "var(--primary)";
  };

  return (
    <div className="settlement-manager">
      {/* 1. Global Platform Branding */}
      <section className="glass" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid var(--primary)' }}>
         <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Platform Identity Settings</h2>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>PLATFORM NAME</label>
                <input 
                    type="text" 
                    value={settings.platformName} 
                    onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                    onBlur={(e) => handleUpdateIdentity('name', e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                />
            </div>
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>ABN / TAX ID</label>
                <input 
                    type="text" 
                    value={settings.platformAbl} 
                    onChange={(e) => setSettings({...settings, platformAbl: e.target.value})}
                    onBlur={(e) => handleUpdateIdentity('abl', e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                />
            </div>
            <div style={{ flex: 1.5 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>OFFICIAL BUSINESS ADDRESS</label>
                <input 
                    type="text" 
                    value={settings.platformAddress || ""} 
                    onChange={(e) => setSettings({...settings, platformAddress: e.target.value})}
                    onBlur={(e) => handleUpdateIdentity('address', e.target.value)}
                    placeholder="Enter full business address"
                    style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                />
            </div>
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>CONTACT NO</label>
                <input 
                    type="text" 
                    value={settings.platformPhone || ""} 
                    onChange={(e) => setSettings({...settings, platformPhone: e.target.value})}
                    onBlur={(e) => handleUpdateIdentity('phone', e.target.value)}
                    placeholder="+1 234 567 890"
                    style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                />
            </div>
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>EMAIL PORTAL</label>
                <input 
                    type="email" 
                    value={settings.platformEmail || ""} 
                    onChange={(e) => setSettings({...settings, platformEmail: e.target.value})}
                    onBlur={(e) => handleUpdateIdentity('email', e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                />
            </div>
         </div>
      </section>

      {/* 2. Commission Management & Scheduling */}
      <section className="glass" style={{ padding: '2.5rem', marginBottom: '3rem', border: '2px solid #000', background: '#fcfcfc', borderRadius: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>⚙️ Commission Engine & Date Rules</h2>
            <div style={{ background: '#000', color: '#fff', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900 }}>
               DYNAMIC ENGINE ACTIVE
            </div>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
            {/* Left: Current Fee & Cutover */}
            <div style={{ paddingRight: '2rem', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b' }}>GLOBAL DEFAULT FEE</h3>
                    {isOverridden && (
                        <div style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '6px', fontWeight: 900, animation: 'pulse 2s infinite' }}>
                           ⚠️ OVERRIDE ACTIVE ({(effectiveFee * 100).toFixed(1)}%)
                        </div>
                    )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>FEE PERCENTAGE</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="number" 
                                    value={feeInput} 
                                    onChange={(e) => setFeeInput(e.target.value)}
                                    style={{ width: '100%', padding: '1rem 2.5rem 1rem 1rem', background: '#fff', color: '#000', border: '2px solid #000', borderRadius: '12px', fontWeight: 900, fontSize: '1.5rem' }} 
                                />
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: '#000', fontSize: '1.2rem' }}>%</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>EFFECTIVE FROM (CUTOVER)</label>
                            <input 
                                type="date" 
                                value={defaultFeeEffectiveDate}
                                onChange={(e) => setDefaultFeeEffectiveDate(e.target.value)}
                                style={{ width: '100%', padding: '1.15rem 1rem', background: '#fff', color: '#000', border: '2px solid #e2e8f0', borderRadius: '12px', fontWeight: 700 }} 
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleUpdateCurrentFee}
                        disabled={isUpdating}
                        style={{ width: '100%', padding: '1.2rem', background: '#000', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', fontSize: '1rem', letterSpacing: '1px' }}>
                        {isUpdating ? 'SYNCING...' : 'LOCK IN NEW GLOBAL RULES'}
                    </button>
                </div>
                <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
                    <span style={{ color: '#000', fontWeight: 900 }}>Note:</span> All bookings occurring <b>before</b> this date will remain locked to legacy rules. All bookings <b>on or after</b> this date will use the new fee.
                </p>
            </div>

            {/* Right: Schedule New Fee */}
            <div>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>SCHEDULE FUTURE CHANGE</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type="number" 
                            placeholder="New Fee %"
                            value={futureFee}
                            onChange={(e) => setFutureFee(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                        />
                    </div>
                    <input 
                        type="date" 
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        style={{ width: '100%', padding: '0.8rem', background: '#fff', color: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px' }} 
                    />
                </div>
                <button 
                    onClick={handleScheduleFee}
                    disabled={isUpdating}
                    style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}>
                    SCHEDULE RATE CHANGE
                </button>
            </div>
         </div>

         {/* Upcoming Schedules List */}
         {settings.schedules?.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: '#64748b' }}>UPCOMING SCHEDULED CHANGES</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {settings.schedules.map((s: any) => (
                        <div key={s.id} style={{ padding: '0.75rem 1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div>
                                <span style={{ fontWeight: 900, color: '#4f46e5', fontSize: '1.1rem' }}>{(s.feePercentage * 100).toFixed(1)}%</span>
                                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Effective: {new Date(s.effectiveFrom).toLocaleDateString()}</p>
                            </div>
                            <button 
                                onClick={() => handleDeleteSchedule(s.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
         )}
         {isUpdating && <p style={{ fontSize: '0.7rem', color: '#4f46e5', marginTop: '1rem', fontWeight: 800 }}>SYNCING CENTRAL COMMISSION RECORDS...</p>}
      </section>

      {/* 3. The Ledger Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Financial Settlement Ledger</h2>
        <button 
            onClick={handleTriggerRun}
            disabled={isRunning}
            style={{ padding: '1rem 2rem', background: '#fff', color: '#0f172a', border: '2px solid #0f172a', borderRadius: '12px', fontWeight: 900, cursor: 'pointer' }}>
            {isRunning ? "PROCESSING..." : "TRIGGER SETTLEMENT RUN"}
        </button>
      </div>

      <div style={{ background: '#fff', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Week / Shop</th>
              <th>Total Customer Paid</th>
              <th>Status</th>
              <th>Control</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td>
                    <span style={{ fontWeight: 800 }}>{s.weekLabel}</span>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{s.tenant.name}</p>
                </td>
                <td>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>${s.grossAmount.toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                        <span style={{ opacity: 0.6 }}>Net Total Payout:</span> 
                        <span style={{ fontWeight: 800, color: '#10b981', marginLeft: '5px' }}>${s.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.2rem' }}>
                        Fees: ${s.feeAmount.toFixed(2)} ({(s.grossAmount > 0 ? ((s.feeAmount / s.grossAmount) * 100).toFixed(1) : 0)}%)
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {s.status.toUpperCase() !== "SETTLED" && (
                            <button 
                                onClick={() => handleStatusUpdate(s.id, "SETTLED")}
                                style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                                SETTLE
                            </button>
                        )}
                        <button 
                            onClick={() => handleDetailedPrint(s.id)}
                            disabled={isFetchingReport}
                            style={{ padding: '0.4rem 0.8rem', background: 'white', color: 'black', border: '1px solid #000', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                            PRINT
                        </button>
                        <button 
                            onClick={() => { setCommentingId(s.id); setTempComment(s.adminComments || ""); }}
                            style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                            NOTES
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Notes Modal Area */}
      {commentingId && !reportData && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass" style={{ width: '400px', padding: '2rem', border: '2px solid var(--primary)' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Investigation Notes</h3>
                  <textarea 
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    rows={5}
                    style={{ width: '100%', padding: '1rem', background: '#000', color: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                     <button onClick={() => setCommentingId(null)} style={{ flex: 1, padding: '0.8rem', border: '1px solid var(--border)', borderRadius: '8px' }}>Close</button>
                     <button onClick={() => handleStatusUpdate(commentingId, "INVESTIGATION", tempComment)} style={{ flex: 1, background: 'var(--primary)', color: 'black', fontWeight: 900, border: 'none', borderRadius: '8px' }}>Save Notes</button>
                  </div>
              </div>
          </div>
      )}

      {/* 5. Master Invoice PDF Preview */}
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
                   DOWNLOAD PDF / PRINT
                </button>
                <button 
                   onClick={() => setReportData(null)}
                   style={{ padding: '0.8rem 1.5rem', background: '#eee', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
                   BACK TO LEDGER
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
                        <th style={{ textAlign: 'left', padding: '10px' }}>DATE / TIME</th>
                        <th style={{ textAlign: 'left', padding: '10px' }}>SERVICE ITEM</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>TOTAL CUSTOMER PAID</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>SECURE PROCESSING & PLATFORM FEES</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>NET TOTAL PAYOUT</th>
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
                                {new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(a.startTime))}<br/>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(a.startTime))}</span>
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                                <strong>{a.serviceName}</strong><br/>
                                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Client: {a.customerName}</span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>${(a.totalWithFee || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>-${(a.platformDeduction || 0).toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900 }}>${(a.actualServicePrice || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                        <span>TOTAL CUSTOMER PAID:</span>
                        <span style={{ fontWeight: 800 }}>${reportData.settlement.grossAmount.toFixed(2)}</span>
                    </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid black' }}>
                        <span>SECURE PROCESSING & PLATFORM FEES:</span>
                        <span style={{ fontWeight: 800 }}>-${reportData.settlement.feeAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', fontSize: '1.4rem', borderBottom: '3px double black' }}>
                        <span style={{ fontWeight: 900 }}>NET TOTAL PAYOUT:</span>
                        <span style={{ fontWeight: 900 }}>${reportData.settlement.amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {reportData.settlement.adminComments && (
                <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', border: '1px solid #ccc' }}>
                    <h4 style={{ marginBottom: '10px' }}>Official Ledger Audit Remarks:</h4>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{reportData.settlement.adminComments}</p>
                </div>
            )}
          </div>
      )}
    </div>
  );
}
