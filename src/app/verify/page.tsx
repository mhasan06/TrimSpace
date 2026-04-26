"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailAction } from "./actions";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      const result = await verifyEmailAction(token);
      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Email verified successfully!");
      } else {
        setStatus("error");
        setMessage(result.error || "Verification failed.");
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f8fafc',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '450px', 
        width: '100%', 
        background: '#fff', 
        padding: '40px', 
        borderRadius: '24px', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        {status === "loading" && (
          <div>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '4px solid #f1f5f9', 
              borderTopColor: '#3b82f6', 
              borderRadius: '50%', 
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{ fontWeight: 800, color: '#1e293b' }}>{message}</h2>
          </div>
        )}

        {status === "success" && (
          <div>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#10b981', 
              color: '#fff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '30px', 
              margin: '0 auto 20px'
            }}>✓</div>
            <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>Verified!</h2>
            <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: 1.5 }}>{message}</p>
            <Link href="/login" style={{ 
              display: 'block', 
              padding: '12px', 
              background: '#000', 
              color: '#fff', 
              textDecoration: 'none', 
              borderRadius: '12px', 
              fontWeight: 700 
            }}>
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#ef4444', 
              color: '#fff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '30px', 
              margin: '0 auto 20px'
            }}>✕</div>
            <h2 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>Failed</h2>
            <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: 1.5 }}>{message}</p>
            <Link href="/register" style={{ 
              display: 'block', 
              padding: '12px', 
              background: '#f1f5f9', 
              color: '#1e293b', 
              textDecoration: 'none', 
              borderRadius: '12px', 
              fontWeight: 700 
            }}>
              Back to Registration
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
