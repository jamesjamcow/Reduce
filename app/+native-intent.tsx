import { router } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';

export default function NativeIntentScreen() {
  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[24px] text-ink">Share intent bridge</Text>
        <Text className="text-[15px] leading-[22px] text-[#10201b9e]">
          Native share handling is scaffolded in the services layer. On device builds, this route becomes the handoff target for Android transparent overlay flows.
        </Text>
        <Button label="Back To Feed" onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}
