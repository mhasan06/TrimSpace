"use client";

import { signOut } from "next-auth/react";

export default function CustomerLogoutButton() {
    return (
        <button 
            onClick={() => signOut({ callbackUrl: "/customer-login" })}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.8rem', 
                padding: '0.8rem 1rem', 
                borderRadius: '12px', 
                background: 'transparent',
                border: 'none',
                color: '#EE5D50', 
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '1rem',
                transition: 'all 0.2s',
                width: '100%',
                textAlign: 'left'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#FFEEF2'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Log Out
        </button>
    );
}
