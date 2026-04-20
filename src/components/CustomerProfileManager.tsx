"use client";

import { useState } from "react";
import { updateCustomerProfile, updateCustomerAvatar } from "@/app/my-bookings/actions";

export default function CustomerProfileManager({ 
  user 
}: { 
  user: { name: string; email: string; phone?: string | null; initial: string; avatarUrl?: string | null } 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch(err: any) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await updateCustomerAvatar(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsUploading(false);
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
    <div className="glass" style={{ 
      textAlign: 'center', 
      padding: '2.5rem 1.5rem', 
      borderRadius: '20px', 
      border: '1px solid rgba(255,255,255,0.1)', 
      marginBottom: '2rem', 
      position: 'relative',
      background: 'linear-gradient(180deg, rgba(var(--primary-rgb), 0.1) 0%, rgba(0,0,0,0) 100%)',
      overflow: 'hidden'
    }}>
      {/* Decorative background circle */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.05, filter: 'blur(40px)', zIndex: 0 }}></div>
      
      {success && <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '0.4rem 1.5rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, zIndex: 10, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>CHANGES SAVED</div>}
      
      <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 1.5rem', zIndex: 1 }}>
        <div style={{ 
          width: '110px', 
          height: '110px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '2.5rem', 
          fontWeight: 900,
          overflow: 'hidden',
          border: '4px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
           {user.avatarUrl ? (
             <img src={user.avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
           ) : user.initial}
        </div>
        
        <label style={{ 
          position: 'absolute', 
          bottom: '5px', 
          right: '5px', 
          background: 'var(--primary)', 
          color: 'black', 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
          opacity: isUploading ? 0.5 : 1,
          transition: 'all 0.2s',
          border: '2px solid var(--background)'
        }}>
          {isUploading ? '...' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          )}
          <input type="file" onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} disabled={isUploading} />
        </label>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.2rem' }}>{user.name}</h3>
        <p style={{ fontSize: '0.85rem', opacity: 0.5, fontWeight: 500, marginBottom: '0.8rem' }}>{user.email}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            VIP MEMBER
          </span>
          {user.phone && (
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
              VERIFIED
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setIsEditing(true)}
          style={{ 
            width: '100%',
            background: 'transparent', 
            border: '1px solid var(--border)', 
            padding: '0.8rem', 
            borderRadius: '12px', 
            color: 'var(--foreground)', 
            fontSize: '0.85rem', 
            cursor: 'pointer', 
            transition: 'all 0.2s', 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit Account Settings
        </button>
      </div>
    </div>
  );
}
