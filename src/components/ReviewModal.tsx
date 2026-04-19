"use client";

import { useState } from "react";
import { submitReview } from "@/app/my-bookings/actions";

export default function ReviewModal({ 
  appointmentId, 
  serviceName, 
  barberName,
  isOpen, 
  onClose 
}: { 
  appointmentId: string;
  serviceName: string;
  barberName: string;
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await submitReview(appointmentId, rating, comment);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem'
    }}>
      <div className="glass" style={{
        background: 'var(--background)', color: 'var(--foreground)',
        padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)',
        position: 'relative'
      }}>
        {!success && (
          <button onClick={onClose} style={{
            position: 'absolute', top: '1rem', right: '1rem', background: 'none',
            border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--foreground)', opacity: 0.6
          }}>×</button>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ width: '60px', height: '60px', background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>Thank You!</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Your feedback helps {barberName} and the shop maintain the highest standards.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 800 }}>Rate Your Visit</h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>How was your {serviceName} with {barberName}?</p>
            
            {error && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer',
                    color: star <= rating ? '#f59e0b' : 'var(--border)',
                    transition: 'color 0.2s', padding: 0
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', color: 'var(--foreground)' }}>Leave a review (Optional)</label>
              <textarea 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Tell us about your experience..."
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(var(--foreground-rgb), 0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)', height: '100px', resize: 'vertical' }} 
              />
            </div>
            
            <button type="submit" disabled={loading} style={{
              background: 'var(--primary)', color: 'white', padding: '0.9rem', borderRadius: '8px',
              border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
