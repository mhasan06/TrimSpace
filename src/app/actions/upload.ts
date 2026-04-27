"use server";

import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function uploadImageAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized: Please log in again.");

    const file = formData.get("file") as File;
    const tenantId = formData.get("tenantId") as string;
    
    if (!file) throw new Error("No file was received by the server.");
    if (!tenantId) throw new Error("Tenant ID is missing.");

    // Initialize Supabase inside the action to ensure env vars are checked at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ADMIN_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Supabase environment variables are missing.");
        throw new Error("Server configuration error: Missing storage credentials.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const fileExt = file.name.split('.').pop();
    const fileName = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `shop-profiles/${fileName}`;

    console.log(`Starting upload for tenant ${tenantId}: ${filePath}`);

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
      console.error("Supabase Storage Error:", error);
      throw new Error(`Storage Error: ${error.message}`);
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    console.log(`Upload successful: ${publicUrl}`);
    return { url: publicUrl };

  } catch (err: any) {
    console.error("Upload Action Crash:", err);
    // Re-throw so the client catch block gets it
    throw new Error(err.message || "An internal error occurred during upload.");
  }
}
