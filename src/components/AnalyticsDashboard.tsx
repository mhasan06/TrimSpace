"use client";

import React, { useMemo } from 'react';
import styles from '@/app/dashboard/page.module.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, CalendarCheck, Users, Activity } from 'lucide-react';

const COLORS = ['#3b429f', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function AnalyticsDashboard({ 
    totalRevenue, 
    totalAppointments, 
    newCustomers, 
    revenueChartData, 
    topServices,
    topCustomers
}: {
    totalRevenue: number;
    totalAppointments: number;
    newCustomers: number;
    revenueChartData: any[];
    topServices: any[];
    topCustomers: any[];
}) {

    // Format revenue chart data
    const formattedChartData = useMemo(() => {
        return revenueChartData.map(d => ({
            ...d,
            dayStr: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
        }));
    }, [revenueChartData]);

    // Format pie chart data
    const pieData = useMemo(() => {
        return topServices.slice(0, 5).map(s => ({
            name: s.name,
            value: s.revenue
        }));
    }, [topServices]);

    const avgTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                <div className={styles.recentSection} style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(59, 66, 159, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b429f' }}>
                            <DollarSign size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowUpRight size={14} /> 12%
                        </div>
                    </div>
                    <div className={styles.miniStatLabel}>Total Revenue (30d)</div>
                    <div className={styles.miniStatValue}>${totalRevenue.toFixed(0)}</div>
                </div>

                <div className={styles.recentSection} style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <CalendarCheck size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowUpRight size={14} /> 8%
                        </div>
                    </div>
                    <div className={styles.miniStatLabel}>Completed Appointments</div>
                    <div className={styles.miniStatValue}>{totalAppointments}</div>
                </div>

                <div className={styles.recentSection} style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                            <Activity size={20} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
                            <ArrowDownRight size={14} /> 2%
                        </div>
                    </div>
                    <div className={styles.miniStatLabel}>Avg. Ticket Size</div>
                    <div className={styles.miniStatValue}>${avgTicket.toFixed(2)}</div>
                </div>

                <div className={styles.recentSection} style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className={styles.miniStatLabel}>Active Clients</div>
                    <div className={styles.miniStatValue}>{newCustomers}</div>
                </div>
            </div>

            {/* Main Growth Chart */}
            <div className={styles.recentSection} style={{ marginBottom: 0 }}>
                <div className={styles.cardHeader}>
                    <h2>Revenue Growth (Last 30 Days)</h2>
                </div>
                <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStripe" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b429f" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b429f" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="dayStr" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="stripe" stroke="#3b429f" strokeWidth={4} fillOpacity={1} fill="url(#colorStripe)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Row */}
            <div className={styles.mockupGridTop}>
                {/* Service Breakdown */}
                <div className={styles.recentSection} style={{ marginBottom: 0 }}>
                    <div className={styles.cardHeader}>
                        <h2>Service Revenue Breakdown</h2>
                    </div>
                    {pieData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>No service data available.</div>
                    )}
                </div>

                {/* Top Customers List */}
                <div className={styles.recentSection} style={{ marginBottom: 0 }}>
                    <div className={styles.cardHeader}>
                        <h2>Top Clients (LTV)</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topCustomers.map((c: any, i: number) => (
                            <div key={i} className={styles.staffItem}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(59, 66, 159, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#3b429f', fontSize: '0.9rem' }}>
                                    {c.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{c.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{c.visits} Visits</div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#3b429f' }}>
                                    ${c.totalSpend.toFixed(2)}
                                </div>
                            </div>
                        ))}
                        {topCustomers.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>No clients yet.</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
