import { StyleSheet, Text, View } from 'react-native';

import { palette, radii } from '@/src/theme/palette';

export function PersonAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.label}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: palette.ink,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  label: {
    color: palette.mist,
    fontSize: 16,
    fontWeight: '800',
  },
});
