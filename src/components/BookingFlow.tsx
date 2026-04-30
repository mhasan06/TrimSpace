"use client";
// Force recompile - snapshot model integrated

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
import { calculateServiceFees, formatPrice } from "@/lib/pricing";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
};

const STORAGE_KEY = "barber_booking_state";

interface BookingFlowProps {
  initialServices: Service[];
  tenantSlug: string;
  category?: string;
  cancellationPolicy?: string | null;
  bookingPolicy?: string | null;
  businessHours: any[];
  platformSettings?: any;
  feeSchedules?: any[];
  address: string;
  tenantName: string;
  shopImage?: string | null;
  rating?: string;
  reviewCount?: string;
  children?: React.ReactNode;
}

export default function BookingFlow({ 
  initialServices, 
  tenantSlug,
  category = 'BARBER',
  businessHours,
  platformSettings,
  feeSchedules,
  address,
  tenantName,
  shopImage,
  rating = "5.0",
  reviewCount = "0",
  cancellationPolicy,
  bookingPolicy,
  children
}: BookingFlowProps) {
  const { data: session } = useSession();
  const terminology = getTerminology(category);

  // Helper to resolve fee for a specific date in the UI
  const getDynamicFeeForDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    // 1. Check Schedules
    if (feeSchedules && feeSchedules.length > 0) {
      const activeSchedule = [...feeSchedules].reverse().find(s => new Date(s.effectiveFrom) <= date);
      if (activeSchedule) return Number(activeSchedule.feePercentage);
    }
    // 2. Check Cutover from DB
    if (platformSettings?.defaultFeeEffectiveFrom && date < new Date(platformSettings.defaultFeeEffectiveFrom)) {
      return 0.017; // Legacy Fallback
    }
    // 3. Global Default from DB
    return platformSettings?.defaultPlatformFee ?? 0.017;
  }, [feeSchedules, platformSettings]);
  
  const [stage, setStage] = useState<"START" | "SERVICES" | "CALENDAR" | "BARBERS" | "PAYMENT">("START");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
  
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [multiCart, setMultiCart] = useState<Record<number, { service: Service; quantity: number }[]>>({ 0: [] });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedBarberIds, setSelectedBarberIds] = useState<Record<number, string | null>>({ 0: null });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const getSydneyToday = () => {
    const now = new Date();
    const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    // If it's 3pm or later (15:00), default to tomorrow
    if (sydneyTime.getHours() >= 15) {
      sydneyTime.setDate(sydneyTime.getDate() + 1);
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(sydneyTime);
  };
  const [targetDate, setTargetDate] = useState<string>(getSydneyToday());
  
  const [authStep, setAuthStep] = useState<'EMAIL' | 'PASSWORD' | 'REGISTER' | 'VERIFY'>('EMAIL');
  const [authEmail, setAuthEmail] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", phoneCode: "+61", password: "", street: "", suburb: "", state: "", verifyCode: "" });
  const [loginError, setLoginError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [barbers, setBarbers] = useState<any[]>([]);
  const [availableBarbersAtTime, setAvailableBarbersAtTime] = useState<string[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
  const totalPrice = allCartItems.reduce((acc, i) => {
    const feeScale = getDynamicFeeForDate(targetDate);
    const { totalCustomerPrice } = calculateServiceFees(Number(i.service.price), feeScale);
    return acc + (totalCustomerPrice * i.quantity);
  }, 0);

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

  const resetBooking = () => {
    if (window.confirm("Are you sure you want to cancel your booking? All progress will be lost.")) {
      localStorage.removeItem(STORAGE_KEY);
      setStage("START");
      setNumberOfPeople(1);
      setCurrentPersonIndex(0);
      setMultiCart({ 0: [] });
      setSelectedTime(null);
      setSelectedBarberIds({ 0: null });
      setTargetDate(getSydneyToday());
    }
  };

  const handleBarberSelect = (barberId: string | null) => {
    setSelectedBarberIds(prev => ({ ...prev, [currentPersonIndex]: barberId }));
    if (numberOfPeople === 1 || currentPersonIndex === numberOfPeople - 1) { 
      if (session) setStage("PAYMENT"); 
      else setShowAuthModal(true); 
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    startTransition(async () => {
       const res = await fetch("/api/auth/verify", { 
         method: "POST", 
         headers: { "Content-Type": "application/json" }, 
         body: JSON.stringify({ email: authEmail, code: regForm.verifyCode }) 
       });
       const d = await res.json();
       if (d.success) {
          // Auto login after verification
          await signIn("credentials", { email: authEmail, password: regForm.password, loginType: "CUSTOMER", redirect: false });
          setShowAuthModal(false);
          setStage("PAYMENT");
       } else {
          setLoginError(d.error || "Invalid verification code.");
       }
    });
  };

  const [showPolicyModal, setShowPolicyModal] = useState(false);

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
    {showPolicyModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
        <div style={{ background: '#fff', width: '100%', maxWidth: '500px', maxHeight: '90vh', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setShowPolicyModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.2rem', letterSpacing: '-0.5px', flexShrink: 0 }}>Cancellation Policy</h2>
          
          <div style={{ 
            lineHeight: 1.6, 
            color: '#475569', 
            fontSize: '0.9rem', 
            whiteSpace: 'pre-wrap', 
            overflowY: 'auto', 
            paddingRight: '10px',
            marginBottom: '1rem',
            flex: 1
          }}>
            {cancellationPolicy || "No specific cancellation policy has been defined for this platform."}
          </div>
          
          <button onClick={() => setShowPolicyModal(false)} style={{ width: '100%', padding: '16px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>I Understand</button>
        </div>
      </div>
    )}
    {showAuthModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
         <div style={{ background: '#fff', width: '100%', maxWidth: '500px', maxHeight: '90vh', borderRadius: '24px', padding: '32px', position: 'relative', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>×</button>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Log in or sign up</h2>
            <p style={{ fontSize: '15px', color: '#000', marginBottom: '24px' }}>Log in or sign up to complete your booking</p>
            {authStep === 'EMAIL' && (
               <>
                 <button 
                   onClick={() => signIn('facebook')} 
                   style={{ 
                     width: '100%', 
                     padding: '16px', 
                     borderRadius: '12px', 
                     border: '1px solid #e2e8f0', 
                     background: '#fff', 
                     color: '#0f172a', 
                     marginBottom: '12px', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     gap: '12px', 
                     fontWeight: 700,
                     fontSize: '15px',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                   }}
                   onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                 >
                   <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" style={{ width: '22px' }} /> 
                   Continue with Facebook
                 </button>

                 <button 
                   onClick={() => signIn('google')} 
                   style={{ 
                     width: '100%', 
                     padding: '16px', 
                     borderRadius: '12px', 
                     border: '1px solid #e2e8f0', 
                     background: '#fff', 
                     color: '#0f172a', 
                     marginBottom: '24px', 
                     display: 'flex', 
                     alignItems: 'center', 
                     justifyContent: 'center', 
                     gap: '12px', 
                     fontWeight: 700,
                     fontSize: '15px',
                     cursor: 'pointer',
                     transition: 'all 0.2s ease',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                   }}
                   onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
                 >
                   <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" style={{ width: '18px' }} /> 
                   Continue with Google
                 </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div><span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>OR</span><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div></div>
                <form onSubmit={async (e) => { e.preventDefault(); const exists = await checkEmailExists(loginForm.email); setAuthEmail(loginForm.email); if (exists) setAuthStep('PASSWORD'); else { setRegForm(prev => ({ ...prev, email: loginForm.email })); setAuthStep('REGISTER'); } }}><input type="email" placeholder="Email address" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '24px' }} required /><button type="submit" style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 700 }}>Continue</button></form>
               </>
            )}
            {authStep === 'PASSWORD' && (
               <form onSubmit={async (e) => { e.preventDefault(); const result = await signIn("credentials", { email: loginForm.email, password: loginForm.password, loginType: "CUSTOMER", redirect: false }); if (result?.error) setLoginError("Invalid credentials"); else { setShowAuthModal(false); setStage("PAYMENT"); } }}><p style={{ fontWeight: 600, marginBottom: '16px' }}>Password for {loginForm.email}</p><input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '24px' }} required />{loginError && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '12px' }}>{loginError}</p>}<button type="submit" style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 700 }}>Login</button></form>
            )}
            {authStep === 'REGISTER' && (
               <form onSubmit={async (e) => { 
                 e.preventDefault(); 
                 const result = await registerCustomer({ ...regForm, email: authEmail, phone: regForm.phoneCode + regForm.phone }); 
                 if (result.error) setLoginError(result.error); 
                 else setAuthStep('VERIFY'); 
               }}>
                 <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: '#0f172a' }}>Full Name</label>
                      <input type="text" placeholder="John Doe" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px' }} required />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: '#0f172a' }}>Mobile Number</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <select value={regForm.phoneCode} onChange={(e) => setRegForm({ ...regForm, phoneCode: e.target.value })} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700 }}>
                          <option value="+61">+61 🇦🇺</option>
                          <option value="+64">+64 🇳🇿</option>
                          <option value="+44">+44 🇬🇧</option>
                          <option value="+1">+1 🇺🇸</option>
                        </select>
                        <input type="tel" placeholder="0400 000 000" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px' }} required />
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px', color: '#0f172a' }}>Your Primary Location</label>
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Street Address</label>
                          <input type="text" placeholder="e.g. 123 Luxury Way" value={regForm.street} onChange={(e) => setRegForm({ ...regForm, street: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Suburb</label>
                            <input type="text" placeholder="Suburb" value={regForm.suburb} onChange={(e) => setRegForm({ ...regForm, suburb: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} required />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>State</label>
                            <input 
                              type="text" 
                              placeholder="State" 
                              name="reg_state"
                              id="reg_state"
                              autoComplete="address-level1"
                              value={regForm.state} 
                              onChange={(e) => setRegForm({ ...regForm, state: e.target.value })} 
                              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff' }} 
                              required 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: '#0f172a' }}>Work Email</label>
                      <input type="email" value={authEmail} disabled style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#eff6ff', color: '#000', fontWeight: 600 }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', color: '#0f172a' }}>Secure Password</label>
                      <input type="password" placeholder="••••••••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#eff6ff' }} required />
                    </div>

                    {loginError && <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', margin: 0 }}>{loginError}</p>}
                    <button type="submit" style={{ width: '100%', padding: '20px', borderRadius: '14px', background: '#000', color: '#fff', fontWeight: 900, fontSize: '18px', marginTop: '10px', cursor: 'pointer' }}>Join the Community</button>
                 </div>
               </form>
            )}
            {authStep === 'VERIFY' && (
               <form onSubmit={handleVerifyCode}>
                 <div style={{ textAlign: 'center', padding: '10px 0' }}>
                   <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px' }}>📧</div>
                   <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Check your email</h3>
                   <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: '1.5' }}>We've sent a 6-digit verification code to<br/><strong style={{ color: '#0f172a' }}>{authEmail}</strong></p>
                   
                   <input 
                     type="text" 
                     maxLength={6} 
                     placeholder="0 0 0 0 0 0" 
                     value={regForm.verifyCode} 
                     onChange={(e) => setRegForm({ ...regForm, verifyCode: e.target.value.replace(/\D/g, '') })} 
                     style={{ width: '100%', padding: '20px', borderRadius: '12px', border: '2px solid #000', fontSize: '32px', textAlign: 'center', letterSpacing: '8px', fontWeight: 900, marginBottom: '24px' }} 
                     required 
                   />
                   
                   {loginError && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '20px' }}>{loginError}</p>}
                   
                   <button type="submit" disabled={isPending} style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 900, fontSize: '16px', cursor: 'pointer' }}>
                     {isPending ? 'Verifying...' : 'Verify & Continue'}
                   </button>
                   
                   <button type="button" onClick={() => setAuthStep('REGISTER')} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, marginTop: '24px', cursor: 'pointer' }}>Back to registration</button>
                 </div>
               </form>
            )}
         </div>
      </div>
    )}

    {stage === "START" && (
      <>
        <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}><h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 950, color: '#0f172a', letterSpacing: '-1.5px', margin: 0 }}>{tenantName} <span style={{ color: '#6366f1', fontSize: '1.2rem', verticalAlign: 'middle' }}>✓</span></h1><button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>🔗</button></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', fontSize: '0.95rem', color: '#64748b' }}><span style={{ fontWeight: 800, color: '#0f172a' }}>{rating}</span><span>{"★".repeat(5)}</span><span>({reviewCount})</span><span>•</span><span style={{ color: '#ef4444', fontWeight: 700 }}>Closed</span><span>•</span><span>{address}</span></div>
        </header>
        <section className={styles.galleryGrid} style={{ marginBottom: '3rem', borderRadius: '24px', overflow: 'hidden' }}>
          <div className={styles.mainImage} style={{ background: `url(${shopImage || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div className={styles.sideGallery} style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            <div style={{ background: `url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          </div>
        </section>
      </>
    )}

    <div className={styles.mainLayout} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', minWidth: 0 }}>
        {stage !== "START" && (
          <button 
            onClick={resetBooking} 
            style={{ 
              position: 'absolute', 
              top: '-15px', 
              right: '-15px', 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer', 
              zIndex: 100, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px', 
              fontWeight: 900,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
            }}
            title="Cancel Booking"
          >
            ×
          </button>
        )}
        {stage === "START" && (<><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '2rem 1.5rem' : '6rem 2rem', background: '#fff', borderRadius: '48px', border: '1px solid #f1f5f9', boxShadow: '0 20px 60px rgba(0,0,0,0.02)', textAlign: 'center', marginBottom: '4rem' }}><h1 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 950, marginBottom: '0.8rem', color: '#0f172a' }}>Start Your Booking</h1><p style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#64748b', fontWeight: 600, marginBottom: isMobile ? '2rem' : '3rem' }}>How many people are joining us?</p><div style={{ display: 'flex', gap: isMobile ? '10px' : '16px', marginBottom: isMobile ? '2.5rem' : '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>{[1, 2, 3, 4, 5].map(num => (<button key={num} onClick={() => setNumberOfPeople(num)} style={{ width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: isMobile ? '16px' : '20px', border: numberOfPeople === num ? '2px solid #000' : '1px solid #e2e8f0', background: numberOfPeople === num ? '#f8fafc' : '#fff', color: '#000', fontWeight: 900, fontSize: isMobile ? '1.2rem' : '1.5rem', cursor: 'pointer' }}>{num}</button>))}</div><button onClick={() => setStage("SERVICES")} style={{ padding: isMobile ? '1rem 3rem' : '1.2rem 4rem', borderRadius: '50px', background: '#000', color: '#fff', fontWeight: 900, fontSize: isMobile ? '1rem' : '1.1rem', cursor: 'pointer' }}>Continue</button></div>{children}</>)}
        {stage === "SERVICES" && (
          <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'visible' }}>
            <div style={{ 
              WebkitPosition: '-webkit-sticky',
              position: 'sticky', 
              top: 0, 
              background: '#fff', 
              zIndex: 1100, 
              padding: '2rem 2rem 1.2rem 2rem',
              borderBottom: '2px solid #f1f5f9',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              borderRadius: '32px 32px 0 0'
            }}>
              <button onClick={() => setStage("START")} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button>
              <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 900, marginBottom: '1rem', margin: 0 }}>Select {terminology.serviceLabelPlural}</h2>
              {numberOfPeople > 1 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', background: '#f8fafc', padding: '6px', borderRadius: '14px' }}>
                  {Array.from({ length: numberOfPeople }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentPersonIndex(i)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: currentPersonIndex === i ? '#fff' : 'transparent', fontWeight: 800, color: currentPersonIndex === i ? '#000' : '#64748b', cursor: 'pointer' }}>
                      Person {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {initialServices.map(service => {
                  const isSelected = (multiCart[currentPersonIndex] || []).some(i => i.service.id === service.id);
                  const feeScale = getDynamicFeeForDate(targetDate);
                  const { totalCustomerPrice } = calculateServiceFees(Number(service.price), feeScale);
                  return (
                    <div key={service.id} onClick={() => addToCart(service)} style={{ padding: '24px', background: '#fff', borderRadius: '18px', border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800 }}>{service.name}</h3>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b' }}>{service.durationMinutes} mins</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>{formatPrice(totalCustomerPrice)}</p>
                      </div>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#6366f1' : '#fff', border: isSelected ? 'none' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        {isSelected ? '✓' : '+'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                marginTop: '32px', 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '16px',
                border: '1px solid #f1f5f9'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                  Prices include secure payment processing and platform service fees.
                </p>
              </div>
            </div>
          </div>
        )}
        {stage === "CALENDAR" && (
          <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'visible' }}>
            <div style={{ 
              WebkitPosition: '-webkit-sticky',
              position: 'sticky', 
              top: 0, 
              background: '#fff', 
              zIndex: 1100, 
              padding: '2.5rem 2.5rem 1.5rem 2.5rem',
              borderBottom: '2px solid #f1f5f9',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              borderRadius: '32px 32px 0 0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <button onClick={() => setStage("SERVICES")} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>← Back</button>
                <input type="date" value={targetDate} onChange={(e) => handleFetchSlots(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none' }} />
              </div>
              
              <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 950, marginBottom: '2rem', letterSpacing: '-1px', margin: 0 }}>Select Date & Time</h2>
              
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginTop: '1.5rem', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                {(() => {
                  const now = new Date();
                  const sydneyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
                  const startOffset = sydneyNow.getHours() >= 15 ? 1 : 0;
                  
                  return [0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => {
                    const date = new Date(sydneyNow);
                    date.setDate(date.getDate() + i + startOffset);
                    const dStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
                    const isSelected = targetDate === dStr;
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleFetchSlots(dStr)} 
                        style={{ 
                          padding: '1rem', 
                          minWidth: '85px', 
                          borderRadius: '18px', 
                          border: isSelected ? '2px solid #000' : '1px solid #f1f5f9', 
                          background: isSelected ? '#000' : '#fff', 
                          color: isSelected ? '#fff' : '#0f172a',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, opacity: isSelected ? 0.8 : 0.6 }}>{date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 950 }}>{date.getDate()}</p>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            <div style={{ padding: '2.5rem' }}>
              {/* Time Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {slots.length > 0 ? slots.map(slot => (
                  <button 
                    key={slot.time} 
                    onClick={() => { setSelectedTime(slot.time); setAvailableBarbersAtTime(slot.availableBarberIds || []); setStage("BARBERS"); setCurrentPersonIndex(0); }} 
                    style={{ 
                      padding: '16px 8px', 
                      borderRadius: '14px', 
                      border: '1px solid #f1f5f9', 
                      background: '#fff', 
                      color: '#0f172a', 
                      fontWeight: 800, 
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#000'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {slot.time}
                  </button>
                )) : (
                  <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '24px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
                    <p style={{ color: '#64748b', fontWeight: 700, margin: 0 }}>No slots available for this date.</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Try selecting another day or checking back later.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {stage === "BARBERS" && (
          <div style={{ background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9', overflow: 'visible' }}>
            <div style={{ 
              WebkitPosition: '-webkit-sticky',
              position: 'sticky', 
              top: 0, 
              background: '#fff', 
              zIndex: 1100, 
              padding: '2rem 2rem 1.2rem 2rem',
              borderBottom: '2px solid #f1f5f9',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              borderRadius: '32px 32px 0 0'
            }}>
              <button onClick={() => setStage("CALENDAR")} style={{ marginBottom: '1.5rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button>
              <h2 style={{ fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: 900, marginBottom: '0.5rem', margin: 0 }}>Choose Professional</h2>
              {numberOfPeople > 1 && (<div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', background: '#f8fafc', padding: '6px', borderRadius: '14px' }}>{Array.from({ length: numberOfPeople }).map((_, i) => (<button key={i} onClick={() => setCurrentPersonIndex(i)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: currentPersonIndex === i ? '#fff' : 'transparent', fontWeight: 800, color: currentPersonIndex === i ? '#000' : '#64748b', cursor: 'pointer' }}>Person {i + 1}</button>))}</div>)}
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff9f0', padding: '12px 16px', borderRadius: '12px', border: '1px solid #ffedd5', marginBottom: '2rem' }}>
                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9a3412', fontWeight: 600, lineHeight: '1.4' }}>
                  Note: Your preferred professional may not be available due to unexpected circumstances.
                </p>
              </div>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                <div onClick={() => handleBarberSelect(null)} style={{ padding: '20px', border: selectedBarberIds[currentPersonIndex] === null ? '2px solid #000' : '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                  <p style={{ fontWeight: 800, margin: 0 }}>Any Professional</p>
                </div>
                {barbers.filter(b => availableBarbersAtTime.includes(b.id)).map(barber => (
                  <div key={barber.id} onClick={() => handleBarberSelect(barber.id)} style={{ padding: '20px', border: selectedBarberIds[currentPersonIndex] === barber.id ? '2px solid #000' : '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: `url(${barber.avatarUrl || 'https://ui-avatars.com/api/?name='+barber.name})`, backgroundSize: 'cover' }}></div>
                    <p style={{ fontWeight: 800, margin: 0 }}>{barber.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {stage === "PAYMENT" && (
          <div style={{ padding: '2rem', background: '#fff', borderRadius: '32px', border: '1px solid #f1f5f9' }}>
            <button onClick={() => { setStage("BARBERS"); setCurrentPersonIndex(numberOfPeople - 1); }} style={{ marginBottom: '2rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 800, cursor: 'pointer' }}>← Back</button>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '2rem' }}>Final Confirmation</h2>
            
            <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', marginBottom: '2.5rem' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>Booking for <strong style={{ color: '#0f172a' }}>{session?.user?.email}</strong></p>
              
              {/* Price Breakdown Component */}
              <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <button 
                  onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    cursor: 'pointer',
                    color: '#0f172a'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Price Details</span>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{showPriceBreakdown ? '−' : '+'}</span>
                </button>
                
                {showPriceBreakdown && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(() => {
                      const baseSubtotal = allCartItems.reduce((acc, i) => acc + (Number(i.service.price) * i.quantity), 0);
                      const totalFeesValue = totalPrice - baseSubtotal;
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
                            <span>Services</span>
                            <span>{formatPrice(baseSubtotal)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>
                            <span>Secure Processing & Platform Fees</span>
                            <span>{formatPrice(totalFeesValue)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 900, fontSize: '1.1rem', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                            <span>Total</span>
                            <span>{formatPrice(totalPrice)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '2.5rem', padding: '1.2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <input type="checkbox" id="disclaimer" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '3px' }} />
                <label htmlFor="disclaimer" style={{ fontSize: '0.9rem', color: '#475569', cursor: 'pointer', lineHeight: '1.5' }}>
                  I agree to the <span onClick={() => setShowPolicyModal(true)} style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'underline' }}>cancellation policy</span> and understand that bookings are non-refundable within 24 hours of the appointment time.
                </label>
              </div>
            </div>
            
            <button onClick={handleCheckout} disabled={isPending || !disclaimerAccepted} style={{ width: '100%', padding: '1.4rem', borderRadius: '50px', background: disclaimerAccepted ? '#6366f1' : '#cbd5e1', color: '#fff', fontWeight: 950, fontSize: '1.2rem', cursor: disclaimerAccepted ? 'pointer' : 'not-allowed', boxShadow: disclaimerAccepted ? '0 12px 40px rgba(99,102,241,0.3)' : 'none' }}>
              {isPending ? "Initializing Checkout..." : "Confirm & Pay"}
            </button>
          </div>
        )}
      </div>

      <aside style={{ position: 'sticky', top: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '28px', border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          {stage === "START" ? (
            <>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Location & Hours</h3>
              <div style={{ height: '200px', borderRadius: '18px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(address || "Australia")}&output=embed`} width="100%" height="100%" style={{ border: 0 }}></iframe>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '2rem', lineHeight: '1.5' }}>{address}</p>
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((dayName, idx) => {
                    const dayNum = (idx + 1) % 7;
                    const hours = (businessHours as any[]).find(h => h.dayOfWeek === dayNum);
                    return (
                        <div key={dayName} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx === 6 ? 'none' : '1px solid #f8fafc' }}>
                            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>{dayName}</span>
                            <span style={{ fontWeight: 800, color: hours ? '#0f172a' : '#ef4444', fontSize: '0.85rem' }}>
                                {hours ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                            </span>
                        </div>
                    );
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '18px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={shopImage || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>{tenantName}</h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#64748b', fontWeight: 600, lineHeight: '1.4' }}>{address}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>⭐ {rating} <span style={{ color: '#94a3b8', fontWeight: 600 }}>({reviewCount})</span></p>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '24px 0', maxHeight: '400px', overflowY: 'auto' }}>
                {totalPrice === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                    Select services to see your summary
                  </div>
                ) : (
                  Object.entries(multiCart).map(([pIdx, items]) => items.length > 0 && (
                    <div key={pIdx} style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: '#6366f1', marginBottom: '10px' }}>Person {Number(pIdx) + 1}</p>
                      {items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{item.service.name}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{item.service.durationMinutes} mins</p>
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{formatPrice(Number(item.service.price))}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>Subtotal</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 950 }}>{formatPrice(totalPrice)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.3 }}>
                  Prices include secure payment processing and platform service fees.
                </p>
              </div>

              {stage !== "PAYMENT" && (
                <button onClick={nextStage} style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#000', color: '#fff', border: 'none', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer' }}>
                  {stage === "SERVICES" ? (currentPersonIndex < numberOfPeople - 1 ? "Next Person" : "Confirm Services") : stage === "CALENDAR" ? "Confirm Time" : stage === "BARBERS" ? (currentPersonIndex < numberOfPeople - 1 ? "Next Professional" : "Confirm Professionals") : "Book Now"}
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
    
    {/* ─── MOBILE STICKY FOOTER (FRESHA STYLE) ─── */}
    {isMobile && stage !== "START" && stage !== "PAYMENT" && allCartItems.length > 0 && (
      <div style={{
        position: 'fixed',
        bottom: '60px',
        left: 0,
        right: 0,
        height: '85px',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 1001,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {allCartItems.length} {allCartItems.length === 1 ? terminology.serviceLabel : terminology.serviceLabelPlural}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.5px' }}>{formatPrice(totalPrice)}</p>
        </div>
        
        <button 
          onClick={nextStage}
          disabled={stage === "CALENDAR" && !selectedTime}
          style={{
            padding: '0.9rem 2.4rem',
            borderRadius: '12px',
            background: (stage === "CALENDAR" && !selectedTime) ? '#334155' : '#fff',
            color: (stage === "CALENDAR" && !selectedTime) ? '#94a3b8' : '#000',
            fontWeight: 900,
            fontSize: '1.1rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Continue
        </button>
      </div>
    )}
    </>
  );
}
