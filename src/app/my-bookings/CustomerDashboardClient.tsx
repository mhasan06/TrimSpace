"use client";

import { useState } from "react";
import Link from "next/link";
import CustomerProfileManager from "@/components/CustomerProfileManager";
import CustomerLogoutButton from "@/components/CustomerLogoutButton";
import SessionHistoryTable from "./SessionHistoryTable";
import InvoiceButton from "@/components/InvoiceButton";
import CancelButton from "@/components/CancelButton";

export default function CustomerDashboardClient({ 
    user, 
    upcoming, 
    past, 
    userReviewIds,
    completedCount,
    cancelledCount
}: any) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)', 
            display: 'flex', 
            padding: '2rem',
            gap: '2rem',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {isProfileOpen && (
                <CustomerProfileManager 
                    user={user} 
                    onClose={() => setIsProfileOpen(false)} 
                />
            )}

            {/* ─── PROFILE COMMAND CARD ─── */}
            <section style={{ 
                width: '380px', 
                background: 'white', 
                borderRadius: '40px', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
                padding: '3rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 'fit-content',
                position: 'sticky',
                top: '2rem'
            }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '5px solid #F5F3FF' }}>
                        <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&size=200`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.2rem' }}>{user.name}</h2>
                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '1rem' }}>NEW CLIENT</span>
                
                <button 
                    onClick={() => setIsProfileOpen(true)}
                    style={{ 
                        background: 'transparent', 
                        border: '1px solid #e2e8f0', 
                        color: '#64748b', 
                        padding: '0.5rem 1.2rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        marginBottom: '2rem'
                    }}
                >
                    Edit Profile
                </button>

                <Link href="/" style={{ width: '100%', background: '#6366f1', color: 'white', textAlign: 'center', padding: '1rem', borderRadius: '18px', textDecoration: 'none', fontWeight: 800, boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)', marginBottom: '2rem' }}>Add New Appointment</Link>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderRadius: '18px' }}>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Email</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', wordBreak: 'break-all' }}>{user.email}</p>
                    </div>
                </div>

                <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <CustomerLogoutButton />
                </div>
            </section>

            {/* ─── MAIN ANALYTICS & LIST ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>Client Profile</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ background: 'white', padding: '0.8rem 1.5rem', borderRadius: '18px', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🔍</span>
                            <input type="text" placeholder="Search appointments..." style={{ border: 'none', outline: 'none', fontSize: '0.9rem', width: '200px' }} />
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    {[
                        { label: 'All Bookings', value: upcoming.length + past.length, color: '#6366f1', trend: '+35%' },
                        { label: 'Completed', value: completedCount, color: '#22c55e', trend: '+25%' },
                        { label: 'Cancelled', value: cancelledCount, color: '#ef4444', trend: '-10%' }
                    ].map((stat, i) => (
                        <div key={i} style={{ background: 'white', padding: '2rem', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: stat.color, margin: 0 }}>{stat.value}</p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginTop: '0.3rem' }}>{stat.label}</p>
                            </div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `4px solid ${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '80%', height: '80%', borderRadius: '50%', border: `4px solid ${stat.color}` }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div style={{ background: 'white', borderRadius: '40px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.02)', flex: 1 }}>
                    <nav style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: '2.5rem' }}>
                        <button style={{ background: 'none', border: 'none', padding: '1rem 0', borderBottom: '3px solid #6366f1', color: '#1e293b', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>Appointments</button>
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {upcoming.length > 0 ? upcoming.map((group: any) => (
                            <div key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', borderRadius: '24px', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{new Date(group.startTime).getUTCDate()}</p>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{new Date(group.startTime).toLocaleDateString('en-AU', { month: 'short' })}</p>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{group.services.map((s: any) => s.name).join(' + ')}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700 }}>{new Date(group.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} • {group.tenant.name}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span style={{ background: '#eef2ff', color: '#6366f1', padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>BOOKED</span>
                                    <div style={{ textAlign: 'right', minWidth: '80px', marginRight: '1rem' }}>
                                        <p style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>${group.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <InvoiceButton appointmentId={group.id} bookingId={group.bookingGroupId || group.id.substring(group.id.length - 8)} />
                                    <CancelButton appointmentId={group.id} amountPaidStripe={group.totalStripe} amountPaidGift={group.totalGift} />
                                </div>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                                <p style={{ color: '#94a3b8', fontWeight: 700 }}>No active appointments found.</p>
                            </div>
                        )}

                        {past.length > 0 && <div style={{ height: '1px', background: '#f1f5f9', margin: '2rem 0' }}></div>}
                        
                        <SessionHistoryTable rows={past.slice(0, 10).map((g: any) => ({
                                id: g.id,
                                startTime: g.startTime.toISOString ? g.startTime.toISOString() : g.startTime,
                                endTime: g.endTime.toISOString ? g.endTime.toISOString() : g.endTime,
                                tenantName: g.tenant.name,
                                tenantSlug: g.tenant.slug,
                                tenantAddress: g.tenant.address,
                                serviceName: g.services.map((s: any) => s.name).join(", "),
                                servicePrice: g.totalPrice,
                                status: g.status,
                                paymentStatus: g.paymentStatus,
                                paymentMethod: g.paymentMethod,
                                amountPaidStripe: g.totalStripe,
                                amountPaidGift: g.totalGift,
                                barberName: g.barber?.name,
                                invoiceUrl: g.invoiceUrl,
                                hasReview: userReviewIds.includes(g.id)
                        }))} />
                    </div>
                </div>
            </main>
        </div>
    );
}
