import styles from "./page.module.css";
import { prisma } from "@/lib/prisma";
import ShopDiscovery from "@/components/ShopDiscovery";

export default async function Home() {
  // BUILD_PING_VERIFY_DEPLOY_SYNC_1025
  // 1. Fetch real tenants
  const realTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // 2. High-End Mockups for "New SaaS" Social Proof (to reach a total of ~20)
  // These represent the "FeaturedPartners" that a new SaaS would highlight
  const demoPartners = [
    { id: "d1", name: "The Gentleman's Lounge", slug: "josh-barbershop", category: "BARBER", address: "Bondi Beach, NSW", shopImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d2", name: "Modern Man Studio", slug: "josh-barbershop", category: "BARBER", address: "Surry Hills, NSW", shopImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80", rating: "4.9" },
    { id: "d3", name: "Luxury Aesthetics Spa", slug: "josh-barbershop", category: "SPA", address: "Double Bay, NSW", shopImage: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d4", name: "Vanguard Hair Design", slug: "josh-barbershop", category: "SALON", address: "Paddington, NSW", shopImage: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80", rating: "4.8" },
    { id: "d5", name: "Obsidian Grooming", slug: "josh-barbershop", category: "BARBER", address: "Barangaroo, NSW", shopImage: "https://images.unsplash.com/photo-1512690196252-784826d4b042?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d6", name: "Serenity Wellness Center", slug: "josh-barbershop", category: "SPA", address: "Mosman, NSW", shopImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80", rating: "4.9" },
    { id: "d7", name: "Golden Scissor Studio", slug: "josh-barbershop", category: "SALON", address: "Manly, NSW", shopImage: "https://images.unsplash.com/photo-1599351431202-1e0f01318992?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d8", name: "The Grooming Room", slug: "josh-barbershop", category: "BARBER", address: "Newtown, NSW", shopImage: "https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?auto=format&fit=crop&q=80", rating: "4.7" },
    { id: "d9", name: "Elysian Retreat", slug: "josh-barbershop", category: "SPA", address: "Potts Point, NSW", shopImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d10", name: "Urban Edge Barbers", slug: "josh-barbershop", category: "BARBER", address: "Darlinghurst, NSW", shopImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80", rating: "4.8" },
    { id: "d11", name: "Aura Hair & Beauty", slug: "josh-barbershop", category: "SALON", address: "Pyrmont, NSW", shopImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80", rating: "4.9" },
    { id: "d12", name: "Iron & Ink Barber", slug: "josh-barbershop", category: "BARBER", address: "Alexandria, NSW", shopImage: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d13", name: "The Skin Sanctuary", slug: "josh-barbershop", category: "SPA", address: "Rose Bay, NSW", shopImage: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80", rating: "4.7" },
    { id: "d14", name: "Crown & Co Barbers", slug: "josh-barbershop", category: "BARBER", address: "Edgecliff, NSW", shopImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80", rating: "5.0" },
    { id: "d15", name: "Velvet Rope Nails", slug: "josh-barbershop", category: "SALON", address: "Woollahra, NSW", shopImage: "https://images.unsplash.com/photo-1604654894610-df490998710c?auto=format&fit=crop&q=80", rating: "4.8" }
  ];

  // Combine real data with strategically chosen demo data for a robust marketplace feel
  const allTenants = [
      ...realTenants.map(t => ({ ...t, isLive: true })), 
      ...demoPartners.map(t => ({ ...t, isLive: false }))
  ].map(t => ({
      ...t,
      isActive: true,
      rating: (t as any).rating || "5.0"
  })).slice(0, 24); // Show up to 24 for a clean 4-column grid

  return (
    <main className={styles.main}>
      <div style={{ background: 'red', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 900, fontSize: '2rem', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999 }}>
        BUILD V2.1 - DEPLOYMENT TEST ACTIVE
      </div>
      <ShopDiscovery initialTenants={allTenants} />
    </main>
  );
}
