import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { MemoryCard } from '@/src/components/MemoryCard';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { usePersonDetail } from '@/src/hooks/usePersonDetail';
import { palette, spacing } from '@/src/theme/palette';

export default function PersonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const detail = usePersonDetail(params.id);

  if (!detail.value) {
    return (
      <Screen>
        <Card>
          <Text style={styles.title}>Person not found</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.title}>{detail.value.person.name}</Text>
        <Text style={styles.copy}>Every memory bundle linked to this person, including captured plans and insight fragments.</Text>
      </Card>

      {detail.value.bundles.map((bundle) => (
        <MemoryCard
          key={bundle.memory.id}
          item={{
            bundle,
            nextEventAt: bundle.events[0]?.eventDate,
            pendingReminderCount: bundle.reminders.filter((item) => item.status === 'pending').length,
          }}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 24,
  },
  copy: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
