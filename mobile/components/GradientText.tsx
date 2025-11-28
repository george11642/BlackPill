import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextProps, LayoutChangeEvent, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { DarkTheme } from '../lib/theme';

interface GradientTextProps extends TextProps {
  text: string;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
}

export function GradientText({
  text,
  colors = [DarkTheme.colors.primary, DarkTheme.colors.accent],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  fontSize = 24,
  fontWeight = '700',
  style,
  numberOfLines,
  ...props
}: GradientTextProps) {
  const [dimensions, setDimensions] = useState({ width: 300, height: fontSize * 1.5 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      // Add buffer to prevent clipping of descenders or edges
      setDimensions({ width: width + 1, height: height + 2 });
    }
  };

  const textStyle = [
    styles.text,
    {
      fontSize,
      fontWeight,
      fontFamily: DarkTheme.typography.fontFamily,
    },
    style,
  ];

  return (
    <MaskedView
      maskElement={
        <Text
          style={textStyle}
          numberOfLines={numberOfLines}
          onLayout={handleLayout}
          {...props}
        >
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={{
          height: dimensions.height,
          width: Math.max(dimensions.width, 50),
        }}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    backgroundColor: 'transparent',
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default GradientText;

