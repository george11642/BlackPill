import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { DarkTheme } from '../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface BellCurveProps {
  score: number;
  maxScore?: number;
  height?: number;
  showPercentile?: boolean;
  delay?: number;
}

export function BellCurve({
  score,
  maxScore = 10,
  height = 160,
  showPercentile = true,
  delay = 0,
}: BellCurveProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const width = screenWidth - 64; // Account for padding
  const padding = 20;
  const curveHeight = height - 40;

  // Calculate position on curve (0-1)
  const normalizedScore = score / maxScore;
  const xPosition = padding + normalizedScore * (width - 2 * padding);

  // Generate bell curve path
  const generateBellCurve = () => {
    const points: string[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const x = padding + (i / steps) * (width - 2 * padding);
      const normalizedX = (i / steps - 0.5) * 6; // Scale to -3 to 3 standard deviations
      const y = Math.exp(-0.5 * normalizedX * normalizedX); // Gaussian function
      const scaledY = curveHeight - y * (curveHeight - 20);

      if (i === 0) {
        points.push(`M ${x} ${scaledY}`);
      } else {
        points.push(`L ${x} ${scaledY}`);
      }
    }

    // Close the path for fill
    points.push(`L ${width - padding} ${curveHeight}`);
    points.push(`L ${padding} ${curveHeight}`);
    points.push('Z');

    return points.join(' ');
  };

  // Calculate Y position on curve for the marker
  const getYOnCurve = (normalizedX: number) => {
    const scaledX = (normalizedX - 0.5) * 6;
    const y = Math.exp(-0.5 * scaledX * scaledX);
    return curveHeight - y * (curveHeight - 20);
  };

  const markerY = getYOnCurve(normalizedScore);

  // Animation for marker
  const markerOpacity = useSharedValue(0);
  const markerScale = useSharedValue(0);

  useEffect(() => {
    markerOpacity.value = withDelay(
      delay + 500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    markerScale.value = withDelay(
      delay + 500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(2)) })
    );
  }, [delay]);

  const animatedMarkerProps = useAnimatedProps(() => ({
    opacity: markerOpacity.value,
    r: 8 * markerScale.value,
  }));

  const animatedLineProps = useAnimatedProps(() => ({
    opacity: markerOpacity.value,
  }));

  // Calculate percentile (approximate based on normal distribution)
  const calculatePercentile = (normalizedScore: number) => {
    // Using simplified CDF approximation
    const z = (normalizedScore - 0.5) * 6;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? Math.round((1 - p) * 100) : Math.round(p * 100);
  };

  const percentile = calculatePercentile(normalizedScore);

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={curveHeight + 20} viewBox={`0 0 ${width} ${curveHeight + 20}`}>
        <Defs>
          <LinearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={DarkTheme.colors.primary} stopOpacity="0.4" />
            <Stop offset="1" stopColor={DarkTheme.colors.primary} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={DarkTheme.colors.primaryDark} stopOpacity="0.5" />
            <Stop offset="0.5" stopColor={DarkTheme.colors.primary} stopOpacity="1" />
            <Stop offset="1" stopColor={DarkTheme.colors.primaryDark} stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        {/* Filled area under curve */}
        <Path
          d={generateBellCurve()}
          fill="url(#curveGradient)"
        />

        {/* Curve outline */}
        <Path
          d={generateBellCurve().split('L ' + (width - padding))[0]}
          fill="none"
          stroke="url(#strokeGradient)"
          strokeWidth={2}
        />

        {/* Vertical line from marker to bottom */}
        <AnimatedLine
          x1={xPosition}
          y1={markerY}
          x2={xPosition}
          y2={curveHeight}
          stroke={DarkTheme.colors.primary}
          strokeWidth={2}
          strokeDasharray="4,4"
          animatedProps={animatedLineProps}
        />

        {/* Marker circle */}
        <G>
          {/* Outer glow */}
          <AnimatedCircle
            cx={xPosition}
            cy={markerY}
            fill={DarkTheme.colors.primary}
            opacity={0.3}
            animatedProps={{
              ...animatedMarkerProps,
              r: 16 * markerScale.value,
            }}
          />
          {/* Inner circle */}
          <AnimatedCircle
            cx={xPosition}
            cy={markerY}
            fill={DarkTheme.colors.primary}
            animatedProps={animatedMarkerProps}
          />
          {/* Center dot */}
          <AnimatedCircle
            cx={xPosition}
            cy={markerY}
            fill={DarkTheme.colors.background}
            animatedProps={{
              ...animatedMarkerProps,
              r: 3 * markerScale.value,
            }}
          />
        </G>
      </Svg>

      {/* "You're here" label */}
      <View style={[styles.labelContainer, { left: Math.max(40, Math.min(xPosition - 40, width - 100)) }]}>
        <Text style={styles.youreHere}>You're here</Text>
      </View>

      {/* Percentile text */}
      {showPercentile && (
        <View style={styles.percentileContainer}>
          <Text style={styles.percentileText}>
            Your overall is better than{' '}
            <Text style={styles.percentileValue}>{percentile}%</Text>
            {' '}of people
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.md,
  },
  labelContainer: {
    position: 'absolute',
    top: 10,
  },
  youreHere: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  percentileContainer: {
    marginTop: DarkTheme.spacing.md,
    alignItems: 'center',
  },
  percentileText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  percentileValue: {
    color: DarkTheme.colors.primary,
    fontWeight: '700',
  },
});

export default BellCurve;

