"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import styles from "../app/[slug]/page.module.css";
import { fetchPublicSlots, registerCustomer, validateGiftCard, createBookingTransaction, fetchBarbers, checkEmailExists } from "../app/[slug]/actions";
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
  bookingPolicy,
  businessHours,
  address,
  tenantName
}: { 
  initialServices: Service[], 
  tenantSlug: string,
  category?: string,
  cancellationPolicy?: string | null,
  bookingPolicy?: string | null,
  businessHours: any[],
  address: string,
  tenantName: string
}) {
  const { data: session, status } = useSession();
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
  const [authStep, setAuthStep] = useState<'EMAIL' | 'PASSWORD' | 'REGISTER' | 'VERIFY'>('EMAIL');
  const [authEmail, setAuthEmail] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // Load barbers on mount
  useEffect(() => {
    fetchBarbers(tenantSlug).then((data) => setBarbers(data as any));
  }, [tenantSlug]);

  const getToday = () => {
    const sydneyStr = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
    const d = new Date(sydneyStr);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [targetDate, setTargetDate] = useState<string>(getToday());
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
      
      const allSelectedServiceIds = new Set(allCartItems.map(i => i.service.id));
      const safeGroups = Object.keys(multiCart).map(key => {
        const items = multiCart[Number(key)] || [];
        return items.map(i => i.service.durationMinutes || 45);
      }).filter(g => g.length > 0);

      const result = await fetchPublicSlots(
        tenantSlug, 
        dateStr, 
        safeGroups.length > 0 ? safeGroups : [[45]], 
        Array.from(allSelectedServiceIds),
        selectedBarberId || undefined
      );
      setSlots(result.availableSlots || []);
      setSlotReason(result.reason || null);
  };

  const handleTimeSelect = (timeStr: string) => {
      setSelectedTime(timeStr);
      const slot = slots.find((s: any) => s.time === timeStr);
      if (slot) {
          setAvailableBarbersAtTime(slot.availableBarberIds || []);
      }
      setStage("BARBERS");
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => setRegForm({ ...regForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const handleEmailSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginForm.email) return;
      setIsCheckingEmail(true);
      setLoginError("");
      try {
        const exists = await checkEmailExists(loginForm.email);
        setAuthEmail(loginForm.email);
        if (exists) {
            setAuthStep('PASSWORD');
        } else {
            setRegForm(prev => ({ ...prev, email: loginForm.email }));
            setAuthStep('REGISTER');
        }
      } catch (err) {
        setLoginError("Something went wrong. Please try again.");
      } finally {
        setIsCheckingEmail(false);
      }
  };

  const handleInPlaceLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await signIn("credentials", { 
          email: loginForm.email, 
          password: loginForm.password, 
          loginType: "CUSTOMER", 
          redirect: false 
      });
      if (result?.error) setLoginError("Invalid email or password.");
  };

  const handleInPlaceRegistration = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError("");
      const result = await registerCustomer({ ...regForm, email: authEmail });
      if (result.error) {
          setLoginError(result.error);
      } else {
          setAuthStep('VERIFY');
      }
  };
  
  const days = useMemo(() => {
    const arr = [];
    // Get the current time in Sydney to determine "Today"
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      
      // We need the YYYY-MM-DD in Sydney timezone
      const year = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', year: 'numeric' }).format(d);
      const month = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', month: '2-digit' }).format(d);
      const day = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit' }).format(d);
      
      const dateStr = `${year}-${month}-${day}`;
      arr.push({ date: d, dateStr });
    }
    return arr;
  }, []);
  
  const saveBookingState = useCallback(() => {
      const state = {
          multiCart,
          selectedBarberId,
          targetDate,
          selectedTime,
          partySize,
          stage,
          isGroupBooking,
          availableBarbersAtTime
      };
      localStorage.setItem(`pending_booking_${tenantSlug}`, JSON.stringify(state));
  }, [multiCart, selectedBarberId, targetDate, selectedTime, partySize, stage, isGroupBooking, availableBarbersAtTime, tenantSlug]);

  useEffect(() => {
      const saved = localStorage.getItem(`pending_booking_${tenantSlug}`);
      if (saved) {
          try {
              const data = JSON.parse(saved);
              // Only restore if current state is empty or we are at a very early stage
              const isCurrentEmpty = Object.values(multiCart).every(items => items.length === 0);
              if (isCurrentEmpty || stage === 'PARTY_SIZE') {
                  setMultiCart(data.multiCart);
                  setSelectedBarberId(data.selectedBarberId);
                  setTargetDate(data.targetDate);
                  setSelectedTime(data.selectedTime);
                  setPartySize(data.partySize);
                  setStage(data.stage);
                  setIsGroupBooking(data.isGroupBooking);
                  if (data.availableBarbersAtTime) setAvailableBarbersAtTime(data.availableBarbersAtTime);
              }
          } catch (e) {
              console.error("Error restoring state", e);
          }
      }
  }, [tenantSlug]); // Remove session dependency here to allow restoration anytime on mount if empty

  useEffect(() => {
      if (session?.user) {
          // If we have a session, we can safely clear the pending state after a short delay
          // giving the UI time to show the confirmation screen
          const timer = setTimeout(() => {
            localStorage.removeItem(`pending_booking_${tenantSlug}`);
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [session, tenantSlug]);


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
