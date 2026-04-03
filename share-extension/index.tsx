import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { TextInput } from '@/src/components/ui/TextInput';
import { palette, spacing } from '@/src/theme/palette';

export default function ShareExtensionScreen() {
  const [note, setNote] = useState('');

  return (
    <View style={styles.screen}>
      <Card style={styles.card}>
        <Text style={styles.title}>Reduce share sheet</Text>
        <Text style={styles.copy}>Capture extra context while the screenshot is still fresh, then hand the OCR text to the main app queue.</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Add a quick note" />
        <Button label="Save To Queue" onPress={() => undefined} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.canvas,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    gap: spacing.md,
  },
  title: {
    color: palette.ink,
    fontFamily: 'SpaceMono',
    fontSize: 20,
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
