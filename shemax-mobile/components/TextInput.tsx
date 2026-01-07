import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { DarkTheme } from '../lib/theme';

interface TextInputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export function TextInput({
  label,
  error,
  containerStyle,
  ...props
}: TextInputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        {...props}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          props.style,
        ]}
        placeholderTextColor={DarkTheme.colors.textTertiary}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: DarkTheme.spacing.md,
  },
  label: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: DarkTheme.spacing.xs,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  input: {
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: DarkTheme.borderRadius.md,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: 12,
    color: DarkTheme.colors.text,
    fontSize: DarkTheme.typography.body.fontSize,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  inputFocused: {
    borderColor: DarkTheme.colors.primary,
  },
  inputError: {
    borderColor: DarkTheme.colors.warning,
  },
  error: {
    color: DarkTheme.colors.warning,
    fontSize: 12,
    marginTop: DarkTheme.spacing.xs,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

