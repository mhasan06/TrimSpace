"use server";

import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function uploadImageAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { error: "Unauthorized: Please log in again." };

    const file = formData.get("file");
    const tenantId = formData.get("tenantId") as string;
    
    if (!file || !(file instanceof Blob)) {
        console.error("Upload Error: No valid file object found in FormData", typeof file);
        return { error: "No valid image file received." };
    }

    const fileObj = file as File;
    const fileName = fileObj.name || "unnamed-file.jpg";
    const fileSize = fileObj.size;
    const fileType = fileObj.type || "image/jpeg";

    console.log(`[UPLOAD DEBUG] Tenant: ${tenantId}, File: ${fileName}, Size: ${fileSize}, Type: ${fileType}`);

    if (fileSize > 5 * 1024 * 1024) {
        return { error: "File too large. Max limit is 5MB." };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ADMIN_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("CRITICAL: Supabase environment variables are missing.");
        return { error: "Server configuration error: Missing storage credentials." };
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const fileExt = fileName.split('.').pop() || 'jpg';
    const uniquePath = `${tenantId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `shop-profiles/${uniquePath}`;

    // Robust buffer conversion
    let buffer: Buffer;
    try {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    } catch (e: any) {
        console.error("Buffer Conversion Failed:", e);
        return { error: "Failed to process image data on server." };
    }

    const { data, error } = await supabaseAdmin.storage
      .from('public-assets')
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: true
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      // Fallback: If public-assets doesn't exist, try creating it or using a default
      return { error: `Storage Error: ${error.message}` };
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('public-assets')
      .getPublicUrl(filePath);

    return { url: publicUrl };

  } catch (err: any) {
    console.error("Upload Action Critical Crash:", err);
    return { error: "An unexpected system error occurred during upload." };
  }
}
