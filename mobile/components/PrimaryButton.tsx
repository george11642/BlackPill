import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme } from '../lib/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'premium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
}: PrimaryButtonProps) {
  const colors =
    variant === 'primary'
      ? [DarkTheme.colors.primary, DarkTheme.colors.secondary]
      : variant === 'secondary'
      ? [DarkTheme.colors.secondary, DarkTheme.colors.premium]
      : [DarkTheme.colors.premium, DarkTheme.colors.primary];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={DarkTheme.colors.text} />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    color: DarkTheme.colors.text,
    fontSize: DarkTheme.typography.button.fontSize,
    fontWeight: DarkTheme.typography.button.fontWeight as any,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

