import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PersonAvatar } from '@/src/components/PersonAvatar';
import { Badge } from '@/src/components/ui/Badge';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { usePeople } from '@/src/hooks/usePeople';
import { palette, spacing } from '@/src/theme/palette';

export default function PeopleScreen() {
  const people = usePeople();

  return (
    <Screen>
      <Card style={styles.header}>
        <Text style={styles.title}>People atlas</Text>
        <Text style={styles.copy}>
          Every person mentioned across screenshots, grouped with the memories, events, and insight subjects attached to them.
        </Text>
      </Card>

      {people.value.map((item) => (
        <Link key={item.person.id} href={{ pathname: '/person/[id]', params: { id: item.person.id } }} asChild>
          <Card style={styles.personCard}>
            <View style={styles.row}>
              <PersonAvatar name={item.person.name} size={56} />
              <View style={styles.copyBlock}>
                <Text style={styles.name}>{item.person.name}</Text>
                <Text style={styles.meta}>
                  {item.memoryCount} memories • {item.upcomingEventCount} upcoming • {item.insightCount} insights
                </Text>
              </View>
            </View>
            <View style={styles.subjects}>
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

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 24,
  },
  copy: {
    color: palette.muted,
    lineHeight: 22,
    fontSize: 15,
  },
  personCard: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: palette.muted,
    fontSize: 13,
  },
  subjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
