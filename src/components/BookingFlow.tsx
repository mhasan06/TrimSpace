"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import styles from "../app/[slug]/page.module.css";
import { 
  fetchPublicSlots, 
  registerCustomer, 
  validateGiftCard, 
  createBookingTransaction, 
  fetchBarbers, 
  checkEmailExists 
} from "../app/[slug]/actions";
import { useSession, signIn } from "next-auth/react";
import { getTerminology } from "@/lib/terminology";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
};

const STORAGE_KEY = "barber_booking_state";

export default function BookingFlow({ 
  initialServices, 
  tenantSlug,
  category = 'BARBER',
  businessHours,
  address,
  tenantName,
  shopImage,
  rating = "5.0",
  reviewCount = "0",
  children
}: { 
  initialServices: Service[], 
  tenantSlug: string,
  category?: string,
  cancellationPolicy?: string | null,
  bookingPolicy?: string | null,
  businessHours: any[],
  address: string,
  tenantName: string,
  shopImage?: string | null,
  rating?: string,
  reviewCount?: string,
  children: React.ReactNode
}) {
  const { data: session } = useSession();
  const terminology = getTerminology(category);
  
  const [stage, setStage] = useState<"START" | "SERVICES" | "CALENDAR" | "BARBERS" | "PAYMENT">("START");
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [multiCart, setMultiCart] = useState<Record<number, { service: Service; quantity: number }[]>>({ 0: [] });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedBarberIds, setSelectedBarberIds] = useState<Record<number, string | null>>({ 0: null });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const getSydneyToday = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  };
  const [targetDate, setTargetDate] = useState<string>(getSydneyToday());
  
  const [authStep, setAuthStep] = useState<'EMAIL' | 'PASSWORD' | 'REGISTER'>('EMAIL');
  const [authEmail, setAuthEmail] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", password: "", street: "", suburb: "", state: "" });
  const [loginError, setLoginError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [barbers, setBarbers] = useState<any[]>([]);
  const [availableBarbersAtTime, setAvailableBarbersAtTime] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  // ─── LOCAL STORAGE PERSISTENCE ───
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.tenantSlug === tenantSlug) {
          setNumberOfPeople(data.numberOfPeople || 1);
          setMultiCart(data.multiCart || { 0: [] });
          setSelectedTime(data.selectedTime || null);
          setSelectedBarberIds(data.selectedBarberIds || { 0: null });
          setTargetDate(data.targetDate || getSydneyToday());
          if (data.selectedTime) setStage("BARBERS");
          else if (Object.values(data.multiCart || {}).some((arr: any) => arr.length > 0)) setStage("SERVICES");
        }
      } catch (e) {}
    }
  }, [tenantSlug]);

  useEffect(() => {
    const state = { tenantSlug, numberOfPeople, multiCart, selectedTime, selectedBarberIds, targetDate };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [numberOfPeople, multiCart, selectedTime, selectedBarberIds, targetDate, tenantSlug]);

  const allCartItems = useMemo(() => Object.entries(multiCart).flatMap(([pIdx, items]) => items.map(i => ({ ...i, p: Number(pIdx) }))), [multiCart]);
  const totalPrice = allCartItems.reduce((acc, i) => acc + (i.service.price * i.quantity), 0);

  useEffect(() => { fetchBarbers(tenantSlug).then((data) => setBarbers(data as any)); }, [tenantSlug]);

  const addToCart = (service: Service) => {
    setMultiCart(prev => {
      const cart = prev[currentPersonIndex] || [];
      const exists = cart.find(i => i.service.id === service.id);
      if (exists) return { ...prev, [currentPersonIndex]: cart.filter(i => i.service.id !== service.id) };
      return { ...prev, [currentPersonIndex]: [...cart, { service, quantity: 1 }] };
    });
  };

  const handleFetchSlots = async (dateStr: string) => {
    setTargetDate(dateStr);
    const safeGroups = Object.keys(multiCart).map(key => (multiCart[Number(key)] || []).map(i => i.service.id)).filter(g => g.length > 0);
    const result = await fetchPublicSlots(tenantSlug, dateStr, safeGroups, undefined);
    setSlots(result.availableSlots || []);
  };

  const nextStage = () => {
    if (stage === "START") { setStage("SERVICES"); setCurrentPersonIndex(0); }
    else if (stage === "SERVICES") {
      if (currentPersonIndex < numberOfPeople - 1) setCurrentPersonIndex(prev => prev + 1);
      else { setStage("CALENDAR"); handleFetchSlots(targetDate); }
    }
    else if (stage === "BARBERS") {
      if (currentPersonIndex < numberOfPeople - 1) setCurrentPersonIndex(prev => prev + 1);
      else { if (session) setStage("PAYMENT"); else setShowAuthModal(true); }
    }
  };

  const handleBarberSelect = (barberId: string | null) => {
    setSelectedBarberIds(prev => ({ ...prev, [currentPersonIndex]: barberId }));
    if (numberOfPeople === 1) { if (session) setStage("PAYMENT"); else setShowAuthModal(true); }
  };

  const handleCheckout = async () => {
    if (!disclaimerAccepted) return alert("Please accept the disclaimer before proceeding.");
    startTransition(async () => {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart: allCartItems, tenantSlug, targetDate, selectedTime, userId: (session?.user as any)?.id, multiCart, selectedBarberIds }) });
      const d = await res.json();
      if (d.url) { localStorage.removeItem(STORAGE_KEY); window.location.href = d.url; }
    });
  };

  return (
    <>
    {showAuthModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
         <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '14px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Log in or sign up</h2>
            <p style={{ fontSize: '15px', color: '#000', marginBottom: '24px' }}>Log in or sign up to complete your booking</p>
            {authStep === 'EMAIL' && (
               <>
                <button onClick={() => signIn('facebook')} style={{ width: '100%', padding: '14px', borderRadius: '40px', border: '1px solid #e2e8f0', background: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 600 }}><img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" style={{ width: '24px' }} /> Continue with Facebook</button>
                <button onClick={() => signIn('google')} style={{ width: '100%', padding: '14px', borderRadius: '40px', border: '1px solid #e2e8f0', background: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 600 }}><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" style={{ width: '22px' }} /> Continue with Google</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div><span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>OR</span><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div></div>
                <form onSubmit={async (e) => { e.preventDefault(); const exists = await checkEmailExists(loginForm.email); setAuthEmail(loginForm.email); if (exists) setAuthStep('PASSWORD'); else { setRegForm(prev => ({ ...prev, email: loginForm.email })); setAuthStep('REGISTER'); } }}><input type="email" placeholder="Email address" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '24px' }} required /><button type="submit" style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 700 }}>Continue</button></form>
               </>
            )}
            {authStep === 'PASSWORD' && (
               <form onSubmit={async (e) => { e.preventDefault(); const result = await signIn("credentials", { email: loginForm.email, password: loginForm.password, loginType: "CUSTOMER", redirect: false }); if (result?.error) setLoginError("Invalid credentials"); else { setShowAuthModal(false); setStage("PAYMENT"); } }}><p style={{ fontWeight: 600, marginBottom: '16px' }}>Password for {loginForm.email}</p><input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '24px' }} required />{loginError && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{loginError}</p>}<button type="submit" style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 700 }}>Login</button></form>
            )}
            {authStep === 'REGISTER' && (
               <form onSubmit={async (e) => { e.preventDefault(); const result = await registerCustomer({ ...regForm, email: authEmail }); if (result.error) setLoginError(result.error); else { setShowAuthModal(false); setStage("PAYMENT"); } }}><div style={{ display: 'grid', gap: '12px' }}><input type="text" placeholder="Full Name" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }} required /><input type="tel" placeholder="Phone Number" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }} required /><input type="password" placeholder="Create Password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }} required /><button type="submit" style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 700, marginTop: '12px' }}>Create Account</button></div></form>
            )}
         </div>
      </div>
    )}

    {stage === "START" && (
      <>
        <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}><h1 style={{ fontSize: '2.4rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-1.5px', margin: 0 }}>{tenantName} <span style={{ color: '#6366f1', fontSize: '1.2rem', verticalAlign: 'middle' }}>✓</span></h1><button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>🔗</button></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: '#64748b' }}><span style={{ fontWeight: 800, color: '#0f172a' }}>{rating}</span><span>{"★".repeat(5)}</span><span>({reviewCount})</span><span>•</span><span style={{ color: '#ef4444', fontWeight: 700 }}>Closed</span><span>•</span><span>{address}</span></div>
        </header>
        <section style={{ marginBottom: '3rem', borderRadius: '24px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', height: '400px' }}><div style={{ background: `url(${shopImage || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div><div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px' }}><div style={{ background: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div><div style={{ background: `url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div></div></section>
      </>
    )}

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        {stage === "START" && (<><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem', background: '#fff', borderRadius: '48px', border: '1px solid #f1f5f9', boxShadow: '0 20px 60px rgba(0,0,0,0.02)', textAlign: 'center', marginBottom: '4rem' }}><h1 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '1rem', color: '#0f172a' }}>Welcome</h1><p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600, marginBottom: '3rem' }}>How many people are joining us?</p><div style={{ display: 'flex', gap: '16px', marginBottom: '4rem' }}>{[1, 2, 3, 4, 5].map(num => (<button key={num} onClick={() => setNumberOfPeople(num)} style={{ width: '72px', height: '72px', borderRadius: '20px', border: numberOfPeople === num ? '2px solid #000' : '1px solid #e2e8f0', background: numberOfPeople === num ? '#f8fafc' : '#fff', color: '#000', fontWeight: 900, fontSize: '1.5rem', cursor: 'pointer' }}>{num}</button>))}</div><button onClick={() => setStage("SERVICES")} style={{ padding: '1.2rem 4rem', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' }}>Continue</button></div>{children}</>)}
        {stage === "SERVICES" && (<div style={{ padding: '2rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9' }}><button onClick={() => setStage("START")} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button><h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '2rem' }}>Select {terminology.serviceLabelPlural}</h2>{numberOfPeople > 1 && (<div style={{ display: 'flex', gap: '10px', marginBottom: '2.5rem', background: '#f8fafc', padding: '6px', borderRadius: '14px' }}>{Array.from({ length: numberOfPeople }).map((_, i) => (<button key={i} onClick={() => setCurrentPersonIndex(i)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: currentPersonIndex === i ? '#fff' : 'transparent', fontWeight: 800, color: currentPersonIndex === i ? '#000' : '#64748b', cursor: 'pointer' }}>Person {i + 1}</button>))}</div>)}<div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>{initialServices.map(service => { const isSelected = (multiCart[currentPersonIndex] || []).some(i => i.service.id === service.id); return (<div key={service.id} onClick={() => addToCart(service)} style={{ padding: '24px', background: '#fff', borderRadius: '18px', border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ flex: 1 }}><h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800 }}>{service.name}</h3><p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b' }}>{service.durationMinutes} mins</p><p style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>A${service.price}</p></div><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#6366f1' : '#fff', border: isSelected ? 'none' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{isSelected ? '✓' : '+'}</div></div>); })}</div></div>)}
        {stage === "CALENDAR" && (<div style={{ padding: '2rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}><button onClick={() => setStage("SERVICES")} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button><input type="date" value={targetDate} onChange={(e) => handleFetchSlots(e.target.value)} style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontWeight: 700 }} /></div><h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Select Date & Time</h2><div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '2rem', paddingBottom: '10px' }}>{[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => { const date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' })); date.setDate(date.getDate() + i); const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); return (<button key={i} onClick={() => handleFetchSlots(dStr)} style={{ padding: '0.8rem', minWidth: '70px', borderRadius: '14px', border: targetDate === dStr ? '2px solid #000' : '1px solid #e2e8f0', background: targetDate === dStr ? '#f8fafc' : '#fff', cursor: 'pointer' }}><p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700 }}>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</p><p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 950 }}>{date.getDate()}</p></button>); })}</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>{slots.length > 0 ? slots.map(slot => (<button key={slot.time} onClick={() => { setSelectedTime(slot.time); setAvailableBarbersAtTime(slot.availableBarberIds || []); setStage("BARBERS"); setCurrentPersonIndex(0); }} style={{ padding: '12px 8px', borderRadius: '12px', border: selectedTime === slot.time ? '2px solid #000' : '1px solid #e2e8f0', background: selectedTime === slot.time ? '#000' : '#fff', color: selectedTime === slot.time ? '#fff' : '#0f172a', fontWeight: 800, cursor: 'pointer' }}>{slot.time}</button>)) : (<div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: '#64748b' }}>No slots available.</div>)}</div></div>)}
        {stage === "BARBERS" && (<div style={{ padding: '2rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9' }}><button onClick={() => setStage("CALENDAR")} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button><h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Choose Professional</h2>{numberOfPeople > 1 && (<div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', background: '#f8fafc', padding: '6px', borderRadius: '14px' }}>{Array.from({ length: numberOfPeople }).map((_, i) => (<button key={i} onClick={() => setCurrentPersonIndex(i)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentPersonIndex === i ? '#fff' : 'transparent', fontWeight: 800, color: currentPersonIndex === i ? '#000' : '#64748b', cursor: 'pointer' }}>Person {i + 1}</button>))}</div>)}<div style={{ display: 'grid', gap: '15px' }}><div onClick={() => handleBarberSelect(null)} style={{ padding: '20px', border: selectedBarberIds[currentPersonIndex] === null ? '2px solid #000' : '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div><p style={{ fontWeight: 800, margin: 0 }}>Any Professional</p></div>{barbers.filter(b => availableBarbersAtTime.includes(b.id)).map(barber => (<div key={barber.id} onClick={() => handleBarberSelect(barber.id)} style={{ padding: '20px', border: selectedBarberIds[currentPersonIndex] === barber.id ? '2px solid #000' : '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}><div style={{ width: '50px', height: '50px', borderRadius: '50%', background: `url(${barber.avatarUrl || 'https://ui-avatars.com/api/?name='+barber.name})`, backgroundSize: 'cover' }}></div><p style={{ fontWeight: 800, margin: 0 }}>{barber.name}</p></div>))}</div></div>)}
        {stage === "PAYMENT" && (<div style={{ padding: '2rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9' }}><button onClick={() => { setStage("BARBERS"); setCurrentPersonIndex(numberOfPeople - 1); }} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button><h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '2rem' }}>Final Confirmation</h2><div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', marginBottom: '2.5rem' }}><p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>Booking for <strong style={{ color: '#0f172a' }}>{session?.user?.email}</strong></p><div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '1.5rem', padding: '1.2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}><input type="checkbox" id="disclaimer" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '3px' }} /><label htmlFor="disclaimer" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer', lineHeight: '1.5' }}>I agree to the <Link href="#" style={{ color: '#6366f1', fontWeight: 700 }}>cancellation policy</Link> and understand that bookings are non-refundable within 24 hours of the appointment time.</label></div></div><button onClick={handleCheckout} disabled={isPending || !disclaimerAccepted} style={{ width: '100%', padding: '1.4rem', borderRadius: '50px', background: disclaimerAccepted ? '#6366f1' : '#cbd5e1', color: '#fff', fontWeight: 950, fontSize: '1.2rem', cursor: disclaimerAccepted ? 'pointer' : 'not-allowed', boxShadow: disclaimerAccepted ? '0 12px 40px rgba(99,102,241,0.3)' : 'none' }}>{isPending ? "Initializing Checkout..." : "Confirm & Pay"}</button></div>)}
      </div>

      <aside style={{ position: 'sticky', top: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          {totalPrice === 0 ? (<><h3>Location & Hours</h3><div style={{ height: '200px', borderRadius: '18px', overflow: 'hidden' }}><iframe src={`https://www.google.com/maps?q=${encodeURIComponent(address || "Australia")}&output=embed`} width="100%" height="100%" style={{ border: 0 }}></iframe></div><p>{address}</p></>) : (
            <><div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}><div style={{ width: '60px', height: '60px', borderRadius: '14px', overflow: 'hidden' }}><img src={shopImage || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div><div><h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 900 }}>{tenantName}</h3><p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 800 }}>⭐ {rating} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({reviewCount})</span></p></div></div><div style={{ borderTop: '1px solid #f1f5f9', padding: '24px 0', maxHeight: '400px', overflowY: 'auto' }}>{Object.entries(multiCart).map(([pIdx, items]) => items.length > 0 && (<div key={pIdx} style={{ marginBottom: '20px' }}><p style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: '#6366f1', marginBottom: '10px' }}>Person {Number(pIdx) + 1}</p>{items.map((item, idx) => (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.service.name}</span><span style={{ fontSize: '0.9rem', fontWeight: 800 }}>A${item.service.price}</span></div>))}{selectedBarberIds[Number(pIdx)] && (<p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>With {barbers.find(b => b.id === selectedBarberIds[Number(pIdx)])?.name}</p>)}</div>))}</div><div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}><span style={{ fontSize: '1.1rem', fontWeight: 900 }}>Subtotal</span><span style={{ fontSize: '1.25rem', fontWeight: 950 }}>A${totalPrice}</span></div>
              {stage !== "PAYMENT" && (
                <button onClick={nextStage} style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' }}>
                  {stage === "START" ? "Select Services" : stage === "SERVICES" ? (currentPersonIndex < numberOfPeople - 1 ? "Next Person" : "Confirm Services") : stage === "CALENDAR" ? "Confirm Time" : stage === "BARBERS" ? (currentPersonIndex < numberOfPeople - 1 ? "Next Professional" : "Confirm Professionals") : "Book Now"}
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
    </>
  );
}
