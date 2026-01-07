import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme } from '../lib/theme';

const { width } = Dimensions.get('window');

// Analysis stages with messages
const ANALYSIS_STAGES = [
    { message: 'Scanning facial features...', emoji: '🔍' },
    { message: 'Analyzing proportions...', emoji: '📐' },
    { message: 'Measuring symmetry...', emoji: '⚖️' },
    { message: 'Calculating harmony...', emoji: '✨' },
    { message: 'Generating your score...', emoji: '🎯' },
];

interface FaceAnalysisLoaderProps {
    capturedPhotoUri: string | null;
}

export function FaceAnalysisLoader({ capturedPhotoUri }: FaceAnalysisLoaderProps) {
    const [currentStage, setCurrentStage] = useState(0);

    // Animation values
    const pulseScale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.3);
    const scannerRotation = useSharedValue(0);
    const progressWidth = useSharedValue(0);
    const dotScale1 = useSharedValue(0.6);
    const dotScale2 = useSharedValue(0.6);
    const dotScale3 = useSharedValue(0.6);
    const messageOpacity = useSharedValue(1);

    useEffect(() => {
        // Pulsing glow effect
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        glowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Scanner rotation
        scannerRotation.value = withRepeat(
            withTiming(360, { duration: 3000, easing: Easing.linear }),
            -1,
            false
        );

        // Animated dots
        dotScale1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        dotScale2.value = withDelay(
            200,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );

        dotScale3.value = withDelay(
            400,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            )
        );

        // Progress bar animation
        progressWidth.value = withTiming(100, { duration: 15000, easing: Easing.linear });

        // Stage rotation
        const stageInterval = setInterval(() => {
            // Fade out message
            messageOpacity.value = withTiming(0, { duration: 200 });

            setTimeout(() => {
                setCurrentStage(prev => (prev + 1) % ANALYSIS_STAGES.length);
                // Fade in new message
                messageOpacity.value = withTiming(1, { duration: 300 });
            }, 200);
        }, 2500);

        return () => clearInterval(stageInterval);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    const scannerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${scannerRotation.value}deg` }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const dot1Style = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale1.value }],
        opacity: interpolate(dotScale1.value, [0.6, 1], [0.5, 1]),
    }));

    const dot2Style = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale2.value }],
        opacity: interpolate(dotScale2.value, [0.6, 1], [0.5, 1]),
    }));

    const dot3Style = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale3.value }],
        opacity: interpolate(dotScale3.value, [0.6, 1], [0.5, 1]),
    }));

    const messageStyle = useAnimatedStyle(() => ({
        opacity: messageOpacity.value,
    }));

    const currentStageData = ANALYSIS_STAGES[currentStage];

    return (
        <View style={styles.container}>
            {/* Blurred background */}
            <View style={styles.backdrop} />

            {/* Main content */}
            <View style={styles.content}>
                {/* Photo with animated effects */}
                <View style={styles.photoWrapper}>
                    {/* Outer glow ring */}
                    <Animated.View style={[styles.glowRingOuter, glowStyle]} />

                    {/* Pulsing container */}
                    <Animated.View style={[styles.photoContainer, pulseStyle]}>
                        {/* Inner glow */}
                        <LinearGradient
                            colors={[`${DarkTheme.colors.primary}40`, 'transparent']}
                            style={styles.innerGlow}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                        />

                        {/* Photo */}
                        {capturedPhotoUri && (
                            <Image
                                source={{ uri: capturedPhotoUri }}
                                style={styles.photo}
                                resizeMode="cover"
                            />
                        )}

                        {/* Scanner overlay */}
                        <Animated.View style={[styles.scannerContainer, scannerStyle]}>
                            <View style={styles.scannerLine} />
                        </Animated.View>

                        {/* Corner accents */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </Animated.View>
                </View>

                {/* Status card */}
                <View style={styles.statusCard}>
                    {/* Animated dots */}
                    <View style={styles.dotsContainer}>
                        <Animated.View style={[styles.dot, dot1Style]} />
                        <Animated.View style={[styles.dot, dot2Style]} />
                        <Animated.View style={[styles.dot, dot3Style]} />
                    </View>

                    {/* Current stage message */}
                    <Animated.View style={[styles.messageContainer, messageStyle]}>
                        <Text style={styles.stageEmoji}>{currentStageData.emoji}</Text>
                        <Text style={styles.stageMessage}>{currentStageData.message}</Text>
                    </Animated.View>

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressFill, progressStyle]}>
                                <LinearGradient
                                    colors={DarkTheme.colors.gradientGold as [string, string, ...string[]]}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    {/* Tip text */}
                    <Text style={styles.tipText}>
                        AI is analyzing your unique features
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: DarkTheme.spacing.lg,
    },
    photoWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: DarkTheme.spacing.xl,
    },
    glowRingOuter: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        borderWidth: 2,
        borderColor: DarkTheme.colors.primary,
        backgroundColor: `${DarkTheme.colors.primary}10`,
    },
    photoContainer: {
        width: 220,
        height: 220,
        borderRadius: 110,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: DarkTheme.colors.primary,
        backgroundColor: DarkTheme.colors.card,
        // Gold shadow
        shadowColor: DarkTheme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    innerGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        zIndex: 1,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    scannerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerLine: {
        position: 'absolute',
        width: 2,
        height: '50%',
        top: 0,
        backgroundColor: DarkTheme.colors.primary,
        opacity: 0.6,
        // Glow effect on scanner line
        shadowColor: DarkTheme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: DarkTheme.colors.primaryLight,
        borderWidth: 2,
    },
    cornerTL: {
        top: 15,
        left: 15,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 8,
    },
    cornerTR: {
        top: 15,
        right: 15,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 8,
    },
    cornerBL: {
        bottom: 15,
        left: 15,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
    },
    cornerBR: {
        bottom: 15,
        right: 15,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 8,
    },
    statusCard: {
        width: width - DarkTheme.spacing.lg * 2,
        maxWidth: 340,
        backgroundColor: DarkTheme.colors.card,
        borderRadius: DarkTheme.borderRadius.xl,
        padding: DarkTheme.spacing.lg,
        borderWidth: 1,
        borderColor: DarkTheme.colors.border,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: DarkTheme.spacing.md,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: DarkTheme.colors.primary,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DarkTheme.spacing.sm,
        marginBottom: DarkTheme.spacing.lg,
    },
    stageEmoji: {
        fontSize: 24,
    },
    stageMessage: {
        fontSize: 18,
        fontWeight: '600',
        color: DarkTheme.colors.text,
        fontFamily: DarkTheme.typography.fontFamily,
    },
    progressContainer: {
        width: '100%',
        marginBottom: DarkTheme.spacing.md,
    },
    progressTrack: {
        height: 6,
        backgroundColor: DarkTheme.colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    tipText: {
        fontSize: 13,
        color: DarkTheme.colors.textTertiary,
        fontFamily: DarkTheme.typography.fontFamily,
        textAlign: 'center',
    },
});

export default FaceAnalysisLoader;
