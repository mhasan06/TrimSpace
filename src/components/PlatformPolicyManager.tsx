"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlatformSettings {
    id: string;
    platformName: string;
    cancellationPolicy: string | null;
    bookingPolicy: string | null;
}

export default function PlatformPolicyManager({ initialSettings }: { initialSettings: PlatformSettings }) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setIsLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/platform-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cancellationPolicy: settings.cancellationPolicy,
                    bookingPolicy: settings.bookingPolicy
                })
            });
            
            if (res.ok) {
                setMessage("Policies updated successfully! ✅");
                router.refresh();
            } else {
                setMessage("Failed to update policies. ❌");
            }
        } catch (err) {
            console.error(err);
            setMessage("Error saving settings.");
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>📜 Legal & Compliance Policies</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.3rem' }}>
                    These policies are displayed globally on the payment screen. Customers must agree to these before completing a booking.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Booking Policy</label>
                    <textarea 
                        value={settings.bookingPolicy || ""} 
                        onChange={e => setSettings({...settings, bookingPolicy: e.target.value})}
                        placeholder="Define your global booking terms..."
                        style={{ 
                            width: '100%', height: '150px', padding: '1.2rem', borderRadius: '12px', 
                            background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--border)',
                            fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical'
                        }} 
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Cancellation & Refund Policy</label>
                    <textarea 
                        value={settings.cancellationPolicy || ""} 
                        onChange={e => setSettings({...settings, cancellationPolicy: e.target.value})}
                        placeholder="Define your global cancellation fees and refund windows..."
                        style={{ 
                            width: '100%', height: '150px', padding: '1.2rem', borderRadius: '12px', 
                            background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid var(--border)',
                            fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical'
                        }} 
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>{message}</span>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        style={{ 
                            padding: '1rem 3rem', background: 'var(--secondary)', color: 'black', 
                            border: 'none', borderRadius: '12px', fontWeight: 900, cursor: 'pointer',
                            opacity: isLoading ? 0.5 : 1, transition: 'all 0.2s'
                        }}
                    >
                        {isLoading ? "SAVING..." : "PUBLISH POLICIES"}
                    </button>
                </div>
            </div>
        </div>
    );
}
