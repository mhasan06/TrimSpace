"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function ReportIssuePage() {
  const { data: session, status } = useSession();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === "loading") return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 800 }}>Loading...</div>;
  if (!session) redirect("/customer-login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitted(true);
    setLoading(false);
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '4rem 1.2rem 8rem' 
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/my-bookings" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#000', marginBottom: '0.8rem', letterSpacing: '-0.04em' }}>Report an Issue</h1>
        <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '3rem' }}>Tell us what went wrong and our world-class team will resolve it.</p>

        {isSubmitted ? (
          <div style={{ 
            background: 'white', 
            padding: '4rem 2rem', 
            borderRadius: '32px', 
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#000', marginBottom: '1rem' }}>Issue Reported</h2>
            <p style={{ color: '#64748b', fontWeight: 500, marginBottom: '2rem' }}>We've received your report and our support concierge will get back to you within 24 hours.</p>
            <Link href="/my-bookings" style={{ background: '#000', color: '#fff', padding: '1.2rem 2.5rem', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>Return Home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', padding: '2.5rem', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 15px 30px rgba(0,0,0,0.02)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Subject</label>
              <input 
                type="text" 
                placeholder="e.g., Problem with my booking" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Description</label>
              <textarea 
                rows={5}
                placeholder="Please provide details about the issue..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                style={{ width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, fontSize: '1rem', fontFamily: 'inherit', resize: 'none' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: '#000', 
                color: '#fff', 
                padding: '1.2rem', 
                borderRadius: '16px', 
                fontWeight: 800, 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
