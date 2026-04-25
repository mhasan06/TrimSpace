"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import SocialLoginButtons from "@/components/SocialLoginButtons";

export default function CustomerLogin() {
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
        loginType: "CUSTOMER",
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid credentials. Try your email and password.");
        setIsLoading(false);
      } else {
        router.refresh();
        router.push("/my-bookings");
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
            Elevate Your Experience.
          </h2>
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155', maxWidth: '450px', opacity: 0.9 }}>
            Join the connoisseurs of self-care. Book your next visit with world-class experts.
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
            Customer Access
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '2.5rem', fontWeight: 600 }}>
            Sign in to manage your appointments and history.
          </p>
          
          {error && <div style={{ color: '#ff4444', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(255,0,0,0.05)', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(255,0,0,0.1)' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="connoisseur@example.com" 
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
              {isLoading ? 'Processing...' : 'Sign In as Connoisseur'}
            </button>
          </form>

          <div style={{ margin: '2rem 0' }}>
            <SocialLoginButtons />
          </div>

          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
            New here? <Link href="/register?type=customer" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Create an account</Link>
          </p>
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
