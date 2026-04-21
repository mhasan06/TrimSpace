import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import GlobalVariablesManager from "@/components/GlobalVariablesManager";

export default async function GlobalVariablesPage() {
    const settings = await prisma.globalSetting.findMany({
        orderBy: { key: 'asc' }
    });

    return (
        <>
            <header className={`${styles.header} glass`}>
                <div>
                    <h1>Global Application Variables</h1>
                    <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Centralized configuration for platform-wide constants and behaviors.</p>
                </div>
            </header>

            <section className={styles.recentSection} style={{ marginTop: '2rem' }}>
                <div className={`${styles.tableContainer} glass`} style={{ padding: '2rem' }}>
                    <GlobalVariablesManager initialSettings={settings} />
                </div>
            </section>
        </>
    );
}
