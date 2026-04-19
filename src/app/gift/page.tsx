"use client";

import { useState } from "react";
import styles from "../page.module.css";
import Link from "next/link";

export default function GiftCardsPage() {
    const [amount, setAmount] = useState(50);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [customAmount, setCustomAmount] = useState("");
    const [error, setError] = useState("");

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
                window.location.href = data.url; // redirect to Stripe hosted checkout
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
        <div className={styles.dashboardContainer} style={{ padding: '4rem 2rem', minHeight: '100vh', background: 'radial-gradient(circle at top right, rgba(var(--primary-rgb), 0.1), transparent)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>The Perfect Gift</span>
                <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginTop: '1rem', lineHeight: '1' }}>Give the Gift of <span style={{ color: 'var(--primary)' }}>Style</span></h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.7, marginTop: '1.5rem', marginBottom: '4rem' }}>
                    Purchase a digital TrimSpace gift card for yourself or a friend. Valid at any participating partner shop.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', textAlign: 'left' }}>
                    {/* Card Preview */}
                    <div className="glass" style={{ 
                        aspectRatio: '1.6/1', 
                        borderRadius: '24px', 
                        padding: '2.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(var(--primary-rgb), 0.2))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.2 }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                           <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Trim<span style={{ color: 'var(--primary)' }}>Space</span></h2>
                           <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>VIRTUAL CARD</span>
                        </div>

                        <div>
                           <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)' }}>${amount}</div>
                           <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.5rem' }}>Digital Credit</p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                           <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>VALID FOR 12 MONTHS</div>
                           <div style={{ fontWeight: 700, letterSpacing: '1px' }}>**** **** **** 1024</div>
                        </div>
                    </div>

                    {/* Purchase Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, opacity: 0.8 }}>Select Amount</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[25, 50, 100, 250].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        style={{ 
                                            padding: '1rem', 
                                            background: amount === val ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: amount === val ? 'black' : 'white',
                                            border: amount === val ? 'none' : '1px solid var(--border)',
                                            borderRadius: '12px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                        ${val}
                                    </button>
                                ))}\
                            </div>
                            {/* Custom amount */}
                            <div style={{ marginTop: '1rem' }}>
                                <input
                                    type="number"
                                    min={5}
                                    max={2000}
                                    placeholder="Or enter custom amount (e.g. 75)"
                                    value={customAmount}
                                    onChange={e => { setCustomAmount(e.target.value); if (e.target.value) setAmount(0); }}
                                    style={{ width: '100%', padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        <div>
                           <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700, opacity: 0.8 }}>Recipient Email</label>
                           <input
                                type="email"
                                placeholder="Where should we send the code?"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                           />
                        </div>

                        {error && (
                            <p style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.85rem', margin: 0 }}>
                                ⚠️ {error}
                            </p>
                        )}

                        <button
                            onClick={handlePurchase}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                background: loading ? 'rgba(255,255,255,0.2)' : '#D4AF37',
                                color: 'black',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 900,
                                fontSize: '1.1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.7 : 1
                            }}>
                            {loading ? "⏳ Redirecting to Stripe..." : `💳 Purchase $${customAmount || amount} Gift Card`}
                        </button>

                        <p style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center' }}>
                            🔒 Secure encrypted checkout powered by Stripe. No card details stored.
                        </p>
                    </div>

                </div>

                <div style={{ marginTop: '8rem' }}>
                    <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>
                        ← Return to Marketplace
                    </Link>
                </div>
            </div>
        </div>
    );
}
