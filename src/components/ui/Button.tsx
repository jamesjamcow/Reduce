import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isPrimary = variant === 'primary';
  const classes = isPrimary
    ? 'min-h-12 items-center justify-center rounded-full bg-ink px-6'
    : variant === 'secondary'
      ? 'min-h-12 items-center justify-center rounded-full border border-[#10201b24] bg-sand px-6'
      : 'min-h-12 items-center justify-center rounded-full border border-[#10201b24] bg-transparent px-6';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={`${classes} ${(disabled || loading) ? 'opacity-50' : ''}`}
      style={({ pressed }) => [{ transform: [{ scale: pressed && !disabled && !loading ? 0.98 : 1 }] }]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FAF4EA' : '#10201B'} />
      ) : (
        <Text className={`text-[14px] font-bold uppercase tracking-[0.8px] ${isPrimary ? 'text-mist' : 'text-ink'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
