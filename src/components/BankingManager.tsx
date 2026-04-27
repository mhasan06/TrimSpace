"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BankingManagerProps {
    tenantId: string;
    initialBankName: string;
    initialBSB: string;
    initialAccountNumber: string;
    initialHistory: any[];
}

export default function BankingManager({ tenantId, initialBankName, initialBSB, initialAccountNumber, initialHistory }: BankingManagerProps) {
    const router = useRouter();
    const [bankName, setBankName] = useState(initialBankName);
    const [bsb, setBsb] = useState(initialBSB);
    const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setIsLoading(true);
        setMessage("");
        try {
            const res = await fetch("/api/tenant/banking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantId, bankName, bsb, accountNumber })
            });
            if (res.ok) {
                setMessage("✅ Banking details updated successfully");
                router.refresh();
            } else {
                setMessage("❌ Failed to update details");
            }
        } catch (err) {
            setMessage("❌ An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                Enter your settlement account details for digital payouts. We follow Australian standard BSB/ACC formatting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bank Name</label>
                <input 
                    type="text" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Commonwealth Bank"
                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>BSB (6 digits)</label>
                    <input 
                        type="text" 
                        value={bsb} 
                        onChange={(e) => setBsb(e.target.value)}
                        placeholder="000-000"
                        maxLength={7}
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Account Number</label>
                    <input 
                        type="text" 
                        value={accountNumber} 
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="000000000"
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                    />
                </div>
            </div>

            {message && <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{message}</div>}

            <button 
                onClick={handleSave}
                disabled={isLoading}
                style={{ 
                    marginTop: '1rem',
                    padding: '1rem', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 700, 
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                }}>
                {isLoading ? "Saving..." : "Update Settlement Account"}
            </button>

            {initialHistory.length > 0 && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px', marginBottom: '1rem' }}>Account Change History</h4>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.5rem', opacity: 0.6 }}>Date</th>
                                    <th style={{ padding: '0.5rem', opacity: 0.6 }}>Bank</th>
                                    <th style={{ padding: '0.5rem', opacity: 0.6 }}>BSB/ACC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {initialHistory.map((h, i) => (
                                    <tr key={h.id} style={{ borderBottom: i === initialHistory.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)' }}>
                                        <td style={{ padding: '0.8rem 0.5rem', fontWeight: 700 }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.8rem 0.5rem' }}>{h.bankName}</td>
                                        <td style={{ padding: '0.8rem 0.5rem', fontFamily: 'monospace', opacity: 0.8 }}>{h.bsb} / {h.accountNumber}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
