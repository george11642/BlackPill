import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Camera, ChevronLeft, Calendar, TrendingUp } from 'lucide-react-native';

import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { IconButton } from '../components/PrimaryButton';
import { DarkTheme, getScoreColor } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 2;

interface Analysis {
  id: string;
  image_url: string;
  score: number;
  created_at: string;
  breakdown?: Record<string, number>;
}

interface ImageLoadState {
  [key: string]: 'loading' | 'loaded' | 'error';
}

interface HistoryResponse {
  analyses: Analysis[];
  total: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProgressPicturesScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState<ImageLoadState>({});

  // Animation values
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  };

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const data = await apiGet<HistoryResponse>(
        '/api/analyses/history?limit=50&sort_by=created_at&order=desc',
        session?.access_token
      );
      setAnalyses(data.analyses || []);
      setTotal(data.total || 0);
      startAnimations();
    } catch (error) {
      console.error('Failed to load progress pictures:', error);
      startAnimations();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  }, []);

  const handlePhotoPress = (analysis: Analysis) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to analysis result screen
    navigation.navigate('AnalysisResult' as never, { analysisId: analysis.id } as never);
  };

  const handleTakePhoto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Camera' as never);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateImprovement = () => {
    if (analyses.length < 2) return null;
    const latest = analyses[0]?.score || 0;
    const oldest = analyses[analyses.length - 1]?.score || 0;
    return (latest - oldest).toFixed(1);
  };

  const handleImageLoad = useCallback((itemId: string) => {
    setImageLoadStates(prev => {
      if (prev[itemId] === 'loaded') return prev; // Prevent unnecessary updates
      return { ...prev, [itemId]: 'loaded' };
    });
  }, []);

  const handleImageError = useCallback((itemId: string) => {
    setImageLoadStates(prev => {
      if (prev[itemId] === 'error') return prev; // Prevent unnecessary updates
      return { ...prev, [itemId]: 'error' };
    });
  }, []);

  const renderPhotoItem = ({ item, index }: { item: Analysis; index: number }) => {
    const scoreColor = getScoreColor(item.score);
    const imageLoadState = imageLoadStates[item.id] || 'loading';
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100).duration(400)}
        style={styles.photoWrapper}
      >
        <Pressable
          onPress={() => handlePhotoPress(item)}
          style={({ pressed }) => [
            styles.photoContainer,
            pressed && styles.photoPressed,
          ]}
        >
          {/* Image with loading/error handling */}
          <Image
            source={{ uri: item.image_url }}
            style={styles.photo}
            resizeMode="cover"
            onLoad={() => handleImageLoad(item.id)}
            onError={() => handleImageError(item.id)}
          />

          {/* Loading Overlay */}
          {imageLoadState === 'loading' && (
            <View style={[styles.photo, styles.photoPlaceholder, StyleSheet.absoluteFill]}>
              <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
            </View>
          )}

          {/* Error Overlay */}
          {imageLoadState === 'error' && (
            <View style={[styles.photo, styles.photoError, StyleSheet.absoluteFill]}>
              <Text style={styles.errorText}>Image failed to load</Text>
              <Text style={styles.errorSubtext}>Tap to retry</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.photoGradient}
          />
          <View style={styles.photoOverlay}>
            <Text style={[styles.photoScore, { color: scoreColor }]}>
              {item.score.toFixed(1)}
            </Text>
            <Text style={styles.photoDate}>{formatDate(item.created_at)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderHeader = () => {
    const improvement = calculateImprovement();
    
    return (
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {/* Stats Summary */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Camera size={20} color={DarkTheme.colors.primary} />
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Photos</Text>
            </View>
            {improvement && (
              <View style={styles.statItem}>
                <TrendingUp 
                  size={20} 
                  color={parseFloat(improvement) >= 0 ? DarkTheme.colors.success : DarkTheme.colors.error} 
                />
                <Text style={[
                  styles.statValue,
                  { color: parseFloat(improvement) >= 0 ? DarkTheme.colors.success : DarkTheme.colors.error }
                ]}>
                  {parseFloat(improvement) >= 0 ? '+' : ''}{improvement}
                </Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            )}
            {analyses.length > 0 && (
              <View style={styles.statItem}>
                <Calendar size={20} color={DarkTheme.colors.textSecondary} />
                <Text style={styles.statValue}>
                  {formatDate(analyses[0].created_at)}
                </Text>
                <Text style={styles.statLabel}>Latest</Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Take New Photo Button */}
        <Pressable
          onPress={handleTakePhoto}
          style={({ pressed }) => [
            styles.takePhotoButton,
            pressed && styles.takePhotoButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
            style={styles.takePhotoGradient}
          >
            <Camera size={24} color="#fff" />
            <Text style={styles.takePhotoText}>Take Progress Photo</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.sectionTitle}>Your Progress Timeline</Text>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Camera size={64} color={DarkTheme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Progress Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Take your first photo to start tracking your transformation journey
      </Text>
      <Pressable
        onPress={handleTakePhoto}
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.emptyButtonPressed,
        ]}
      >
        <Text style={styles.emptyButtonText}>Take First Photo</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[DarkTheme.colors.background, '#0a0a0a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />

      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <IconButton
          icon={<ChevronLeft size={24} color={DarkTheme.colors.text} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        <Text style={styles.navTitle}>Progress Pictures</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={analyses}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.photoRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DarkTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingTop: 60,
    paddingBottom: DarkTheme.spacing.md,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  header: {
    paddingHorizontal: DarkTheme.spacing.md,
    paddingBottom: DarkTheme.spacing.lg,
  },
  statsCard: {
    marginBottom: DarkTheme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  statLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  takePhotoButton: {
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: DarkTheme.spacing.lg,
  },
  takePhotoButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  takePhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.md,
  },
  takePhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  listContent: {
    paddingBottom: 100,
  },
  photoRow: {
    paddingHorizontal: DarkTheme.spacing.md,
    gap: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  photoWrapper: {
    flex: 1,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3,
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.surface,
  },
  photoPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    backgroundColor: DarkTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoError: {
    backgroundColor: DarkTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: DarkTheme.colors.error,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DarkTheme.spacing.sm,
  },
  photoScore: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  photoDate: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: DarkTheme.spacing.xl,
    paddingVertical: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.lg,
  },
  emptyButtonPressed: {
    opacity: 0.9,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

