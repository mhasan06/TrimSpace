"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GlobalSetting {
    id: string;
    key: string;
    value: string;
    label: string | null;
    category: string | null;
}

export default function GlobalVariablesManager({ initialSettings }: { initialSettings: GlobalSetting[] }) {
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (id: string, value: string) => {
        setIsLoading(true);
        try {
            await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, value })
            });
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newKey || !newValue) return;
        setIsLoading(true);
        try {
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: newKey.toUpperCase(), value: newValue, label: newLabel })
            });
            setNewKey("");
            setNewValue("");
            setNewLabel("");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        setIsLoading(true);
        try {
            await fetch("/api/admin/settings", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Creation Header Section */}
            <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--primary)' }}>➕ Define New Platform Variable</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', opacity: 0.9 }}>SYSTEM KEY</label>
                        <input 
                            placeholder="e.g. STRIPE_API_KEY" 
                            value={newKey} 
                            onChange={e => setNewKey(e.target.value)} 
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)', background: '#111', color: 'white', fontWeight: 600 }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', opacity: 0.9 }}>VALUE / SECRET</label>
                        <input 
                            placeholder="sk_test_..." 
                            value={newValue} 
                            onChange={e => setNewValue(e.target.value)} 
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)', background: '#111', color: 'white', fontWeight: 600 }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', opacity: 0.9 }}>FRIENDLY LABEL</label>
                        <input 
                            placeholder="Primary Payout Key" 
                            value={newLabel} 
                            onChange={e => setNewLabel(e.target.value)} 
                            style={{ padding: '0.8rem', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)', background: '#111', color: 'white', fontWeight: 600 }} 
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                            onClick={handleCreate} 
                            disabled={isLoading} 
                            style={{ 
                                padding: '0.8rem 2rem', 
                                background: 'var(--primary)', 
                                color: 'black', 
                                border: 'none', 
                                borderRadius: '8px', 
                                fontWeight: 900, 
                                cursor: 'pointer',
                                width: '100%',
                                height: '48px'
                            }}>
                            {isLoading ? "PROVISIONING..." : "ADD VARIABLE"}
                        </button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.7, marginBottom: '0.5rem' }}>Active Application Settings</h3>
                {settings.map((s) => (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>{s.key}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{s.label || "No description"}</div>
                        </div>
                        <input 
                            defaultValue={s.value} 
                            onBlur={(e) => handleSave(s.id, e.target.value)}
                            style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }} 
                        />
                        <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>Auto-saves on blur</div>
                        <button onClick={() => handleDelete(s.id)} style={{ padding: '0.4rem', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>DELETE</button>
                    </div>
                ))}
                {settings.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>No global variables defined.</p>}
            </div>
        </div>
    );
}
