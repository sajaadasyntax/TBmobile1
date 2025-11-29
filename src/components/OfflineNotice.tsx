// Offline notice banner component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineNoticeProps {
  onRetry?: () => void;
}

export function OfflineNotice({ onRetry }: OfflineNoticeProps) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  const isOffline = !isConnected || isInternetReachable === false;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          transform: [{ translateY: slideAnim }],
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📶</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>
            Please check your connection and try again
          </Text>
        </View>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ef4444',
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#fecaca',
    fontSize: 13,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineNotice;

