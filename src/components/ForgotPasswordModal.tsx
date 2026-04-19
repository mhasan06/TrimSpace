"use client";

import { useState } from "react";
import { requestResetOTP, verifyOTPAndReset } from "@/lib/resetActions";

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  defaultEmail = "" 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  defaultEmail?: string;
}) {
  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST");
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");

  if (!isOpen) return null;

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await requestResetOTP(email);
      if (res.error) {
        setError(res.error);
      } else {
        setMaskedPhone(res.maskedPhone || "XXXX");
        setStep("VERIFY");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
    setLoading(false);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await verifyOTPAndReset(email, otp, newPassword);
      if (res.error) {
        setError(res.error);
      } else {
        setStep("SUCCESS");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
    setLoading(false);
  };

  const handleClose = () => {
    setStep("REQUEST");
    setEmail(defaultEmail);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem'
    }}>
      <div className="glass" style={{
        background: 'var(--background)', color: 'var(--foreground)',
        padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)',
        position: 'relative'
      }}>
        <button onClick={handleClose} style={{
          position: 'absolute', top: '1rem', right: '1rem', background: 'none',
          border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.6
        }}>×</button>

        {step === "REQUEST" && (
          <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Reset Password</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>Enter your registered email address and we'll send a 6-digit code to your mobile phone.</p>
            
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@example.com"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
            </div>
            
            <button type="submit" disabled={loading} style={{
              background: 'var(--primary)', color: 'white', padding: '0.9rem', borderRadius: '8px',
              border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === "VERIFY" && (
          <form onSubmit={handleVerifyAndReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Enter Verification Code</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>We sent a 6-digit code to the mobile number ending in <strong>{maskedPhone}</strong>.</p>
            
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem' }}>6-Digit OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="123456" maxLength={6}
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', marginTop: '0.5rem' }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem' }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
            </div>
            
            <button type="submit" disabled={loading} style={{
              background: 'var(--primary)', color: 'white', padding: '0.9rem', borderRadius: '8px',
              border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? "Verifying..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === "SUCCESS" && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '60px', height: '60px', background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 800 }}>Password Reset!</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '2rem' }}>Your password has been successfully updated and a confirmation email has been sent. You can now log in with your new password.</p>
            <button onClick={handleClose} style={{
              background: 'var(--foreground)', color: 'var(--background)', padding: '0.9rem 2rem', borderRadius: '8px',
              border: 'none', fontWeight: 700, cursor: 'pointer', width: '100%'
            }}>
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
