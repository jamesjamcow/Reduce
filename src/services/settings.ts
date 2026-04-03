import * as SecureStore from 'expo-secure-store';

const DIRECT_API_KEY = 'reduce.direct-api-key';

export async function saveDirectApiKey(value: string) {
  await SecureStore.setItemAsync(DIRECT_API_KEY, value.trim());
}

export async function loadDirectApiKey() {
  return SecureStore.getItemAsync(DIRECT_API_KEY);
}
