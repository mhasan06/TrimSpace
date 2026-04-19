import styles from "../page.module.css";

export default function Support() {
  return (
    <>
      <header className={`${styles.header} glass`}>
        <h1>Contact Platform Support</h1>
        <div className={styles.profileStats}>
          <span className={styles.badge}>Response Time: 2hrs</span>
        </div>
      </header>

      <section className={styles.recentSection} style={{ maxWidth: '600px' }}>
        <h2>How can we help?</h2>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>Send a message directly to the BarberApp platform owners if you need help with billing, technical issues, or platform requests.</p>
        <div className={`${styles.statCard} glass`} style={{ padding: '2rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Subject</label>
              <input type="text" placeholder="e.g. Billing Issue" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', outline: 'none', color: 'var(--foreground)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Message</label>
              <textarea placeholder="Describe your issue..." rows={6} style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', outline: 'none', resize: 'vertical', color: 'var(--foreground)' }}></textarea>
            </div>
            <button type="button" style={{ padding: '0.875rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Send Message
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
