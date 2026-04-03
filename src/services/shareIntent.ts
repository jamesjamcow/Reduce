import { DeviceEventEmitter, NativeModules } from 'react-native';

import { analyzeCapture } from '@/src/services/ai';
import { mockOcrFromImage } from '@/src/services/ocr';
import { useAppStore } from '@/src/stores/appStore';

type ShareIntentNativeModule = {
  consumeSharedImage?: () => Promise<string | null>;
};

const nativeModule = NativeModules.ShareIntentModule as ShareIntentNativeModule | undefined;
const androidShareEventName = 'ReduceShareIntent';

async function reviewSharedImage(uri: string) {
  const rawOcrText = await mockOcrFromImage(uri);
  const parsed = await analyzeCapture(rawOcrText, 'Imported from Android share sheet.');
  useAppStore.getState().setPendingReview(parsed);
  return parsed;
}

export async function consumeInitialSharedImage() {
  const uri = await nativeModule?.consumeSharedImage?.();
  if (!uri) return null;
  return reviewSharedImage(uri);
}

export function subscribeToSharedImages(onShared: () => void) {
  const subscription = DeviceEventEmitter.addListener(androidShareEventName, async (uri: string) => {
    if (!uri) return;
    await reviewSharedImage(uri);
    onShared();
  });

  return () => {
    subscription.remove();
  };
}
