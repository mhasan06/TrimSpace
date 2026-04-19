"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAlertAsRead } from "../app/dashboard/actions";

interface Alert {
    id: string;
    type: string;
    message: string;
    metadata?: any;
    isRead: boolean;
    createdAt: Date | string;
}

export default function DashboardAlerts({ initialAlerts }: { initialAlerts: Alert[] }) {
    const [alerts, setAlerts] = useState(initialAlerts);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    
    const unreadCount = alerts.filter(a => !a.isRead).length;

    const handleMarkRead = async (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        await markAlertAsRead(id);
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button 
                onClick={() => setOpen(!open)}
                style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--border)', 
                    padding: '0.6rem', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? "var(--primary)" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span style={{ 
                        position: 'absolute', 
                        top: '-5px', 
                        right: '-5px', 
                        background: 'var(--primary)', 
                        color: 'black', 
                        fontSize: '0.65rem', 
                        fontWeight: 900, 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(212, 175, 55, 0.5)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <>
                    <style dangerouslySetInnerHTML={{ __html: `
                        .alerts-panel {
                            position: absolute;
                            top: 120%;
                            right: 0;
                            width: 320px;
                            background: #1a1a1a;
                            border: 1px solid var(--border);
                            border-radius: 16px;
                            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                            z-index: 1000;
                            overflow: hidden;
                        }
                        @media (max-width: 768px) {
                            .alerts-panel {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 90vw;
                                max-height: 80vh;
                            }
                        }
                    `}} />
                    <div className="alerts-panel">
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Merchant Activity</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{alerts.length} total</span>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {alerts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '0.85rem' }}>No recent activity.</div>
                        ) : (
                            alerts.map(a => (
                                <div 
                                    key={a.id} 
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!a.isRead) await handleMarkRead(a.id);
                                        
                                        let meta: any = {};
                                        try {
                                            meta = typeof a.metadata === 'string' ? JSON.parse(a.metadata) : (a.metadata || {});
                                        } catch (err) {
                                            console.error("Alert metadata parse error:", err);
                                        }

                                        const targetDate = meta.date || meta.targetDate;
                                        const appointmentId = meta.appointmentId;
                                        
                                        if (targetDate) {
                                            const url = `/dashboard?date=${targetDate}${appointmentId ? `&appointmentId=${appointmentId}` : ''}`;
                                            router.push(url);
                                            setOpen(false);
                                        } else {
                                            router.refresh();
                                        }
                                    }}
                                    style={{ 
                                        padding: '1.2rem', 
                                        borderBottom: '1px solid rgba(255,255,255,0.1)', 
                                        cursor: 'pointer',
                                        background: a.isRead ? 'rgba(0,0,0,0.2)' : 'rgba(212, 175, 55, 0.1)',
                                        display: 'flex',
                                        gap: '1.2rem',
                                        transition: 'all 0.2s ease',
                                        borderLeft: a.isRead ? '4px solid transparent' : '4px solid var(--primary)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = a.isRead ? 'rgba(0,0,0,0.2)' : 'rgba(212, 175, 55, 0.1)'}
                                >
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'white', lineHeight: '1.4', marginBottom: '0.4rem' }}>{a.message}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{new Date(a.createdAt).toLocaleString()}</span>
                                            {(a.metadata as any)?.date || (a.metadata as any)?.targetDate ? (
                                                <div style={{ padding: '0.4rem 0.8rem', background: 'var(--primary)', borderRadius: '6px', border: '1px solid var(--primary)' }}>
                                                    <span style={{ fontSize: '0.65rem', color: 'black', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                        JUMP TO VIEW →
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {alerts.length > 0 && (
                        <div style={{ padding: '0.8rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
                           <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Close Panel</button>
                        </div>
                    )}
                </div>
                </>
            )}
        </div>
    );
}
