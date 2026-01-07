import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface BlurredContentProps {
  children: React.ReactNode;
  isBlurred: boolean;
  intensity?: number;
  style?: ViewStyle;
  overlay?: React.ReactNode;
}

export function BlurredContent({ 
  children, 
  isBlurred, 
  intensity = 20, 
  style,
  overlay 
}: BlurredContentProps) {
  if (!isBlurred) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {children}
      </View>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      {overlay && (
        <View style={styles.overlay}>
          {overlay}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    opacity: 0.6, // Slightly fade underlying content
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

