import styles from "../dashboard/page.module.css";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)' }}>
      {/* Hero Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
          Software to supercharge your shop.
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--foreground)', opacity: 0.8, maxWidth: '600px', margin: '0 auto 3rem' }}>
          Advanced features without the premium price tag. TrimSpace is the top-rated software to run your barbershop or spa.
        </p>
        <Link href="/register" style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2.5rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, textDecoration: 'none' }}>
           Create your Business Account
        </Link>
      </section>

      {/* Pricing Tiers (Matching Fresha Parity) */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Independent Tier */}
          <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
             <h2 style={{ fontSize: '1.5rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Independent</h2>
             <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '2rem' }}>For solo barbers or independent professionals</p>
             <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '2rem' }}>
                A$44.95<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.7 }}> / month</span>
             </div>
             <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--foreground)' }}>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> Single calendar column</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> 20 free phone messages</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> 50 free marketing emails</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> Unlimited client bookings</li>
             </ul>
             <Link href="/register" style={{ display: 'block', textAlign: 'center', background: 'transparent', color: 'var(--foreground)', border: '2px solid var(--foreground)', padding: '0.8rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>Get Started</Link>
          </div>

          {/* Team Tier */}
          <div className="glass" style={{ padding: '3rem 2rem', borderRadius: '16px', border: '2px solid var(--primary)', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '0.3rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>MOST POPULAR</div>
             <h2 style={{ fontSize: '1.5rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Team Shop</h2>
             <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '2rem' }}>For expanding shops looking to scale easily</p>
             <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--foreground)', marginBottom: '2rem' }}>
                A$29.95<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.7 }}> / team member</span>
             </div>
             <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--foreground)' }}>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> Multiple calendar columns</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> 20 free messages per member</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> Phone, Chat, & Email support</li>
                <li style={{ display: 'flex', gap: '0.8rem' }}><span>✓</span> Integrated Business Communications</li>
             </ul>
             <Link href="/register" style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>Start Team Trial</Link>
          </div>

        </div>
      </section>
    </div>
  );
}
