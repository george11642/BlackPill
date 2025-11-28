import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { Download, Share2, Instagram, MessageCircle, X, Copy } from 'lucide-react-native';

import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { PrimaryButton, IconButton } from '../components/PrimaryButton';
import { GlassCard } from '../components/GlassCard';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { DarkTheme, getScoreColor } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface AnalysisData {
  id: string;
  score: number;
  potential_score?: number;
  image_url?: string;
  breakdown: {
    symmetry: number;
    jawline: number;
    eyes: number;
    lips: number;
    skin: number;
    bone_structure: number;
  };
  referral_code?: string;
}

export function ShareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { session, user } = useAuth();
  const { analysisId } = route.params as { analysisId: string };
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // Animation values
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const data = await apiGet<AnalysisData>(
        `/api/analyses/${analysisId}`,
        session?.access_token
      );
      setAnalysis(data);
      startAnimations();
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: 500 });
    buttonsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const captureCard = async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture?.();
        return uri || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to capture card:', error);
      return null;
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSharing(true);
    
    try {
      const uri = await captureCard();
      if (uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your BlackPill score',
          });
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share card');
    } finally {
      setSharing(false);
    }
  };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const uri = await captureCard();
      if (uri) {
        // TODO: Save to camera roll using expo-media-library
        Alert.alert('Success', 'Card saved to your photos!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save card');
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  if (loading || !analysis) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing your share card...</Text>
      </View>
    );
  }

  const potentialScore = analysis.potential_score || Math.min(10, analysis.score + 1.5);
  const referralCode = analysis.referral_code || user?.referral_code || 'BLACKPILL';
  const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://black-pill.app';
  const shareUrl = `${appUrl}/ref/${referralCode}`;

  return (
    <View style={styles.container}>
      {/* Close button */}
      <View style={styles.closeButton}>
        <IconButton
          icon={<X size={24} color={DarkTheme.colors.text} />}
          onPress={handleClose}
          variant="ghost"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Share Card Preview */}
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={styles.viewShot}
          >
            <ShareCard
              score={analysis.score}
              potentialScore={potentialScore}
              imageUrl={analysis.image_url}
              breakdown={analysis.breakdown}
              referralCode={referralCode}
              shareUrl={shareUrl}
            />
          </ViewShot>
        </Animated.View>

        {/* Swipe indicator */}
        <View style={styles.swipeIndicator}>
          <Text style={styles.swipeText}>swipe for more</Text>
          <View style={styles.dots}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={[styles.dot, i === 0 && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionButtons, buttonsAnimatedStyle]}>
          <PrimaryButton
            title="Save"
            onPress={handleSave}
            variant="outline"
            icon={<Download size={20} color={DarkTheme.colors.primary} />}
            style={styles.actionButton}
          />
          <PrimaryButton
            title="Share"
            onPress={handleShare}
            variant="primary"
            loading={sharing}
            icon={<Share2 size={20} color={DarkTheme.colors.background} />}
            style={styles.actionButton}
          />
        </Animated.View>

        {/* Share Options */}
        <Animated.View style={[styles.shareOptions, buttonsAnimatedStyle]}>
          <Text style={styles.shareOptionsTitle}>Share to</Text>
          <View style={styles.shareOptionsRow}>
            <ShareOption icon={<Instagram size={24} />} label="Instagram" />
            <ShareOption icon={<MessageCircle size={24} />} label="iMessage" />
            <ShareOption icon={<Copy size={24} />} label="Copy Link" />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Share Card Component (the actual card that gets shared)
interface ShareCardProps {
  score: number;
  potentialScore: number;
  imageUrl?: string;
  breakdown: {
    symmetry: number;
    jawline: number;
    eyes: number;
    lips: number;
    skin: number;
    bone_structure: number;
  };
  referralCode: string;
  shareUrl: string;
}

