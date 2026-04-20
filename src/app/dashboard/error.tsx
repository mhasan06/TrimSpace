"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Crash:", error);
  }, [error]);

  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem', 
      background: '#0a0a0a', 
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ 
        background: 'rgba(255, 68, 68, 0.1)', 
        border: '1px solid #ff4444', 
        padding: '2rem', 
        borderRadius: '24px', 
        maxWidth: '600px' 
      }}>
        <h2 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '1.5rem' }}>Dashboard System Failure</h2>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          The dashboard encountered a critical rendering error in the production environment.
        </p>
        
        <div style={{ 
          background: '#000', 
          padding: '1rem', 
          borderRadius: '12px', 
          textAlign: 'left', 
          marginBottom: '2rem',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          <code style={{ color: '#ff4444', fontSize: '0.8rem' }}>
            {error.message || "Unknown Runtime Error"}
          </code>
        </div>

        <button
          onClick={() => reset()}
          style={{ 
            background: '#ff4444', 
            color: 'white', 
            border: 'none', 
            padding: '0.8rem 2rem', 
            borderRadius: '12px', 
            fontWeight: 700, 
            cursor: 'pointer' 
          }}
        >
          Attempt System Restart
        </button>
      </div>
    </div>
  );
}
