import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, spacing } from '@/src/theme/palette';

export function Screen({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={[palette.canvas, '#F0DDC1', '#DDB07E']} style={styles.background}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + 10,
    paddingBottom: 140,
    gap: spacing.lg,
  },
});
