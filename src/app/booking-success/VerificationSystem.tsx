"use client";

import { useEffect, useState } from "react";
import { finalizeStripeBooking } from "./actions";
import Link from "next/link";

// FORCE_REBUILD_V3_LUXURY_FIX
export default function VerificationSystem({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<"VERIFYING" | "SUCCESS" | "ERROR">("VERIFYING");
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const runVerification = async () => {
      try {
        const result: any = await finalizeStripeBooking(sessionId);
        
        if (result && result.success) {
          setData(result);
          setStatus("SUCCESS");
        } else {
          // Absolute fallback for type safety
          const message = result?.error || "Transaction verification failed";
          setErrorMsg(message);
          setStatus("ERROR");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Internal verification error");
        setStatus("ERROR");
      }
    };
    
    runVerification();
  }, [sessionId]);

  if (status === "VERIFYING") {
    return (
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div className="spinner" style={{ border: '4px solid rgba(212, 175, 55, 0.1)', borderLeftColor: '#D4AF37', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }}></div>
        <h2 style={{ color: '#D4AF37' }}>Verifying Payment Session...</h2>
        <p style={{ opacity: 0.7 }}>Please do not close this window while we secure your booking.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: '#ff4444', fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Fulfillment Error</h2>
        <p style={{ color: '#ff6666', background: 'rgba(255, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #ff4444', marginBottom: '2rem' }}>
          {errorMsg}
        </p>
        <Link href="/" style={{ color: '#D4AF37', fontWeight: 600, textDecoration: 'underline' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', color: 'white' }}>
      <div style={{ width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 2rem', border: '2px solid #10b981' }}>
        ✓
      </div>
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#10b981' }}>Booking Secured!</h1>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.5rem', color: '#ffffff' }}>Thank you for booking with {data?.tenantSlug || 'us'}!</h2>
      <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '3rem' }}>
        Your appointment is officially confirmed and synchronized with our schedule.
      </p>
      
      {/* Receipt Card */}
      <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.06)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '3.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>Appointment Details</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid #10b981' }}>
               PAID & CONFIRMED
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <p style={{ fontSize: '1.1rem' }}><strong>Merchant:</strong> <span style={{ color: '#D4AF37' }}>{data?.tenantSlug || 'Shop'}</span></p>
            <p style={{ fontSize: '1.1rem' }}><strong>Date & Time:</strong> {data?.targetDate || 'TBD'} at {data?.selectedTime || 'TBD'}</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}><strong>Stripe Sync ID:</strong> {sessionId.substring(0, 20)}...</p>
         </div>

         <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <p style={{ fontSize: '0.85rem', color: '#D4AF37' }}>A confirmation receipt has been generated for your record. You can manage this booking anytime from your dashboard.</p>
         </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1.2rem' }}>
         <Link href="/my-bookings" style={{ flex: 1, padding: '1.2rem', background: '#10b981', color: 'black', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
           View My Bookings
         </Link>
         <Link href="/" style={{ flex: 1, padding: '1.2rem', border: '2px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '1.05rem', transition: 'all 0.2s ease' }}>
           Back to Home
         </Link>
      </div>
    </div>
  );
}
