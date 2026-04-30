"use client";

import { useState } from "react";
import { resetTransactionalDataAction, runEndToEndValidationAction } from "./actions";

export default function DeveloperToolsPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm("CRITICAL: This will delete ALL appointments and settlements. Are you absolutely sure?")) return;
    setLoading(true);
    setStatus("Cleaning database...");
    const res = await resetTransactionalDataAction();
    setLoading(false);
    if (res.success) {
      alert("System Reset Complete.");
      setStatus("System Clean.");
    } else {
      alert("Error: " + res.error);
      setStatus("Reset Failed.");
    }
  };

  const handleRunTest = async () => {
    setLoading(true);
    setReport(null);
    setStatus("Running E2E Validation (Reset -> Mock -> Settle -> Audit)...");
    const res = await runEndToEndValidationAction();
    setLoading(false);
    if (res.success) {
      setReport(res.report);
      setStatus("Test Sequence Complete.");
    } else {
      alert("Test Failed: " + res.error);
      setStatus("Sequence Error.");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>System Diagnostics</h1>
        <p style={{ opacity: 0.6 }}>Internal tools for financial logic verification and clean-room testing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Reset Section */}
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          padding: '2rem', 
          borderRadius: '24px' 
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧹</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444', marginBottom: '1rem' }}>Full Transactional Reset</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.8 }}>
            Permanently deletes all **Appointments**, **Settlements**, and **Dispute Notes**. 
            This will NOT affect Users, Shops, or Service configurations.
          </p>
          <button 
            onClick={handleReset}
            disabled={loading}
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '1rem 2rem', 
              borderRadius: '12px', 
              fontWeight: 900, 
              cursor: 'pointer',
              width: '100%',
              opacity: loading ? 0.5 : 1
            }}
          >
            EXECUTE HARD RESET
          </button>
        </div>

        {/* Validation Section */}
        <div style={{ 
          background: 'rgba(99, 102, 241, 0.05)', 
          border: '1px solid rgba(99, 102, 241, 0.2)', 
          padding: '2rem', 
          borderRadius: '24px' 
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧪</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6366f1', marginBottom: '1rem' }}>E2E Financial Audit</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.8 }}>
            Runs a full simulation: Resetting data, creating mock bookings (1.7% + fees), triggering settlement, and auditing the results.
          </p>
          <button 
            onClick={handleRunTest}
            disabled={loading}
            style={{ 
              background: '#6366f1', 
              color: 'white', 
              border: 'none', 
              padding: '1rem 2rem', 
              borderRadius: '12px', 
              fontWeight: 900, 
              cursor: 'pointer',
              width: '100%',
              opacity: loading ? 0.5 : 1
            }}
          >
            RUN VALIDATION SCRIPT
          </button>
        </div>
      </div>

      {status && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
            STATUS: {status}
        </div>
      )}

      {report && (
        <div style={{ marginTop: '2rem', background: '#0f172a', color: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #1e293b' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', marginBottom: '1.5rem' }}>✅ {report.summary}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem' }}>GROSS VOLUME (AUD)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: report.match.gross ? '#10b981' : '#ef4444' }}>
                        ${report.metrics.actualGross}
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '5px' }}>/ Exp: ${report.metrics.expectedGross}</span>
                    </div>
                </div>
                <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem' }}>NET PAYOUTS (AUD)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: report.match.net ? '#10b981' : '#ef4444' }}>
                        ${report.metrics.actualNet}
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '5px' }}>/ Exp: ${report.metrics.expectedNet}</span>
                    </div>
                </div>
                <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem' }}>PLATFORM FEES (AUD)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: report.match.fees ? '#10b981' : '#ef4444' }}>
                        ${report.metrics.actualFees}
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '5px' }}>/ Exp: ${report.metrics.expectedFees}</span>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                <strong>Test Notes:</strong> Generated mock data for "{report.testShop}". 
                Verified standard booking ($100.00) and cancellation fee ($30.00) against the 1.7% + 30c + 50c model with 10c rounding.
            </div>
        </div>
      )}

    </div>
  );
}
