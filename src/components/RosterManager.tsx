"use client";

import { useState } from "react";
import { inviteStaffMember, removeStaffMember, updateStaffDetails, createStaffMember } from "../app/dashboard/roster/actions";
import ImageUpload from "./ImageUpload";

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  total_appointments: number;
  total_revenue: number;
  isOwner: boolean;
}

function StaffCard({ member, tenantId, staffLabel }: { member: StaffMember; tenantId: string; staffLabel: string }) {
  const [removing, setRemoving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState(member.name || "");
  const [editBio, setEditBio] = useState(member.bio || "");
  const [editAvatar, setEditAvatar] = useState(member.avatarUrl || "");
  const [saving, setSaving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.name || member.email} from your roster? Their account will remain intact.`)) return;
    setRemoving(true);
    const res = await removeStaffMember(member.id, tenantId);
    if (res.error) alert(res.error);
    setRemoving(false);
  };

  const handleUpdate = async () => {
    if (!editName) return;
    setSaving(true);
    const res = await updateStaffDetails(member.id, tenantId, { 
        name: editName, 
        bio: editBio,
        avatarUrl: editAvatar 
    });
    if (res.error) {
      alert(res.error);
    } else {
      setIsEditing(false);
    }
    setSaving(false);
  };

  const avgPerJob = member.total_appointments > 0 ? (member.total_revenue / member.total_appointments) : 0;

  return (
    <div className="glass" style={{
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '1.5rem',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
    }}>
      {/* Profile Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary)', flexShrink: 0 }}>
            <img 
                src={editAvatar || `https://ui-avatars.com/api/?name=${member.name || member.email}&background=random`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Name"
              style={{ width: '100%', padding: '0.4rem 0.6rem', background: '#000', border: '1px solid var(--primary)', borderRadius: '4px', color: 'white', fontSize: '0.9rem' }}
            />
          ) : (
            <>
              <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.15rem', color: 'var(--foreground)' }}>{member.name || 'Unnamed'}</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{member.email}</p>
            </>
          )}
        </div>
      </div>

      {/* Bio / Description */}
      <div style={{ minHeight: '40px' }}>
          {isEditing ? (
              <textarea 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Professional Bio..."
                style={{ width: '100%', height: '80px', padding: '0.6rem', background: '#000', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', fontSize: '0.8rem', resize: 'none' }}
              />
          ) : (
              <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {member.bio || `Senior ${staffLabel} with a focus on excellence.`}
              </p>
          )}
      </div>

      {isEditing && (
          <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, opacity: 0.5, marginBottom: '0.4rem', display: 'block' }}>Update Avatar</label>
              <ImageUpload 
                tenantId={tenantId} 
                currentImage={editAvatar} 
                label="Change Picture" 
                height="100px" 
                onUploadSuccess={(url) => setEditAvatar(url)} 
              />
          </div>
      )}

      {/* Performance Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary)' }}>{member.total_appointments}</p>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>Jobs</p>
          </div>
          <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: '1.2rem', color: '#10b981' }}>${member.total_revenue.toFixed(0)}</p>
              <p style={{ fontSize: '0.6rem', opacity: 0.5, textTransform: 'uppercase' }}>Revenue</p>
          </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
        {isEditing ? (
          <>
            <button
               onClick={handleUpdate}
               disabled={saving}
               style={{ flex: 1, padding: '0.7rem', background: 'var(--primary)', color: 'black', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
            >
               {saving ? 'Saving...' : 'Save Member'}
            </button>
            <button
               onClick={() => { setIsEditing(false); setEditName(member.name || ""); setEditBio(member.bio || ""); setEditAvatar(member.avatarUrl || ""); }}
               disabled={saving}
               style={{ flex: 1, padding: '0.7rem', background: 'transparent', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
               Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Manage Profile
            </button>
            {!member.isOwner && (
              <button
                onClick={handleRemove}
                disabled={removing}
                style={{ padding: '0.6rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                {removing ? '...' : 'Remove'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RosterManager({ staff, tenantId, currentUserId, staffLabel }: {
  staff: StaffMember[];
  tenantId: string;
  currentUserId: string;
  staffLabel: string;
}) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [activeTab, setActiveTab] = useState<'create'|'link'>('create');
  const [createData, setCreateData] = useState({ name: '', email: '', password: '', role: 'BARBER', bio: '', avatarUrl: '' });
  const [creating, setCreating] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteMsg(null);
    const res = await inviteStaffMember(inviteEmail, tenantId);
    if (res.error) {
      setInviteMsg({ type: 'error', text: res.error });
    } else if (res.pending && res.joinLink) {
      setInviteMsg({ type: 'success', text: `No account found for ${inviteEmail}. Share this link: ${res.joinLink}` });
    } else {
      setInviteMsg({ type: 'success', text: `${inviteEmail} has been added to your roster! ✅` });
    }
    if (!res.error) setInviteEmail('');
    setInviting(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.name || !createData.email || !createData.password) {
      setInviteMsg({ type: 'error', text: 'Name, Email, and Password are required.' });
      return;
    }
    setCreating(true);
    setInviteMsg(null);
    const res = await createStaffMember(tenantId, createData);
    if (res.error) {
      setInviteMsg({ type: 'error', text: res.error });
    } else {
      setInviteMsg({ type: 'success', text: `New user ${createData.name} created and added to roster! ✅` });
      setCreateData({ name: '', email: '', password: '', role: 'BARBER', bio: '', avatarUrl: '' });
    }
    setCreating(false);
  };

  const enriched = staff.map(s => ({ ...s, isOwner: s.id === currentUserId }));

  return (
    <div>
      {/* Add To Team Panel */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '20px', marginBottom: '3rem', border: '1px solid rgba(212,175,55,0.2)' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
           <button 
             onClick={() => setActiveTab('create')} 
             style={{ background: 'transparent', border: 'none', color: activeTab === 'create' ? 'var(--primary)' : 'var(--foreground)', fontWeight: activeTab === 'create' ? 900 : 500, fontSize: '1.1rem', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : 'none' }}>
             Create New Member
           </button>
           <button 
             onClick={() => setActiveTab('link')} 
             style={{ background: 'transparent', border: 'none', color: activeTab === 'link' ? 'var(--primary)' : 'var(--foreground)', fontWeight: activeTab === 'link' ? 900 : 500, fontSize: '1.1rem', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'link' ? '2px solid var(--primary)' : 'none' }}>
             Link Existing User
           </button>
        </div>

        {activeTab === 'create' ? (
           <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1.5rem', maxWidth: '600px' }}>Register a new professional directly to your shop. They can use these credentials to log in.</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input type="text" placeholder="Full Name" required value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} style={{ padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                    <input type="email" placeholder="Email Address" required value={createData.email} onChange={e => setCreateData({...createData, email: e.target.value})} style={{ padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input type="password" placeholder="Temporary Password" required value={createData.password} onChange={e => setCreateData({...createData, password: e.target.value})} style={{ padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                    <select value={createData.role} onChange={e => setCreateData({...createData, role: e.target.value})} style={{ padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}>
                        <option value="BARBER">Professional (Barber/Stylist)</option>
                        <option value="ADMIN">Shop Admin</option>
                    </select>
                </div>
                <textarea placeholder="Professional Bio (Optional)" value={createData.bio} onChange={e => setCreateData({...createData, bio: e.target.value})} style={{ padding: '0.8rem', height: '80px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', resize: 'none' }} />
                
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6, display: 'block', marginBottom: '0.3rem' }}>Profile Picture Upload (Optional)</label>
                  <ImageUpload tenantId={tenantId} currentImage={createData.avatarUrl || ""} label="Upload Avatar" onUploadSuccess={(url) => setCreateData({...createData, avatarUrl: url})} height="60px" />
                  {createData.avatarUrl && <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.3rem' }}>Image uploaded successfully!</p>}
                </div>

                <button type="submit" disabled={creating} style={{ padding: '1rem', background: 'var(--primary)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', opacity: creating ? 0.6 : 1, marginTop: '0.5rem' }}>
                  {creating ? 'Creating User...' : 'Create & Add to Team'}
                </button>
              </form>
           </div>
        ) : (
           <div>
              <p style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '1.5rem', maxWidth: '600px' }}>Enter the email address of your new team member. If they already have a TrimSpace account, they will be linked instantly.</p>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder={`e.g. jason@${staffLabel.toLowerCase()}shop.com`}
                  style={{ flex: 1, minWidth: '300px', padding: '1rem 1.5rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', fontSize: '1rem', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={inviting}
                  style={{ padding: '1rem 2.5rem', background: 'var(--primary)', color: 'black', border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', opacity: inviting ? 0.6 : 1, fontSize: '1rem' }}
                >
                  {inviting ? 'Linking...' : `Link Account`}
                </button>
              </form>
           </div>
        )}

        {inviteMsg && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: inviteMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${inviteMsg.type === 'success' ? '#10b981' : '#ef4444'}` }}>
              <p style={{ fontSize: '0.9rem', color: inviteMsg.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{inviteMsg.text}</p>
          </div>
        )}
      </div>

      {/* Staff Cards Grid */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          Active Team Members
          <span style={{ fontSize: '0.8rem', background: 'var(--border)', padding: '0.3rem 0.8rem', borderRadius: '50px', opacity: 0.6 }}>{enriched.length}</span>
      </h2>
      
      {enriched.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem', opacity: 0.4 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No team members linked to this establishment yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {enriched.map(member => (
            <StaffCard key={member.id} member={member} tenantId={tenantId} staffLabel={staffLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
