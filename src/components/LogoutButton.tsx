"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton({ color = "#ff4444" }: { color?: string }) {
  return (
    <button 
      onClick={() => signOut()}
      style={{ 
        padding: '0.6rem 1.2rem', 
        background: 'transparent', 
        color: color, 
        border: `1px solid ${color}`, 
        borderRadius: '10px', 
        fontSize: '0.9rem', 
        fontWeight: 800, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = color;
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = color;
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>
      Log out
    </button>
  );
}
