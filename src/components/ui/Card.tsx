import { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export function Card({
  children,
  style,
  className,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; className?: string }>) {
  return (
    <View
      className={`rounded-[28px] border border-[#10201b24] bg-[rgba(250,244,234,0.92)] p-[22px] ${className ?? ''}`}
      style={[
        {
          shadowColor: 'rgba(20,24,18,0.12)',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 4,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
