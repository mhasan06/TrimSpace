import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HoursManager, BlockerManager } from "@/components/ScheduleManagers";
import BrandingManager from "@/components/BrandingManager";
import BankingManager from "@/components/BankingManager";

export default async function ShopSettings() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  // Retrieve Master Tenant Record + Operational Arrays
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { 
      businessHours: true, 
      scheduleOverrides: true,
      bankHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1>Shop Configuration & Operations</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Global settings, Timetables, and Subscriptions</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem', marginTop: '2rem' }}>
         <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: 0 }}>
               <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Public Branding & Profile</h2>
               <BrandingManager 
                  tenantId={tenantId} 
                  initialName={tenant?.name || ""} 
                  initialSlug={tenant?.slug || ""} 
                  initialAddress={tenant?.address || ""}
                  initialCategory={tenant?.category || "BARBER"}
                  initialTemplate={tenant?.templateId || "LUXURY"}
                  initialABN={tenant?.abn || "00 000 000 000"}
                  initialShopImage={tenant?.shopImage || ""}
                  initialGallery={tenant?.galleryImages || []}
                  initialCustomerPhotos={tenant?.customerPhotos || []}
                  initialDescription={tenant?.description || ""}
                  initialPhone={tenant?.phone || ""}
                  initialStreet={tenant?.street || ""}
                  initialSuburb={tenant?.suburb || ""}
                  initialState={tenant?.state || ""}
                  initialPhoneCode={tenant?.phoneCode || "+61"}
                  initialBusinessName={tenant?.businessName || ""}
                  initialWebsite={tenant?.website || ""}
               />
            </div>

            <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: 0 }}>
               <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Standard Operating Hours</h2>
               <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '2rem' }}>Define your weekly shop availability. Set start/end times precisely. Use the Lunch fields to automatically block out mathematical breaks for your team!</p>
               
               {/* Client Side Hours Manager rendering Live DB state */}
               <HoursManager tenantId={tenantId} initialHours={tenant?.businessHours || []} />
            </div>

            <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: 0, border: '1px solid #ff4444' }}>
               <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 68, 68, 0.4)', paddingBottom: '0.5rem', color: '#ff4444' }}>Physical Shop Closures (Overrides)</h2>
               <p style={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '2rem' }}>Physically block specific dates (Holidays, Renovations) from accepting any appointments inside the Global Mathematical Engine.</p>
               
               {/* Client Side Vacations Blocker */}
               <BlockerManager tenantId={tenantId} overrides={tenant?.scheduleOverrides || []} />
            </div>
         </section>

         <aside>
            <div className={`${styles.statCard} glass`} style={{ border: '1px solid var(--primary)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>SaaS Subscription</h3>
                  <span style={{ background: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>ACTIVE</span>
               </div>
               
               <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, marginBottom: '1.5rem' }}>
                  You are currently enrolled in the platform software tracking tier.
               </p>

               <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <span style={{ opacity: 0.7 }}>Current Plan</span>
                     <span style={{ fontWeight: 600 }}>Founder Tier (Complimentary)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ opacity: 0.7 }}>Monthly Billing</span>
                     <span style={{ fontWeight: 600, color: 'var(--primary)' }}>$0.00 / mo</span>
                  </div>
               </div>

               <button style={{ width: '100%', background: 'var(--foreground)', color: 'var(--background)', padding: '0.8rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Manage Billing (Stripe)
               </button>
            </div>

            <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: '2rem 0 0 0', border: '1px solid var(--primary)' }}>
               <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Settlement & Payout Account</h2>
                <BankingManager 
                  tenantId={tenantId}
                  initialBankName={tenant?.bankName || ""}
                  initialBSB={tenant?.bsb || ""}
                  initialAccountNumber={tenant?.accountNumber || ""}
                  initialHistory={tenant?.bankHistory || []}
                />
            </div>
         </aside>
      </div>
    </>
  );
}
