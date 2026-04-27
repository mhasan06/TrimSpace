"use server";

import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Secure server-side key
);

export async function uploadImageAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  const tenantId = formData.get("tenantId") as string;
  
  if (!file) throw new Error("No file provided");

  const fileExt = file.name.split('.').pop();
  const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `shop-profiles/${fileName}`;

  // Convert File to Buffer for Supabase upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabaseAdmin.storage
    .from('public-assets')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    console.error("Supabase Upload Error:", error);
    throw new Error(error.message);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('public-assets')
    .getPublicUrl(filePath);

  return { url: publicUrl };
}
