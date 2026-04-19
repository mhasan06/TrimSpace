"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface WeeklyBooking {
  date: string; // ISO date string
  jobCount: number;
  revenue: number;
}

export default function WeeklyCalendar({ weekData, currentDay }: { weekData: WeeklyBooking[], currentDay: string }) {
  const router = useRouter();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (dateStr: string) => {
    router.push(`/dashboard?date=${dateStr.split('T')[0]}`);
  };

  const maxJobs = Math.max(...weekData.map(d => d.jobCount), 1);

  return (
    <div className="glass" style={{ padding: '2rem', marginTop: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Outlook</h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.2rem' }}>7-Day Load Distribution</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
           <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></div>
           <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Busiest Day Indicator</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' }}>
        {weekData.map((day) => {
          const d = new Date(day.date);
          const isCurrent = day.date.split('T')[0] === currentDay;
          const dayName = dayNames[d.getUTCDay()];
          const dayNum = d.getUTCDate();

          return (
            <div 
              key={day.date}
              onClick={() => handleDayClick(day.date)}
              style={{
                background: isCurrent ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                border: isCurrent ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '1.2rem 0.8rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.background = isCurrent ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = isCurrent ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)';
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', letterSpacing: '1px' }}>{dayName}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, display: 'block', margin: '0.3rem 0', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
              
              <div style={{ height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', margin: '0.8rem 0', position: 'relative' }}>
                 <div style={{ 
                    width: '100%', 
                    background: isCurrent ? 'var(--primary)' : 'var(--secondary)', 
                    height: `${(day.jobCount / maxJobs) * 100 || 5}%`, 
                    borderRadius: '4px',
                    opacity: day.jobCount === 0 ? 0.2 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '12px'
                 }}>
                    {day.jobCount > 0 && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 900, 
                        transform: day.jobCount < (maxJobs * 0.2) ? 'translateY(-15px)' : 'none',
                        color: day.jobCount < (maxJobs * 0.2) ? 'white' : (isCurrent ? 'black' : 'white')
                      }}>
                        {day.jobCount}
                      </span>
                    )}
                 </div>
              </div>

              <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                <p style={{ color: isCurrent ? 'var(--primary)' : 'white' }}>{day.jobCount} Jobs</p>
                <p style={{ opacity: 0.5, marginTop: '2px' }}>${day.revenue.toFixed(0)}</p>
              </div>

              {isCurrent && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
