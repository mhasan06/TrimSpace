import GiftSuccessClient from "./GiftSuccessClient";

export default async function GiftSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#121212',
        borderRadius: '32px',
        border: '1px solid rgba(212,175,55,0.2)',
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 80px rgba(0,0,0,0.8)'
      }}>
        {!sessionId ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ color: '#ef4444' }}>Invalid Session</h2>
            <p style={{ opacity: 0.6, marginTop: '1rem' }}>No payment session found.</p>
          </div>
        ) : (
          <GiftSuccessClient sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}
