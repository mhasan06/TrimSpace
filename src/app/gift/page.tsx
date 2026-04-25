"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GiftCardsPage() {
    const [amount, setAmount] = useState(50);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState("");
    const [error, setError] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handlePurchase = async () => {
        const finalAmount = customAmount ? parseFloat(customAmount) : amount;
        if (!email) { setError("Please enter a recipient email address."); return; }
        if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
        if (finalAmount < 5) { setError("Minimum gift card amount is $5."); return; }

        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/gift-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: finalAmount, recipientEmail: email }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || "Failed to initialize checkout. Please try again.");
                setLoading(false);
            }
        } catch (e) {
            setError("Network error. Please check your connection.");
            setLoading(false);
        }
    };

    return (
        <main style={{ 
            minHeight: '100vh', 
            background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
            padding: isMobile ? '2rem 1.2rem 8rem' : '5rem 2.5rem',
            color: '#000'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '5rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.85rem' }}>The Perfect Gift</span>
                    <h1 style={{ fontSize: isMobile ? '2.5rem' : '4rem', fontWeight: 950, marginTop: '1rem', lineHeight: 1.1, letterSpacing: '-0.04em' }}>
                        Give the Gift of <span style={{ color: '#000', textDecoration: 'underline', textDecorationColor: '#e2e8f0' }}>Style</span>
                    </h1>
                    <p style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', color: '#475569', marginTop: '1.5rem', maxWidth: '600px', margin: '1.5rem auto 0', fontWeight: 600 }}>
                        Purchase a digital TrimSpace gift card. Valid at any participating partner shop.
                    </p>
                </div>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    gap: isMobile ? '3rem' : '5rem', 
                    alignItems: 'flex-start' 
                }}>
                    {/* Card Preview */}
                    <div style={{ flex: 1, width: '100%' }}>
                        <div style={{ 
                            aspectRatio: '1.6/1', 
                            borderRadius: '32px', 
                            background: `url('/trimspace_gift_card_premium_1777127041061.png') center/cover no-repeat`,
                            boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '2rem', 
                                right: '2rem', 
                                background: 'rgba(255,255,255,0.9)', 
                                backdropFilter: 'blur(10px)',
                                padding: '0.8rem 1.5rem', 
                                borderRadius: '16px',
                                fontWeight: 900,
                                fontSize: '1.8rem',
                                color: '#000',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                            }}>
                                ${customAmount || amount}
                            </div>
                        </div>
                        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Digital Gift Experience Preview</p>
                    </div>

                    {/* Purchase Controls */}
                    <div style={{ 
                        flex: 1, 
                        width: '100%', 
                        background: 'rgba(255,255,255,0.6)', 
                        backdropFilter: 'blur(20px)', 
                        padding: isMobile ? '2rem' : '3rem', 
                        borderRadius: '32px', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '1.2rem', fontWeight: 800, color: '#000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Amount</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {[25, 50, 100, 250].map(val => (
                                        <button 
                                            key={val}
                                            onClick={() => { setAmount(val); setCustomAmount(""); }}
                                            style={{ 
                                                padding: '1.2rem', 
                                                background: amount === val && !customAmount ? '#000' : '#fff',
                                                color: amount === val && !customAmount ? '#fff' : '#000',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '16px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontSize: '1rem'
                                            }}>
                                            ${val}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Or enter custom amount"
                                        value={customAmount}
                                        onChange={e => { setCustomAmount(e.target.value); if (e.target.value) setAmount(0); }}
                                        style={{ width: '100%', padding: '1.2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#000', fontWeight: 700, outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div>
                               <label style={{ display: 'block', marginBottom: '1.2rem', fontWeight: 800, color: '#000', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient Email</label>
                               <input
                                    type="email"
                                    placeholder="Where should we send the code?"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{ width: '100%', padding: '1.2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#000', fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontSize: '1rem' }}
                               />
                            </div>

                            {error && (
                                <div style={{ color: '#ff4444', background: 'rgba(255,0,0,0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,0,0,0.1)', fontSize: '0.9rem', fontWeight: 700 }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '1.4rem',
                                    background: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    fontSize: '1.1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: loading ? 0.7 : 1,
                                    marginTop: '1rem'
                                }}>
                                {loading ? "⏳ Secure Redirect..." : `Continue to Checkout`}
                            </button>

                            <p style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', fontWeight: 600 }}>
                                Secure payment via Stripe. Valid for 12 months.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                    <Link href="/" style={{ color: '#000', textDecoration: 'none', fontWeight: 800, fontSize: '0.95rem', borderBottom: '2px solid #000', paddingBottom: '2px' }}>
                        Return to Marketplace
                    </Link>
                </div>
            </div>
        </main>
    );
}
