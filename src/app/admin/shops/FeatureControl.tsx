"use client";

import { useState } from "react";
import { updateShopFeaturesAction } from "./actions";

const ALL_FEATURES = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "LEDGER", label: "Master Ledger" },
  { id: "COMMS", label: "Communications Hub" },
  { id: "REPORTS", label: "Advanced Reporting" },
  { id: "SERVICES", label: "Services Management" },
  { id: "ROSTER", label: "Staff Roster" },
  { id: "CUSTOMERS", label: "Customer Directory" },
  { id: "SETTINGS", label: "Shop Settings" },
  { id: "SUPPORT", label: "Contact Support" },
];

export default function FeatureControl({ tenantId, enabledFeatures }: { tenantId: string, enabledFeatures: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState<string[]>(enabledFeatures || []);
  const [loading, setLoading] = useState(false);

  const handleToggle = (id: string) => {
    setFeatures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateShopFeaturesAction(tenantId, features);
    if (res.error) alert(res.error);
    else setIsOpen(false);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          padding: '0.4rem 0.8rem', 
          background: 'rgba(99, 102, 241, 0.1)', 
          color: '#6366f1', 
          border: '1px solid #6366f1', 
          borderRadius: '6px', 
          fontSize: '0.7rem', 
          fontWeight: 900, 
          cursor: 'pointer' 
        }}>
        FEATURES
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass" style={{ width: '400px', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Dashboard Menu Control</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
              {ALL_FEATURES.map(f => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={features.includes(f.id)} 
                    onChange={() => handleToggle(f.id)} 
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={handleSave} 
                disabled={loading}
                style={{ flex: 1, background: 'var(--primary)', color: 'black', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
                {loading ? "SAVING..." : "SAVE PERMISSIONS"}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
