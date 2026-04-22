export async function uploadFile(bucket: string, path: string, blob: any, contentType: string): Promise<string> {
  const { createClient } = require('@supabase/supabase-js');
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sKey = (process.env.SUPABASE_ADMIN_KEY || '').trim();
  console.log(`[Storage] Key Length: ${sKey.length}`);
  const client = createClient(sUrl, sKey);

  // Auto-create bucket if it doesn't exist
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.find((b: any) => b.name === bucket)) {
    console.log(`[Storage] Creating bucket: ${bucket}`);
    await client.storage.createBucket(bucket, { public: true });
  }

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
