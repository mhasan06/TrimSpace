"use client";

import { useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize browser-safe client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_ANON_KEY"
);

export default function ImageUpload({ 
    tenantId, 
    currentImage, 
    onUploadSuccess,
    label = "Upload Image",
    height = "200px"
}: { 
    tenantId: string, 
    currentImage: string, 
    onUploadSuccess: (url: string) => void,
    label?: string,
    height?: string
}) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ─── QUALITY CONTROL CHECKS ───
    
    // 1. File Size Check (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image quality is too high (file too large). Please limit to 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
    }

    setUploading(true);
    setStatus("Processing...");

    setStatus("Optimizing...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `shop-profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      onUploadSuccess(data.publicUrl);
      setStatus("Done!");
      setTimeout(() => setStatus(null), 2000);
    } catch (error: any) {
      alert("Upload failed: " + error.message);
      setStatus(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: '0.2rem' }}>
      <div style={{ 
        width: '100%', 
        height: height, 
        background: 'rgba(255,255,255,0.03)', 
        border: '1px dashed var(--border)', 
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }} 
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      onClick={() => fileInputRef.current?.click()}>
        
        {currentImage && (
            <img src={currentImage} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploading ? 0.2 : 0.6, position: 'absolute' }} />
        )}

        {uploading ? (
            <div style={{ textAlign: 'center', zIndex: 1 }}>
                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '20px', height: '20px', margin: '0 auto 0.5rem', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700 }}>{status}</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        ) : (
            <div style={{ textAlign: 'center', zIndex: 1, padding: '1rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem', opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <p style={{ fontSize: '0.75rem', fontWeight: 800 }}>{label}</p>
                <p style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.2rem' }}>JPG, PNG or WEBP</p>
            </div>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleUpload} 
        accept="image/*"
      />
    </div>
  );
}
