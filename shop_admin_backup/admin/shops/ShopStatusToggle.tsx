"use client";

import { useTransition } from "react";
import { toggleShopAction } from "@/lib/actions";

export default function ShopStatusToggle({ tenantId, currentStatus }: { tenantId: string, currentStatus: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleShopAction(tenantId, !currentStatus);
      if (res.error) alert(res.error);
    });
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        border: 'none',
        background: currentStatus ? 'rgba(255, 68, 68, 0.1)' : 'var(--primary)',
        color: currentStatus ? '#ff4444' : 'white',
        fontWeight: 600,
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.7 : 1,
        transition: 'all 0.2s'
      }}>
      {isPending ? "Updating..." : (currentStatus ? "Shutdown Shop" : "Verify & Activate")}
    </button>
  );
}
