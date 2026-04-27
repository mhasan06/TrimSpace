const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://vtyljcccdgsmwxtihucs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eWxqY2NjZGdzbXd4dGlodWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgyMDMwNiwiZXhwIjoyMDkxMzk2MzA2fQ.hot9M6JsB1k46DdEW4cI1hfuyTzufGtYjAjxfPIRIps";

const supabase = createClient(supabaseUrl, supabaseKey);

async function initStorage() {
  console.log("Checking storage buckets...");
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const bucketName = 'public-assets';
  const exists = buckets.find(b => b.name === bucketName);

  if (!exists) {
    console.log(`Creating bucket: ${bucketName}...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log("Bucket created successfully!");
    }
  } else {
    console.log(`Bucket '${bucketName}' already exists.`);
  }
}

initStorage();
