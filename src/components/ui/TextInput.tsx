import { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps, View } from 'react-native';

import { palette, radii, spacing } from '@/src/theme/palette';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(props, ref) {
  return (
    <View style={styles.shell}>
      <RNTextInput
        ref={ref}
        placeholderTextColor={palette.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  input: {
    color: palette.ink,
    minHeight: 42,
    fontSize: 15,
  },
});
