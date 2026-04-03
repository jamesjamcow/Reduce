import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { PersonAvatar } from '@/src/components/PersonAvatar';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { usePeople } from '@/src/hooks/usePeople';

export default function PeopleScreen() {
  const people = usePeople();

  return (
    <Screen>
      <Card style={{ gap: 10 }}>
        <Text className="font-mono text-[24px] text-ink">People atlas</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          Every person mentioned across screenshots, grouped with the memories, events, and insight subjects attached to them.
        </Text>
      </Card>

      {people.value.map((item) => (
        <Link key={item.person.id} href={{ pathname: '/person/[id]', params: { id: item.person.id } }} asChild>
          <Card style={{ gap: 16 }}>
            <View className="flex-row items-center gap-4">
              <PersonAvatar name={item.person.name} size={56} />
              <View className="flex-1 gap-1">
                <Text className="text-[18px] font-bold text-ink">{item.person.name}</Text>
                <Text className="text-[13px] text-[#10201b9e]">
                  {item.memoryCount} memories • {item.upcomingEventCount} upcoming • {item.insightCount} insights
                </Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {item.topSubjects.length > 0 ? (
                item.topSubjects.map((subject) => <Badge key={subject} label={subject} tone="soft" />)
              ) : (
                <Badge label="No insight subjects yet" />
              )}
            </View>
          </Card>
        </Link>
      ))}
    </Screen>
  );
}
