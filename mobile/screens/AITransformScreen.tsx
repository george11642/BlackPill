import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { X, Download, Share2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';

import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { PrimaryButton, IconButton } from '../components/PrimaryButton';
import { GlassCard } from '../components/GlassCard';
import { LockedFeatureOverlay } from '../components/LockedFeatureOverlay';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - 48;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.25;

interface Transformation {
  id: string;
  scenario: string;
  scenario_name: string;
  image_url: string;
}

const SCENARIOS = [
  { id: 'formal', name: 'Formal Event', emoji: '🎩' },
  { id: 'casual', name: 'Casual Cool', emoji: '😎' },
  { id: 'fitness', name: 'Fitness Model', emoji: '💪' },
  { id: 'professional', name: 'Business Executive', emoji: '💼' },
  { id: 'beach', name: 'Beach Lifestyle', emoji: '🏖️' },
];

export function AITransformScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { features } = useSubscription();
  const canAccess = features.aiTransform.access;
  const { analysisId } = route.params as { analysisId: string };
  
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.9);

  useEffect(() => {
    loadTransformations();
    startAnimations();
  }, []);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    imageScale.value = withSpring(1, { damping: 15, stiffness: 100 });
  };

  const loadTransformations = async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ transformations: Transformation[] }>(
        `/api/ai-transform?analysisId=${analysisId}`,
        session?.access_token
      );
      setTransformations(data.transformations || []);
    } catch (error) {
      console.error('Failed to load transformations:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTransformation = async (scenario?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      const data = await apiPost<{ transformations: Transformation[]; remaining_this_month: number }>(
        '/api/ai-transform',
        { analysisId, scenario: scenario || 'formal' },
        session?.access_token
      );

      if (data.transformations && data.transformations.length > 0) {
        setTransformations(prev => [...data.transformations, ...prev]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate transformation';
      if (error?.upgrade_required) {
        Alert.alert(
          'Subscription Required',
          'AI transformations require a subscription. Upgrade to unlock this feature!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => navigation.navigate('Subscription' as never) },
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < transformations.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const renderTransformation = ({ item, index }: { item: Transformation; index: number }) => (
    <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.transformedImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.imageGradient}
      />
      <View style={styles.scenarioLabel}>
        <Text style={styles.scenarioText}>{item.scenario_name}</Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LockedFeatureOverlay
        isVisible={!canAccess}
        title="AI Transform Locked"
        description="See your potential as a 10/10. Upgrade to Elite to unlock AI transformations."
        style={{ zIndex: 200 }}
      />
      {/* Close button */}
      <Animated.View style={[styles.closeButton, headerAnimatedStyle]}>
        <IconButton
          icon={<X size={24} color={DarkTheme.colors.text} />}
          onPress={handleClose}
          variant="ghost"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.title}>You as a 10/10</Text>
        <Text style={styles.subtitle}>AI-enhanced version of you</Text>
      </Animated.View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading transformations...</Text>
        </View>
      ) : transformations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Sparkles size={48} color={DarkTheme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>See Your Best Self</Text>
          <Text style={styles.emptySubtitle}>
            Generate AI-enhanced images showing your potential in different scenarios
          </Text>
          <PrimaryButton
            title={generating ? 'Generating...' : 'Generate Transformation'}
            onPress={() => generateTransformation()}
            loading={generating}
            style={styles.generateButton}
            icon={<Sparkles size={20} color={DarkTheme.colors.background} />}
          />
        </View>
      ) : (
        <>
          {/* Image Carousel */}
          <FlatList
            ref={flatListRef}
            data={transformations}
            renderItem={renderTransformation}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
              setCurrentIndex(index);
            }}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={IMAGE_WIDTH + 16}
            decelerationRate="fast"
          />

          {/* Navigation Arrows */}
          {transformations.length > 1 && (
            <View style={styles.navigationContainer}>
              <IconButton
                icon={<ChevronLeft size={24} color={currentIndex === 0 ? DarkTheme.colors.textDisabled : DarkTheme.colors.text} />}
                onPress={handlePrevious}
                variant="ghost"
              />
              <View style={styles.pagination}>
                {transformations.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
              <IconButton
                icon={<ChevronRight size={24} color={currentIndex === transformations.length - 1 ? DarkTheme.colors.textDisabled : DarkTheme.colors.text} />}
                onPress={handleNext}
                variant="ghost"
              />
            </View>
          )}

          {/* Swipe hint */}
          <Text style={styles.swipeHint}>swipe for more</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <PrimaryButton
              title="Save"
              onPress={() => {}}
              variant="outline"
              icon={<Download size={20} color={DarkTheme.colors.primary} />}
              style={styles.actionButton}
            />
            <PrimaryButton
              title="Share"
              onPress={() => {}}
              variant="primary"
              icon={<Share2 size={20} color={DarkTheme.colors.background} />}
              style={styles.actionButton}
            />
          </View>

          {/* Generate More Button */}
          <PrimaryButton
            title={generating ? 'Generating...' : 'Generate Another'}
            onPress={() => generateTransformation()}
            loading={generating}
            variant="ghost"
            style={styles.generateMoreButton}
            icon={<Sparkles size={18} color={DarkTheme.colors.primary} />}
          />
        </>
      )}

      {/* Scenario Selector (shown when generating) */}
      {generating && (
        <View style={styles.generatingOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          <Sparkles size={48} color={DarkTheme.colors.primary} />
          <Text style={styles.generatingText}>Creating your transformation...</Text>
          <Text style={styles.generatingSubtext}>This may take a moment</Text>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} style={{ marginTop: 24 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: DarkTheme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: DarkTheme.spacing.md,
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DarkTheme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.lg,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderGold,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.xl,
    lineHeight: 24,
  },
  generateButton: {
    width: '100%',
  },
  carouselContent: {
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: DarkTheme.borderRadius.xl,
    overflow: 'hidden',
    marginRight: DarkTheme.spacing.md,
    position: 'relative',
  },
  transformedImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  scenarioLabel: {
    position: 'absolute',
    bottom: DarkTheme.spacing.md,
    left: DarkTheme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.xs,
    borderRadius: DarkTheme.borderRadius.full,
  },
  scenarioText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DarkTheme.colors.surface,
  },
  paginationDotActive: {
    backgroundColor: DarkTheme.colors.primary,
    width: 24,
  },
  swipeHint: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    marginTop: DarkTheme.spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  generateMoreButton: {
    marginHorizontal: DarkTheme.spacing.lg,
    marginTop: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xl,
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  generatingText: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.lg,
  },
  generatingSubtext: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.xs,
  },
});

export default AITransformScreen;

