import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MarketingKit from "@/components/MarketingKit";

export default async function MarketingPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    redirect("/login");
  }

  const shop = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      slug: true,
      templateId: true,
      enabledFeatures: true,
    }
  });

  if (!shop) {
    redirect("/dashboard");
  }

  // Check if Marketing feature is enabled for this shop
  const enabledFeatures = (shop.enabledFeatures as string[]) || [];
  if (!enabledFeatures.includes("MARKETING")) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>Feature Restricted</h2>
        <p style={{ opacity: 0.6, marginTop: '1rem' }}>The Marketing Kit is currently not enabled for your account. Please contact TrimSpace Admin.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <MarketingKit 
        shopName={shop.name}
        shopSlug={shop.slug}
        theme={shop.templateId || 'LUXURY'}
      />
    </div>
  );
}
