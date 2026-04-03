import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { TextInput } from '@/src/components/ui/TextInput';

export default function ShareExtensionScreen() {
  const [note, setNote] = useState('');

  return (
    <View className="flex-1 justify-center bg-canvas p-[22px]">
      <Card style={{ gap: 16 }}>
        <Text className="font-mono text-[20px] text-ink">Reduce share sheet</Text>
        <Text className="text-[14px] leading-[20px] text-[#10201b9e]">
          Capture extra context while the screenshot is still fresh, then hand the OCR text to the main app queue.
        </Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Add a quick note" />
        <Button label="Save To Queue" onPress={() => undefined} />
      </Card>
    </View>
  );
}
