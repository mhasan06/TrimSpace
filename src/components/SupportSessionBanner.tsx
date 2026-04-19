"use client";

import { disableSupportSessionAction } from "@/app/admin/support/actions";
import { useState } from "react";

export default function SupportSessionBanner({ 
  tenantName, 
  adminName 
}: { 
  tenantName: string, 
  adminName: string 
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = async () => {
    setIsExiting(true);
    await disableSupportSessionAction();
  };

  return (
    <div style={{ 
      background: 'linear-gradient(90deg, #991b1b, #dc2626)', 
      color: 'white', 
      padding: '0.6rem 1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      zIndex: 10001,
      position: 'sticky',
      top: 0,
      fontWeight: 800,
      fontSize: '0.85rem',
      letterSpacing: '0.05em',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      textTransform: 'uppercase'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '2px 8px', 
          borderRadius: '4px', 
          fontSize: '0.7rem', 
          border: '1px solid rgba(255,255,255,0.3)' 
        }}>
          REMOTE SUPPORT ACTIVE
        </div>
        <span>
          Acting as owner of <strong style={{ color: '#fef08a' }}>{tenantName}</strong>
        </span>
        <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 600 }}>
          Logged: {adminName}
        </span>
      </div>

      <button 
        onClick={handleExit}
        disabled={isExiting}
        style={{ 
          background: 'white', 
          color: '#dc2626', 
          border: 'none', 
          padding: '0.4rem 1rem', 
          borderRadius: '6px', 
          fontWeight: 900, 
          cursor: 'pointer',
          fontSize: '0.75rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
      >
        {isExiting ? "RESTORING CONTEXT..." : "EXIT SUPPORT"}
      </button>
    </div>
  );
}
