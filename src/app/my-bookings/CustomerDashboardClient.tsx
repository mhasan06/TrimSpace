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
    cancelledCount,
    favorites = []
}: any) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("appointments");
    const [viewingInvoice, setViewingInvoice] = useState<any>(null);

    const filteredRows = (() => {
        if (activeTab === "appointments") return upcoming;
        if (activeTab === "completed") return past;
        return [];
    })();

    const nextBooking = upcoming[0];

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

            {viewingInvoice && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="printable-invoice" style={{ background: 'white', width: '100%', maxWidth: '800px', borderRadius: '24px', padding: '3rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto', color: '#1e293b' }}>
                        <button onClick={() => setViewingInvoice(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }} className="no-print">✕</button>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '2rem', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#6366f1', margin: 0 }}>TAX INVOICE</h2>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Booking ID: </span>
                                    <span style={{ fontWeight: 800, color: '#1e293b' }}>#{viewingInvoice.bookingGroupId || viewingInvoice.id.slice(-8).toUpperCase()}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>{viewingInvoice.tenant.name}</h3>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', opacity: 0.6 }}>{viewingInvoice.tenant.address}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Billed To</p>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>{user.name}</p>
                                <p style={{ margin: '0.2rem 0', opacity: 0.6 }}>{user.email}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Session Date</p>
                                <p style={{ margin: 0, fontWeight: 800 }}>{new Date(viewingInvoice.startTime).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p style={{ margin: '0.2rem 0', opacity: 0.6 }}>{new Date(viewingInvoice.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem 0', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Service Details</th>
                                    <th style={{ textAlign: 'center', padding: '1rem 0', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ textAlign: 'right', padding: '1rem 0', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Amount</th>
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
                                            <td style={{ padding: '1.2rem 0' }}>
                                                <div style={{ fontWeight: 800 }}>{s.name}</div>
                                                {isCancelled && <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>50% Retention Fee Applied</div>}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '1.2rem 0' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.2rem 0.6rem', borderRadius: '6px', background: isCancelled ? '#fee2e2' : (isFuture ? '#e0f2fe' : '#f0fdf4'), color: isCancelled ? '#ef4444' : (isFuture ? '#0369a1' : '#16a34a') }}>
                                                    {statusText}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '1.2rem 0', fontWeight: 800 }}>
                                                <div style={{ textDecoration: isCancelled ? 'line-through' : 'none', opacity: isCancelled ? 0.4 : 1 }}>${s.price.toFixed(2)}</div>
                                                {isCancelled && <div style={{ color: '#ef4444' }}>${finalPrice.toFixed(2)}</div>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div style={{ marginLeft: 'auto', width: '320px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', opacity: 0.6, fontSize: '0.85rem' }}>
                                <span>Services Subtotal</span>
                                <span>${(viewingInvoice.services.reduce((acc: number, s: any) => acc + s.price, 0)).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', opacity: 0.6, fontSize: '0.85rem' }}>
                                <span>Priority Booking Fee</span>
                                <span>$0.50</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', fontWeight: 900, borderTop: '1px solid #f1f5f9', marginTop: '0.5rem' }}>
                                <span>Total Paid</span>
                                <span>${viewingInvoice.totalPrice.toFixed(2)}</span>
                            </div>
                            
                            {viewingInvoice.services.some((s: any) => s.status === 'CANCELLED') && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '18px', border: '1px dashed #6366f1' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.6 }}>
                                        <span>Final Session Cost</span>
                                        <span>${(viewingInvoice.services.reduce((acc: number, s: any) => acc + (s.status === 'CANCELLED' ? (s.price * 0.5) : s.price), 0) + 0.50).toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#6366f1', fontSize: '1.1rem' }}>
                                        <span>Estimated Refund</span>
                                        <span>${(viewingInvoice.services.reduce((acc: number, s: any) => acc + (s.cancellationFee || 0), 0)).toFixed(2)}</span>
                                    </div>
                                    <p style={{ fontSize: '0.65rem', margin: '0.8rem 0 0', opacity: 0.5, lineHeight: '1.4' }}>
                                        Refund represents the 50% returned portion of cancelled services processed to your original payment method.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="no-print" style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
                            <button onClick={() => window.print()} style={{ flex: 1, background: '#6366f1', color: 'white', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Print Now</button>
                            <button onClick={() => setViewingInvoice(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', padding: '1rem', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Close Preview</button>
                        </div>

                        <style>{`
                            @media print {
                                .no-print { display: none !important; }
                                body * { visibility: hidden; }
                                .printable-invoice, .printable-invoice * { visibility: visible; }
                                .printable-invoice { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
                            }
                        `}</style>
                    </div>
                </div>
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

                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '1rem' }}>{user.name}</h2>
                
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
            </section>

            {/* ─── MAIN ANALYTICS & LIST ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.2rem' }}>Welcome, {user.name.split(' ')[0]}!</h1>
                        {nextBooking && (
                            <p style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 700 }}>
                                📅 Next visit: {new Date(nextBooking.startTime).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })} at {new Date(nextBooking.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
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

                {/* Favorites Quick Booking */}
                {favorites.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#ef4444' }}>❤️</span> Favorite Shops
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                            {favorites.map((shop: any) => (
                                <Link 
                                    key={shop.id}
                                    href={`/${shop.slug}`}
                                    style={{ 
                                        minWidth: '150px', background: 'white', padding: '1.2rem', 
                                        borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)',
                                        textDecoration: 'none', display: 'flex', flexDirection: 'column', 
                                        alignItems: 'center', gap: '0.8rem', border: '1px solid #f1f5f9',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseLeave={(e: any) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        {shop.name.charAt(0)}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', margin: 0, textAlign: 'center' }}>{shop.name}</p>
                                    <span style={{ fontSize: '0.7rem', background: '#6366f115', color: '#6366f1', padding: '0.3rem 0.8rem', borderRadius: '10px', fontWeight: 800 }}>Book Now</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div style={{ background: 'white', borderRadius: '40px', padding: '2.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.02)', flex: 1 }}>
                    <nav style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #f1f5f9', marginBottom: '2.5rem' }}>
                        <button 
                            onClick={() => setActiveTab("appointments")}
                            style={{ 
                                background: 'none', border: 'none', padding: '1rem 0', 
                                borderBottom: activeTab === "appointments" ? '3px solid #6366f1' : '3px solid transparent', 
                                color: activeTab === "appointments" ? '#1e293b' : '#94a3b8', 
                                fontWeight: 800, fontSize: '1rem', cursor: 'pointer' 
                            }}
                        >
                            Active
                        </button>
                        <button 
                            onClick={() => setActiveTab("completed")}
                            style={{ 
                                background: 'none', border: 'none', padding: '1rem 0', 
                                borderBottom: activeTab === "completed" ? '3px solid #6366f1' : '3px solid transparent', 
                                color: activeTab === "completed" ? '#1e293b' : '#94a3b8', 
                                fontWeight: 800, fontSize: '1rem', cursor: 'pointer' 
                            }}
                        >
                            Completed
                        </button>
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {activeTab === "appointments" ? (
                            upcoming.length > 0 ? upcoming.map((group: any) => (
                                <div key={group.id} style={{ 
                                    background: '#f8fafc', borderRadius: '32px', padding: '1.5rem', 
                                    border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '1rem' 
                                }}>
                                    {/* Group Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'center', minWidth: '50px' }}>
                                                <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>{new Date(group.startTime).getUTCDate()}</p>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{new Date(group.startTime).toLocaleDateString('en-AU', { month: 'short' })}</p>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                                    {group.services.length > 1 ? "Group Booking" : "Single Booking"} • {group.tenant.name}
                                                </h4>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>{group.services.length} services booked</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => setViewingInvoice(group)}
                                                    style={{ 
                                                        background: '#6366f1', color: 'white', 
                                                        padding: '0.5rem 1.2rem', borderRadius: '12px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '0.7rem',
                                                        boxShadow: '0 5px 15px rgba(99, 102, 241, 0.2)', border: 'none'
                                                    }}
                                                >
                                                    VIEW
                                                </button>
                                            </div>
                                            {group.bookingGroupId && group.services.length > 1 && (
                                                <CancelButton 
                                                    appointmentId={group.bookingGroupId} 
                                                    amountPaidStripe={group.totalStripe} 
                                                    amountPaidGift={group.totalGift} 
                                                    label="Cancel All"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Cascaded Services */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {group.services.map((service: any, idx: number) => {
                                            const sTime = new Date(service.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
                                            const sDate = new Date(service.startTime).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
                                            return (
                                                <div key={service.id || idx} style={{ 
                                                    background: 'white', padding: '1rem 1.5rem', borderRadius: '18px', 
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: service.status === 'CANCELLED' ? '#ef4444' : '#6366f1' }}></div>
                                                        <div>
                                                            <span style={{ fontWeight: 800, color: service.status === 'CANCELLED' ? '#ef4444' : '#1e293b', fontSize: '0.9rem', textDecoration: service.status === 'CANCELLED' ? 'line-through' : 'none' }}>{service.name}</span>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                                                {sDate} at {sTime} • ${service.price.toFixed(2)}
                                                                {service.status === 'CANCELLED' && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>(CANCELLED)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {service.status !== 'CANCELLED' && (
                                                        <CancelButton 
                                                            appointmentId={service.id} 
                                                            amountPaidStripe={Number(group.totalStripe / group.services.length)} 
                                                            amountPaidGift={Number(group.totalGift / group.services.length)} 
                                                            label="Cancel"
                                                            small
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                                    <p style={{ color: '#94a3b8', fontWeight: 700 }}>No active appointments found.</p>
                                </div>
                            )
                        ) : (
                            <>
                                {filteredRows.length > 0 ? (
                                    <SessionHistoryTable 
                                        onPrint={(row: any) => {
                                            const originalGroup = filteredRows.find((g: any) => g.id === row.id);
                                            setViewingInvoice(originalGroup);
                                        }}
                                        rows={filteredRows.slice(0, 10).map((g: any) => ({
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
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                        <p style={{ color: '#94a3b8', fontWeight: 700 }}>No bookings found in this category.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
