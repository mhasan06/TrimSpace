"use client";
import { useEffect, useState, Suspense } from "react";
import { registerAction } from "./actions";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import SocialLoginButtons from "@/components/SocialLoginButtons";
import { AU_SUBURBS } from "@/lib/constants";
import Link from "next/link";

function RegisterContent() {
  const searchParams = useSearchParams();
  const [isBusiness, setIsBusiness] = useState(false);
  const [formState, setFormState] = useState<{ error?: string; success?: boolean; message?: string } | null>(null);
  const [suburbInput, setSuburbInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);

  const matchingSuburbs = AU_SUBURBS.filter(item => 
      suburbInput && item.s.toLowerCase().includes(suburbInput.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    if (searchParams.get("type") === "business") {
      setIsBusiness(true);
    }
  }, [searchParams]);

  async function clientAction(formData: FormData) {
    formData.append("accountType", isBusiness ? "business" : "customer");
    const result = await registerAction(null, formData);
    setFormState(result);
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '2rem 1rem' 
    }}>
      <main style={{ 
        width: '100%', 
        maxWidth: '650px', 
        padding: '2rem 1.5rem', 
        borderRadius: '32px', 
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 950, color: '#000', marginBottom: '0.8rem', letterSpacing: '-0.03em' }}>
            {isBusiness ? "The Master's Journey" : "Join the Community"}
          </h1>
          <p style={{ fontSize: '1rem', color: '#475569', fontWeight: 600, opacity: 0.8 }}>
            {isBusiness ? "Empower your craft with world-class tools." : "Enter a marketplace designed for elite grooming."}
          </p>
        </div>

        {/* Account Switcher */}
        <div style={{ 
          display: 'flex', 
          background: 'rgba(0,0,0,0.03)', 
          borderRadius: '40px', 
          padding: '0.4rem', 
          marginBottom: '2rem',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <button 
            onClick={() => setIsBusiness(false)} 
            style={{ 
              flex: 1, 
              padding: '0.8rem', 
              border: 'none', 
              background: !isBusiness ? '#000' : 'transparent', 
              color: !isBusiness ? 'white' : '#64748b', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 800,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}>
            Connoisseurs
          </button>
          <button 
            onClick={() => setIsBusiness(true)} 
            style={{ 
              flex: 1, 
              padding: '0.8rem', 
              border: 'none', 
              background: isBusiness ? '#000' : 'transparent', 
              color: isBusiness ? 'white' : '#64748b', 
              borderRadius: '40px', 
              cursor: 'pointer', 
              fontWeight: 800,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}>
            Masters
          </button>
        </div>

        {formState?.error && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(255, 60, 60, 0.05)', 
            border: '1px solid rgba(255, 60, 60, 0.2)', 
            borderRadius: '16px', 
            color: '#dc2626', 
            marginBottom: '2rem', 
            fontSize: '0.9rem',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {formState.error}
          </div>
        )}

        {formState?.success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#fff' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 style={{ color: '#000', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 950 }}>
              {isBusiness ? "Application Received" : "Verify Your Email"}
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '2rem' }}>
              {formState.message || (isBusiness 
                ? "Your partnership request has been received. Our concierge team will review your application and contact you shortly to complete your onboarding."
                : "We've sent a verification link to your email address. Please click the link to activate your account and start booking appointments.")
              }
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '1rem 2.5rem', background: '#000', color: '#fff', textDecoration: 'none', borderRadius: '40px', fontWeight: 800, fontSize: '1rem' }}>Return to Login</Link>
          </div>
        ) : (
          <form action={clientAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {isBusiness && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shop Category</label>
                    <select name="category" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }}>
                      <option value="BARBER">Barbershop</option>
                      <option value="SALON">Hair Salon</option>
                      <option value="SPA">Spa & Wellness</option>
                      <option value="SKIN">Skin Care</option>
                      <option value="NAILS">Nails</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Public Shop Name</label>
                    <input name="shopName" type="text" placeholder="e.g. Skyline Masters" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal Business Name</label>
                    <input name="businessName" type="text" placeholder="e.g. Skyline Grooming Pty Ltd" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ABN</label>
                    <input name="abn" type="text" placeholder="00 000 000 000" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isBusiness ? "Master Full Name" : "Full Name"}
                </label>
                <input name="name" type="text" placeholder="John Doe" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select name="phoneCode" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', color: '#000', width: '90px', fontWeight: 700 }}>
                    <option value="+61">+61</option>
                    <option value="+1">+1</option>
                  </select>
                  <input name="phone" type="tel" required placeholder="0400 000 000" style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600, minWidth: '0' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '24px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '0.85rem', color: '#000', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.2rem', letterSpacing: '0.05em' }}>
                {isBusiness ? "Physical Boutique Address" : "Your Primary Location"}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Street Address</label>
                  <input name="street" type="text" placeholder="e.g. 123 Luxury Way" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Suburb</label>
                    <input 
                        name="suburb" 
                        type="text" 
                        placeholder="Suburb" 
                        value={suburbInput}
                        onChange={(e) => { setSuburbInput(e.target.value); setShowSuburbDropdown(true); }}
                        onFocus={() => setShowSuburbDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSuburbDropdown(false), 200)}
                        required 
                        style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} 
                    />
                    {showSuburbDropdown && matchingSuburbs.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 100, borderRadius: '16px', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', marginTop: '8px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            {matchingSuburbs.map(item => (
                                <div 
                                    key={`${item.s}-${item.st}`}
                                    onClick={() => {
                                        setSuburbInput(item.s);
                                        setStateInput(item.st);
                                        setShowSuburbDropdown(false);
                                    }}
                                    style={{ padding: '0.8rem 1.2rem', cursor: 'pointer', fontSize: '0.95rem', color: '#000', borderBottom: '1px solid rgba(0,0,0,0.03)', fontWeight: 700 }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    🏙️ {item.s}, {item.st}
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>State</label>
                    <input 
                      name="state" 
                      type="text" 
                      placeholder="State" 
                      value={stateInput}
                      onChange={(e) => setStateInput(e.target.value)}
                      required 
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Email</label>
                <input name="email" type="email" placeholder="email@example.com" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secure Password</label>
                <input name="password" type="password" placeholder="••••••••" required style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff', fontSize: '1rem', fontWeight: 600 }} />
              </div>
            </div>

            <SubmitButton isBusiness={isBusiness} />
          </form>
        )}

        {!isBusiness && !formState?.success && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
            <SocialLoginButtons mode="up" compact={true} />
          </div>
        )}
        
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, marginTop: '2rem' }}>
          Already part of the community? <Link href={isBusiness ? "/partner-login" : "/customer-login"} style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Sign In</Link>
        </p>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

function SubmitButton({ isBusiness }: { isBusiness: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button 
      disabled={pending} 
      type="submit" 
      style={{ 
        marginTop: '1rem', 
        padding: '1.2rem', 
        background: '#000', 
        color: 'white', 
        border: 'none', 
        borderRadius: '16px', 
        fontSize: '1rem', 
        fontWeight: 800, 
        cursor: pending ? 'not-allowed' : 'pointer', 
        opacity: pending ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
    >
      {pending ? 'Processing...' : 'Join the Community'}
    </button>
  );
}
