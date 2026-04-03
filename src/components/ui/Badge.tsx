import { Text, View } from 'react-native';

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'soft' }) {
  const classes =
    tone === 'accent'
      ? 'bg-[rgba(196,90,60,0.16)]'
      : tone === 'soft'
        ? 'bg-[rgba(109,126,87,0.16)]'
        : 'bg-[rgba(16,32,27,0.08)]';
  return (
    <View className={`mr-[6px] rounded-full px-[10px] py-[6px] ${classes}`}>
      <Text className="text-[12px] font-bold text-ink">{label}</Text>
    </View>
  );
}
