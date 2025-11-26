import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { DarkTheme } from '../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={20} style={styles.blur}>
        <View style={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.glassCard,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
  },
  blur: {
    flex: 1,
  },
  content: {
    padding: DarkTheme.spacing.md,
  },
});

