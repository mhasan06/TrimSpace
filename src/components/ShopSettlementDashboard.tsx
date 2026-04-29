"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "../app/dashboard/page.module.css";
import { calculateServiceFees } from "@/lib/pricing";
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
        let totalCustomerPaid = 0;
        let totalFees = 0;
        let totalPayout = 0;

        filteredApps.forEach(app => {
            const fees = calculateServiceFees(Number(app.service?.price || 0));
            if (app.status === 'CANCELLED') {
                const retention = Number(app.cancellationFee || (fees.basePrice * 0.5));
                totalPayout += retention;
                totalCustomerPaid += retention;
            } else {
                totalCustomerPaid += fees.totalCustomerPrice;
                totalFees += (fees.totalCustomerPrice - fees.basePrice);
                totalPayout += fees.basePrice;
            }
        });

        return { totalCustomerPaid, totalFees, totalPayout };
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
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #6366f1', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>TOTAL CUSTOMER PAID</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>${breakdown.totalCustomerPaid.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>All-inclusive revenue</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>SECURE PROCESSING & PLATFORM FEES</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900 }}>${breakdown.totalFees.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>Platform deductions</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid #16a34a' }}>
                    <h4 style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '1px' }}>NET TOTAL PAYOUT</h4>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#16a34a' }}>${breakdown.totalPayout.toFixed(2)}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.4, marginTop: '0.3rem' }}>Shop revenue after fees</p>
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
