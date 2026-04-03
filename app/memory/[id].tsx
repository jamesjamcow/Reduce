import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/ui/Screen';
import { useMemoryDetail } from '@/src/hooks/useMemoryDetail';
import { addEventToCalendar } from '@/src/services/calendar';
import { Button } from '@/src/components/ui/Button';
import { formatTimestamp } from '@/src/utils/dates';

export default function MemoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const memory = useMemoryDetail(params.id);

  if (!memory.value) {
    return (
      <Screen>
        <Card>
          <Text className="font-mono text-[24px] text-ink">Memory not found</Text>
        </Card>
      </Screen>
    );
  }

  const bundle = memory.value;
  const primaryEvent = bundle.events[0];

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[24px] text-ink">{bundle.memory.title}</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">{bundle.memory.body || 'No body text saved.'}</Text>
        <View className="flex-row flex-wrap gap-2">
          {bundle.people.map((person) => (
            <Badge key={person.id} label={person.name} tone="soft" />
          ))}
        </View>
      </Card>

      {bundle.events.length > 0 ? (
        <Card style={{ gap: 16 }}>
          <Text className="font-mono text-[18px] text-ink">Events</Text>
          {bundle.events.map((event) => (
            <View key={event.id} className="gap-2 border-b border-[#10201b24] pb-[10px]">
              <Text className="text-[16px] font-bold text-ink">{event.title}</Text>
              <Text className="text-[15px] leading-[22px] text-[#10201b9e]">{formatTimestamp(event.eventDate)}</Text>
              {event.location ? <Text className="text-[15px] leading-[22px] text-[#10201b9e]">{event.location}</Text> : null}
            </View>
          ))}
          {primaryEvent ? (
            <Button
              label="Add First Event To Calendar"
              variant="secondary"
              onPress={() => addEventToCalendar(primaryEvent.title, primaryEvent.eventDate, primaryEvent.eventEndDate, primaryEvent.location)}
            />
          ) : null}
        </Card>
      ) : null}

      {bundle.insights.length > 0 ? (
        <Card style={{ gap: 16 }}>
          <Text className="font-mono text-[18px] text-ink">Insights</Text>
          {bundle.insights.map((insight) => (
            <View key={insight.id} className="gap-2 border-b border-[#10201b24] pb-[10px]">
              <Badge label={insight.category} tone="accent" />
              <Text className="text-[15px] leading-[22px] text-[#10201b9e]">{insight.content}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[18px] text-ink">Raw OCR</Text>
        <Text className="text-[14px] leading-[22px] text-dusk">{bundle.memory.rawOcrText || 'No OCR text stored.'}</Text>
      </Card>
    </Screen>
  );
}
