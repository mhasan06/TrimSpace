import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import UserTable from "./UserTable.client";

export default async function AllUsersPage() {
  const users = await prisma.$queryRawUnsafe<any[]>(
    `SELECT u.*, t.name as "tenantName" 
     FROM "User" u 
     LEFT JOIN "Tenant" t ON u."tenantId" = t.id 
     ORDER BY u."createdAt" DESC`
  );

  // Ensure data stability for client component
  const formattedUsers = users.map(u => ({
    ...u,
    role: u.role || "CUSTOMER",
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    tenant: u.tenantName ? { name: u.tenantName } : null
  }));

  return (
    <>
      <header className={`${styles.header} glass`} style={{ marginBottom: '2rem' }}>
        <div>
           <h1>Global User Directory</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Comprehensive database of all platform participants and access controls</p>
        </div>
      </header>

      <section className={styles.recentSection}>
        <div className={`${styles.tableContainer} glass`}>
          <UserTable initialUsers={formattedUsers as any} />
        </div>
      </section>
    </>
  );
}
