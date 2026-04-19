# TrimSpace Mobile: Native App Setup Guide (Android & iOS)

This guide explains how to transform the TrimSpace web application into native Android and Apple applications using **Capacitor**.

## 1. Prerequisites
*   **A Mac** (Required for the Apple App Store / iOS build).
*   **Xcode** (Installed on Mac).
*   **Android Studio** (For the Google Play Store / Android build).
*   **Capacitor CLI**:
    ```bash
    npm install @capacitor/core @capacitor/cli
    ```

## 2. Initialize Mobile Platforms
Run these commands in your project root:
```bash
npx cap init
npx cap add ios
npx cap add android
```

## 3. Configuration for "Live Sync"
Your `capacitor.config.ts` has been pre-configured. Ensure the `server.url` points to your live deployment (e.g., Vercel). This allows:
1.  **NextAuth** to persist sessions natively.
2.  **Server Actions** to execute across the mobile bridge.
3.  **Instant Updates**: Changes you push to the web will appear in the app instantly without a store update.

## 4. Building the Binaries

### Apple (iOS)
1.  Run `npx cap open ios`.
2.  In Xcode, select your Team and App Bundle ID.
3.  Press the **Play** button to run on a simulator or physical iPhone.

### Android
1.  Run `npx cap open android`.
2.  In Android Studio, allow the Gradle sync to complete.
3.  Press **Run** to launch on an emulator or physical device.

## 5. PWA (The Instant Experience)
The project also includes a `manifest.json`. You can "Install" the app directly from Chrome (Android) or Safari (iOS -> Share -> Add to Home Screen) even without using the native stores.

---
**Note:** For Production deployment, you will need an Apple Developer Account ($99/yr) and a Google Play Console Account ($25 one-time).
