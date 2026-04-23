import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import GlobalVariablesManager from "@/components/GlobalVariablesManager";
import PlatformPolicyManager from "@/components/PlatformPolicyManager";

export default async function GlobalVariablesPage() {
    // Fetch system-wide key-value variables
    const globalSettings = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "GlobalSetting" ORDER BY "key" ASC`
    );

    // Fetch the main platform singleton settings
    const platformSettings = await prisma.platformSettings.findUnique({
        where: { id: 'platform_global' }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            <header className={`${styles.header} glass`}>
                <div>
                    <h1>Global Application Variables</h1>
                    <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Centralized configuration for platform-wide constants and legal policies.</p>
                </div>
            </header>

            <section className={styles.recentSection}>
                <div className={`${styles.tableContainer} glass`} style={{ padding: '2.5rem' }}>
                    <PlatformPolicyManager initialSettings={platformSettings as any} />
                </div>
            </section>

            <section className={styles.recentSection}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', opacity: 0.8 }}>🔧 Advanced System Constants</h2>
                <div className={`${styles.tableContainer} glass`} style={{ padding: '2rem' }}>
                    <GlobalVariablesManager initialSettings={globalSettings} />
                </div>
            </section>
        </div>
    );
}
