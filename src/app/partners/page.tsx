"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, TrendingUp, Users, Zap, Shield, Globe, Sparkles, CheckCircle, CreditCard, Megaphone } from 'lucide-react';

export default function PartnersPage() {
  return (
    <div style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-sans)', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '80px' }}>
      
      {/* Navigation Bar */}
      <nav style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, 
        backgroundColor: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', height: '80px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="white" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}>TrimSpace</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/partner-login" style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.875rem' }}>
              Log in
            </Link>
            <Link href="/register?type=business" style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.875rem', fontWeight: 700, borderRadius: '8px', textDecoration: 'none', transition: 'background-color 0.2s' }}>
              Join TrimSpace
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 0 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '24px', maxWidth: '900px', color: 'var(--foreground)' }}>
          The operating system for <span style={{ color: 'var(--primary)' }}>modern barbershops</span>.
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: '#64748b', lineHeight: 1.6, marginBottom: '40px', maxWidth: '700px' }}>
          TrimSpace is a subscription-free platform designed to elevate your brand, automate operations, and turn first-time walk-ins into lifelong clients.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register?type=business" style={{ padding: '16px 32px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', textDecoration: 'none' }}>
            Get started for free <ArrowRight size={20} />
          </Link>
          <Link href="#features" style={{ padding: '16px 32px', backgroundColor: 'transparent', border: '2px solid var(--border)', color: 'var(--foreground)', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', fontSize: '1.125rem', textDecoration: 'none' }}>
            Explore Platform
          </Link>
        </div>
        
        {/* Dashboard Image */}
        <div style={{ marginTop: '60px', width: '100%', maxWidth: '1000px', borderRadius: '16px 16px 0 0', border: '1px solid var(--border)', borderBottom: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', overflow: 'hidden', height: 'auto', minHeight: '300px' }}>
            <Image 
              src="/dashboard_mockup.png" 
              alt="TrimSpace Dashboard" 
              width={1000} 
              height={600} 
              style={{ width: '100%', height: 'auto', display: 'block' }} 
              priority
            />
        </div>
      </section>

      {/* Trust & Stats (Zero Subscription Focus) */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '32px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--foreground)' }}>0%</div>
            <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Monthly Subscription Fees</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>24/7</div>
            <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Automated Bookings</div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--foreground)' }}>100%</div>
            <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>Focus on Growth</div>
          </div>
        </div>
      </section>

      {/* Business Model & Content */}
      <section id="features" style={{ padding: '100px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Feature Block 1: The Client Booking Experience */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '64px', alignItems: 'center', marginBottom: '120px' }}>
          <div style={{ flex: '1 1 400px' }}>
            <Globe size={40} color="var(--primary)" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>A seamless booking experience.</h2>
            <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Give your clients a premium booking portal that feels like a luxury brand. No more phone tag or messy DMs. Clients can book online 24/7, select their preferred barber, and manage their own appointments.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Integrated service menus with intelligent durations</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Mobile-optimized for bookings on the go</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Automatic timezone and business hour enforcement</li>
            </ul>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-glass)', border: '1px solid var(--border)' }}>
              <Image src="/booking_mobile_mockup.png" alt="Mobile Booking" width={350} height={700} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>

        {/* Feature Block 2: Payments (Business Model) */}
        <div style={{ display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', gap: '64px', alignItems: 'center', marginBottom: '120px' }}>
          <div style={{ flex: '1 1 400px' }}>
            <CreditCard size={40} color="var(--primary)" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>Zero subscriptions. We only grow when you grow.</h2>
            <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Stop paying hundreds of dollars a month just to use a calendar. TrimSpace is free to use. We only charge a small processing fee when you accept payments or secure bookings through the platform. 
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Completely free appointment scheduling</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Secure integrated payments to reduce no-shows</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Automated tipping and fast payouts</li>
            </ul>
          </div>
          <div style={{ flex: '1 1 400px', backgroundColor: 'var(--card-bg)', borderRadius: '24px', padding: '48px', border: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--foreground)' }}>$0<span style={{ fontSize: '1.5rem', color: '#64748b' }}>/mo</span></div>
            <p style={{ color: '#64748b', fontWeight: 600, marginTop: '16px' }}>Unlimited Staff. Unlimited Bookings. Unlimited Potential.</p>
          </div>
        </div>

        {/* Feature Block 3: Marketing & Retention */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '64px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 400px' }}>
            <Megaphone size={40} color="var(--primary)" style={{ marginBottom: '24px' }} />
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '24px' }}>Marketing tools to keep chairs full.</h2>
            <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              Retain your best clients with automated marketing tools. Send blast campaigns, gift cards, and intelligent re-booking reminders when clients are due for their next cut.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Digital Gift Cards engine</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Automated "Time for a cut" reminders</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--foreground)', fontWeight: 600 }}><CheckCircle size={20} color="var(--primary)"/> Targeted email and SMS campaigns</li>
            </ul>
          </div>
          <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-glass)', border: '1px solid var(--border)', width: '100%' }}>
              <Image src="/marketing_mockup.png" alt="Marketing Campaign UI" width={600} height={400} style={{ display: 'block', width: '100%', height: 'auto' }} />
            </div>
          </div>
        </div>

      </section>

      {/* Call to Action */}
      <section style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)', padding: '100px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '24px' }}>Ready to build your empire?</h2>
        <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>Join the elite network of barbershops using TrimSpace to scale their operations and redefine the client experience.</p>
        <Link href="/register?type=business" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '16px 40px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 800, borderRadius: '8px', fontSize: '1.125rem', textDecoration: 'none' }}>
          Join TrimSpace Now
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
        <p>© 2026 TrimSpace Platform. Elevating the craft.</p>
      </footer>
    </div>
  );
}
