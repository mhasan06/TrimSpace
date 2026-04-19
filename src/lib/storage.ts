import { supabaseAdmin } from "./supabase";

/**
 * Uploads a PDF blob to Supabase Storage and returns the public signature URL.
 */
export async function uploadInvoice(appointmentId: string, pdfBlob: Blob): Promise<string> {
  const fileName = `invoice-${appointmentId}.pdf`;
  const bucketName = 'invoices';

  // 1. Upload the file to the 'invoices' bucket
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (error) {
    console.error("Storage Upload Error:", error);
    throw new Error(`Failed to upload invoice to cloud storage: ${error.message}`);
  }

  // 2. Generate a signed URL for secure, long-term access (or public URL if the bucket is public)
  // Here we use a public URL as requested for simplicity, but a signed URL is better for production privacy.
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrl;
}
