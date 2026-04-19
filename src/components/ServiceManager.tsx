"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteServiceAction, updateServiceAction, toggleServiceVisibilityAction } from "../app/dashboard/services/actions";

interface Service {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  durationMinutes: number;
  price: number;
}

export default function ServiceManager({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Keep local state in sync if initialServices changes (e.g. on page refresh)
  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    // Optimistic Update
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !currentStatus } : s
    ));

    const result = await toggleServiceVisibilityAction(id, currentStatus);
    
    if (result?.error) {
      alert("Error: " + result.error);
      // Rollback on error
      setServices(prev => prev.map(s => 
        s.id === id ? { ...s, isActive: currentStatus } : s
      ));
    } else {
      router.refresh();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    setIsDeletingId(id);
    const result = await deleteServiceAction(id);
    if (result?.error) alert("Error: " + result.error);
    else {
      setServices(prev => prev.filter(s => s.id !== id));
      router.refresh();
    }
    setIsDeletingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {services.map((srv) => {
        const isEditing = editingId === srv.id;

        if (isEditing) {
          return (
            <div key={srv.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--primary)', background: 'rgba(212,175,55,0.05)' }}>
               <form action={async (formData) => {
                 const res = await updateServiceAction(srv.id, formData);
                 if (res?.error) alert(res.error);
                 else {
                   setEditingId(null);
                   router.refresh();
                 }
               }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, color: 'var(--primary)' }}>Service Name</label>
                       <input name="name" defaultValue={srv.name} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, color: 'var(--primary)' }}>Duration (Mins)</label>
                       <input name="durationMinutes" type="number" step="15" defaultValue={srv.durationMinutes} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, color: 'var(--primary)' }}>Price ($)</label>
                       <input name="price" type="number" step="0.01" defaultValue={srv.price} required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                       <label style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, color: 'var(--primary)' }}>Description</label>
                       <textarea name="description" defaultValue={srv.description || ''} rows={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#000', color: 'white', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                     <button type="button" onClick={() => setEditingId(null)} style={{ padding: '0.8rem 1.5rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                     <button type="submit" style={{ padding: '0.8rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer' }}>Save Changes</button>
                  </div>
               </form>
            </div>
          );
        }

        return (
          <div key={srv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', transition: 'all 0.2s ease', opacity: srv.isActive ? 1 : 0.65 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)' }}>{srv.name}</h3>
                {!srv.isActive && (
                  <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                    HIDDEN
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600, marginTop: '0.4rem' }}>
                {srv.durationMinutes} mins
              </p>
              {srv.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--foreground)', opacity: 0.6, marginTop: '0.5rem', lineHeight: '1.6', maxWidth: '80%' }}>
                  {srv.description}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingLeft: '2rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                ${srv.price.toFixed(2)}
              </span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <button 
                   onClick={() => handleToggleVisibility(srv.id, srv.isActive)}
                   style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${srv.isActive ? '#9ca3af' : 'var(--primary)'}`, color: srv.isActive ? '#9ca3af' : 'var(--primary)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                   {srv.isActive ? 'HIDE' : 'UNHIDE'}
                 </button>
                 <button 
                   onClick={() => setEditingId(srv.id)} 
                   style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                   EDIT
                 </button>
                 <button 
                   onClick={() => handleDelete(srv.id, srv.name)} 
                   disabled={isDeletingId === srv.id}
                   style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', opacity: isDeletingId === srv.id ? 0.5 : 1 }}>
                   {isDeletingId === srv.id ? '...' : 'DELETE'}
                 </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
