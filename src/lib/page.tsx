"use client";
import { useState } from "react";
import { registerAction } from "./actions";
import { useFormStatus } from "react-dom";

export default function RegisterPage() {
    const [isBusiness, setIsBusiness] = useState(false);
    const [formState, setFormState] = useState<{ error?: string; success?: boolean; message?: string } | null>(null);

    async function clientAction(formData: FormData) {
        formData.append("accountType", isBusiness ? "business" : "customer");
        const result = await registerAction(null, formData);
        setFormState(result);
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--background)', padding: '2rem' }}>
            <main className="glass" style={{ width: '100%', maxWidth: '500px', padding: '3rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)', textAlign: 'center', marginBottom: '0.5rem' }}>Join TrimSpace</h1>
                <p style={{ textAlign: 'center', color: 'var(--foreground)', opacity: 0.7, marginBottom: '2rem' }}>
                    {isBusiness ? "Set up your Tenant Workspace" : "Create a profile to easily book appointments"}
                </p>

                <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '8px', padding: '0.3rem', marginBottom: '2rem' }}>
                    <button onClick={() => setIsBusiness(false)} style={{ flex: 1, padding: '0.6rem', border: 'none', background: !isBusiness ? 'var(--primary)' : 'transparent', color: !isBusiness ? 'white' : 'var(--foreground)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Customer</button>
                    <button onClick={() => setIsBusiness(true)} style={{ flex: 1, padding: '0.6rem', border: 'none', background: isBusiness ? 'var(--primary)' : 'transparent', color: isBusiness ? 'white' : 'var(--foreground)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Business Owner</button>
                </div>

                {formState?.error && <div style={{ padding: '1rem', background: 'rgba(255, 60, 60, 0.1)', border: '1px solid rgba(255, 60, 60, 0.4)', borderRadius: '8px', color: 'rgb(255, 60, 60)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{formState.error}</div>}
                {formState?.success ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{formState.message}</h2>
                        <a href="/login" style={{ display: 'inline-block', padding: '0.8rem 2rem', background: 'var(--foreground)', color: 'var(--background)', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>Login to Portal</a>
                    </div>
                ) : (
                    <form action={clientAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        {isBusiness && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600 }}>Your Shop Name</label>
                                <input name="shopName" type="text" placeholder="e.g. Skyline Barbers" required={isBusiness} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600 }}>Full Name</label>
                            <input name="name" type="text" required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600 }}>Email Address</label>
                            <input name="email" type="email" required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--foreground)', fontWeight: 600 }}>Secure Password</label>
                            <input name="password" type="password" required style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }} />
                        </div>
                        <SubmitButton />
                    </form>
                )}
            </main>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <button disabled={pending} type="submit" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1 }}>{pending ? 'Encrypting...' : 'Complete Registration'}</button>;
}
