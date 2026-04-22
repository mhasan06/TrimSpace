export async function uploadFile(bucket: string, path: string, blob: any, contentType: string): Promise<string> {
  const { createClient } = require('@supabase/supabase-js');
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const client = createClient(sUrl, sKey);

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true
    });

  if (error) {
    console.error(`Storage Upload Error (${bucket}):`, error);
    throw new Error(`Failed to upload ${path} to ${bucket}: ${error.message}`);
  }

  const { data: { publicUrl } } = client.storage
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