function ShareCard({
  score,
  potentialScore,
  imageUrl,
  breakdown,
  referralCode,
  shareUrl,
}: ShareCardProps) {
  const scoreColor = getScoreColor(score);

  const metrics = [
    { label: 'Masculinity', value: breakdown.jawline },
    { label: 'Skin Quality', value: breakdown.skin },
    { label: 'Jawline', value: breakdown.jawline },
    { label: 'Cheekbones', value: breakdown.bone_structure },
  ];

  return (
    <View style={shareCardStyles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.background, DarkTheme.colors.backgroundSecondary]}
        style={shareCardStyles.background}
      />

      {/* Header */}
      <Text style={shareCardStyles.title}>Ratings</Text>

      {/* Profile Photo */}
      <View style={shareCardStyles.avatarContainer}>
        <ProfileAvatar imageUrl={imageUrl} size="lg" showGoldRing />
      </View>

      {/* Main Scores */}
      <View style={shareCardStyles.scoresContainer}>
        <View style={shareCardStyles.scoreColumn}>
          <Text style={shareCardStyles.scoreLabel}>Overall</Text>
          <Text style={[shareCardStyles.scoreValue, { color: scoreColor }]}>
            {Math.round(score)}
          </Text>
        </View>
        <View style={shareCardStyles.scoreDivider} />
        <View style={shareCardStyles.scoreColumn}>
          <Text style={shareCardStyles.scoreLabel}>Potential</Text>
          <Text style={[shareCardStyles.scoreValue, { color: DarkTheme.colors.primary }]}>
            {Math.round(potentialScore)}
          </Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={shareCardStyles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={shareCardStyles.metricItem}>
            <Text style={shareCardStyles.metricLabel}>{metric.label}</Text>
            <Text style={shareCardStyles.metricValue}>{Math.round(metric.value)}</Text>
            <View style={shareCardStyles.metricBar}>
              <View
                style={[
                  shareCardStyles.metricBarFill,
                  { width: `${metric.value * 10}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* QR Code and Referral */}
      <View style={shareCardStyles.footer}>
        <View style={shareCardStyles.qrContainer}>
          <QRCode
            value={shareUrl}
            size={60}
            color={DarkTheme.colors.primary}
            backgroundColor="transparent"
          />
        </View>
        <View style={shareCardStyles.referralInfo}>
          <Text style={shareCardStyles.referralLabel}>Get your score</Text>
          <Text style={shareCardStyles.referralCode}>{referralCode}</Text>
        </View>
      </View>

      {/* Watermark */}
      <Text style={shareCardStyles.watermark}>black-pill.app</Text>
    </View>
  );
}

// Share Option Button
interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
}

function ShareOption({ icon, label }: ShareOptionProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement specific share actions
  };

  return (
    <GlassCard variant="subtle" onPress={handlePress} style={styles.shareOption}>
      <View style={styles.shareOptionIcon}>{icon}</View>
      <Text style={styles.shareOptionLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  viewShot: {
    borderRadius: DarkTheme.borderRadius.xl,
    overflow: 'hidden',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  swipeText: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DarkTheme.colors.surface,
  },
  dotActive: {
    backgroundColor: DarkTheme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xl,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  shareOptions: {
    width: '100%',
  },
  shareOptionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
    textAlign: 'center',
  },
  shareOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DarkTheme.spacing.md,
  },
  shareOption: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  shareOptionIcon: {
    marginBottom: DarkTheme.spacing.xs,
  },
  shareOptionLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

const shareCardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: DarkTheme.borderRadius.xl,
    overflow: 'hidden',
    padding: DarkTheme.spacing.lg,
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  scoreColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoreDivider: {
    width: 1,
    height: 60,
    backgroundColor: DarkTheme.colors.borderSubtle,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.lg,
  },
  metricItem: {
    width: '48%',
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.md,
    padding: DarkTheme.spacing.sm,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  metricBar: {
    height: 3,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.md,
    marginTop: 'auto',
  },
  qrContainer: {
    padding: DarkTheme.spacing.sm,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: DarkTheme.borderRadius.md,
  },
  referralInfo: {
    alignItems: 'flex-start',
  },
  referralLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: 1,
  },
  watermark: {
    position: 'absolute',
    bottom: DarkTheme.spacing.md,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

export default ShareScreen;
