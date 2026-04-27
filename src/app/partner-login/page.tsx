"use client";
import { useState, useEffect } from "react";
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
        loginType: "PARTNER",
        redirect: false,
      });

      if (res?.error) {
        // Clean up NextAuth internal error strings if they exist
        const displayError = res.error.includes("EMAIL_NOT_VERIFIED") 
          ? "Please check your email and verify your account before logging in."
          : res.error.includes("ACCOUNT_DISABLED")
            ? "This account has been deactivated by an administrator."
            : "Invalid credentials. Try your email and password.";

        setError(displayError);
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
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: isMobile ? '100vh' : 'calc(100vh - 80px)', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      overflowX: 'hidden',
      color: '#000'
    }}>
      {/* ─── LEFT: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: isMobile ? 'none' : 1.2, 
        height: isMobile ? '25vh' : 'auto',
        background: `linear-gradient(to ${isMobile ? 'bottom' : 'right'}, transparent 70%, rgba(255,255,255,0.8)), url('/luxury_barbershop.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: isMobile ? '2rem' : '5rem',
        position: 'relative',
        borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)',
        borderBottom: isMobile ? '1px solid rgba(0,0,0,0.05)' : 'none'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: isMobile ? '2rem' : '3.2rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.8rem', color: '#000' }}>
            Empower Your Mastery.
          </h2>
          {!isMobile && (
            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#334155', maxWidth: '450px', opacity: 0.9 }}>
              Manage your operations with precision. Access your shop dashboard and team controls.
            </p>
          )}
        </div>
      </div>

      {/* ─── RIGHT: LOGIN FORM ─── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: isMobile ? '2rem' : '5rem', 
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: isMobile ? '2rem' : '2.4rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.02em', color: '#000' }}>
            Master Access
          </h1>
          <p style={{ color: '#475569', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: isMobile ? '2rem' : '2.5rem', fontWeight: 600 }}>
            Secure sign in for business partners and shop owners.
          </p>
          
          {error && <div style={{ color: '#ff4444', marginBottom: '1.5rem', textAlign: 'center', background: 'rgba(255,0,0,0.05)', padding: '0.8rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', border: '1px solid rgba(255,0,0,0.1)' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Email</label>
              <input 
                type="email" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@business.com" 
                required 
                style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
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
                transition: 'all 0.2s',
                opacity: isLoading ? 0.7 : 1 
              }}
              >
              {isLoading ? 'Authenticating...' : 'Secure Master Log In'}
            </button>
          </form>

          <div style={{ marginTop: isMobile ? '2rem' : '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              New to TrimSpace? <Link href="/register?type=business" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Join as Partner</Link>
            </p>
            <p style={{ marginTop: '0.8rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, margin: '0.8rem 0 0' }}>
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
