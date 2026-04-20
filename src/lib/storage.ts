import { supabaseAdmin } from "./supabase";

/**
 * Uploads a file blob to a specified Supabase Storage bucket and returns the public URL.
 */
export async function uploadFile(bucket: string, path: string, blob: Blob, contentType: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error("Supabase Admin client not initialized. Check your SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true
    });

  if (error) {
    console.error(`Storage Upload Error (${bucket}):`, error);
    throw new Error(`Failed to upload ${path} to ${bucket}: ${error.message}`);
  }

  if (!supabaseAdmin) throw new Error("Supabase client missing.");

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Uploads a PDF blob to Supabase Storage and returns the public signature URL.
 */
export async function uploadInvoice(appointmentId: string, pdfBlob: Blob): Promise<string> {
  return uploadFile('invoices', `invoice-${appointmentId}.id.pdf`, pdfBlob, 'application/pdf');
}
