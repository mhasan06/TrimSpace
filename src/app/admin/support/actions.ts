"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * TRIGGER: Activate Secure Impersonation
 */
export async function enableSupportSessionAction(tenantId: string) {
  const session = await getServerSession(authOptions);
  
  // PLATFORM SECURITY: Prevent non-admins from triggering impersonation
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED: Only Platform Admins can initiate remote support sessions.");
  }

  const cookieStore = await cookies();
  cookieStore.set("trimspace_support_tenant_id", tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600 // 1 hour support window
  });

  // Redirect to the impersonated shop's dashboard
  redirect("/dashboard");
}

/**
 * REVERT: End Remote Support
 */
export async function disableSupportSessionAction() {
  const cookieStore = await cookies();
  cookieStore.delete("trimspace_support_tenant_id");
  
  // Return to the governance portal
  redirect("/admin/shops");
}
