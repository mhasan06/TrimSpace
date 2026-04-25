"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { updateCustomerProfile } from "@/app/my-bookings/actions";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (status === "loading") return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 800 }}>Loading...</div>;
  if (!session) redirect("/customer-login");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await updateCustomerProfile({
        name,
        ...(password ? { password } : {})
      });
      if (res.error) setError(res.error);
      else setSuccess("Profile updated successfully");
    } catch (err) {
      setError("Update failed");
    }
    setLoading(false);
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '4rem 1.2rem 8rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <Link href="/my-bookings" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#000', marginBottom: '3rem', letterSpacing: '-0.04em' }}>Account Settings</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profile Overview */}
          <div style={{ background: '#fff', padding: '2.5rem 1.5rem', borderRadius: '32px', boxShadow: '0 15px 35px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', width: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', color: '#000', textAlign: 'center' }}>Personal Details</h2>
            
            {success && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 800 }}>✅ {success}</div>}
            {error && <div style={{ background: '#fff1f2', color: '#e11d48', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 800 }}>❌ {error}</div>}

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: '#6366f1', border: '4px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                  {session.user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', wordBreak: 'break-all' }}>{session.user?.email}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Your account email cannot be changed.</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, fontSize: '1rem' }}
                />
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem', marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.5rem', color: '#6366f1' }}>Security</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%',
                  background: '#000', 
                  color: '#fff', 
                  padding: '1.2rem', 
                  borderRadius: '16px', 
                  fontWeight: 800, 
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  marginTop: '1.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              >
                {loading ? 'Updating...' : 'Save All Changes'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Link href="/favorites" style={{ textDecoration: 'none', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '2rem' }}>❤️</span>
              <span style={{ fontWeight: 900, color: '#000', fontSize: '1.1rem' }}>Saved Favorites</span>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Manage your premium collection.</span>
            </Link>
            <Link href="/report-issue" style={{ textDecoration: 'none', background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '2rem' }}>🆘</span>
              <span style={{ fontWeight: 900, color: '#000', fontSize: '1.1rem' }}>Help & Support</span>
              <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Report issues or get concierge help.</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
