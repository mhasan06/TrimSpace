"use client";

import { useState, useRef } from "react";
import { uploadImageAction } from "@/app/actions/upload";

export default function ImageUpload({ 
    tenantId, 
    currentImage, 
    onUploadSuccess,
    label = "Upload Image",
    height = "120px"
}: { 
    tenantId: string, 
    currentImage: string, 
    onUploadSuccess: (url: string) => void,
    label?: string,
    height?: string
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);

      const result = await uploadImageAction(formData);
      onUploadSuccess(result.url);
    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{ 
          width: '100%', 
          height: '100%', 
          border: '2px dashed #e2e8f0', 
          borderRadius: '12px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#f8fafc',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
      >
        {currentImage && !uploading && (
          <img src={currentImage} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
        )}
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', background: currentImage ? 'rgba(255,255,255,0.8)' : 'transparent', padding: '0.5rem', borderRadius: '8px' }}>
          {uploading ? (
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1' }}>Uploading...</p>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem' }}>📷</span>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>{label}</p>
            </>
          )}
        </div>
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
