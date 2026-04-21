"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "../app/dashboard/page.module.css";
import SettlementTable from "./SettlementTable";

export default function ShopSettlementDashboard({ appointments }: { appointments: any[] }) {
    const [selectedWeek, setSelectedWeek] = useState<string>("ALL");
    
    // Internal Date Range for fine-tuned filtering within the component
    const [customRange, setCustomRange] = useState<{ from: string; to: string }>({ from: "", to: "" });

    // 1. Generate Week Options based on Australia/Sydney logic
    const weeklyOptions = useMemo(() => {
        const weeks: Record<string, string> = {};
        appointments.forEach(app => {
            const date = new Date(app.startTime);
            const target = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
            const day = target.getDay();
            const diff = target.getDate() - day + (day === 0 ? -6 : 1);
            const mon = new Date(target.setDate(diff));
            mon.setHours(0,0,0,0);
            
            const key = mon.toISOString().split('T')[0];
            const label = `${mon.getDate()}/${mon.getMonth() + 1}`;
            weeks[key] = label;
        });
        return Object.entries(weeks).sort((a,b) => b[0].localeCompare(a[0]));
    }, [appointments]);

    // Side effect to default to the most recent week if no explicit custom range is set
    useEffect(() => {
        if (selectedWeek === "ALL" && weeklyOptions.length > 0 && !customRange.from && !customRange.to) {
            setSelectedWeek(weeklyOptions[0][0]);
        }
    }, [weeklyOptions, selectedWeek, customRange]);

    // 2. Filter Data
    const filteredApps = useMemo(() => {
        let items = appointments;

        // Custom Range Filter (if dates provided)
        if (customRange.from || customRange.to) {
            items = items.filter(app => {
                const appDate = new Date(app.startTime).toISOString().split('T')[0];
                const matchesFrom = !customRange.from || appDate >= customRange.from;
                const matchesTo = !customRange.to || appDate <= customRange.to;
                return matchesFrom && matchesTo;
            });
            return items;
        }

        // Week Dropdown Filter (if no custom range active)
        if (selectedWeek !== "ALL") {
            items = items.filter(app => {
                const date = new Date(app.startTime);
                const target = new Date(date.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
                const day = target.getDay();
                const diff = target.getDate() - day + (day === 0 ? -6 : 1);
                const mon = new Date(target.setDate(diff));
                mon.setHours(0,0,0,0);
                return mon.toISOString().split('T')[0] === selectedWeek;
            });
        }
        
        return items;
    }, [selectedWeek, customRange, appointments]);

    // 3. Calculate Breakdown
    const breakdown = useMemo(() => {
        let digital = 0;
        let gift = 0;
        let cancellation = 0;
        let cash = 0;

        filteredApps.forEach(app => {
            const price = Number(app.service?.price || app.sp || 0);
            if (app.status === 'CANCELLED') {
                cancellation += Number(app.cancellationFee || (price * 0.5));
            } else {
                if (Number(app.amountPaidGift || 0) > 0) gift += Number(app.amountPaidGift);
                
                if (app.paymentMethod === 'CARD_ONLINE') {
                    digital += Number(app.amountPaidStripe || (price - Number(app.amountPaidGift || 0)));
                } else {
                    cash += (price - Number(app.amountPaidGift || 0));
                }
            }
        });

        return { digital, gift, cancellation, cash, total: digital + gift + cancellation + cash };
    }, [filteredApps]);

    const activeLabel = weeklyOptions.find(o => o[0] === selectedWeek)?.[1];

    const resetFilters = () => {
        setSelectedWeek("ALL");
        setCustomRange({ from: "", to: "" });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Filter Controls */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                            <h3 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Select Week</h3>
                            <select 
                                value={selectedWeek} 
                                onChange={(e) => {
                                    setSelectedWeek(e.target.value);
                                    setCustomRange({ from: "", to: "" }); // Reset range if week picked
                                }}
                                style={{ padding: '0.8rem 1rem', background: '#111', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, minWidth: '180px' }}>
                                <option value="ALL">Show All Entries</option>
                                {weeklyOptions.map(([key, label]) => (
                                    <option key={key} value={key}>Week of {label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div>
                                <h3 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date From</h3>
                                <input 
                                    type="date" 
                                    value={customRange.from}
                                    onChange={(e) => {
                                        setCustomRange({ ...customRange, from: e.target.value });
                                        setSelectedWeek("ALL"); // Reset week if range used
                                    }}
                                    style={{ padding: '0.8rem', background: '#111', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date To</h3>
                                <input 
                                    type="date" 
                                    value={customRange.to}
                                    onChange={(e) => {
                                        setCustomRange({ ...customRange, to: e.target.value });
                                        setSelectedWeek("ALL"); // Reset week if range used
                                    }}
                                    style={{ padding: '0.8rem', background: '#111', color: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', colorScheme: 'dark' }}
                                />
                            </div>
                            <button 
                                onClick={resetFilters}
                                style={{ 
                                    background: 'var(--primary)', 
                                    color: '#000', 
                                    border: 'none', 
                                    padding: '0.8rem 1.5rem', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 800,
                                    height: '42px'
                                }}
                            >
                                RESET FILTERS
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>DIGITAL REVENUE</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>${breakdown.digital.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>Stripe & Online</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)', background: 'rgba(212, 175, 55, 0.05)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>GIFT CREDIT</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>${breakdown.gift.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>Redeemed value</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>CANCELLATIONS</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>${breakdown.cancellation.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>50% Retention fees</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--secondary)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>PERIOD TOTAL</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--secondary)' }}>${breakdown.total.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>Current selection sum</p>
                </div>
            </div>

            {/* Integrated Ledger Table */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Transaction Breakdown</h2>
                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{filteredApps.length} entries matching filters</span>
                </div>
                <SettlementTable appointments={filteredApps.map(a => ({
                    ...a,
                    service: a.service || { name: a.sn || 'Service', price: Number(a.sp || 0) },
                    customer: a.customer || { name: a.cn || 'Guest' },
                    amountPaidStripe: Number(a.amountPaidStripe || 0),
                    amountPaidGift: Number(a.amountPaidGift || 0)
                }))} />
            </div>
        </div>
    );
}
