import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  return (
    <View className="rounded-[18px] border border-[#10201b24] bg-[rgba(255,255,255,0.45)] px-4 py-[6px]">
      <RNTextInput
        ref={ref}
        placeholderTextColor="rgba(16,32,27,0.62)"
        className="min-h-[42px] text-[15px] text-ink"
        {...props}
      />
    </View>
  );
});
