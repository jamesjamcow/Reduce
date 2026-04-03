import { Text, View } from 'react-native';

export function PersonAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      className="items-center justify-center border-2 border-[rgba(255,255,255,0.35)] bg-ink"
      style={{ width: size, height: size, borderRadius: size / 2 }}>
      <Text className="text-[16px] font-extrabold text-mist">{initials}</Text>
    </View>
  );
}
