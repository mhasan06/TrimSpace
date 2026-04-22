"use client";

import styles from "../app/dashboard/page.module.css";

interface MarketingKitProps {
  shopName: string;
  shopSlug: string;
  shopLogo?: string;
  theme: string; // LUXURY, VINTAGE, MINIMAL
}

export default function MarketingKit({ shopName, shopSlug, shopLogo, theme }: MarketingKitProps) {
  const downloadUrl = `https://trimspace.com.au/book/${shopSlug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(downloadUrl)}&bgcolor=ffffff&color=000000&margin=10`;

  const getThemeStyles = () => {
    switch (theme) {
      case 'LUXURY':
        return {
          accent: '#d4af37', // Gold
          font: 'serif',
          background: '#000000',
          text: '#ffffff'
        };
      case 'VINTAGE':
        return {
          accent: '#7c2d12', // Deep Brown
          font: 'serif',
          background: '#fef3c7',
          text: '#1e1b4b'
        };
      default: // MINIMAL
        return {
          accent: '#6366f1', // Indigo
          font: 'sans-serif',
          background: '#ffffff',
          text: '#111827'
        };
    }
  };

  const t = getThemeStyles();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* UI Preview Header */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Shop Marketing Kit</h1>
          <p style={{ opacity: 0.6, marginTop: '0.2rem' }}>Print these materials and display them in your shop to drive digital bookings.</p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{ 
            background: 'var(--primary)', color: 'black', border: 'none', 
            padding: '1rem 2rem', borderRadius: '16px', fontWeight: 900, 
            cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(var(--primary-rgb), 0.3)'
          }}
        >
          🖨️ Print Marketing Flyer
        </button>
      </div>

      {/* The Printable Flyer */}
      <div id="printable-flyer" style={{ 
        width: '210mm', height: '297mm', // A4
        background: t.background, color: t.text,
        margin: '0 auto', padding: '2rem',
        boxShadow: '0 0 50px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: t.font, position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative Borders for Luxury/Vintage */}
        {theme !== 'MINIMAL' && (
           <div style={{ position: 'absolute', inset: '1rem', border: `2px solid ${t.accent}`, pointerEvents: 'none' }}></div>
        )}

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <div style={{ color: t.accent, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '1rem' }}>
            Powered by TrimSpace
          </div>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
            {shopName}
          </h2>
          <div style={{ width: '80px', height: '4px', background: t.accent, margin: '0 auto' }}></div>
        </div>

        <div style={{ textAlign: 'center', maxWidth: '80%', zIndex: 1 }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: '1.2', marginBottom: '1.5rem' }}>
            Skip the Wait.<br/>
            <span style={{ color: t.accent }}>Book Your Next Cut In Seconds.</span>
          </h3>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, fontWeight: 500 }}>
            Join our exclusive digital community for faster bookings, loyalty rewards, and instant updates.
          </p>
        </div>

        <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 1 }}>
          <img src={qrCodeUrl} alt="QR Code" style={{ width: '250px', height: '250px', display: 'block' }} />
          <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'black' }}>
            <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>Scan to Download</p>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Available on iOS & Android</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${t.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>1</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Scan</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: t.accent, opacity: 0.3 }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${t.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>2</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Download</span>
            </div>
            <div style={{ width: '40px', height: '2px', background: t.accent, opacity: 0.3 }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${t.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>3</div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Book</span>
            </div>
          </div>
        </div>

        <div style={{ opacity: 0.3, fontSize: '0.7rem', fontWeight: 700, textAlign: 'center' }}>
          www.trimspace.com.au/book/{shopSlug}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-flyer, #printable-flyer * {
            visibility: visible;
          }
          #printable-flyer {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 2rem;
            box-shadow: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
