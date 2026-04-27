"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import styles from "../app/[slug]/page.module.css";
import { fetchPublicSlots, registerCustomer, validateGiftCard, createBookingTransaction, fetchBarbers } from "../app/[slug]/actions";
import { useSession, signIn } from "next-auth/react";
import { getTerminology } from "@/lib/terminology";
import SocialLoginButtons from "./SocialLoginButtons";
import { AU_SUBURBS } from "@/lib/constants";

export type Service = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
};

export default function BookingFlow({ 
  initialServices, 
  tenantSlug,
  category = 'BARBER',
  cancellationPolicy,
  bookingPolicy
}: { 
  initialServices: Service[], 
  tenantSlug: string,
  category?: string,
  cancellationPolicy?: string | null,
  bookingPolicy?: string | null
}) {
  const { data: session } = useSession();
  const terminology = getTerminology(category);
  const [stage, setStage] = useState<"PARTY_SIZE" | "SERVICES" | "CALENDAR" | "BARBERS" | "PAYMENT">("PARTY_SIZE");
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<{ id: string; name: string | null; avatarUrl?: string | null; services?: { id: string }[] }[]>([]);
  const [availableBarbersAtTime, setAvailableBarbersAtTime] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [agreedToPolicies, setAgreedToPolicies] = useState(false);
  const [partySize, setPartySize] = useState(1);
  const [currentPersonIndex, setCurrentPersonIndex] = useState(0);
  const [multiCart, setMultiCart] = useState<Record<number, { service: Service; quantity: number }[]>>({ 0: [] });
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", password: "", street: "", suburb: "", state: "" });
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  
  const matchingSubs = useMemo(() => {
    if (!regForm.suburb) return [];
    return AU_SUBURBS.filter(item => item.s.toLowerCase().includes(regForm.suburb.toLowerCase())).slice(0, 8);
  }, [regForm.suburb]);
  
  const [giftCode, setGiftCode] = useState("");
  const [appliedCard, setAppliedCard] = useState<{ id: string; balance: number } | null>(null);
  const [giftError, setGiftError] = useState("");
  const [isValidatingGift, setIsValidatingGift] = useState(false);
  
  const [isPending, startTransition] = useTransition();

  // Load barbers on mount
  useEffect(() => {
    fetchBarbers(tenantSlug).then((data) => setBarbers(data as any));
  }, [tenantSlug]);

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => setRegForm({ ...regForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  // STATE PERSISTENCE: Save/Restore for Social Login redirects
  useEffect(() => {
    // 1. Restore state on mount
    const saved = localStorage.getItem(`trim_booking_${tenantSlug}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.multiCart) setMultiCart(data.multiCart);
        if (data.targetDate) setTargetDate(data.targetDate);
        if (data.selectedTime) setSelectedTime(data.selectedTime);
        if (data.partySize) setPartySize(data.partySize);
        if (data.stage) setStage(data.stage);
        // Clear after restore to prevent "ghost" bookings later
        localStorage.removeItem(`trim_booking_${tenantSlug}`);
      } catch (e) {
        console.error("Failed to restore booking state", e);
      }
    }
  }, [tenantSlug]);

  const saveBookingState = () => {
    const data = { multiCart, targetDate, selectedTime, partySize, stage };
    localStorage.setItem(`trim_booking_${tenantSlug}`, JSON.stringify(data));
  };

  const getTomorrow = () => {
    const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
    const d = new Date(sydneyStr);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [targetDate, setTargetDate] = useState<string>(getTomorrow());
  const [slots, setSlots] = useState<{ time: string, finishTime: string }[]>([]);
  const [slotReason, setSlotReason] = useState<string | null>(null);

  const addToCart = useCallback((service: Service) => {
    setMultiCart((prev) => {
      const currentCart = prev[currentPersonIndex] || [];
      const existing = currentCart.find(item => item.service.id === service.id);
      
      let updatedCart;
      if (existing) {
        // Toggle OFF: If already selected, remove it
        updatedCart = currentCart.filter(item => item.service.id !== service.id);
      } else {
        // Toggle ON: Add to the selection list
        updatedCart = [...currentCart, { service, quantity: 1 }];
      }
      
      return { ...prev, [currentPersonIndex]: updatedCart };
    });
  }, [currentPersonIndex]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setMultiCart((prev) => {
      const currentCart = prev[currentPersonIndex] || [];
      const updatedCart = currentCart.map(item => item.service.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0);
      return { ...prev, [currentPersonIndex]: updatedCart };
    });
  }, [currentPersonIndex]);

  const allCartItems = useMemo(() => {
    return Object.entries(multiCart).flatMap(([pIdx, items]) => 
      items.map(item => ({ ...item, p: Number(pIdx) }))
    );
  }, [multiCart]);
  const currentCart = useMemo(() => multiCart[currentPersonIndex] || [], [multiCart, currentPersonIndex]);
  const currentCartIds = useMemo(() => new Set(currentCart.map(i => i.service.id)), [currentCart]);
  const totalPrice = useMemo(() => allCartItems.reduce((acc, i) => acc + (i.service.price * i.quantity), 0), [allCartItems]);

  const serviceGroups = useMemo(() => {
    return Object.values(multiCart).map(items => items.map(i => i.service.durationMinutes));
  }, [multiCart]);

  const maxDuration = useMemo(() => {
    const personDurations = serviceGroups.map(g => g.reduce((a, b) => a + b, 0));
    return Math.max(0, ...personDurations);
  }, [serviceGroups]);

  const format12h = useCallback((timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }, []);

  const nextPerson = useCallback(() => {
    if (currentPersonIndex < partySize - 1) {
      setCurrentPersonIndex(currentPersonIndex + 1);
      setMultiCart(prev => ({ ...prev, [currentPersonIndex + 1]: prev[currentPersonIndex + 1] || [] }));
    } else {
      moveToCalendar();
    }
  }, [currentPersonIndex, partySize]);

  const prevPerson = () => {
    if (currentPersonIndex > 0) {
      setCurrentPersonIndex(currentPersonIndex - 1);
    }
  };

  const moveToCalendar = async () => {
     setStage("CALENDAR");
     fetchSlots(targetDate);
  };

  const fetchSlots = async (dateStr: string) => {
      setTargetDate(dateStr);
      setSelectedTime(null);
      
      // Calculate qualified barbers for ALL selected services across ALL persons
      const allSelectedServiceIds = new Set(allCartItems.map(i => i.service.id));
      const qualifiedBarbers = barbers.filter(b => {
          const barberServiceIds = new Set(b.services?.map((s: any) => s.id) || []);
          return Array.from(allSelectedServiceIds).every(id => barberServiceIds.has(id));
      });

      // Explicitly extract durations
      const safeGroups = Object.keys(multiCart).map(key => {
        const items = multiCart[Number(key)] || [];
        return items.map(i => i.service.durationMinutes || 45);
      }).filter(g => g.length > 0);

      const result = await fetchPublicSlots(tenantSlug, dateStr, safeGroups.length > 0 ? safeGroups : [[45]], selectedBarberId || undefined);
      setSlots(result.availableSlots || []);
      setSlotReason(result.reason || null);
  };

  const handleTimeSelect = (timeStr: string) => {
      setSelectedTime(timeStr);
      const slot = slots.find(s => s.time === timeStr);
      if (slot && (slot as any).availableBarberIds) {
          setAvailableBarbersAtTime((slot as any).availableBarberIds);
      }
      setStage("BARBERS");
  };

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleApplyGiftCard = async () => {
    if (!giftCode) return;
    setIsValidatingGift(true);
    const result = await validateGiftCard(giftCode, tenantSlug);
    if (result.error) {
       setGiftError(result.error);
       setAppliedCard(null);
    } else {
       setAppliedCard({ id: result.cardId, balance: result.balance });
    }
    setIsValidatingGift(false);
  };

  const giftDiscount = appliedCard ? Math.min(totalPrice, appliedCard.balance) : 0;
  const finalPrice = totalPrice - giftDiscount;

  const handleInPlaceLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await signIn("credentials", { email: loginForm.email, password: loginForm.password, loginType: "CUSTOMER", redirect: false });
      if (result?.error) setLoginError("Invalid email or password.");
  };

  const handleFinalCheckout = () => {
    if (!selectedTime) return;
    setIsProcessingPayment(true);
    startTransition(async () => {
      try {
        let activeUserId = (session?.user as any)?.id;
        if (!activeUserId) {
          const regResult = await registerCustomer(regForm);
          if (regResult.error) { alert("Registration Failed: " + regResult.error); return; }
          activeUserId = regResult.userId;
        }

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            cart: allCartItems, 
            tenantSlug, 
            targetDate, 
            selectedTime, 
            userId: activeUserId, 
            giftCode: appliedCard ? giftCode : null,
            isGroup: partySize > 1,
            multiCart 
          })
        });

        const checkoutData = await response.json();
        if (checkoutData.error) throw new Error(checkoutData.error);
        if (checkoutData.bypassStripe) {
          const result = await createBookingTransaction(allCartItems.map(i => ({ serviceId: i.service.id, quantity: i.quantity, p: i.p })), tenantSlug, targetDate, selectedTime, "GIFT_CARD", activeUserId, partySize > 1, checkoutData.giftCardId, checkoutData.giftDiscount);
          if (result.success) {
            // Force a 1.2s delay to ensure the database has fully committed before we move to confirmation
            setTimeout(() => {
               window.location.href = "/booking-confirmation?bypass=true";
            }, 1200);
          }
          else throw new Error(result.error || "Failed to finalize booking.");
          return;
        }
        if (checkoutData.url) window.location.href = checkoutData.url;
        else throw new Error("Failed to initialize secure checkout session.");
      } catch (err: any) { alert("Payment Gateway Error: " + err.message); }
      finally { setIsProcessingPayment(false); }
    });
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'border-color 0.2s ease'
  };

  const bookBtnStyle: React.CSSProperties = {
    padding: '0.6rem 2rem',
    borderRadius: '50px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#1e293b',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
       {/* Visual Progress Steps */}
      <div style={{ 
        display: 'flex', 
        gap: '0.8rem', 
        padding: '0.8rem', 
        background: '#f8fafc', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
          {["Party", "Service", "Time", "Pro", "Pay"].map((s: string, i: number) => (
             <div key={s} style={{ 
                fontWeight: 800, 
                fontSize: '0.75rem', 
                color: (i === 0 && stage === 'PARTY_SIZE') || (i === 1 && stage === 'SERVICES') || (i === 2 && stage === 'CALENDAR') || (i === 3 && stage === 'BARBERS') || (i === 4 && stage === 'PAYMENT') ? 'var(--primary)' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
             }}>
                <span style={{ height: '18px', width: '18px', borderRadius: '50%', background: (i === 0 && stage === 'PARTY_SIZE') || (i === 1 && stage === 'SERVICES') || (i === 2 && stage === 'CALENDAR') || (i === 3 && stage === 'BARBERS') || (i === 4 && stage === 'PAYMENT') ? 'var(--primary)' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{i+1}</span>
                {s}
             </div>
          ))}
      </div>

      {stage === "PARTY_SIZE" && (
          <div style={{ background: '#fff', padding: 'clamp(1rem, 5vw, 3rem)', borderRadius: '32px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
             <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem' }}>Welcome</h2>
             <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: 500 }}>How many people are joining us?</p>
             
             <div style={{ display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button 
                    key={n}
                    onClick={() => {
                      setPartySize(n);
                      setIsGroupBooking(n > 1);
                      setStage("SERVICES");
                    }}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '16px', 
                      border: '2px solid #e2e8f0', 
                      background: '#fff', 
                      fontSize: '1.2rem', 
                      fontWeight: 900, 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = 'inherit'; }}
                  >
                    {n}
                  </button>
                ))}
             </div>
          </div>
      )}

      {stage === "BARBERS" && (
          <div style={{ background: '#fff', padding: 'clamp(1rem, 5vw, 3rem)', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Choose Your Professional</h2>
             <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Select a specific specialist or the first available.</p>
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '2.5rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.8rem', borderRadius: '12px', borderLeft: '4px solid #cbd5e1' }}>
                The requested professional is subject to availability and may be unavailable due to circumstances beyond our control.
              </p>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                <button 
                  onClick={() => { setSelectedBarberId(null); setStage("PAYMENT"); }}
                  style={{ 
                    padding: '1.5rem', 
                    background: '#fff', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '24px', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✨</div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>Any Specialist</div>
                </button>

                {barbers.filter(b => availableBarbersAtTime.includes(b.id)).map(b => (
                  <button 
                    key={b.id}
                    onClick={() => { setSelectedBarberId(b.id); setStage("PAYMENT"); }}
                    style={{ 
                      padding: '1.5rem', 
                      background: '#fff', 
                      border: '2px solid #e2e8f0', 
                      borderRadius: '24px', 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem', border: '2px solid #f1f5f9' }}>
                        <img src={b.avatarUrl || `https://ui-avatars.com/api/?name=${b.name || 'P'}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{b.name || 'Professional'}</div>
                  </button>
                ))}
             </div>

          </div>
      )}

      {stage === "SERVICES" && (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                  {partySize > 1 ? `Person ${currentPersonIndex + 1} Selection` : terminology.serviceLabelPlural}
                </h2>
                {partySize > 1 && (
                  <div style={{ 
                    marginTop: '0.8rem', 
                    background: 'rgba(99,102,241,0.08)', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '12px', 
                    borderLeft: '4px solid var(--primary)',
                    display: 'block'
                  }}>
                    <p style={{ color: 'var(--primary)', fontSize: '0.85rem', margin: 0, fontWeight: 800 }}>
                      Choose the service for connoisseur {currentPersonIndex + 1} of {partySize}
                    </p>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                <button 
                  onClick={() => setStage("PARTY_SIZE")}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change Party
                </button>
                <div style={{ padding: '0.4rem 1rem', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {partySize} {partySize === 1 ? 'Customer' : 'Customers'}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {initialServices.map((srv) => (
                <div key={srv.id} style={{ ...cardStyle, flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                   <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                           <div>
                              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{srv.name}</h4>
                              <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500, margin: '0.2rem 0' }}>{srv.durationMinutes} mins</p>
                           </div>
                           <p style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>${srv.price.toFixed(0)}</p>
                        </div>
                        {srv.description && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.6rem', lineHeight: 1.4 }}>{srv.description}</p>}
                   </div>
                   <div style={{ width: '100%', display: 'flex', justifyContent: 'stretch' }}>
                        {currentCartIds.has(srv.id) ? (
                            <button 
                                onClick={() => addToCart(srv)}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    background: 'var(--primary)', 
                                    borderRadius: '50px', 
                                    padding: '0.6rem 1.5rem',
                                    color: '#fff',
                                    fontWeight: 800,
                                    gap: '0.5rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                <span>Selected</span>
                                <span style={{ fontSize: '1.2rem' }}>✓</span>
                            </button>
                        ) : (
                            <button 
                             className="book-btn-hover"
                             style={bookBtnStyle} 
                             onClick={() => addToCart(srv)}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.background = '#000';
                                 e.currentTarget.style.color = '#fff';
                                 e.currentTarget.style.borderColor = '#000';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.background = '#fff';
                                 e.currentTarget.style.color = '#1e293b';
                                 e.currentTarget.style.borderColor = '#e2e8f0';
                             }}
                             >
                             Select
                            </button>
                        )}
                   </div>
                </div>
              ))}
              {initialServices.length === 0 && (
                <p style={{ color: '#64748b', padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px' }}>No services available for booking at this time.</p>
              )}
            </div>

            {currentCart.length > 0 && (
              <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'rgba(99,102,241,0.05)', borderRadius: '24px', border: '1px solid var(--primary)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', color: '#1e293b' }}>
                   Excellent choice! Ready to proceed?
                </p>
                <button 
                  onClick={nextPerson}
                  style={{ 
                    padding: '1.2rem 3rem', 
                    background: 'var(--primary)', 
                    color: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    fontWeight: 900, 
                    fontSize: '1.2rem', 
                    cursor: 'pointer',
                    boxShadow: '0 20px 40px -10px rgba(99,102,241,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {currentPersonIndex < partySize - 1 ? `Confirm & Add Person ${currentPersonIndex + 2}` : 'Confirm & Choose Time'}
                </button>
              </div>
            )}
        </>
      )}

      {stage === "CALENDAR" && (
          <div style={{ background: '#fff', padding: 'clamp(1rem, 5vw, 3rem)', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Select a Time</h2>
            <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Choose your preferred date to see available openings.</p>
            
            <input 
                type="date" 
                min={getTomorrow()}
                value={targetDate} 
                onChange={(e) => fetchSlots(e.target.value)} 
                style={{ width: '100%', padding: '1.2rem', marginBottom: '2.5rem', border: '2px solid #f1f5f9', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }} 
            />

            <div>
               {slotReason ? (
                   <div style={{ padding: '2rem', textAlign: 'center', background: '#fff1f2', color: '#be123c', borderRadius: '16px', border: '1px solid #fecdd3', margin: '1rem 0' }}>
                      {slotReason}
                   </div>
               ) : (
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '1rem' }}>
                      {slots.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', gridColumn: '1 / -1', padding: '3rem' }}>No slots available this date.</p>}
                      {slots.map((s: any) => (
                          <button 
                             key={s.time} 
                             onClick={() => handleTimeSelect(s.time)}
                             style={{ 
                                padding: '0.8rem 0.5rem', 
                                background: '#fff', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '16px', 
                                color: '#1e293b', 
                                fontWeight: 800, 
                                cursor: 'pointer', 
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px'
                             }}
                             onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                             onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                             >
                             <span style={{ fontSize: '0.95rem' }}>{s.time}</span>
                             <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>Ends {format12h(s.finishTime)}</span>
                          </button>
                      ))}
                   </div>
               )}
            </div>
            
            <button onClick={() => setStage("SERVICES")} style={{ marginTop: '3rem', width: '100%', padding: '1.2rem', background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>
                &laquo; Back to {terminology.serviceLabelPlural}
            </button>
          </div>
      )}

      {stage === "PAYMENT" && (
          <div style={{ 
            background: '#fff', 
            padding: 'clamp(1rem, 4vw, 3rem)', 
            borderRadius: 'clamp(16px, 5vw, 32px)', 
            border: '1px solid #e2e8f0',
            width: '100%',
            boxSizing: 'border-box'
          }}>
             {!session?.user ? (
               <div>
                  <button 
                    onClick={() => setStage("CALENDAR")}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginBottom: '1rem', padding: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    ← Back to Schedule
                  </button>
                  <h2 style={{ fontSize: 'min(2rem, 8vw)', fontWeight: 900, marginBottom: '2rem' }}>Check Out</h2>
                  {isLoginMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div onClick={saveBookingState} style={{ width: '100%' }}>
                                <SocialLoginButtons mode="in" compact={true} callbackUrl={typeof window !== 'undefined' ? window.location.href : '/'} />
                            </div>
                            
                            <form onSubmit={handleInPlaceLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <input required name="email" type="email" placeholder="Email Address" value={loginForm.email} onChange={handleLoginChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                                <input required name="password" type="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                                {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{loginError}</p>}
                                <button type="submit" style={{ width: '100%', padding: '1.2rem', background: '#000', color: '#fff', fontWeight: 900, border: 'none', borderRadius: '16px', cursor: 'pointer' }}>Sign In & Book</button>
                            </form>
                            
                            <button type="button" onClick={() => setIsLoginMode(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}>Create an account instead</button>
                        </div>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div onClick={saveBookingState} style={{ width: '100%' }}>
                            <SocialLoginButtons mode="up" compact={true} callbackUrl={typeof window !== 'undefined' ? window.location.href : '/'} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>FULL NAME</label>
                                <input name="name" required placeholder="John Doe" value={regForm.name} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>MOBILE NUMBER</label>
                                <input name="phone" required type="tel" placeholder="0400 000 000" value={regForm.phone} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>EMAIL ADDRESS</label>
                            <input name="email" required type="email" placeholder="john@example.com" value={regForm.email} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>STREET ADDRESS</label>
                            <input name="street" required placeholder="e.g. 123 Luxury Way" value={regForm.street} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>SUBURB</label>
                                <input 
                                    name="suburb" 
                                    required
                                    placeholder="Suburb" 
                                    value={regForm.suburb} 
                                    onChange={handleRegChange}
                                    onFocus={() => setShowSubDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowSubDropdown(false), 200)}
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} 
                                />
                                {showSubDropdown && matchingSubs.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 100, borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                        {matchingSubs.map(item => (
                                            <div 
                                                key={`${item.s}-${item.st}`}
                                                onClick={() => setRegForm({ ...regForm, suburb: item.s, state: item.st })}
                                                style={{ padding: '0.8rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}
                                            >
                                                {item.s}, {item.st}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>STATE</label>
                                <input name="state" required placeholder="State" value={regForm.state} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginLeft: '4px' }}>SECURE PASSWORD</label>
                            <input name="password" required type="password" placeholder="Min. 8 characters" value={regForm.password} onChange={handleRegChange} style={{ width: '100%', boxSizing: 'border-box', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.95rem' }} />
                        </div>
                        
                        <button type="button" onClick={() => setIsLoginMode(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem' }}>Already have an account? Log in</button>
                    </div>
                  )}
               </div>
             ) : (
              <div>
                  <button 
                    onClick={() => setStage("CALENDAR")}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginBottom: '1rem', padding: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    ← Back to Schedule
                  </button>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Confirm Booking</h2>
                  <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Review your selection and complete your booking securely.</p>
               </div>
             )}

             <div style={{ marginTop: '2.5rem', padding: 'clamp(1rem, 4vw, 2rem)', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1.5rem' }}>Order Summary</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                    {Object.keys(multiCart).map(key => {
                      const personIndex = Number(key);
                      const items = multiCart[personIndex];
                      if (!items || items.length === 0) return null;
                      return (
                        <div key={key} style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Connoisseur {personIndex + 1}
                          </p>
                          {items.map(item => (
                            <div key={item.service.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontWeight: 600 }}>{item.service.name} x{item.quantity}</span>
                              <span style={{ fontWeight: 800 }}>${(item.service.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                 </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontWeight: 700 }}>${totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Priority Booking Fee</span>
                  <span style={{ fontWeight: 700 }}>$0.50</span>
                </div>
                {giftDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600 }}>Gift Card Applied</span>
                    <span style={{ fontWeight: 700 }}>-${giftDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#0f172a' }}>Total (AUD)</span>
                  <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#6366f1' }}>${(finalPrice + 0.50).toFixed(2)}</span>
                </div>
                
                <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Professional</h4>
                 <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    {selectedBarberId ? barbers.find(b => b.id === selectedBarberId)?.name : "Any Specialist (First Available)"}
                 </p>

                 <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2.5rem' }}>Date & Time</h4>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{new Date(targetDate).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })} at {selectedTime}</p>
             </div>

              <div style={{ marginTop: '2.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '20px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>Policies & Terms</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#475569' }}>
                        <strong style={{ color: '#1e293b' }}>Booking Policy:</strong> {bookingPolicy || "A valid payment method is required to secure your booking."}
                    </div>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#475569' }}>
                        <strong style={{ color: '#1e293b' }}>Cancellation Policy:</strong> {cancellationPolicy || "Cancellations must be made at least 24 hours in advance."}
                    </div>
                </div>

                <label style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1.5rem', cursor: 'pointer', background: agreedToPolicies ? 'rgba(99,102,241,0.05)' : 'transparent', padding: '1rem', borderRadius: '12px', border: agreedToPolicies ? '1px solid #6366f1' : '1px solid transparent', transition: 'all 0.2s' }}>
                    <input 
                        type="checkbox" 
                        checked={agreedToPolicies} 
                        onChange={(e) => setAgreedToPolicies(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>I agree to the Booking and Cancellation policies.</span>
                </label>
              </div>

              <button 
                 onClick={handleFinalCheckout}
                 disabled={isPending || isProcessingPayment || !agreedToPolicies}
                 style={{ 
                     marginTop: '2.5rem', 
                     width: '100%', 
                     padding: '1.4rem', 
                     background: agreedToPolicies ? '#000' : '#cbd5e1', 
                     color: '#fff', 
                     border: 'none', 
                     borderRadius: '20px', 
                     fontWeight: 900, 
                     fontSize: '1.2rem', 
                     cursor: agreedToPolicies ? 'pointer' : 'not-allowed',
                     boxShadow: agreedToPolicies ? '0 20px 40px -10px rgba(0,0,0,0.3)' : 'none',
                     transition: 'all 0.3s ease'
                 }}>
                 {isProcessingPayment ? "Redirecting to Secure Checkout..." : "Confirm & Pay Online"}
              </button>
          </div>
      )}

      {/* Persistent Mini-Cart (Fresha Style) */}
       {allCartItems.length > 0 && stage !== 'PAYMENT' && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: '#000', color: '#fff', borderRadius: '24px', padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {partySize > 1 && (
                  <button onClick={prevPerson} disabled={currentPersonIndex === 0} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPersonIndex === 0 ? 'not-allowed' : 'pointer', fontSize: '1.2rem' }}>&lsaquo;</button>
                )}
                <div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>
                      {partySize > 1 ? `Person ${currentPersonIndex + 1} of ${partySize}` : `${allCartItems.length} services selected`}
                    </p>
                    <p style={{ fontSize: '1.3rem', fontWeight: 900 }}>Total: ${(finalPrice + 0.50).toFixed(2)} AUD</p>
                </div>
            </div>
            
            {stage === 'SERVICES' ? (
                <button 
                  onClick={nextPerson} 
                  disabled={currentCart.length === 0}
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: currentCart.length === 0 ? 'not-allowed' : 'pointer', opacity: currentCart.length === 0 ? 0.5 : 1 }}
                >
                  {currentPersonIndex < partySize - 1 ? 'Next Person' : 'Choose Time'}
                </button>
            ) : (
                <button onClick={() => setStage('PAYMENT')} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>Review & Pay</button>
            )}
        </div>
      )}
    </div>
  );
}
