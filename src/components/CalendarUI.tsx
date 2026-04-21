"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Barber { id: string; name: string | null; }
interface Appointment { 
  id: string; 
  startTime: string; 
  endTime: string; 
  status: string; 
  customer: { name: string | null }; 
  service: { name: string; durationMinutes: number; price: number } 
  barberId: string;
  bookingGroupId: string | null;
}

type ViewMode = 'day' | 'week' | 'month';

export default function CalendarUI({ barbers, appointments, currentDateStr, highlightAppointmentId }: { barbers: Barber[], appointments: Appointment[], currentDateStr: string, highlightAppointmentId?: string }) {
  const [selectedBooking, setSelectedBooking] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // Default to month as per screenshot
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const router = useRouter();

  const current = new Date(currentDateStr);
  const isToday = (d: Date) => d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

  const navigateMonth = (offset: number) => {
      const d = new Date(currentDateStr);
      d.setMonth(d.getMonth() + offset);
      const nextStr = d.toISOString().split('T')[0];
      router.push(`/dashboard?date=${nextStr}`);
  };

  // --- MONTH VIEW LOGIC ---
  const monthData = useMemo(() => {
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Get Mon-Sun index (1-7)
    let startDayIdx = firstDay.getDay(); 
    if (startDayIdx === 0) startDayIdx = 7; // Sunday fix
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    
    // Fill padding from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIdx - 1; i > 0; i--) {
        cells.push({ day: prevMonthLastDay - i + 1, monthOffset: -1, date: new Date(year, month - 1, prevMonthLastDay - i + 1) });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        cells.push({ day: i, monthOffset: 0, date: new Date(year, month, i) });
    }
    
    // Next month padding
    const remaining = 42 - cells.length; // 6 rows of 7
    for (let i = 1; i <= remaining; i++) {
        cells.push({ day: i, monthOffset: 1, date: new Date(year, month + 1, i) });
    }
    
    return cells;
  }, [current]);

  const monthLabel = current.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- REFINED FRESHA HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
                onClick={() => router.push(`/dashboard?date=${new Date().toISOString().split('T')[0]}`)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Today
            </button>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <button onClick={() => navigateMonth(-1)} style={{ padding: '0.5rem 0.8rem', background: '#fff', border: 'none', cursor: 'pointer', borderRight: '1px solid #e2e8f0' }}>&lsaquo;</button>
                <div style={{ padding: '0.5rem 1.5rem', minWidth: '140px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{monthLabel}</div>
                <button onClick={() => navigateMonth(1)} style={{ padding: '0.5rem 0.8rem', background: '#fff', border: 'none', cursor: 'pointer' }}>&rsaquo;</button>
            </div>
            <select 
                value={selectedBarberId}
                onChange={(e) => setSelectedBarberId(e.target.value)}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                <option value="all">All Professionals</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button style={{ padding: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-3h6m2 5h6"/></svg>
            </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ padding: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                <select 
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as ViewMode)}
                    style={{ padding: '0.5rem 1rem', background: '#fff', border: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                </select>
            </div>
            <button style={{ background: '#000', color: '#fff', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                Add
            </button>
        </div>
      </div>

      {/* --- CALENDAR BODY --- */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Day Labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <div key={d} style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#4a5568' }}>{d}</div>
            ))}
        </div>

        {/* Month Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
            {monthData.map((cell: any, idx: number) => {
                const dayStr = cell.date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                const dayApps = appointments.filter(a => {
                    const aStart = new Date(a.startTime).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
                    const cellStart = cell.date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
                    return aStart === cellStart && (selectedBarberId === 'all' || a.barberId === selectedBarberId);
                });

                const isTodayCell = isToday(cell.date);

                return (
                    <div key={idx} style={{ 
                        borderRight: '1px solid #f1f5f9', 
                        borderBottom: '1px solid #f1f5f9', 
                        padding: '0.5rem',
                        background: cell.monthOffset !== 0 ? 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)' : '#fff'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            <span style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 700,
                                opacity: cell.monthOffset !== 0 ? 0.3 : 1,
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                background: isTodayCell ? '#3b82f6' : 'transparent',
                                color: isTodayCell ? '#fff' : 'inherit'
                            }}>
                                {cell.day}
                            </span>
                            {cell.day === 1 && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.5 }}>
                                    {cell.date.toLocaleString('default', { month: 'long' })}
                                </span>
                            )}
                        </div>

                        {/* Grouped App Blocks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {(() => {
                                const grouped: any[] = [];
                                const map = new Map();
                                dayApps.forEach(app => {
                                    const gid = app.bookingGroupId || app.id;
                                    if (!map.has(gid)) {
                                        map.set(gid, { ...app, allServices: [] });
                                        grouped.push(map.get(gid));
                                    }
                                    map.get(gid).allServices.push(app.service);
                                });
                                return grouped.map(group => (
                                    <div 
                                        key={group.bookingGroupId || group.id} 
                                        onClick={() => setSelectedBooking(group)}
                                        style={{ 
                                            background: group.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : (group.bookingGroupId ? '#dcfce7' : '#bfdbfe'), 
                                            padding: '4px 6px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 800, 
                                            color: group.status === 'CANCELLED' ? '#ef4444' : (group.bookingGroupId ? '#166534' : '#1e40af'), 
                                            whiteSpace: 'nowrap', 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            cursor: 'pointer',
                                            borderLeft: group.status === 'CANCELLED' ? '3px solid #ef4444' : (group.bookingGroupId ? '3px solid #166534' : 'none'),
                                            textDecoration: group.status === 'CANCELLED' ? 'line-through' : 'none'
                                        }}>
                                        {new Date(group.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} 
                                        {group.bookingGroupId ? ' [GRP] ' : ' '}
                                        {group.customer.name}
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Booking Detail Sidebar (matching Fresha logic) */}
      {selectedBooking && (
          <div style={{ position: 'fixed', top: 0, right: 0, width: '400px', height: '100vh', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '2rem', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a202c' }}>Appointment Detail</h3>
                  <button onClick={() => setSelectedBooking(null)} style={{ background: '#f7fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
              </div>
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                  <div style={{ marginBottom: '2.5rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>Client</label>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a202c', marginTop: '0.5rem' }}>{selectedBooking.customer.name || 'Anonymous'}</p>
                  </div>
                   <div style={{ marginBottom: '2.5rem' }}>
                       <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>Services</label>
                       {(selectedBooking as any).allServices ? (selectedBooking as any).allServices.map((s: any, idx: number) => (
                           <p key={idx} style={{ fontSize: '1rem', fontWeight: 800, color: '#1a202c', marginTop: '0.3rem' }}>• {s.name} (${s.price})</p>
                       )) : (
                           <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1a202c', marginTop: '0.3rem' }}>{selectedBooking.service.name}</p>
                       )}
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                       <div>
                           <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#718096', textTransform: 'uppercase', letterSpacing: '1px' }}>Professional</label>
                           <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1a202c', marginTop: '0.3rem' }}>{barbers.find(b => b.id === selectedBooking.barberId)?.name || 'Merchant'}</p>
                       </div>
                   </div>
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Date</span>
                          <span style={{ fontWeight: 800, color: '#1a202c' }}>{new Date(selectedBooking.startTime).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Start Time</span>
                          <span style={{ fontWeight: 800, color: '#1a202c' }}>{new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                  </div>
              </div>
              <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #edf2f7', display: 'flex', gap: '1rem' }}>
                  <button style={{ flex: 1, padding: '0.8rem', background: '#3182ce', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Checkout</button>
                  <button onClick={() => setSelectedBooking(null)} style={{ padding: '0.8rem 1.5rem', background: '#f7fafc', color: '#4a5568', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
          </div>
      )}
    </div>
  );
}
