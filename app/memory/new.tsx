import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';
import { TextInput } from '@/src/components/ui/TextInput';
import { createManualMemory } from '@/src/db/repository';
import { syncReminderNotifications } from '@/src/services/reminders';
import { useAppStore } from '@/src/stores/appStore';
import { palette, spacing } from '@/src/theme/palette';
import { isoFromUnix, unixFromInput } from '@/src/utils/dates';

export default function ManualMemoryScreen() {
  const [people, setPeople] = useState('Alex Chen');
  const [title, setTitle] = useState('Manual follow-up');
  const [body, setBody] = useState('Met at a workshop. Worth revisiting next week.');
  const [eventTitle, setEventTitle] = useState('Follow-up coffee');
  const [eventDate, setEventDate] = useState(isoFromUnix(Date.now() + 4 * 24 * 60 * 60 * 1000));
  const [eventLocation, setEventLocation] = useState('Downtown');
  const [insight, setInsight] = useState('Reliable and strong at shipping prototypes');
  const [saving, setSaving] = useState(false);
  const bumpDataVersion = useAppStore((state) => state.bumpDataVersion);

  async function handleSave() {
    setSaving(true);
    const bundle = await createManualMemory({
      personNames: people.split(',').map((value) => value.trim()),
      title,
      body,
      eventTitle,
      eventDate: unixFromInput(eventDate),
      eventLocation,
      insightContent: insight,
      insightCategory: 'trait',
      tags: ['manual'],
    });

    if (bundle) {
      await syncReminderNotifications(bundle.memory.id);
      bumpDataVersion();
      router.replace({ pathname: '/memory/[id]', params: { id: bundle.memory.id } });
    }

    setSaving(false);
  }

  return (
    <Screen>
      <Card style={styles.block}>
        <Text style={styles.title}>Manual memory</Text>
        <TextInput value={people} onChangeText={setPeople} placeholder="People, comma separated" />
        <TextInput value={title} onChangeText={setTitle} placeholder="Capture title" />
        <TextInput value={body} onChangeText={setBody} placeholder="Context" multiline />
        <TextInput value={eventTitle} onChangeText={setEventTitle} placeholder="Event title" />
        <TextInput value={eventDate} onChangeText={setEventDate} placeholder="2026-04-15T10:00" />
        <TextInput value={eventLocation} onChangeText={setEventLocation} placeholder="Location" />
        <TextInput value={insight} onChangeText={setInsight} placeholder="Insight" multiline />
        <View style={styles.actions}>
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Button label="Save Memory" onPress={handleSave} loading={saving} />
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
