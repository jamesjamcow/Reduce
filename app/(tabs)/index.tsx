import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDeferredValue, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { MemoryCard } from '@/src/components/MemoryCard';
import { ProcessingQueue } from '@/src/components/ProcessingQueue';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { TextInput } from '@/src/components/ui/TextInput';
import { useMemories } from '@/src/hooks/useMemories';
import { useQueueItems } from '@/src/hooks/useQueueItems';
import { useSearchResults } from '@/src/hooks/useSearchResults';
import { analyzeCapture } from '@/src/services/ai';
import { mockOcrFromImage } from '@/src/services/ocr';
import { enqueueSampleShare, processPendingQueue } from '@/src/services/queue';
import { useAppStore } from '@/src/stores/appStore';
import { palette, spacing } from '@/src/theme/palette';
import { formatTimestamp } from '@/src/utils/dates';

export default function HomeScreen() {
  const [processing, setProcessing] = useState(false);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setPendingReview = useAppStore((state) => state.setPendingReview);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);

  const deferredSearch = useDeferredValue(searchQuery);
  const memories = useMemories(deferredSearch);
  const queue = useQueueItems();
  const searchResults = useSearchResults(deferredSearch);

  async function handleGalleryReview() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery access needed', 'Allow photo access to run the in-app review flow.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled) return;
    const rawOcrText = await mockOcrFromImage(result.assets[0]?.uri);
    const parsed = await analyzeCapture(rawOcrText, 'Imported from gallery for review.');
    setPendingReview(parsed);
    router.push('/review');
  }

  async function handleProcessQueue() {
    setProcessing(true);
    await processPendingQueue();
    bumpDataVersion();
    setProcessing(false);
  }

  async function handleEnqueueSample() {
    await enqueueSampleShare();
    bumpDataVersion();
  }

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.kicker}>Reduce</Text>
        <Text style={styles.title}>Turn screenshots into follow-through.</Text>
        <Text style={styles.subtitle}>
          Capture loose plans, remember what people are good at, and surface the next move before it slips.
        </Text>
        <View style={styles.heroActions}>
          <Button label="Share Demo" onPress={handleEnqueueSample} />
          <Button label="Review From Gallery" variant="secondary" onPress={handleGalleryReview} />
        </View>
      </Card>

      <View style={styles.searchBlock}>
        <Text style={styles.sectionTitle}>Search your network</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Who hosts hackathons? Who knows Stripe?"
        />
      </View>

      <ProcessingQueue items={queue.value} />

      <Card style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Pipeline</Text>
        <View style={styles.heroActions}>
          <Button label="Process Queue" onPress={handleProcessQueue} loading={processing} />
          <Button label="Manual Memory" variant="ghost" onPress={() => router.push('/memory/new')} />
        </View>
      </Card>

      {deferredSearch.trim().length > 0 && searchResults.value.length > 0 ? (
        <Card style={styles.searchResults}>
          <Text style={styles.sectionTitle}>Knowledge matches</Text>
          {searchResults.value.map((result) => (
            <View key={result.person.id} style={styles.resultRow}>
              <Text style={styles.resultName}>{result.person.name}</Text>
              <Text style={styles.resultCopy}>
                {result.insights.map((insight) => insight.content).join(' • ')}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming memories</Text>
        <Text style={styles.sectionMeta}>{memories.value.length} captures</Text>
      </View>

      {memories.value.map((item) => (
        <MemoryCard key={item.bundle.memory.id} item={item} />
      ))}

      {memories.value.length === 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Nothing saved yet</Text>
          <Text style={styles.subtitle}>Use Share Demo to enqueue a capture, then process it into people, events, and insights.</Text>
        </Card>
      ) : null}

      {memories.value[0]?.nextEventAt ? (
        <Card>
          <Text style={styles.sectionTitle}>Next live reminder</Text>
          <Text style={styles.resultCopy}>{formatTimestamp(memories.value[0].nextEventAt)}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    backgroundColor: 'rgba(16, 32, 27, 0.92)',
  },
  kicker: {
    color: '#F3B85A',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: palette.mist,
    fontFamily: 'SpaceMono',
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: 'rgba(250, 244, 234, 0.8)',
    fontSize: 15,
    lineHeight: 22,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  searchBlock: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 18,
  },
  sectionMeta: {
    color: palette.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  quickActions: {
    gap: spacing.md,
  },
  searchResults: {
    gap: spacing.md,
  },
  resultRow: {
    gap: 6,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  resultName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  resultCopy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
