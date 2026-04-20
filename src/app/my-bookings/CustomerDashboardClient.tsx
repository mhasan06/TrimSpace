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

    const filteredRows = (() => {
        if (activeTab === "appointments") return upcoming;
        if (activeTab === "completed") return past.filter((g: any) => g.status !== "CANCELLED");
        if (activeTab === "cancelled") return past.filter((g: any) => g.status === "CANCELLED");
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

          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <CustomerLogoutButton />
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
                                    href={`/shop/${shop.slug}`}
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
                        <button 
                            onClick={() => setActiveTab("cancelled")}
                            style={{ 
                                background: 'none', border: 'none', padding: '1rem 0', 
                                borderBottom: activeTab === "cancelled" ? '3px solid #6366f1' : '3px solid transparent', 
                                color: activeTab === "cancelled" ? '#1e293b' : '#94a3b8', 
                                fontWeight: 800, fontSize: '1rem', cursor: 'pointer' 
                            }}
                        >
                            Cancelled
                        </button>
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {activeTab === "appointments" ? (
                            upcoming.length > 0 ? upcoming.map((group: any) => (
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
                            )
                        ) : (
                            <>
                                {filteredRows.length > 0 ? (
                                    <SessionHistoryTable rows={filteredRows.slice(0, 10).map((g: any) => ({
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
