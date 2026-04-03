import { Text, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { formatRelative } from '@/src/utils/dates';
import type { QueueItem } from '@/src/types';

export function ProcessingQueue({ items }: { items: QueueItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card style={{ gap: 16 }}>
      <Text className="font-mono text-[18px] text-ink">Processing queue</Text>
      {items.slice(0, 3).map((item) => (
        <View key={item.id} className="flex-row items-center gap-[10px]">
          <View className="flex-1 gap-[6px]">
            <Text className="text-[14px] leading-[20px] text-ink" numberOfLines={2}>
              {item.rawOcrText}
            </Text>
            <Text className="text-[12px] text-[#10201b9e]">{formatRelative(item.createdAt)}</Text>
          </View>
          <Badge label={item.status} tone={item.status === 'failed' ? 'accent' : 'soft'} />
        </View>
      ))}
    </Card>
  );
}
