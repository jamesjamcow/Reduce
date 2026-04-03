import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDeferredValue, useState } from 'react';
import { Alert, Text, View } from 'react-native';

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
      <Card className="gap-4 bg-[rgba(16,32,27,0.92)]" style={{ gap: 16, backgroundColor: 'rgba(16, 32, 27, 0.92)' }}>
        <Text className="text-[12px] font-bold uppercase tracking-[1.4px] text-[#F3B85A]">Reduce</Text>
        <Text className="font-mono text-[28px] leading-[34px] text-mist">Turn screenshots into follow-through.</Text>
        <Text className="text-[15px] leading-[22px] text-[rgba(250,244,234,0.8)]">
          Capture loose plans, remember what people are good at, and surface the next move before it slips.
        </Text>
        <View className="flex-row flex-wrap gap-[10px]">
          <Button label="Share Demo" onPress={handleEnqueueSample} />
          <Button label="Review From Gallery" variant="secondary" onPress={handleGalleryReview} />
        </View>
      </Card>

      <View className="gap-[10px]">
        <Text className="font-mono text-[18px] text-ink">Search your network</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Who hosts hackathons? Who knows Stripe?"
        />
      </View>

      <ProcessingQueue items={queue.value} />

      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[18px] text-ink">Pipeline</Text>
        <View className="flex-row flex-wrap gap-[10px]">
          <Button label="Process Queue" onPress={handleProcessQueue} loading={processing} />
          <Button label="Manual Memory" variant="ghost" onPress={() => router.push('/memory/new')} />
        </View>
      </Card>

      {deferredSearch.trim().length > 0 && searchResults.value.length > 0 ? (
        <Card style={{ gap: 16 }}>
          <Text className="font-mono text-[18px] text-ink">Knowledge matches</Text>
          {searchResults.value.map((result) => (
            <View
              key={result.person.id}
              className="gap-[6px] border-b border-[#10201b24] pb-[10px]">
              <Text className="text-[16px] font-bold text-ink">{result.person.name}</Text>
              <Text className="text-[14px] leading-[20px] text-[#10201b9e]">
                {result.insights.map((insight) => insight.content).join(' • ')}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Text className="font-mono text-[18px] text-ink">Upcoming memories</Text>
        <Text className="text-[12px] font-bold uppercase text-[#10201b9e]">{memories.value.length} captures</Text>
      </View>

      {memories.value.map((item) => (
        <MemoryCard key={item.bundle.memory.id} item={item} />
      ))}

      {memories.value.length === 0 ? (
        <Card>
          <Text className="font-mono text-[18px] text-ink">Nothing saved yet</Text>
          <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
            Use Share Demo to enqueue a capture, then process it into people, events, and insights.
          </Text>
        </Card>
      ) : null}

      {memories.value[0]?.nextEventAt ? (
        <Card>
          <Text className="font-mono text-[18px] text-ink">Next live reminder</Text>
          <Text className="text-[14px] leading-[20px] text-[#10201b9e]">{formatTimestamp(memories.value[0].nextEventAt)}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
