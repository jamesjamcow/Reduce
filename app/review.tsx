import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Screen } from '@/src/components/ui/Screen';
import { TextInput } from '@/src/components/ui/TextInput';
import { saveParsedCapture } from '@/src/db/repository';
import { syncReminderNotifications } from '@/src/services/reminders';
import { useAppStore } from '@/src/stores/appStore';
import { palette, spacing } from '@/src/theme/palette';

export default function ReviewScreen() {
  const pendingReview = useAppStore((state) => state.pendingReview);
  const setPendingReview = useAppStore((state) => state.setPendingReview);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState(pendingReview?.personNames.join(', ') ?? '');
  const [title, setTitle] = useState(pendingReview?.title ?? '');
  const [body, setBody] = useState(pendingReview?.body ?? '');

  if (!pendingReview) {
    return (
      <Screen>
        <Card style={styles.block}>
          <Text style={styles.title}>No review payload</Text>
          <Button label="Back To Feed" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const review = pendingReview;

  async function handleSave() {
    setSaving(true);
    const bundle = await saveParsedCapture({
      personNames: people.split(',').map((value) => value.trim()).filter(Boolean),
      title,
      body,
      userNote: review.userNote,
      rawOcrText: review.rawOcrText,
      events: review.events,
      insights: review.insights,
      tags: review.tags,
      duplicateCandidates: review.duplicateCandidates,
    });

    if (bundle) {
      await syncReminderNotifications(bundle.memory.id);
      setPendingReview(null);
      bumpDataVersion();
      router.replace({ pathname: '/memory/[id]', params: { id: bundle.memory.id } });
    }

    setSaving(false);
  }

  return (
    <Screen>
      <Card style={styles.block}>
        <Text style={styles.title}>Review capture</Text>
        <TextInput value={people} onChangeText={setPeople} placeholder="People" />
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" />
        <TextInput value={body} onChangeText={setBody} placeholder="Parsed body" multiline />

        <View style={styles.row}>
          {review.tags.map((tag) => (
            <Badge key={tag} label={`#${tag}`} tone="soft" />
          ))}
        </View>

        {review.duplicateCandidates.length > 0 ? (
          <Card style={styles.duplicateCard}>
            <Text style={styles.section}>Possible duplicates</Text>
            {review.duplicateCandidates.map((candidate) => (
              <Text key={`${candidate.inputName}-${candidate.existingPersonId}`} style={styles.copy}>
                {candidate.inputName} might be the same as {candidate.existingPersonName}
              </Text>
            ))}
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button label="Discard" variant="ghost" onPress={() => router.back()} />
          <Button label="Save Capture" onPress={handleSave} loading={saving} />
        </View>
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
  section: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  copy: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  duplicateCard: {
    gap: spacing.sm,
  },
});
