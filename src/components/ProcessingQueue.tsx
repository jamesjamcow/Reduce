import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { palette, spacing } from '@/src/theme/palette';
import { formatRelative } from '@/src/utils/dates';
import type { QueueItem } from '@/src/types';

export function ProcessingQueue({ items }: { items: QueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Processing queue</Text>
      {items.slice(0, 3).map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.body} numberOfLines={2}>
              {item.rawOcrText}
            </Text>
            <Text style={styles.meta}>{formatRelative(item.createdAt)}</Text>
          </View>
          <Badge label={item.status} tone={item.status === 'failed' ? 'accent' : 'soft'} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 18,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  body: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: palette.muted,
    fontSize: 12,
  },
});
