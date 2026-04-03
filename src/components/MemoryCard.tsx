import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { PersonAvatar } from '@/src/components/PersonAvatar';
import { palette, spacing } from '@/src/theme/palette';
import { formatRelative, formatTimestamp } from '@/src/utils/dates';
import type { HomeFeedItem } from '@/src/types';

export function MemoryCard({ item }: { item: HomeFeedItem }) {
  const { bundle } = item;

  return (
    <Link href={{ pathname: '/memory/[id]', params: { id: bundle.memory.id } }} asChild>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.peopleRow}>
            {bundle.people.slice(0, 2).map((person) => (
              <PersonAvatar key={person.id} name={person.name} size={38} />
            ))}
          </View>
          <Badge label={bundle.memory.sourceType.toUpperCase()} tone="soft" />
        </View>

        <Text style={styles.title}>{bundle.memory.title}</Text>
        <Text style={styles.body} numberOfLines={3}>
          {bundle.memory.body || bundle.memory.userNote || 'No additional context yet.'}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{bundle.people.map((person) => person.name).join(', ')}</Text>
          <Text style={styles.meta}>
            {item.nextEventAt ? formatTimestamp(item.nextEventAt) : formatRelative(bundle.reminders[0]?.remindAt)}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          {bundle.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} label={`#${tag}`} />
          ))}
        </View>
      </Card>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peopleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: {
    color: palette.dusk,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
