"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/page.module.css";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@trimspace.co");
  const [password, setPassword] = useState("admin");
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
        loginType: "ADMIN",
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid secure protocol response.");
        setIsLoading(false);
      } else {
        router.push("/admin"); // Direct Superuser injection strictly bypassing Shop Dashboards!
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected global failure occurred.");
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={`${styles.card} glass`} style={{ borderTop: '4px solid #ff4444' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
           <span style={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px' }}>
              RESTRICTED SYSTEM ACCESS
           </span>
        </div>
        <h1 className={styles.title} style={{ color: 'var(--foreground)' }}>Platform Gateway</h1>
        <p className={styles.subtitle} style={{ opacity: 0.7 }}>Superuser protocol authorization</p>
        
        {error && <div style={{ color: '#ff4444', marginBottom: '1rem', textAlign: 'center', background: 'rgba(255,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" style={{ color: 'var(--accent)' }}>System Identity</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@trimspace.co" 
              required 
              style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" style={{ color: 'var(--accent)' }}>Cryptographic Key</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            />
            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setIsForgotOpen(true)}
                style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={isLoading}
            style={{ width: '100%', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', background: '#ff4444', color: 'white', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Decrypting...' : 'Override Entry'}
          </button>
        </form>
        <p className={styles.footer} style={{ opacity: 0.5, marginTop: '2rem' }}>
          Unmatched IPs will be severely mathematically constrained. 
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
