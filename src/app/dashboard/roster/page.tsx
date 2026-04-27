import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTerminology } from "@/lib/terminology";
import { prisma } from "@/lib/prisma";
import { getStaffStats } from "./actions";
import RosterManager from "@/components/RosterManager";

export default async function TeamRoster() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  const currentUserId = (session?.user as any)?.id;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const terminology = getTerminology(tenant?.category);
  const staff = await getStaffStats(tenantId);

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
          <h1>{terminology.rosterLabel}</h1>
          <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            Manage your active {terminology.staffLabelPlural.toLowerCase()}, review performance, and invite new team members
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Team Size</p>
            <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>{staff.length}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>Total Revenue</p>
            <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--secondary)' }}>
              ${staff.reduce((s: number, m: any) => s + Number(m.total_revenue || 0), 0).toFixed(0)}
            </p>
          </div>
        </div>
      </header>

      <div style={{ marginTop: '2rem' }}>
        <RosterManager
          staff={staff}
          tenantId={tenantId}
          currentUserId={currentUserId}
          staffLabel={terminology.staffLabel}
          enabledFeatures={tenant?.enabledFeatures as string[]}
        />
      </div>

      <section style={{ marginTop: '3rem', padding: '2rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Roster Permissions Logic</h2>
        <p style={{ color: 'var(--foreground)', opacity: 0.7, lineHeight: 1.7, fontSize: '0.9rem' }}>
          When you invite a {terminology.staffLabel.toLowerCase()}, they receive an email with a secure link to create their account.
          Once registered, they are automatically linked to your shop and can manage their own calendar column independently
          without accessing your global revenue data.
        </p>
      </section>
    </>
  );
}
