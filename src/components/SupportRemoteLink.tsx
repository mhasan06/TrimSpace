"use client";

import { enableSupportSessionAction } from "@/app/admin/support/actions";
import { useState } from "react";

export default function SupportRemoteLink({ 
  tenantId, 
  shopName 
}: { 
  tenantId: string, 
  shopName: string 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartSupport = async () => {
    if (!confirm(`Enter remote support session for ${shopName}?`)) return;
    setIsLoading(true);
    await enableSupportSessionAction(tenantId);
  };

  return (
    <button 
      onClick={handleStartSupport}
      disabled={isLoading}
      style={{ 
        background: 'rgba(56, 189, 248, 0.1)', 
        color: '#38bdf8', 
        border: '1px solid rgba(56, 189, 248, 0.3)', 
        padding: '0.4rem 0.8rem', 
        borderRadius: '6px', 
        fontSize: '0.75rem', 
        fontWeight: 700, 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg>
      {isLoading ? "INITIATING..." : "REMOTE SUPPORT"}
    </button>
  );
}
