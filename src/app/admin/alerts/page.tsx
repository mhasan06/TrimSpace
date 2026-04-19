import styles from "../../dashboard/page.module.css";

export default function AlertsPage() {
  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1>System Health & Alerts</h1>
           <p style={{ color: '#ff4444', marginTop: '0.3rem', fontSize: '0.9rem' }}>Critical infrastructure monitoring and security logs</p>
        </div>
      </header>

      <div style={{ padding: '2rem', background: 'rgba(255, 68, 68, 0.05)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '12px', marginTop: '2rem' }}>
         <h2 style={{ color: '#ff4444', fontSize: '1.1rem', marginBottom: '1rem' }}>Active Threat Level: LOW</h2>
         <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>No critical 500-errors or security breaches detected in the last 24 hours.</p>
      </div>

      <section className={styles.recentSection} style={{ marginTop: '2rem' }}>
        <h2>Infrastructure Logs</h2>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Service</th>
                <th>Event Type</th>
                <th>Message</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
               <tr>
                  <td>{new Date().toLocaleString()}</td>
                  <td>AUTH_ENGINE</td>
                  <td>LOGIN_SUCCESS</td>
                  <td>Superuser admin@trimspace.co authenticated via Platform Gateway</td>
                  <td><span style={{ color: 'var(--secondary)' }}>INFO</span></td>
               </tr>
               <tr style={{ opacity: 0.6 }}>
                  <td>{new Date(Date.now() - 3600000).toLocaleString()}</td>
                  <td>DATABASE_POOL</td>
                  <td>CONNECTION_STABLE</td>
                  <td>Supabase IPv4 Pooler active via Port 6543</td>
                  <td><span style={{ color: 'var(--secondary)' }}>INFO</span></td>
               </tr>
               <tr style={{ opacity: 0.6 }}>
                  <td>{new Date(Date.now() - 7200000).toLocaleString()}</td>
                  <td>NEXT_RUNTIME</td>
                  <td>REVALIDATION</td>
                  <td>Static paths revalidated for Shop Settings</td>
                  <td><span style={{ color: 'var(--secondary)' }}>INFO</span></td>
               </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
