// TrustBuild Mobile App Configuration

export const config = {
  // Web app URL - change this to your production URL
  webAppUrl: __DEV__ 
    ? 'http://localhost:3000' // Development URL
    : 'https://trustbuild.uk', // Production URL
  
  // API base URL
  apiUrl: __DEV__
    ? 'http://localhost:3001'
    : 'https://api.trustbuild.uk',
  
  // App information
  appName: 'TrustBuild',
  appVersion: '1.0.0',
  
  // Deep linking scheme
  scheme: 'trustbuild',
  
  // Notification configuration
  notifications: {
    channelId: 'trustbuild-notifications',
    channelName: 'TrustBuild Notifications',
    channelDescription: 'Job updates, messages, and important alerts',
  },
  
  // Session timeout (24 hours in milliseconds)
  sessionTimeout: 24 * 60 * 60 * 1000,
  
  // WebView settings
  webview: {
    allowFileAccess: true,
    allowFileAccessFromFileURLs: true,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
    mixedContentMode: 'compatibility' as const,
  },
};

export default config;

