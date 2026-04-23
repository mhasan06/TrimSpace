"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RaiseDisputeButtonProps {
    appointmentId: string;
    serviceName: string;
    date: string;
}

export default function RaiseDisputeButton({ appointmentId, serviceName, date }: RaiseDisputeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason || !description) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/disputes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId,
                    reason,
                    description
                })
            });

            if (res.ok) {
                setMessage("Dispute submitted successfully. Our team will review it. ✅");
                setTimeout(() => {
                    setIsOpen(false);
                    router.refresh();
                }, 2000);
            } else {
                setMessage("Failed to submit dispute. ❌");
            }
        } catch (err) {
            console.error(err);
            setMessage("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                style={{ 
                    background: 'transparent', color: '#64748b', 
                    padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.65rem', border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e: any) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseLeave={(e: any) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                REPORT ISSUE
            </button>

            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>Report a Problem</h3>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            Tell us what went wrong with your <strong>{serviceName}</strong> on {new Date(date).toLocaleDateString()}.
                        </p>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Reason for Dispute</label>
                                <select 
                                    required
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)}
                                    style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, outline: 'none' }}
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="SERVICE_NOT_RECEIVED">Service Not Received</option>
                                    <option value="UNSATISFACTORY_QUALITY">Unsatisfactory Quality</option>
                                    <option value="DUPLICATE_CHARGE">Duplicate Charge</option>
                                    <option value="INCORRECT_AMOUNT">Incorrect Amount Charged</option>
                                    <option value="OTHER">Other Issue</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>Details</label>
                                <textarea 
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Please provide as much detail as possible to help us investigate..."
                                    style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: '120px', resize: 'vertical', outline: 'none' }}
                                />
                            </div>

                            {message && (
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: message.includes('success') ? '#10b981' : '#ef4444', textAlign: 'center' }}>
                                    {message}
                                </p>
                            )}

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{ 
                                    marginTop: '0.5rem', background: '#000', color: '#fff', padding: '1rem', 
                                    borderRadius: '14px', border: 'none', fontWeight: 900, cursor: 'pointer',
                                    opacity: isSubmitting ? 0.5 : 1
                                }}
                            >
                                {isSubmitting ? "SUBMITTING..." : "SUBMIT DISPUTE"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
