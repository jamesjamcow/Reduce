import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { palette, spacing } from '@/src/theme/palette';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Card style={styles.block}>
        <Text style={styles.title}>Route not found</Text>
        <Text style={styles.copy}>The screen you asked for does not exist in this build.</Text>
        <Button label="Back To Feed" onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
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
  },
});
