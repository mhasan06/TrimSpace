"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SocialLoginButtons({ mode = "in", compact = false }: { mode?: "in" | "up", compact?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const label = mode === "in" ? "Sign in" : "Sign up";

  const handleSocialLogin = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/my-bookings" });
  };

  const containerStyle: React.CSSProperties = compact 
    ? { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }
    : { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', width: '100%' };

  const buttonBaseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div style={{ width: '100%' }}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.05)' }}></div>
          <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.05)' }}></div>
        </div>
      )}

      <div style={containerStyle}>
        {/* Google Button */}
        <button
          onClick={() => handleSocialLogin("google")}
          disabled={!!loading}
          style={{
            ...buttonBaseStyle,
            padding: compact ? '1rem' : '0.9rem',
            flex: compact ? 'none' : 1,
            width: compact ? '60px' : 'auto',
            height: compact ? '60px' : 'auto',
            opacity: loading === "google" ? 0.7 : 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = '#fff'; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {!compact && <span style={{ marginLeft: '1rem', fontWeight: 800, fontSize: '0.95rem', color: '#000' }}>{loading === "google" ? "..." : `${label} with Google`}</span>}
        </button>

        {/* Facebook Button */}
        <button
          onClick={() => handleSocialLogin("facebook")}
          disabled={!!loading}
          style={{
            ...buttonBaseStyle,
            padding: compact ? '1rem' : '0.9rem',
            flex: compact ? 'none' : 1,
            width: compact ? '60px' : 'auto',
            height: compact ? '60px' : 'auto',
            opacity: loading === "facebook" ? 0.7 : 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = '#fff'; }}
        >
          <svg width="24" height="24" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {!compact && <span style={{ marginLeft: '1rem', fontWeight: 800, fontSize: '0.95rem', color: '#000' }}>{loading === "facebook" ? "..." : `${label} with Facebook`}</span>}
        </button>
      </div>
    </div>
  );
}
