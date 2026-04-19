"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const shopName = searchParams.get("name") || "This Premium Venue";
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      color: '#1e293b',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '700px', 
        width: '100%', 
        background: '#fff', 
        borderRadius: '32px', 
        padding: '4rem 3rem', 
        textAlign: 'center',
        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        {/* Animated Badge */}
        <div style={{ 
          display: 'inline-block', 
          background: 'rgba(99, 102, 241, 0.1)', 
          color: '#6366f1', 
          padding: '0.5rem 1.5rem', 
          borderRadius: '50px', 
          fontWeight: 900, 
          fontSize: '0.75rem', 
          textTransform: 'uppercase', 
          letterSpacing: '2px',
          marginBottom: '2rem'
        }}>
          Network Expansion
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          {shopName} is <span style={{ color: '#6366f1' }}>Coming Soon</span>
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: '#64748b', lineHeight: 1.6, marginBottom: '3rem' }}>
          We are currently integrating this venue into the TrimSpace ecosystem. Real-time booking and financial settlements for this location will be active shortly.
        </p>

        {/* Client Side: Notify Me */}
        <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', marginBottom: '4rem', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Want to be the first to book?</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                />
                <button style={{ background: '#000', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '12px', fontWeight: 700 }}>Notify Me</button>
            </div>
        </div>

        {/* Merchant Side: Register Section */}
        <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '3rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Are you the owner?</h4>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Claim your profile & start booking today</h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Join the TrimSpace network to unlock 1-click settlements, automated staff scheduling, and zero-hassle client management.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <Link href="/partner-login" style={{ 
                    background: '#6366f1', 
                    color: '#fff', 
                    padding: '1rem 2rem', 
                    borderRadius: '14px', 
                    fontWeight: 800, 
                    textDecoration: 'none',
                    boxShadow: '0 15px 30px -5px rgba(99, 102, 241, 0.4)'
                }}>
                    Register Your Shop
                </Link>
                <Link href="/pricing" style={{ 
                    background: '#fff', 
                    color: '#1e293b', 
                    padding: '1rem 2rem', 
                    borderRadius: '14px', 
                    fontWeight: 700, 
                    textDecoration: 'none',
                    border: '1px solid #e2e8f0'
                }}>
                    Learn More
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComingSoonContent />
    </Suspense>
  );
}
