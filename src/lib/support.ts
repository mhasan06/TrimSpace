import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * ARCHITECTURAL CORE: Administrative Impersonation Logic
 * This helper resolves the correct tenant identity for the current request.
 * If a Platform Admin is in "Support Mode", it swaps the context to the target shop.
 */
export async function getActiveTenantContext() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  
  if (!session?.user) return null;

  const user = session.user as any;
  const impersonateId = cookieStore.get("trimspace_support_tenant_id")?.value;

  // SECURITY PROTOCOL: Impersonation only allowed if user is a verified PLATFORM ADMIN
  if (user.role === "ADMIN" && impersonateId) {
    const targetShop = await prisma.tenant.findUnique({
      where: { id: impersonateId },
      select: { name: true, id: true }
    });

    if (targetShop) {
      return {
        tenantId: targetShop.id,
        tenantName: targetShop.name,
        isSupportMode: true,
        realAdminName: user.name,
        realAdminId: user.id
      };
    }
  }

  // Fallback to standard shop owner context
  return {
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    isSupportMode: false,
    realAdminName: user.name,
    realAdminId: user.id
  };
}
