import React, { useState, useMemo } from 'react';
import { Text, StyleSheet, TextProps, LayoutChangeEvent, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GradientTextProps extends TextProps {
  text: string;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  fontSize?: number;
  fontWeight?: '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
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
  align = 'left',
  maxWidth,
  ...props
}: GradientTextProps) {
  // Calculate max width: use provided maxWidth, or default to screen minus padding
  const effectiveMaxWidth = maxWidth ?? SCREEN_WIDTH - 48;

  // Estimate initial width based on text length and fontSize to prevent clipping
  // Average character width is approximately 0.6 * fontSize for most fonts
  const estimatedWidth = useMemo(() => {
    const charWidth = fontSize * 0.6;
    const estimated = text.length * charWidth;
    // Cap at effective max width, minimum 50px
    return Math.min(Math.max(estimated, 50), effectiveMaxWidth);
  }, [text, fontSize, effectiveMaxWidth]);

  const [dimensions, setDimensions] = useState({
    width: estimatedWidth,
    height: fontSize * 1.5
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      // Add buffer to prevent clipping of descenders or edges, but respect maxWidth
      const newWidth = Math.min(width + 1, effectiveMaxWidth);
      setDimensions({ width: newWidth, height: height + 2 });
    }
  };

  const textStyle = [
    styles.text,
    {
      fontSize,
      fontWeight,
      fontFamily: DarkTheme.typography.fontFamily,
      textAlign: align as const,
      maxWidth: effectiveMaxWidth, // Constrain text width
    },
    style,
  ];

  return (
    <MaskedView
      style={{
        alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        maxWidth: effectiveMaxWidth, // Constrain container
      }}
      maskElement={
        <Text
          style={textStyle}
          numberOfLines={numberOfLines}
          ellipsizeMode={numberOfLines ? 'tail' : undefined}
          onLayout={handleLayout}
          {...props}
        >
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={start}
        end={end}
        style={{
          height: dimensions.height,
          width: Math.min(Math.max(dimensions.width + 4, 50), effectiveMaxWidth), // Respect maxWidth
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

