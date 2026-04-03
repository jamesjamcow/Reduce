import { useEffect, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { TextInput } from '@/src/components/ui/TextInput';
import { Button } from '@/src/components/ui/Button';
import { loadDirectApiKey, saveDirectApiKey } from '@/src/services/settings';
import { enqueueSampleShare, processPendingQueue } from '@/src/services/queue';
import { useAppStore } from '@/src/stores/appStore';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [useDirectApi, setUseDirectApi] = useState(false);
  const [busy, setBusy] = useState(false);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);

  useEffect(() => {
    loadDirectApiKey().then((value) => {
      if (value) {
        setApiKey(value);
        setUseDirectApi(true);
      }
    });
  }, []);

  async function handleSaveKey() {
    await saveDirectApiKey(apiKey);
    Alert.alert('Saved', 'Direct Gemini key stored locally in Secure Store.');
  }

  async function handleDemoPipeline() {
    setBusy(true);
    await enqueueSampleShare();
    await processPendingQueue();
    bumpDataVersion();
    setBusy(false);
  }

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[20px] text-ink">AI routing</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          V1 assumes a proxy-backed free tier first. If you add your own Gemini key, the app can switch to direct mode later.
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-ink">Prefer direct API</Text>
          <Switch value={useDirectApi} onValueChange={setUseDirectApi} />
        </View>
        <TextInput
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Paste your Gemini API key"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button label="Save Key" onPress={handleSaveKey} />
      </Card>

      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[20px] text-ink">MVP controls</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          Use this to simulate the screenshot funnel without wiring the native share extension on a real device yet.
        </Text>
        <Button label="Run Demo Pipeline" onPress={handleDemoPipeline} loading={busy} />
      </Card>

      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[20px] text-ink">Platform notes</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          Share extension, ML Kit OCR, and calendar writes are stubbed for local generation and can be hardened on device builds.
        </Text>
      </Card>
    </Screen>
  );
}
