// TrustBuild Mobile App - WebView-based
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  BackHandler,
  Platform,
  Alert,
  Linking as RNLinking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import * as ExpoLinking from 'expo-linking';
import Constants from 'expo-constants';

import { config } from './config';
import { LoadingScreen } from './src/components/LoadingScreen';
import { ErrorScreen } from './src/components/ErrorScreen';
import { OfflineNotice } from './src/components/OfflineNotice';
import { useNetworkStatus } from './src/hooks/useNetworkStatus';
import { secureStorage, appStorage } from './src/services/storage';
import notifications, {
  registerForPushNotificationsAsync,
  sendPushTokenToServer,
} from './src/services/notifications';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Message types from WebView
interface WebViewMessage {
  type: string;
  payload?: any;
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(config.webAppUrl);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  // Handle back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        
        // Confirm exit
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit TrustBuild?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url && webViewRef.current) {
        const path = url.replace(`${config.scheme}://`, '');
        const fullUrl = `${config.webAppUrl}/${path}`;
        webViewRef.current.injectJavaScript(`window.location.href = '${fullUrl}'`);
      }
    };

    // Handle initial deep link
    ExpoLinking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Listen for deep links while app is open
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // Initialize app - load stored auth and setup notifications
  const initializeApp = async () => {
    try {
      // Load stored auth token
      const storedToken = await secureStorage.getAuthToken();
      if (storedToken) {
        setAuthToken(storedToken);
      }

      // Register for push notifications
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && storedToken) {
        await sendPushTokenToServer(pushToken);
      }

      // Setup notification listeners
      const notificationSubscription = notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      const responseSubscription = notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.url && webViewRef.current) {
            webViewRef.current.injectJavaScript(
              `window.location.href = '${data.url}'`
            );
          }
        }
      );

      // Check for notification that opened the app
      const lastResponse = await notifications.getLastNotificationResponse();
      if (lastResponse) {
        const data = lastResponse.notification.request.content.data;
        if (data?.url) {
          setCurrentUrl(`${config.webAppUrl}${data.url}`);
        }
      }

      return () => {
        notificationSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  // Handle messages from WebView
  const handleWebViewMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'AUTH_TOKEN':
          // Store auth token from web app
          if (message.payload?.token) {
            await secureStorage.setAuthToken(message.payload.token);
            setAuthToken(message.payload.token);
            
            // Send push token to server now that we're authenticated
            const pushToken = await appStorage.getPushToken();
            if (pushToken) {
              await sendPushTokenToServer(pushToken);
            }
          }
          break;
          
        case 'LOGOUT':
          // Clear stored data
          await secureStorage.clearAll();
          await appStorage.clearAll();
          setAuthToken(null);
          break;
          
        case 'SHARE':
          // Handle share intent
          if (message.payload?.url || message.payload?.text) {
            // Share functionality would go here
            console.log('Share requested:', message.payload);
          }
          break;
          
        case 'OPEN_EXTERNAL':
          // Open external URL in browser
          if (message.payload?.url) {
            RNLinking.openURL(message.payload.url);
          }
          break;
          
        case 'NAVIGATE':
          // Navigate to specific screen
          if (message.payload?.url && webViewRef.current) {
            webViewRef.current.injectJavaScript(
              `window.location.href = '${message.payload.url}'`
            );
          }
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  }, []);

  // Navigation state changed
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  }, []);

  // WebView loaded
  const handleLoadEnd = useCallback(async () => {
    setIsLoading(false);
    setHasError(false);
    await SplashScreen.hideAsync();
    
    // Inject auth token if available
    if (authToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        try {
          localStorage.setItem('auth_token', '${authToken}');
          console.log('Auth token injected from mobile app');
        } catch (e) {
          console.error('Failed to inject auth token:', e);
        }
      `);
    }
  }, [authToken]);

  // WebView error
  const handleError = useCallback(async (error: any) => {
    console.error('WebView error:', error);
    setHasError(true);
    setErrorMessage(error.nativeEvent?.description || 'Failed to load the app');
    await SplashScreen.hideAsync();
  }, []);

  // Retry loading
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  // JavaScript to inject into WebView for communication
  const injectedJavaScript = `
    (function() {
      // Create bridge for communication with native app
      window.TrustBuildMobile = {
        sendMessage: function(type, payload) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
        },
        isApp: true,
        platform: '${Platform.OS}',
        version: '${Constants.expoConfig?.version || '1.0.0'}',
        // Open external URL in system browser
        openExternal: function(url) {
          this.sendMessage('OPEN_EXTERNAL', { url: url });
        },
      };
      
      // Intercept token storage
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = function(key, value) {
        if (key === 'auth_token') {
          window.TrustBuildMobile.sendMessage('AUTH_TOKEN', { token: value });
        }
        return originalSetItem(key, value);
      };
      
      // Intercept token removal (logout)
      const originalRemoveItem = localStorage.removeItem.bind(localStorage);
      localStorage.removeItem = function(key) {
        if (key === 'auth_token') {
          window.TrustBuildMobile.sendMessage('LOGOUT', {});
        }
        return originalRemoveItem(key);
      };
      
      // Override window.open to stay in WebView for internal links
      const originalOpen = window.open;
      window.open = function(url, target, features) {
        if (url) {
          try {
            const urlObj = new URL(url, window.location.origin);
            const currentHost = window.location.hostname.replace(/^www\./, '');
            const targetHost = urlObj.hostname.replace(/^www\./, '');
            
            // Check if it's an internal link or allowed domain
            if (targetHost === currentHost || 
                targetHost.endsWith('.' + currentHost) ||
                targetHost.endsWith('.stripe.com') ||
                targetHost === 'stripe.com') {
              // Navigate within WebView
              window.location.href = url;
              return null;
            }
          } catch (e) {
            console.warn('Failed to parse URL in window.open:', url);
          }
          
          // External URL - open in system browser
          window.TrustBuildMobile.openExternal(url);
          return null;
        }
        return originalOpen.call(window, url, target, features);
      };
      
      // Handle link clicks that might open in new window
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.target === '_blank') {
          const href = link.href;
          if (href) {
            try {
              const urlObj = new URL(href, window.location.origin);
              const currentHost = window.location.hostname.replace(/^www\./, '');
              const targetHost = urlObj.hostname.replace(/^www\./, '');
              
              // Internal links should stay in WebView
              if (targetHost === currentHost || targetHost.endsWith('.' + currentHost)) {
                e.preventDefault();
                window.location.href = href;
                return;
              }
            } catch (err) {
              console.warn('Failed to parse link URL:', href);
            }
          }
        }
      }, true);
      
      // Notify web app that it's running in mobile container
      window.dispatchEvent(new CustomEvent('trustbuild-mobile-ready', {
        detail: { platform: '${Platform.OS}', version: '${Constants.expoConfig?.version || '1.0.0'}' }
      }));
      
      console.log('TrustBuild Mobile bridge initialized');
    })();
    true;
  `;

  // Handle URL requests to determine if they should open externally
  const shouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;
    
    // Allow about: and blob: URLs
    if (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) {
      return true;
    }
    
    // Handle special schemes (tel:, mailto:, etc.) - open in system handler
    if (url.startsWith('tel:') || url.startsWith('mailto:') || url.startsWith('sms:')) {
      RNLinking.openURL(url);
      return false;
    }
    
    // Parse URLs to check domain
    try {
      const requestUrl = new URL(url);
      const appUrl = new URL(config.webAppUrl);
      const apiUrl = new URL(config.apiUrl);
      
      // Allow navigation within the app domain (including www and subdomains)
      const appDomain = appUrl.hostname.replace(/^www\./, '');
      const apiDomain = apiUrl.hostname.replace(/^www\./, '');
      const requestDomain = requestUrl.hostname.replace(/^www\./, '');
      
      // Check if request is to the same domain, a subdomain, or API domain
      if (requestDomain === appDomain || 
          requestDomain.endsWith(`.${appDomain}`) ||
          requestDomain === apiDomain ||
          requestDomain.endsWith(`.${apiDomain}`)) {
        return true;
      }
      
      // Also allow localhost and local development
      if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
        return true;
      }
      
      // Allow Stripe payment URLs to stay in WebView for better UX
      if (requestDomain === 'js.stripe.com' || 
          requestDomain === 'checkout.stripe.com' ||
          requestDomain.endsWith('.stripe.com') ||
          requestDomain === 'stripe.com') {
        return true;
      }
      
      // Allow Google OAuth/authentication URLs
      if (requestDomain === 'accounts.google.com' ||
          requestDomain.endsWith('.google.com')) {
        return true;
      }
      
    } catch (e) {
      // If URL parsing fails, allow navigation
      console.warn('Failed to parse URL:', url);
      return true;
    }
    
    // Open external URLs in system browser (e.g., social media, maps, etc.)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      RNLinking.openURL(url);
      return false;
    }
    
    return true;
  }, []);

  // Show error screen
  if (hasError && !isOffline) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
        <ErrorScreen
          title="Connection Error"
          message={errorMessage || 'Failed to connect to TrustBuild. Please check your internet connection and try again.'}
          onRetry={handleRetry}
          showDetails={__DEV__}
          error={errorMessage}
        />
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      <OfflineNotice onRetry={handleRetry} />
      
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={(error) => {
          if (error.nativeEvent.statusCode >= 400) {
            handleError(error);
          }
        }}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={config.webview.javaScriptEnabled}
        domStorageEnabled={config.webview.domStorageEnabled}
        allowFileAccess={config.webview.allowFileAccess}
        allowFileAccessFromFileURLs={config.webview.allowFileAccessFromFileURLs}
        mediaPlaybackRequiresUserAction={config.webview.mediaPlaybackRequiresUserAction}
        allowsInlineMediaPlayback={config.webview.allowsInlineMediaPlayback}
        mixedContentMode={config.webview.mixedContentMode}
        startInLoadingState={true}
        renderLoading={() => <LoadingScreen message="Loading TrustBuild..." />}
        pullToRefreshEnabled={true}
        allowsBackForwardNavigationGestures={true}
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={['*']}
        userAgent={`TrustBuild/${Constants.expoConfig?.version || '1.0.0'} (${Platform.OS})`}
      />
      
      {isLoading && !hasError && (
        <View style={styles.loadingOverlay}>
          <LoadingScreen message="Connecting to TrustBuild..." />
        </View>
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a365d',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
