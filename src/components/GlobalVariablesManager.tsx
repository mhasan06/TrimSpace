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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <input placeholder="VARIABLE_KEY" value={newKey} onChange={e => setNewKey(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }} />
                <input placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }} />
                <input placeholder="Friendly Label (Optional)" value={newLabel} onChange={e => setNewLabel(e.target.value)} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'white' }} />
                <button onClick={handleCreate} disabled={isLoading} style={{ padding: '0.8rem 1.5rem', background: 'var(--primary)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>ADD VARIABLE</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
