"use client";

import { useState } from "react";
import { updateBarberLimitAction } from "./actions";

export default function BarberLimitControl({ tenantId, currentLimit }: { tenantId: string, currentLimit: number }) {
  const [limit, setLimit] = useState(currentLimit);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await updateBarberLimitAction(tenantId, limit);
    setIsSaving(false);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          color: 'var(--primary)',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}
      >
        <span>Staff Limit: {currentLimit}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <input 
        type="number" 
        min="1" 
        max="50"
        value={limit} 
        onChange={(e) => setLimit(parseInt(e.target.value))}
        style={{
          width: '50px',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--primary)',
          borderRadius: '4px',
          padding: '0.2rem 0.4rem',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 700
        }}
      />
      <button 
        disabled={isSaving}
        onClick={handleSave}
        style={{
          background: 'var(--primary)',
          border: 'none',
          borderRadius: '4px',
          padding: '0.2rem 0.5rem',
          color: 'black',
          fontSize: '0.7rem',
          fontWeight: 900,
          cursor: 'pointer'
        }}
      >
        {isSaving ? '...' : 'SAVE'}
      </button>
      <button 
        onClick={() => { setIsEditing(false); setLimit(currentLimit); }}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '4px',
          padding: '0.2rem 0.5rem',
          color: 'white',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        ESC
      </button>
    </div>
  );
}
