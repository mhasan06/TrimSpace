"use client";

import { useState } from "react";
import { toggleCustomerStatus, deleteCustomer } from "@/app/dashboard/customers/actions";

interface Customer {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    _count: {
        appointments: number;
    }
}

export default function CustomerManager({ initialCustomers, tenantId, isAdmin }: { initialCustomers: Customer[], tenantId?: string, isAdmin: boolean }) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleToggle = async (customer: Customer) => {
        setProcessingId(customer.id);
        const res = await toggleCustomerStatus(customer.id, tenantId || "", customer.isActive);
        if (res.success) {
            setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isActive: !c.isActive } : c));
        }
        setProcessingId(null);
    };

    const handleDelete = async (customer: Customer) => {
        if (!confirm(`Permanently DELETE customer ${customer.name || customer.email}? This action is irreversible.`)) return;
        setProcessingId(customer.id);
        const res = await deleteCustomer(customer.id, tenantId || "");
        if (res.success) {
            setCustomers(prev => prev.filter(c => c.id !== customer.id));
        }
        setProcessingId(null);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Customer</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Contact</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Appointments</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Joined</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', opacity: c.isActive ? 1 : 0.5 }}>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: 700 }}>{c.name || "Anonymous"}</p>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>ID: {c.id.slice(0, 8)}</p>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontSize: '0.85rem' }}>{c.email}</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{c.phone || "No Phone"}</p>
                                    {(c as any).suburb || (c as any).state || (c as any).gender ? (
                                        <p style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.4rem', fontWeight: 600 }}>
                                            {[(c as any).suburb, (c as any).state].filter(Boolean).join(', ')} 
                                            {(c as any).gender ? ` • ${(c as any).gender}` : ''}
                                        </p>
                                    ) : null}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ background: 'var(--primary)', color: 'black', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>
                                        {c._count.appointments}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        color: c.isActive ? '#10b981' : '#ef4444',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        textTransform: 'uppercase'
                                    }}>
                                        ● {c.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => handleToggle(c)}
                                            disabled={processingId === c.id}
                                            style={{ 
                                                padding: '0.4rem 0.8rem', 
                                                background: 'transparent', 
                                                border: `1px solid ${c.isActive ? '#ef4444' : '#10b981'}`, 
                                                color: c.isActive ? '#ef4444' : '#10b981',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {c.isActive ? 'Suspend' : 'Reactive'}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(c)}
                                            disabled={processingId === c.id}
                                            style={{ 
                                                padding: '0.4rem 0.8rem', 
                                                background: 'transparent', 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                color: 'var(--foreground)',
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', opacity: 0.4 }}>
                        No customers found in this establishment's directory.
                    </div>
                )}
            </div>
        </div>
    );
}
