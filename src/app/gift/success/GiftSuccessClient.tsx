"use client";

import { useEffect, useState } from "react";
import { fulfillGiftCardPurchase } from "../actions";
import Link from "next/link";

export default function GiftSuccessClient({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "ERROR">("LOADING");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fulfillGiftCardPurchase(sessionId).then(res => {
      if (res.success) { setData(res); setStatus("SUCCESS"); }
      else { setErr(res.error || "Unknown error"); setStatus("ERROR"); }
    });
  }, [sessionId]);

  const copyCode = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "LOADING") return (
    <div style={{ textAlign: 'center', color: 'white', padding: '4rem 2rem' }}>
      <div style={{ width: 50, height: 50, border: '4px solid rgba(212,175,55,0.2)', borderLeftColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h2 style={{ color: '#D4AF37' }}>Activating your gift card...</h2>
      <p style={{ opacity: 0.6 }}>Please don't close this window.</p>
    </div>
  );

  if (status === "ERROR") return (
    <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h2 style={{ color: '#ef4444', fontSize: '1.8rem', margin: '1rem 0' }}>Activation Failed</h2>
      <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', marginBottom: '2rem' }}>{err}</p>
      <Link href="/gift" style={{ color: '#D4AF37', fontWeight: 700 }}>← Try again</Link>
    </div>
  );

  return (
    <div style={{ textAlign: 'center', color: 'white' }}>
      {/* Success Icon */}
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 2rem' }}>✓</div>

      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', marginBottom: '0.5rem' }}>Gift Card Activated!</h1>
      <p style={{ opacity: 0.7, marginBottom: '3rem' }}>
        {data.alreadyFulfilled ? "This card was already activated." : `A $${data.amount} gift card has been created and is ready to use.`}
      </p>

      {/* Card Display */}
      <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(255,255,255,0.05))', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '24px', padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: 200, height: 200, background: '#D4AF37', filter: 'blur(80px)', opacity: 0.1 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', margin: 0 }}>Trim<span style={{ color: '#D4AF37' }}>Space</span></h2>
          <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 700, letterSpacing: 1 }}>VIRTUAL CARD</span>
        </div>

        <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#D4AF37', marginBottom: '0.5rem' }}>${data.amount}</div>
        <p style={{ opacity: 0.5, fontSize: '0.85rem', marginBottom: '2rem' }}>Digital Credit · Valid at all partner shops</p>

        {/* Code Box */}
        <div
          onClick={copyCode}
          style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.3)', transition: 'background 0.2s' }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '3px', color: '#D4AF37' }}>{data.code}</span>
          <span style={{ fontSize: '0.75rem', color: copied ? '#10b981' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
            {copied ? '✓ COPIED' : 'TAP TO COPY'}
          </span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem', marginBottom: '2.5rem', fontSize: '0.85rem', opacity: 0.7, textAlign: 'left' }}>
        <p>📧 <strong>Sent to:</strong> {data.recipientEmail}</p>
        <p style={{ marginTop: '0.5rem' }}>💡 Use this code at checkout on any TrimSpace booking page.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/gift" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.08)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem' }}>
          Buy Another
        </Link>
        <Link href="/" style={{ flex: 1, padding: '1rem', background: '#D4AF37', color: 'black', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem' }}>
          Find a Shop →
        </Link>
      </div>
    </div>
  );
}
