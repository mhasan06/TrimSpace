"use client";

import { useState } from "react";
import Link from "next/link";
import CustomerProfileManager from "@/components/CustomerProfileManager";
import CustomerLogoutButton from "@/components/CustomerLogoutButton";
import SessionHistoryTable from "./SessionHistoryTable";
import InvoiceButton from "@/components/InvoiceButton";
import CancelButton from "@/components/CancelButton";
import RaiseDisputeButton from "@/components/RaiseDisputeButton";

export default function CustomerDashboardClient({ 
    user, 
    upcoming, 
    completed,
    cancelled,
    userReviewIds,
    completedCount,
    cancelledCount,
    favorites = [],
    disputeNotes = []
}: any) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("appointments");
    const [viewingInvoice, setViewingInvoice] = useState<any>(null);
    const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const filteredRows = (() => {
        if (activeTab === "appointments") return upcoming;
        if (activeTab === "completed") return completed;
        if (activeTab === "cancelled") return cancelled;
        return [];
    })();

    const nextBooking = upcoming[0];

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)', 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            padding: isMobile ? '1rem' : '2rem',
            gap: isMobile ? '1.5rem' : '2rem',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* ... Invoice and Profile Modals remain unchanged ... */}
            {isProfileOpen && (
                <CustomerProfileManager 
                    user={user} 
                    onClose={() => setIsProfileOpen(false)} 
                />
            )}

            {viewingInvoice && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem' }}>
                    <div className="printable-invoice" style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '24px', padding: isMobile ? '1.5rem' : '3rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto', color: '#1e293b' }}>
                        <button onClick={() => setViewingInvoice(null)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }} className="no-print">✕</button>
                        
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem', gap: '1rem' }}>
                            <div>
                                <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, color: '#6366f1', margin: 0 }}>TAX INVOICE</h2>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Booking ID: </span>
                                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>#{viewingInvoice.bookingGroupId || viewingInvoice.id.slice(-8).toUpperCase()}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>{viewingInvoice.tenant.name}</h3>
                                <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', opacity: 0.6 }}>{viewingInvoice.tenant.address}</p>
                            </div>
                        </div>
                        {/* ... Rest of Invoice Modal remains structurally similar but with responsive tweaks ... */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '2rem', marginBottom: '2rem' }}>
                            <div>
                                <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Billed To</p>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>{user.name}</p>
                                <p style={{ margin: '0.1rem 0', opacity: 0.6, fontSize: '0.85rem' }}>{user.email}</p>
                            </div>
                            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Session Date</p>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>{new Date(viewingInvoice.startTime).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', minWidth: isMobile ? '400px' : 'auto' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ textAlign: 'left', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Details</th>
                                        <th style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ textAlign: 'right', padding: '1rem 0', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingInvoice.services.map((s: any, i: number) => {
                                        const isCancelled = s.status === 'CANCELLED';
                                        const finalPrice = isCancelled ? (s.price * 0.5) : s.price;
                                        const isFuture = new Date(s.startTime) > new Date();
                                        const statusText = isCancelled ? 'CANCELLED' : (isFuture ? 'BOOKED' : 'COMPLETED');
                                        return (
                                            <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '1rem 0' }}>
                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{s.name}</div>
                                                    {isCancelled && <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700 }}>50% Retention Fee</div>}
                                                </td>
                                                <td style={{ textAlign: 'center', padding: '1rem 0' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, padding: '0.2rem 0.5rem', borderRadius: '6px', background: isCancelled ? '#fee2e2' : (isFuture ? '#e0f2fe' : '#f0fdf4'), color: isCancelled ? '#ef4444' : (isFuture ? '#0369a1' : '#16a34a') }}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '1rem 0', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    <div style={{ textDecoration: isCancelled ? 'line-through' : 'none', opacity: isCancelled ? 0.4 : 1 }}>${s.price.toFixed(2)}</div>
                                                    {isCancelled && <div style={{ color: '#ef4444' }}>${finalPrice.toFixed(2)}</div>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginLeft: 'auto', width: isMobile ? '100%' : '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', opacity: 0.6, fontSize: '0.8rem' }}>
                                <span>Subtotal</span>
                                <span>${(viewingInvoice.services.reduce((acc: number, s: any) => acc + s.price, 0)).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', fontWeight: 900, borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                                <span>Total Paid</span>
                                <span>${viewingInvoice.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="no-print" style={{ marginTop: '2.5rem', display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => window.print()} style={{ flex: 1, background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Print</button>
                            <button onClick={() => setViewingInvoice(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── PROFILE COMMAND CARD ─── */}
            <section style={{ 
                width: isMobile ? '100%' : '380px', 
                background: 'white', 
                borderRadius: '32px', 
                boxShadow: '0 15px 35px rgba(0,0,0,0.03)',
                padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: 'fit-content',
                position: isMobile ? 'relative' : 'sticky',
                top: isMobile ? '0' : '2rem'
            }}>
                <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
                    <div style={{ width: isMobile ? '100px' : '130px', height: isMobile ? '100px' : '130px', borderRadius: '50%', overflow: 'hidden', border: '5px solid #F5F3FF' }}>
                        <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff&size=200`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                </div>

                <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.8rem', textAlign: 'center' }}>{user.name}</h2>
                
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
                        marginBottom: '1.5rem'
                    }}
                >
                    Edit Profile
                </button>

                <Link href="/" style={{ width: '100%', background: '#6366f1', color: 'white', textAlign: 'center', padding: '1rem', borderRadius: '18px', textDecoration: 'none', fontWeight: 800, boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)', marginBottom: '1.5rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>Add New Appointment</Link>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#f8fafc', padding: '0.8rem 1.2rem', borderRadius: '18px' }}>
                        <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Email</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', wordBreak: 'break-all' }}>{user.email}</p>
                    </div>
                </div>
            </section>

            {/* ─── MAIN ANALYTICS & LIST ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2rem', width: '100%' }}>
                
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.2rem' }}>Welcome, {user.name.split(' ')[0]}!</h1>
                        {nextBooking && (
                            <p style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#6366f1', fontWeight: 700 }}>
                                📅 Next visit: {new Date(nextBooking.startTime).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} at {new Date(nextBooking.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                </header>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '1rem' : '1.5rem' }}>
                    {[
                        { label: 'All Bookings', value: upcoming.length + completed.length + cancelled.length, color: '#6366f1' },
                        { label: 'Completed', value: completedCount, color: '#22c55e' },
                        { label: 'Cancelled', value: cancelledCount, color: '#ef4444' }
                    ].map((stat, i) => (
                        <div key={i} style={{ background: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 900, color: stat.color, margin: 0 }}>{stat.value}</p>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginTop: '0.3rem' }}>{stat.label}</p>
                            </div>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `3px solid ${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: '70%', height: '70%', borderRadius: '50%', border: `3px solid ${stat.color}` }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Favorites Quick Booking */}
                {favorites.length > 0 && (
                    <div style={{ marginBottom: isMobile ? '1rem' : '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#ef4444' }}>❤️</span> Favorite Shops
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', WebkitOverflowScrolling: 'touch' }}>
                            {favorites.map((shop: any) => (
                                <Link 
                                    key={shop.id}
                                    href={`/${shop.slug}`}
                                    style={{ 
                                        minWidth: '140px', background: 'white', padding: '1rem', 
                                        borderRadius: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.02)',
                                        textDecoration: 'none', display: 'flex', flexDirection: 'column', 
                                        alignItems: 'center', gap: '0.6rem', border: '1px solid #f1f5f9'
                                    }}
                                >
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, color: '#6366f1' }}>
                                        {shop.name.charAt(0)}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', margin: 0, textAlign: 'center' }}>{shop.name}</p>
                                    <span style={{ fontSize: '0.65rem', background: '#6366f115', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 800 }}>Book Now</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{ background: 'white', borderRadius: '32px', padding: isMobile ? '1.5rem' : '2.5rem', boxShadow: '0 15px 40px rgba(0,0,0,0.02)', flex: 1, width: '100%' }}>
                    <nav style={{ display: 'flex', gap: isMobile ? '1rem' : '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: isMobile ? '1.5rem' : '2.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        {["appointments", "completed", "cancelled"].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{ 
                                    background: 'none', border: 'none', padding: '1rem 0', 
                                    borderBottom: activeTab === tab ? '3px solid #6366f1' : '3px solid transparent', 
                                    color: activeTab === tab ? '#1e293b' : '#94a3b8', 
                                    fontWeight: 800, fontSize: isMobile ? '0.85rem' : '1rem', cursor: 'pointer',
                                    whiteSpace: 'nowrap', textTransform: 'capitalize'
                                }}
                            >
                                {tab === 'appointments' ? 'Active' : tab}
                            </button>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {filteredRows.length > 0 ? (
                            filteredRows.map((group: any) => (
                                <div key={group.id} style={{ 
                                    background: '#f8fafc', borderRadius: '24px', padding: isMobile ? '1rem' : '1.5rem', 
                                    border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' 
                                }}>
                                    {/* Group Header */}
                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'center', minWidth: '45px' }}>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{new Date(group.startTime).getUTCDate()}</p>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{new Date(group.startTime).toLocaleDateString('en-AU', { month: 'short' })}</p>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{group.tenant.name}</h4>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{group.services.length} {group.services.length > 1 ? 'services' : 'service'}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                                            <button 
                                                onClick={() => setViewingInvoice(group)}
                                                style={{ 
                                                    flex: 1, background: '#6366f1', color: 'white', 
                                                    padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer',
                                                    fontWeight: 800, fontSize: '0.7rem', border: 'none'
                                                }}
                                            >
                                                VIEW
                                            </button>
                                            {activeTab === 'appointments' && group.bookingGroupId && group.services.filter((s: any) => s.status !== 'CANCELLED').length > 1 && (
                                                <div style={{ flex: 1 }}>
                                                    <CancelButton 
                                                        appointmentId={group.bookingGroupId} 
                                                        amountPaidStripe={group.services.filter((s: any) => s.status !== 'CANCELLED').reduce((acc: number, s: any) => acc + s.amountPaidStripe, 0)} 
                                                        amountPaidGift={group.services.filter((s: any) => s.status !== 'CANCELLED').reduce((acc: number, s: any) => acc + s.amountPaidGift, 0)} 
                                                        label="Cancel All"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cascaded Services */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {group.services.map((service: any, idx: number) => {
                                            const sTime = new Date(service.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <div key={service.id || idx} style={{ 
                                                    background: 'white', padding: '0.8rem 1rem', borderRadius: '16px', 
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)', gap: '0.5rem'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                        <div style={{ width: '3px', height: '20px', background: service.status === 'CANCELLED' ? '#ef4444' : '#6366f1', borderRadius: '2px' }} />
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8' }}>{sTime}</p>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                                                                {service.name}
                                                                {service.status === 'CANCELLED' && <span style={{ color: '#ef4444', marginLeft: '0.4rem' }}>(CANCELLED)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {activeTab === 'appointments' && service.status !== 'CANCELLED' && (
                                                            <CancelButton 
                                                                appointmentId={service.id} 
                                                                amountPaidStripe={service.amountPaidStripe} 
                                                                amountPaidGift={service.amountPaidGift} 
                                                                label="Cancel"
                                                                small
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                <p style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem' }}>No {activeTab} bookings found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
