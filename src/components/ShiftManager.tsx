"use client";

import { useState, useEffect } from "react";
import { getStaffShifts, upsertStaffShift } from "../app/dashboard/roster/actions";

interface StaffMember {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
}

interface ShiftManagerProps {
    staff: StaffMember[];
    tenantId: string;
}

export default function ShiftManager({ staff, tenantId }: ShiftManagerProps) {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadShifts = async () => {
        setLoading(true);
        const data = await getStaffShifts(tenantId, selectedDate, selectedDate);
        setShifts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadShifts();
    }, [selectedDate, tenantId]);

    const handleToggleShift = async (userId: string, currentOff: boolean) => {
        // Optimistic update for zero-lag experience
        setShifts(prev => {
            const existing = prev.find(s => s.userId === userId && s.date === selectedDate);
            if (existing) return prev.map(s => (s.userId === userId && s.date === selectedDate) ? { ...s, isDayOff: !currentOff } : s);
            return [...prev, { userId, date: selectedDate, isDayOff: !currentOff }];
        });

        const res = await upsertStaffShift(tenantId, {
            userId,
            date: selectedDate,
            isDayOff: !currentOff
        });

        if (res.error) {
            alert(res.error);
            loadShifts(); // Rollback on error
        }
    };

    const isOffOnDate = (userId: string) => {
        const shift = shifts.find(s => s.userId === userId && s.date === selectedDate);
        return shift ? shift.isDayOff : false;
    };

    return (
        <div className="glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid var(--primary)', marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        Premium Shift Manager
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>Tier 2 Feature</span>
                    </h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.3rem' }}>Manage specific dates, staff leave, and one-off roster overrides.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>SELECT DATE:</span>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        style={{ padding: '0.8rem', background: '#000', border: '1px solid var(--primary)', borderRadius: '8px', color: 'white', fontWeight: 700 }}
                    />
                </div>
            </div>

            {loading ? (
               <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Loading roster for {selectedDate}...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {staff.map(s => {
                        const off = isOffOnDate(s.id);
                        return (
                            <div key={s.id} className="glass" style={{ 
                                padding: '1.5rem', 
                                borderRadius: '16px', 
                                border: off ? '2px solid rgba(239,68,68,0.4)' : '2px solid rgba(16,185,129,0.2)', 
                                textAlign: 'center',
                                background: off ? 'rgba(239,68,68,0.05)' : 'transparent',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '2px solid var(--border)' }}>
                                    <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${s.name || s.email}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{s.name || 'Unnamed'}</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '1.2rem' }}>{s.email}</p>
                                
                                <button 
                                    onClick={() => handleToggleShift(s.id, off)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.8rem', 
                                        background: off ? 'var(--primary)' : 'transparent', 
                                        color: off ? 'black' : (off ? '#ef4444' : '#10b981'),
                                        border: `1px solid ${off ? 'var(--primary)' : '#10b981'}`,
                                        borderRadius: '10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {off ? 'RESTORE TO WORKING' : 'MARK AS OFF-DUTY'}
                                </button>
                                {off && <p style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '0.6rem', fontWeight: 700 }}>OFF ON {selectedDate}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
