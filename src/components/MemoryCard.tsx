import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PersonAvatar } from '@/src/components/PersonAvatar';
import { formatRelative, formatTimestamp } from '@/src/utils/dates';
import type { HomeFeedItem } from '@/src/types';

export function MemoryCard({ item }: { item: HomeFeedItem }) {
  const { bundle } = item;

  return (
    <Link href={{ pathname: '/memory/[id]', params: { id: bundle.memory.id } }} asChild>
      <Card style={{ gap: 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            {bundle.people.slice(0, 2).map((person) => (
              <PersonAvatar key={person.id} name={person.name} size={38} />
            ))}
          </View>
          <Badge label={bundle.memory.sourceType.toUpperCase()} tone="soft" />
        </View>

        <Text className="font-mono text-[20px] leading-[26px] text-ink">{bundle.memory.title}</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]" numberOfLines={3}>
          {bundle.memory.body || bundle.memory.userNote || 'No additional context yet.'}
        </Text>

        <View className="flex-row justify-between gap-4">
          <Text className="flex-1 text-[12px] font-bold text-dusk">{bundle.people.map((person) => person.name).join(', ')}</Text>
          <Text className="flex-1 text-[12px] font-bold text-dusk">
            {item.nextEventAt ? formatTimestamp(item.nextEventAt) : formatRelative(bundle.reminders[0]?.remindAt)}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {bundle.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} label={`#${tag}`} />
          ))}
        </View>
      </Card>
    </Link>
  );
}
