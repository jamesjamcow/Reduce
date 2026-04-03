import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { MemoryCard } from '@/src/components/MemoryCard';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { usePersonDetail } from '@/src/hooks/usePersonDetail';

export default function PersonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const detail = usePersonDetail(params.id);

  if (!detail.value) {
    return (
      <Screen>
        <Card>
          <Text className="font-mono text-[24px] text-ink">Person not found</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[24px] text-ink">{detail.value.person.name}</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          Every memory bundle linked to this person, including captured plans and insight fragments.
        </Text>
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
