"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlatformSettings {
    id: string;
    platformName: string;
    cancellationPolicy: string | null;
    bookingPolicy: string | null;
    penaltyLongThreshold: number;
    penaltyShortThreshold: number;
    penaltyLongRate: number;
    penaltyMidRate: number;
    penaltyShortRate: number;
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
                    bookingPolicy: settings.bookingPolicy,
                    penaltyLongThreshold: settings.penaltyLongThreshold,
                    penaltyShortThreshold: settings.penaltyShortThreshold,
                    penaltyLongRate: settings.penaltyLongRate,
                    penaltyMidRate: settings.penaltyMidRate,
                    penaltyShortRate: settings.penaltyShortRate
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>📜 Legal & Compliance Policies</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.3rem' }}>
                    These policies are displayed globally. Customers must agree to these before completing a booking.
                </p>
            </div>

            {/* Financial Logic Tiers */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
                 <h4 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', color: '#3b82f6', marginBottom: '1.5rem' }}>💰 Dynamic Cancellation Penalties</h4>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>LONG WINDOW (HOURS)</label>
                        <input 
                            type="number" 
                            value={settings.penaltyLongThreshold} 
                            onChange={e => setSettings({...settings, penaltyLongThreshold: parseInt(e.target.value)})}
                            style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', color: '#000', border: '1px solid var(--border)', fontWeight: 700 }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>SHORT WINDOW (HOURS)</label>
                        <input 
                            type="number" 
                            value={settings.penaltyShortThreshold} 
                            onChange={e => setSettings({...settings, penaltyShortThreshold: parseInt(e.target.value)})}
                            style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', color: '#000', border: '1px solid var(--border)', fontWeight: 700 }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>OVER {settings.penaltyLongThreshold}H RATE (0-1.0)</label>
                        <input 
                            type="number" step="0.01"
                            value={settings.penaltyLongRate} 
                            onChange={e => setSettings({...settings, penaltyLongRate: parseFloat(e.target.value)})}
                            style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', color: '#000', border: '1px solid var(--border)', fontWeight: 700 }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>{settings.penaltyShortThreshold}H-{settings.penaltyLongThreshold}H RATE (0-1.0)</label>
                        <input 
                            type="number" step="0.01"
                            value={settings.penaltyMidRate} 
                            onChange={e => setSettings({...settings, penaltyMidRate: parseFloat(e.target.value)})}
                            style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', color: '#000', border: '1px solid var(--border)', fontWeight: 700 }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7 }}>UNDER {settings.penaltyShortThreshold}H RATE (0-1.0)</label>
                        <input 
                            type="number" step="0.01"
                            value={settings.penaltyShortRate} 
                            onChange={e => setSettings({...settings, penaltyShortRate: parseFloat(e.target.value)})}
                            style={{ padding: '0.8rem', borderRadius: '8px', background: '#fff', color: '#000', border: '1px solid var(--border)', fontWeight: 700 }}
                        />
                    </div>
                 </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Booking Policy Display</label>
                    <textarea 
                        value={settings.bookingPolicy || ""} 
                        onChange={e => setSettings({...settings, bookingPolicy: e.target.value})}
                        placeholder="Define your global booking terms..."
                        style={{ 
                            width: '100%', height: '120px', padding: '1.2rem', borderRadius: '12px', 
                            background: '#fff', color: '#1e293b', border: '1px solid var(--border)',
                            fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }} 
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>Cancellation & Refund Policy Display</label>
                    <textarea 
                        value={settings.cancellationPolicy || ""} 
                        onChange={e => setSettings({...settings, cancellationPolicy: e.target.value})}
                        placeholder="Define your global cancellation fees and refund windows..."
                        style={{ 
                            width: '100%', height: '120px', padding: '1.2rem', borderRadius: '12px', 
                            background: '#fff', color: '#1e293b', border: '1px solid var(--border)',
                            fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
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
                        {isLoading ? "SAVING..." : "PUBLISH CONFIGURATION"}
                    </button>
                </div>
            </div>
        </div>
    );
}
