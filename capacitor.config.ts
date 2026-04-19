import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.trimspace.app',
  appName: 'TrimSpace',
  webDir: 'out',
  server: {
    // CRITICAL: Point this to your production URL for the "Hybrid" experience
    // This allows NextAuth and Server Actions to work natively.
    url: 'https://your-production-url.vercel.app',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
