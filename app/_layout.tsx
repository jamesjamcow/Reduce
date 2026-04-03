import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import 'react-native-get-random-values';

import { initializeDatabase } from '@/src/db/client';
import { markPastRemindersSent, seedDemoData } from '@/src/db/repository';
import { requestNotificationPermissions } from '@/src/services/notifications';
import { processPendingQueue } from '@/src/services/queue';
import { palette } from '@/src/theme/palette';
import { useAppStore } from '@/src/stores/appStore';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const initialized = useAppStore((state) => state.initialized);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded || initialized) return;

    let active = true;
    Promise.all([initializeDatabase(), seedDemoData(), requestNotificationPermissions()])
      .then(() => markPastRemindersSent())
      .then(() => processPendingQueue())
      .then(() => {
        if (!active) return;
        setInitialized(true);
        bumpDataVersion();
      })
      .finally(() => SplashScreen.hideAsync());

    return () => {
      active = false;
    };
  }, [bumpDataVersion, initialized, loaded, setInitialized]);

  if (!loaded || !initialized) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color={palette.ink} size="large" />
        <Text style={styles.title}>Reduce</Text>
        <Text style={styles.subtitle}>Loading your network memory.</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.canvas },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="memory/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+native-intent" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: palette.canvas,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 24,
  },
  subtitle: {
    color: palette.muted,
    fontSize: 14,
  },
});
