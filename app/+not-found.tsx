import { router } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Screen } from '@/src/components/ui/Screen';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[24px] text-ink">Route not found</Text>
        <Text className="text-[15px] text-[#10201b9e]">The screen you asked for does not exist in this build.</Text>
        <Button label="Back To Feed" onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}
