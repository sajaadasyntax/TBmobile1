# TrustBuild Mobile App

A React Native mobile app for TrustBuild built with Expo SDK 54 using a WebView approach for rapid development and consistent user experience across platforms.

## Features

- 📱 **WebView-based** - Consistent UI with the web app
- 🔐 **Secure Authentication** - Token persistence via SecureStore
- 🔔 **Push Notifications** - Real-time alerts for job updates, messages
- 📴 **Offline Support** - Graceful offline handling with retry
- 🔗 **Deep Linking** - Open specific screens via `trustbuild://` links
- ⬅️ **Native Navigation** - Back button and gesture support
- 🎨 **Native Splash Screen** - Branded loading experience

## Prerequisites

- Node.js >= 20.x
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) for building
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Configuration

1. **Update config.ts** with your production URLs:

```typescript
export const config = {
  webAppUrl: 'https://trustbuild.uk',
  apiUrl: 'https://api.trustbuild.uk',
  // ...
};
```

2. **Update app.json** with your app identifiers:
   - `ios.bundleIdentifier`
   - `android.package`
   - `extra.eas.projectId`

3. **For push notifications**, configure:
   - iOS: Add your APNs key in EAS
   - Android: Add `google-services.json` from Firebase

## Building for Production

### Setup EAS Build

```bash
# Login to Expo
eas login

# Configure project
eas build:configure
```

### Build APK (Android)

```bash
# Preview APK (for testing)
eas build --profile preview --platform android

# Production AAB (for Play Store)
eas build --profile production --platform android
```

### Build IPA (iOS)

```bash
# Development build
eas build --profile development --platform ios

# Production build
eas build --profile production --platform ios
```

## Project Structure

```
mobile/
├── App.tsx                 # Main app component with WebView
├── config.ts               # App configuration
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── assets/                # App icons and images
│   ├── icon.png
│   ├── adaptive-icon.png
│   ├── splash-icon.png
│   └── favicon.png
└── src/
    ├── components/        # React components
    │   ├── LoadingScreen.tsx
    │   ├── ErrorScreen.tsx
    │   └── OfflineNotice.tsx
    ├── services/          # Business logic
    │   ├── storage.ts     # Secure storage service
    │   └── notifications.ts # Push notification service
    └── hooks/             # Custom React hooks
        └── useNetworkStatus.ts
```

## WebView-Web App Communication

The app establishes a bridge with the web app for:

### From Web App → Mobile

```javascript
// Web app can send messages to mobile
if (window.TrustBuildMobile) {
  window.TrustBuildMobile.sendMessage('SHARE', { url: '...', text: '...' });
}
```

### Message Types

| Type | Description |
|------|-------------|
| `AUTH_TOKEN` | Auth token stored/updated |
| `LOGOUT` | User logged out |
| `SHARE` | Share content request |
| `OPEN_EXTERNAL` | Open URL in system browser |
| `NAVIGATE` | Navigate to specific route |

### Checking if Running in App

```javascript
// In your web app
if (window.TrustBuildMobile?.isApp) {
  console.log('Running in mobile app');
  console.log('Platform:', window.TrustBuildMobile.platform);
  console.log('Version:', window.TrustBuildMobile.version);
}

// Or listen for the ready event
window.addEventListener('trustbuild-mobile-ready', (event) => {
  console.log('Mobile app ready:', event.detail);
});
```

## Deep Linking

The app supports deep links with the `trustbuild://` scheme:

| URL | Opens |
|-----|-------|
| `trustbuild://` | Home screen |
| `trustbuild://dashboard` | Dashboard |
| `trustbuild://jobs/123` | Job details |
| `trustbuild://messages` | Messages |

## Environment Variables

Configure in `eas.json` or via EAS secrets:

```bash
# Set EAS secrets
eas secret:create --name API_URL --value "https://api.trustbuild.uk"
```

## Troubleshooting

### Common Issues

1. **WebView not loading**
   - Check network connectivity
   - Verify `config.webAppUrl` is correct
   - Ensure web app allows embedding (CSP headers)

2. **Push notifications not working**
   - Verify Firebase/APNs configuration
   - Check notification permissions
   - Ensure device is physical (not emulator)

3. **Build failures**
   - Run `expo doctor` to check for issues
   - Clear cache: `npm start -- --clear`
   - Check EAS build logs

### Debug Mode

In development, additional error information is shown. Set `showDetails={__DEV__}` in ErrorScreen for production debugging.

## Contributing

1. Create a feature branch
2. Make changes
3. Test on both Android and iOS
4. Submit a pull request

## License

Proprietary - TrustBuild Ltd

