import styles from "./download.module.css";
import Image from "next/image";
import Link from "next/link";

export default function DownloadApp() {
  const mockupUrl = "/trimspace_app_mockup_1776183703964.png";

  return (
    <div className={styles.downloadPage}>
      <div className={styles.contentWrapper}>
        
        {/* Left Side: Content */}
        <div className={styles.textContent}>
          <h1 className={styles.heroTitle}>
            Everything looks<br />
            better in the app.
          </h1>
          <p className={styles.heroSubtitle}>
            Join the world's most advanced booking platform. Discover best-in-class barbers, salons, and spas near you.
          </p>

          <div className={styles.badgeGroup}>
            <img 
               src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
               alt="App Store" 
               className={styles.storeBadge} 
            />
            <img 
               src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
               alt="Google Play" 
               className={styles.storeBadge} 
            />
          </div>

          <div className={styles.qrContainer}>
            <div className={styles.qrCode}>
               <img 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://trimspace.co" 
                 alt="QR Code" 
                 style={{ width: '100%', height: '100%' }}
               />
            </div>
            <div className={styles.qrText}>
              <h4>Scan to download</h4>
              <p>Point your camera to start</p>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
              <Link href="/" style={{ color: 'white', opacity: 0.5, textDecoration: 'none', fontSize: '0.9rem' }}>
                Continue to web version &rarr;
              </Link>
          </div>
        </div>

        {/* Right Side: Visuals */}
        <div className={styles.mockupContainer}>
          <div className={styles.floatingBadge}>#1 Rated App</div>
          <img 
             src={mockupUrl} 
             alt="TrimSpace App Mockup" 
             className={styles.phoneImage} 
          />
        </div>

      </div>
    </div>
  );
}
