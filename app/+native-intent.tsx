import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { palette, spacing } from '@/src/theme/palette';

export default function NativeIntentScreen() {
  return (
    <Screen>
      <Card style={styles.block}>
        <Text style={styles.title}>Share intent bridge</Text>
        <Text style={styles.copy}>
          Native share handling is scaffolded in the services layer. On device builds, this route becomes the handoff target for Android transparent overlay flows.
        </Text>
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
    lineHeight: 22,
    fontSize: 15,
  },
});
