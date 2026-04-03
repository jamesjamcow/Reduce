import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { TextInput } from '@/src/components/ui/TextInput';
import { Button } from '@/src/components/ui/Button';
import { loadDirectApiKey, saveDirectApiKey } from '@/src/services/settings';
import { enqueueSampleShare, processPendingQueue } from '@/src/services/queue';
import { useAppStore } from '@/src/stores/appStore';
import { palette, spacing } from '@/src/theme/palette';

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
      <Card style={styles.block}>
        <Text style={styles.title}>AI routing</Text>
        <Text style={styles.copy}>
          V1 assumes a proxy-backed free tier first. If you add your own Gemini key, the app can switch to direct mode later.
        </Text>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Prefer direct API</Text>
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

      <Card style={styles.block}>
        <Text style={styles.title}>MVP controls</Text>
        <Text style={styles.copy}>
          Use this to simulate the screenshot funnel without wiring the native share extension on a real device yet.
        </Text>
        <Button label="Run Demo Pipeline" onPress={handleDemoPipeline} loading={busy} />
      </Card>

      <Card style={styles.block}>
        <Text style={styles.title}>Platform notes</Text>
        <Text style={styles.copy}>Share extension, ML Kit OCR, and calendar writes are stubbed for local generation and can be hardened on device builds.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 20,
  },
  copy: {
    color: palette.muted,
    lineHeight: 22,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
