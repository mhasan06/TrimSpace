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

  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });

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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)' }}>Service Description</label>
            <textarea name="description" placeholder="Explain the details of this service to your clients..." rows={3} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontFamily: 'inherit', resize: 'vertical' }} />
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
          <ServiceManager initialServices={services} />
        )}
      </section>

    </div>
  );
}
