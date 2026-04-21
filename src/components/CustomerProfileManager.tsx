"use client";

import { useState } from "react";
import { updateCustomerProfile, updateCustomerAvatar } from "@/app/my-bookings/actions";

export default function CustomerProfileManager({ 
  user,
  onClose
}: { 
  user: { 
    name: string; 
    email: string; 
    phone?: string | null; 
    suburb?: string | null;
    state?: string | null;
    gender?: string | null;
    avatarUrl?: string | null;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [suburb, setSuburb] = useState(user.suburb || "");
  const [state, setState] = useState(user.state || "");
  const [gender, setGender] = useState(user.gender || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await updateCustomerAvatar(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setAvatarUrl(res.avatarUrl);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setUploading(false);
  };

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
        suburb,
        state,
        gender,
        avatarUrl,
        ...(password ? { password } : {})
      });
      
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch(err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
        position: 'fixed', inset: 0, zIndex: 10000, 
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }}>
      <div style={{ 
          width: '100%', maxWidth: '500px', background: 'white', borderRadius: '32px', 
          padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>Edit Profile</h3>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
        </div>

        {error && <div style={{ background: '#fff1f2', color: '#e11d48', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>{error}</div>}
        {success && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 800 }}>✅ Profile Updated!</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</label>
            <input type="email" value={user.email} disabled style={{ width: '100%', padding: '1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600, color: '#64748b', cursor: 'not-allowed' }} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: '#f8fafc', padding: '1.2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                <img src={avatarUrl || `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    {uploading ? "Uploading Image..." : "Profile Picture"}
                </label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    style={{ fontSize: '0.8rem', color: '#64748b' }} 
                />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600 }}>
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Suburb</label>
                <input type="text" value={suburb} onChange={e => setSuburb(e.target.value)} style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>State</label>
                <input type="text" value={state} onChange={e => setState(e.target.value)} style={{ width: '100%', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 600 }} />
              </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '1rem', color: '#6366f1' }}>Change Password</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '0.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
              </div>
          </div>
          
          <button type="submit" disabled={loading} style={{ 
              background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '18px', border: 'none', 
              fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
          }}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
