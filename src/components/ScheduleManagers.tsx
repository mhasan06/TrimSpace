"use client";
import React, { useState } from "react";
import { updateBusinessHours, addScheduleOverride, removeScheduleOverride } from "../app/dashboard/settings/actions";

export function HoursManager({ tenantId, initialHours }: { tenantId: string, initialHours: any[] }) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Seed default state or use DB state
    const [hours, setHours] = useState(
        days.map((_, i) => {
            const dbHr = initialHours.find((h: any) => h.dayOfWeek === i);
            if (dbHr) {
                return {
                    ...dbHr,
                    lunchStart: dbHr.lunchStart || "",
                    lunchEnd: dbHr.lunchEnd || ""
                };
            }
            return { dayOfWeek: i, openTime: "09:00", closeTime: "17:00", lunchStart: "", lunchEnd: "", activeStaff: 1 };
        })
    );
    const [saving, setSaving] = useState(false);

    const handleUpdate = (index: number, field: string, value: string | number) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const saveChanges = async () => {
        setSaving(true);
        const res = await updateBusinessHours(tenantId, hours);
        if (res.error) {
            alert(res.error);
        } else if (res.success) {
            alert("Operational Hours successfully synchronized with the Global Engine!");
        }
        setSaving(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <style jsx>{`
                .hours-grid {
                    display: grid;
                    grid-template-columns: minmax(100px, 1fr) 1fr 1fr 1fr 1fr 80px;
                    gap: 0.5rem;
                    align-items: center;
                }
                .hours-header {
                    font-weight: 600;
                    font-size: 0.85rem;
                    opacity: 0.8;
                    margin-bottom: 0.5rem;
                }
                @media (max-width: 768px) {
                    .hours-header { display: none; }
                    .hours-grid {
                        grid-template-columns: 1fr;
                        background: rgba(255,255,255,0.03);
                        padding: 1.5rem;
                        border-radius: 12px;
                        border: 1px solid var(--border);
                        gap: 1rem;
                    }
                    .day-label {
                        font-size: 1.1rem;
                        color: var(--primary);
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                        padding-bottom: 0.5rem;
                        margin-bottom: 0.5rem;
                    }
                    .input-group {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 0.8rem;
                    }
                }
            `}</style>

            <div className="hours-grid hours-header">
                <span>Day</span>
                <span>Open</span>
                <span>Close</span>
                <span>Lunch (Start)</span>
                <span>Lunch (End)</span>
                <span title="Number of Barbers scheduled to work">Staff</span>
            </div>

            {hours.map((hr: any, idx: number) => (
                <div key={idx} className="hours-grid">
                    <span className="day-label" style={{ fontWeight: 600 }}>{days[hr.dayOfWeek]}</span>
                    <input type="time" value={hr.openTime} onChange={(e) => handleUpdate(idx, 'openTime', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />
                    <input type="time" value={hr.closeTime} onChange={(e) => handleUpdate(idx, 'closeTime', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }} />
                    <input type="time" value={hr.lunchStart || ""} onChange={(e) => handleUpdate(idx, 'lunchStart', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)', border: '1px dotted var(--border)' }} />
                    <input type="time" value={hr.lunchEnd || ""} onChange={(e) => handleUpdate(idx, 'lunchEnd', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)', border: '1px dotted var(--border)' }} />
                    <input type="number" min="0" max="20" value={hr.activeStaff} onChange={(e) => handleUpdate(idx, 'activeStaff', e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--primary)' }} />
                </div>
            ))}
            
            <button onClick={saveChanges} disabled={saving} style={{ marginTop: '1rem', padding: '0.8rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', width: '200px' }}>
                {saving ? "Updating Core..." : "Save Config"}
            </button>
        </div>
    );
}

export function BlockerManager({ tenantId, overrides }: { tenantId: string, overrides: any[] }) {
    const [date, setDate] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const blockDate = async () => {
        if (!date) return;
        setLoading(true);
        await addScheduleOverride(tenantId, date, reason || "Closed");
        setLoading(false);
        setDate("");
        setReason("");
    };

    const removeBlock = async (id: string) => {
        await removeScheduleOverride(id);
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', background: 'var(--background)', border: '1px solid var(--primary)', color: 'var(--foreground)', flex: 1 }} />
                <input type="text" placeholder="Reason (e.g. Christmas)" value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', flex: 2 }} />
                <button onClick={blockDate} disabled={loading} style={{ padding: '0.8rem 1.5rem', background: '#ff4444', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    Block Date
                </button>
            </div>

            {overrides.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h4 style={{ opacity: 0.8, fontSize: '0.9rem' }}>Active Blockers</h4>
                    {overrides.map(ov => (
                        <div key={ov.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(255,0,0,0.1)', border: '1px solid #ff4444', borderRadius: '6px', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 600, marginRight: '1rem' }}>{ov.date}</span>
                                <span style={{ opacity: 0.8 }}>{ov.reason}</span>
                            </div>
                            <button onClick={() => removeBlock(ov.id)} style={{ padding: '0.2rem 0.6rem', background: 'transparent', border: '1px solid var(--foreground)', color: 'var(--foreground)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Unblock</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
