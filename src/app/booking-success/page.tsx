import FulfillmentClient from "./FulfillmentClient";
import Link from "next/link";
import styles from "../[slug]/page.module.css";

export default async function BookingSuccess({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className={styles.luxuryLayout} style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{ 
          maxWidth: '600px', 
          width: 'calc(100% - 2rem)', 
          padding: '4rem 2rem', 
          borderRadius: '32px', 
          border: '1px solid rgba(212, 175, 55, 0.3)', 
          background: '#121212',
          boxShadow: '0 25px 80px rgba(0,0,0,0.8)',
          margin: '2rem auto'
        }}
      >
        {!sessionId ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '2rem', fontWeight: 800 }}>Invalid Transaction</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>We couldn't verify your payment session. If this is unexpected, please contact support.</p>
            <Link href="/" style={{ color: '#D4AF37', fontWeight: 600, textDecoration: 'underline' }}>Return Home</Link>
          </div>
        ) : (
          <FulfillmentClient sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
