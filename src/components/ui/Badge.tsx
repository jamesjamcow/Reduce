import { StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing } from '@/src/theme/palette';

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'soft' }) {
  return (
    <View style={[styles.badge, tone === 'accent' && styles.accent, tone === 'soft' && styles.soft]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 32, 27, 0.08)',
    marginRight: spacing.xs,
  },
  accent: {
    backgroundColor: 'rgba(196, 90, 60, 0.16)',
  },
  soft: {
    backgroundColor: 'rgba(109, 126, 87, 0.16)',
  },
  label: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '700',
  },
});
