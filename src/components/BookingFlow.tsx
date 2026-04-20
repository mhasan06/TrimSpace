"use client";

import { useState, useTransition } from "react";
import styles from "../app/[slug]/page.module.css";
import { fetchPublicSlots, registerCustomer, validateGiftCard, createBookingTransaction } from "../app/[slug]/actions";
import { useSession, signIn } from "next-auth/react";
import { getTerminology } from "@/lib/terminology";

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
  category = 'BARBER'
}: { 
  initialServices: Service[], 
  tenantSlug: string,
  category?: string 
}) {
  const { data: session } = useSession();
  const terminology = getTerminology(category);
  const [stage, setStage] = useState<"SERVICES" | "CALENDAR" | "PAYMENT">("SERVICES");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [regForm, setRegForm] = useState({ name: "", username: "", email: "", phone: "", password: "" });
  
  const [giftCode, setGiftCode] = useState("");
  const [appliedCard, setAppliedCard] = useState<{ id: string; balance: number } | null>(null);
  const [giftError, setGiftError] = useState("");
  const [isValidatingGift, setIsValidatingGift] = useState(false);
  
  const [cart, setCart] = useState<{ service: Service; quantity: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => setRegForm({ ...regForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

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
  const [slots, setSlots] = useState<string[]>([]);
  const [slotReason, setSlotReason] = useState<string | null>(null);

  const addToCart = (service: Service) => {
    setCart((prev) => {
      const existing = prev.find(item => item.service.id === service.id);
      if (existing) return prev.map(item => item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { service, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => item.service.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };

  const totalPrice = cart.reduce((total, item) => total + (item.service.price * item.quantity), 0);

  const moveToCalendar = async () => {
     setStage("CALENDAR");
     fetchSlots(targetDate);
  };

  const fetchSlots = async (dateStr: string) => {
     setTargetDate(dateStr);
     const totalDuration = cart.reduce((tot, item) => tot + (item.service.durationMinutes * item.quantity), 0);
     const result = await fetchPublicSlots(tenantSlug, dateStr, totalDuration);
     setSlots(result.availableSlots || []);
     setSlotReason(result.reason || null);
  };

  const handleTimeSelect = (timeStr: string) => {
     setSelectedTime(timeStr);
     setStage("PAYMENT");
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
          body: JSON.stringify({ cart, tenantSlug, targetDate, selectedTime, userId: activeUserId, giftCode: appliedCard ? giftCode : null })
        });

        const checkoutData = await response.json();
        if (checkoutData.error) throw new Error(checkoutData.error);
        if (checkoutData.bypassStripe) {
          const result = await createBookingTransaction(cart.map(i => ({ serviceId: i.service.id, quantity: i.quantity })), tenantSlug, targetDate, selectedTime, "GIFT_CARD", activeUserId, undefined, checkoutData.giftCardId, checkoutData.giftDiscount);
          if (result.success) window.location.href = "/booking-confirmation?bypass=true";
          else throw new Error(result.error || "Failed to finalize booking.");
          return;
        }
        if (checkoutData.url) window.location.href = checkoutData.url;
        else throw new Error("Failed to initialize secure checkout session.");
      } catch (err: any) { alert("Payment Gateway Error: " + err.message); }
      finally { setIsProcessingPayment(false); }
    });
  };

  // ─── STYLING OBJECTS (FRESHA LIGHT THEME) ───
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
      <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {["Select", "Schedule", "Payment"].map((s: string, i: number) => (
             <div key={s} style={{ 
                fontWeight: 800, 
                fontSize: '0.85rem', 
                color: (i === 0 && stage === 'SERVICES') || (i === 1 && stage === 'CALENDAR') || (i === 2 && stage === 'PAYMENT') ? 'var(--primary)' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
             }}>
                <span style={{ height: '20px', width: '20px', borderRadius: '50%', background: (i === 0 && stage === 'SERVICES') || (i === 1 && stage === 'CALENDAR') || (i === 2 && stage === 'PAYMENT') ? 'var(--primary)' : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{i+1}</span>
                {s}
             </div>
          ))}
      </div>

      {stage === "SERVICES" && (
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '2rem', color: '#0f172a' }}>{terminology.serviceLabelPlural}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {initialServices.map((srv) => (
                <div key={srv.id} style={cardStyle}>
                   <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>{srv.name}</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.6rem' }}>{srv.durationMinutes} mins</p>
                        <p style={{ color: '#1e293b', fontWeight: 800, fontSize: '1rem' }}>from ${srv.price.toFixed(0)}</p>
                        {srv.description && <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.8rem', lineHeight: 1.5, maxWidth: '80%' }}>{srv.description}</p>}
                   </div>
                   <div style={{ minWidth: '150px', display: 'flex', justifyContent: 'flex-end' }}>
                       {cart.find(i => i.service.id === srv.id) ? (
                           <div style={{ 
                               display: 'flex', 
                               alignItems: 'center', 
                               background: '#f8fafc', 
                               borderRadius: '50px', 
                               border: '1px solid var(--primary)',
                               padding: '0.4rem'
                           }}>
                               <button 
                                   onClick={() => updateQuantity(srv.id, -1)}
                                   style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer', padding: '0 1rem', fontSize: '1.2rem' }}>
                                   -
                               </button>
                               <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                                   {cart.find(i => i.service.id === srv.id)?.quantity}
                               </span>
                               <button 
                                   onClick={() => addToCart(srv)}
                                   style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer', padding: '0 1rem', fontSize: '1.2rem' }}>
                                   +
                               </button>
                           </div>
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
                            Book
                           </button>
                       )}
                   </div>
                </div>
              ))}
              {initialServices.length === 0 && (
                <p style={{ color: '#64748b', padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px' }}>No services available for booking at this time.</p>
              )}
            </div>
          </div>
      )}

      {stage === "CALENDAR" && (
          <div style={{ background: '#fff', padding: '3rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
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
                      {slots.map(t => (
                          <button 
                             key={t} 
                             onClick={() => handleTimeSelect(t)}
                             style={{ padding: '1rem 0', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                             onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                             onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                             >
                             {t}
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
          <div style={{ background: '#fff', padding: '3rem', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
             {!session?.user ? (
               <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Check Out</h2>
                  {isLoginMode ? (
                        <form onSubmit={handleInPlaceLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <input required name="email" type="email" placeholder="Email Address" value={loginForm.email} onChange={handleLoginChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                            <input required name="password" type="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} style={{ width: '100%', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem' }} />
                            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{loginError}</p>}
                            <button type="submit" style={{ width: '100%', padding: '1.2rem', background: '#000', color: '#fff', fontWeight: 900, border: 'none', borderRadius: '16px', cursor: 'pointer' }}>Sign In & Book</button>
                            <button type="button" onClick={() => setIsLoginMode(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}>Create an account instead</button>
                        </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input name="name" placeholder="Full Name" value={regForm.name} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                            <input name="email" type="email" placeholder="Email" value={regForm.email} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        </div>
                        <input name="password" type="password" placeholder="Create Password" value={regForm.password} onChange={handleRegChange} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                        <button type="button" onClick={() => setIsLoginMode(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer' }}>Already have an account? Log in</button>
                    </div>
                  )}
               </div>
             ) : (
               <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Confirm Booking</h2>
                  <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>Review your selection and complete your booking securely.</p>
               </div>
             )}

             <div style={{ marginTop: '2.5rem', padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem' }}>Order Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Services Subtotal</span>
                  <span style={{ fontWeight: 700 }}>${totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Priority Booking Fee</span>
                  <span style={{ fontWeight: 700 }}>$0.50</span>
                </div>
                {giftDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                    <span>Gift Card Applied</span>
                    <span style={{ fontWeight: 700 }}>-${giftDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>Total (AUD)</span>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>${(finalPrice + 0.50).toFixed(2)}</span>
                </div>
                
                <h4 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '0.5rem', marginTop: '2rem' }}>Selected Date & Time</h4>
                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>{targetDate} at {selectedTime}</p>
             </div>

             <button 
                onClick={handleFinalCheckout}
                disabled={isPending || isProcessingPayment}
                style={{ 
                    marginTop: '2.5rem', 
                    width: '100%', 
                    padding: '1.4rem', 
                    background: '#000', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '20px', 
                    fontWeight: 900, 
                    fontSize: '1.2rem', 
                    cursor: 'pointer',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
                }}>
                {isProcessingPayment ? "Redirecting to Secure Checkout..." : "Confirm & Pay Online"}
             </button>
          </div>
      )}

      {/* Persistent Mini-Cart (Fresha Style) */}
      {cart.length > 0 && stage !== 'PAYMENT' && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '600px', background: '#000', color: '#fff', borderRadius: '24px', padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>{cart.length} {cart.length === 1 ? 'service' : 'services'} selected</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 900 }}>Total: ${(finalPrice + 0.50).toFixed(2)} AUD</p>
            </div>
            {stage === 'SERVICES' ? (
                <button onClick={moveToCalendar} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>Choose Time</button>
            ) : (
                <button onClick={() => setStage('PAYMENT')} style={{ background: '#fff', color: '#000', border: 'none', padding: '0.8rem 2rem', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>Review & Pay</button>
            )}
        </div>
      )}
    </div>
  );
}
