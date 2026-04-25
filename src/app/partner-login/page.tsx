"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function PartnerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        loginType: "PARTNER",
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid login credentials.");
        setIsLoading(false);
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <main style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      overflow: 'hidden',
      color: '#000'
    }}>
      {/* ─── LEFT: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: 1.2, 
        background: `linear-gradient(to right, transparent 70%, rgba(255,255,255,0.8)), url('/luxury_barbershop.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '5rem',
        position: 'relative',
        borderRight: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3.2rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem', color: '#000' }}>
            Empower Your Mastery.
          </h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155', maxWidth: '450px', opacity: 0.9 }}>
            Manage your operations with precision. Access your shop dashboard and team controls.
          </p>
        </div>
      </div>

      {/* ─── RIGHT: LOGIN FORM ─── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '5rem', 
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.02em', color: '#000' }}>
            Master Access
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: 600 }}>
            Secure sign in for business partners and shop owners.
          </p>
          
          {error && <div style={{ color: '#ff4444', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(255,0,0,0.05)', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(255,0,0,0.1)' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@business.com" 
                required 
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 500 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input 
                type="password" 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem' }}
              />
              <div style={{ textAlign: 'right' }}>
                <button 
                  type="button" 
                  onClick={() => setIsForgotOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#475569', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                padding: '1.2rem', 
                borderRadius: '12px', 
                background: '#000', 
                color: '#fff', 
                border: 'none', 
                fontSize: '1rem', 
                fontWeight: 800, 
                cursor: isLoading ? 'not-allowed' : 'pointer', 
                transition: 'transform 0.2s',
                opacity: isLoading ? 0.7 : 1 
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = 'none')}
              >
              {isLoading ? 'Authenticating...' : 'Secure Master Log In'}
            </button>
          </form>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
              New to TrimSpace? <Link href="/register?type=business" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Join as Partner</Link>
            </p>
            <p style={{ marginTop: '0.8rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
              Not a business? <Link href="/customer-login" style={{ color: '#000', fontWeight: 700, textDecoration: 'none' }}>Customer Login</Link>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotOpen} 
        onClose={() => setIsForgotOpen(false)} 
        defaultEmail={email} 
      />
    </main>
  );
}
