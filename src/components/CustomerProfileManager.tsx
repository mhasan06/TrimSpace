"use client";

import { useState } from "react";
import { updateCustomerProfile } from "@/app/my-bookings/actions";

export default function CustomerProfileManager({ 
  user 
}: { 
  user: { name: string; email: string; phone?: string | null; initial: string } 
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    try {
      const res = await updateCustomerProfile({
        name,
        phone,
        ...(password ? { password } : {})
      });
      
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setIsEditing(false);
        setPassword("");
        setConfirmPassword("");
      }
    } catch(err: any) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  if (isEditing) {
    return (
      <div className="glass" style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.05)', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground)' }}>
          Edit Profile
          <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
        </h3>
        
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', color: 'var(--foreground)' }}>Email Address (Cannot be changed)</label>
            <input type="email" value={user.email} disabled style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', opacity: 0.5 }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', color: 'var(--foreground)' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', color: 'var(--foreground)' }}>Phone Number (Optional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 8900" style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8, color: 'var(--foreground)' }}>Change Password (Optional)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
              <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
            </div>
          </div>
          
          <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass" style={{ textAlign: 'center', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem', position: 'relative' }}>
      {success && <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '0.2rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Profile Updated</div>}
      
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900 }}>
         {user.initial}
      </div>
      <h3 style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{user.name}</h3>
      <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{user.email}</p>
      {user.phone && <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.2rem' }}>{user.phone}</p>}
      
      <button 
        onClick={() => setIsEditing(true)}
        style={{ marginTop: '1.5rem', background: 'var(--foreground)', border: '1px solid var(--border)', padding: '0.6rem 1.2rem', borderRadius: '20px', color: 'var(--background)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
      >
        Manage Profile
      </button>
    </div>
  );
}
