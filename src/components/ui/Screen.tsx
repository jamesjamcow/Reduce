import { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function Screen({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={['#F5E9D6', '#F0DDC1', '#DDB07E']} className="flex-1">
      <View className="absolute inset-0 bg-[rgba(255,255,255,0.24)]" />
      <ScrollView contentContainerClassName="gap-[22px] px-[22px] pb-[140px] pt-[50px]" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </LinearGradient>
  );
}
