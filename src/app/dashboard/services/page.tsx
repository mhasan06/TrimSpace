import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServiceAction } from "./actions";
import ServiceManager from "@/components/ServiceManager";

export default async function ServicesDashboard() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    return <div style={{ color: 'white' }}>Please log in to manage your shop.</div>;
  }

  const [services, barbers] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId },
      include: { barbers: true }, // Include current assignments
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({
      where: { tenantId, role: "BARBER", isActive: true },
      select: { id: true, name: true, avatarUrl: true }
    })
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--foreground)' }}>Manage Services</h1>
        <p style={{ color: 'var(--foreground)', opacity: 0.7, marginTop: '0.5rem' }}>
          Define the exact duration of each service below. The booking engine automatically restricts clients based on Barber availability and the durations you specify.
        </p>
      </header>

      {/* Service Creation Tool */}
      <section className="glass" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Service</h2>
        <form action={createServiceAction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Service Name</label>
            <input name="name" type="text" placeholder="e.g. Bespoke Hot Towel Shave" required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Duration (Mins)</label>
            <input name="durationMinutes" type="number" step="15" placeholder="e.g. 45" required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Price ($)</label>
            <input name="price" type="number" step="0.01" placeholder="e.g. 35.00" required style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }} />
            <p style={{ fontSize: '0.7rem', color: 'var(--foreground)', opacity: 0.6, margin: 0 }}>
              * Platform will automatically add {activeFeePercent}% + A$0.30 + 50c fees to this price.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Service Description</label>
            <textarea name="description" placeholder="Explain the details of this service to your clients..." rows={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'block', textTransform: 'uppercase' }}>Assign Barbers to this Service</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {barbers.map(b => (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border)' }}>
                        <input type="checkbox" name="barberIds" value={b.id} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.name || 'Unnamed'}</span>
                    </label>
                ))}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s', width: 'fit-content' }}>
              Publish Service
            </button>
          </div>
        </form>
      </section>

      {/* Active Services Roster */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2px solid var(--primary)', opacity: 0.9, paddingBottom: '0.8rem', width: 'fit-content' }}>Service Catalog</h2>
        {services.length === 0 ? (
          <p style={{ color: 'var(--foreground)', opacity: 0.6 }}>No services created yet.</p>
        ) : (
          <ServiceManager initialServices={services} barbers={barbers} tenantId={tenantId} platformSettings={platformSettings} />
        )}
      </section>

    </div>
  );
}
