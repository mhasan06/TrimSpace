import styles from "../../dashboard/page.module.css";

export default function AdminReporting() {
  return (
    <>
      <header className={`${styles.header} glass`}>
        <h1>Advanced Platform Reporting</h1>
        <div className={styles.profileStats}>
          <span className={styles.badge}>Data Refreshed: Today, 8:00 AM</span>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <h3>Blended Platform Churn</h3>
          <p className={styles.statNumber} style={{ color: '#ff4444' }}>1.2%</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Below 2% threshold (Healthy)</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Avg. Shop ARPU</h3>
          <p className={styles.statNumber}>$142.50</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Subscription + Transaction fees</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Market Cap (Aggregate)</h3>
          <p className={styles.statNumber}>$4.2M</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Across all verified tenants</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Infrastructure Load</h3>
          <p className={styles.statNumber} style={{ color: '#10b981' }}>14%</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Tier-1 redundancy active</p>
        </div>
      </div>

      <section className={styles.recentSection} style={{ marginTop: '2.5rem' }}>
        <h2>Strategic Revenue Forecast (Yearly)</h2>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quarterly Period</th>
                <th>Projected GMV</th>
                <th>Est. Platform Take (2.5%)</th>
                <th>Subscription MRR</th>
                <th>Projected Net Profit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Q1 2026</td>
                <td>$450,000</td>
                <td>$11,250</td>
                <td>$32,400</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>$43,650</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Q2 2026</td>
                <td>$620,000</td>
                <td>$15,500</td>
                <td>$48,000</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>$63,500</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Q3 2026 (Est.)</td>
                <td>$890,000</td>
                <td>$22,250</td>
                <td>$62,000</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>$84,250</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
        <section className={styles.recentSection}>
          <h2>Customer Retention Cohorts</h2>
          <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Signup Month</th>
                  <th>Month 1</th>
                  <th>Month 3</th>
                  <th>Month 6</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>January</td>
                  <td>100%</td>
                  <td>92%</td>
                  <td>88%</td>
                </tr>
                <tr>
                  <td>February</td>
                  <td>100%</td>
                  <td>94%</td>
                  <td>91%</td>
                </tr>
                <tr>
                  <td>March</td>
                  <td>100%</td>
                  <td>96%</td>
                  <td>--</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2>Top Performing Regions (GMV)</h2>
          <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>City / Region</th>
                  <th>Monthly Volume</th>
                  <th>Active Shops</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>New York, NY</td>
                  <td>$145.2K</td>
                  <td>42</td>
                </tr>
                <tr>
                  <td>Los Angeles, CA</td>
                  <td>$98.5K</td>
                  <td>28</td>
                </tr>
                <tr>
                  <td>Chicago, IL</td>
                  <td>$54.1K</td>
                  <td>12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
