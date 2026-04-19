"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/page.module.css";
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
    <main className={styles.main}>
      <div className={`${styles.card} glass`}>
        <h1 className={styles.title}>Partner Login</h1>
        <p className={styles.subtitle}>Manage your business operations and team.</p>
        
        {error && <div style={{ color: '#ff4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Work Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@barbershop.com" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
            />
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setIsForgotOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={isLoading}
            style={{ width: '100%', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Authenticating...' : 'Secure Partner Log In'}
          </button>
        </form>
        <p className={styles.footer} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          New to TrimSpace? <Link href="/register?type=business" className={styles.link} style={{ fontWeight: 800, color: 'var(--primary)' }}>Join as Partner</Link>
        </p>
        <p className={styles.footer} style={{ marginTop: '0.8rem', opacity: 0.6 }}>
          Not a business? <Link href="/customer-login" className={styles.link}>Customer Login</Link>
        </p>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotOpen} 
        onClose={() => setIsForgotOpen(false)} 
        defaultEmail={email} 
      />
    </main>
  );
}
