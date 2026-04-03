import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/ui/Screen';
import { useMemoryDetail } from '@/src/hooks/useMemoryDetail';
import { addEventToCalendar } from '@/src/services/calendar';
import { Button } from '@/src/components/ui/Button';
import { palette, spacing } from '@/src/theme/palette';
import { formatTimestamp } from '@/src/utils/dates';

export default function MemoryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const memory = useMemoryDetail(params.id);

  if (!memory.value) {
    return (
      <Screen>
        <Card>
          <Text style={styles.title}>Memory not found</Text>
        </Card>
      </Screen>
    );
  }

  const bundle = memory.value;
  const primaryEvent = bundle.events[0];

  return (
    <Screen>
      <Card style={styles.block}>
        <Text style={styles.title}>{bundle.memory.title}</Text>
        <Text style={styles.copy}>{bundle.memory.body || 'No body text saved.'}</Text>
        <View style={styles.row}>
          {bundle.people.map((person) => (
            <Badge key={person.id} label={person.name} tone="soft" />
          ))}
        </View>
      </Card>

      {bundle.events.length > 0 ? (
        <Card style={styles.block}>
          <Text style={styles.section}>Events</Text>
          {bundle.events.map((event) => (
            <View key={event.id} style={styles.item}>
              <Text style={styles.itemTitle}>{event.title}</Text>
              <Text style={styles.copy}>{formatTimestamp(event.eventDate)}</Text>
              {event.location ? <Text style={styles.copy}>{event.location}</Text> : null}
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
        <Card style={styles.block}>
          <Text style={styles.section}>Insights</Text>
          {bundle.insights.map((insight) => (
            <View key={insight.id} style={styles.item}>
              <Badge label={insight.category} tone="accent" />
              <Text style={styles.copy}>{insight.content}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card style={styles.block}>
        <Text style={styles.section}>Raw OCR</Text>
        <Text style={styles.raw}>{bundle.memory.rawOcrText || 'No OCR text stored.'}</Text>
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
    fontSize: 24,
  },
  section: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 18,
  },
  copy: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    gap: 8,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  itemTitle: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  raw: {
    color: palette.dusk,
    fontSize: 14,
    lineHeight: 22,
  },
});
