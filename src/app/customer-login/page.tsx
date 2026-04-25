"use client";

import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: 'calc(100vh - 80px)', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      overflowX: 'hidden',
      color: '#000'
    }}>
      {/* ─── LEFT: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: 1.2, 
        minHeight: isMobile ? '40vh' : 'auto',
        background: `linear-gradient(to right, transparent 70%, rgba(255,255,255,0.8)), url('/luxury_barbershop.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: isMobile ? '2rem' : '5rem',
        position: 'relative',
        borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)',
        borderBottom: isMobile ? '1px solid rgba(0,0,0,0.05)' : 'none'
      }}>
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          background: isMobile ? 'rgba(255,255,255,0.7)' : 'transparent',
          backdropFilter: isMobile ? 'blur(10px)' : 'none',
          padding: isMobile ? '1.5rem' : '0',
          borderRadius: isMobile ? '24px' : '0'
        }}>
          <h2 style={{ 
            fontSize: isMobile ? '2.2rem' : '3.8rem', 
            fontWeight: 950, 
            letterSpacing: '-0.04em', 
            lineHeight: 1.1, 
            marginBottom: '1rem', 
            color: '#000',
            textShadow: '0 0 40px rgba(255,255,255,0.8)' 
          }}>
            The Space for Excellence.
          </h2>
          <p style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            fontWeight: 700, 
            color: '#1e293b', 
            maxWidth: '500px', 
            opacity: 1,
            lineHeight: 1.5,
            textShadow: '0 0 20px rgba(255,255,255,0.8)',
            background: !isMobile ? 'rgba(255,255,255,0.4)' : 'transparent',
            padding: !isMobile ? '0.5rem 1rem' : '0',
            borderRadius: '12px',
            marginLeft: !isMobile ? '-1rem' : '0',
            backdropFilter: !isMobile ? 'blur(10px)' : 'none'
          }}>
            Enter a world-class marketplace where premium grooming meets effortless booking.
          </p>
        </div>
      </div>

      {/* ─── RIGHT: LOGIN FORM ─── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: isMobile ? '3rem 1.5rem' : '5rem', 
        background: isMobile ? 'transparent' : 'rgba(255,255,255,0.4)',
        backdropFilter: isMobile ? 'none' : 'blur(30px)',
        WebkitBackdropFilter: isMobile ? 'none' : 'blur(30px)'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: isMobile ? '2rem' : '2.4rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.02em', color: '#000' }}>
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
            <SocialLoginButtons mode="up" compact={true} />
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
