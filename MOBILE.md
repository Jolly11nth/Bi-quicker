# Bi-quicker mobile app

Bi-quicker is now configured for Capacitor so the existing React/Vite application can be packaged as native Android and iOS applications while continuing to use the same web codebase and Railway API.

## Requirements

- Node.js 22+
- Android Studio for Android builds
- macOS + Xcode for iOS builds

## Install

```bash
npm install
```

## Add native platforms

Run each command once when setting up a fresh checkout:

```bash
npm run mobile:add:android
npm run mobile:add:ios
```

The commands generate the native `android/` and `ios/` projects from the Capacitor configuration. These platform projects should then be committed to the repository so native app configuration, signing settings, icons, and store metadata can be versioned.

## Build and sync web assets

```bash
npm run build
npx cap sync
```

Or:

```bash
npm run mobile:build
```

## Open native projects

```bash
npm run mobile:open:android
npm run mobile:open:ios
```

## App identity

- App name: `Bi-quicker`
- Android/iOS application ID: `com.biquicker.app`
- Web build directory: `dist`

## Backend

The native apps use the same frontend API configuration as the web application. For production, the API must be reachable over HTTPS from the device.

Do not put Paystack secret keys or other backend secrets in the mobile application. Payment initialization and verification remain server-side through the Railway backend.
