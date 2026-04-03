import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import 'react-native-get-random-values';
import '../global.css';

import { initializeDatabase } from '@/src/db/client';
import { markPastRemindersSent, seedDemoData } from '@/src/db/repository';
import { requestNotificationPermissions } from '@/src/services/notifications';
import { processPendingQueue } from '@/src/services/queue';
import { consumeInitialSharedImage, subscribeToSharedImages } from '@/src/services/shareIntent';
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

  useEffect(() => {
    if (!initialized) return;

    let active = true;

    consumeInitialSharedImage().then((parsed) => {
      if (!active || !parsed) return;
      router.push('/review');
    });

    const unsubscribe = subscribeToSharedImages(() => {
      if (!active) return;
      router.push('/review');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialized]);

  if (!loaded || !initialized) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color={palette.ink} size="large" />
        <Text className="font-mono text-[24px] text-ink">Reduce</Text>
        <Text className="text-[14px] text-[#10201b9e]">Loading your network memory.</Text>
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

const styles = {
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
    backgroundColor: palette.canvas,
  },
};
