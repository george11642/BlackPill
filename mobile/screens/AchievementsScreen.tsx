import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withDelay,
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Trophy, Award, TrendingUp, Users, Lock, CheckCircle2 } from 'lucide-react-native';

import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { Achievement } from '../lib/types';
import { DarkTheme } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'analysis', label: 'Analysis', icon: Award },
  { id: 'streak', label: 'Streaks', icon: TrendingUp },
  { id: 'social', label: 'Social', icon: Users },
];

// Helper to categorize achievements based on ID/Key
const getCategory = (id?: string): string => {
  if (!id) return 'analysis'; // Handle undefined id
  if (id.includes('scan') || id.includes('score') || id.includes('improved')) return 'analysis';
  if (id.includes('streak')) return 'streak';
  if (id.includes('referral') || id.includes('share') || id.includes('leaderboard')) return 'social';
  if (id.includes('routine')) return 'streak'; // or routine category if added
  return 'analysis';
};

export function AchievementsScreen() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    loadAchievements();
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await apiGet<{ achievements: any[] }>(
        '/api/achievements',
        session?.access_token
      );
      
      // Map API response to frontend Achievement type
      const mappedAchievements: Achievement[] = (data.achievements || []).map((achievement) => ({
        id: achievement.id || achievement.key, // Use id if available, fallback to key
        name: achievement.name,
        description: achievement.description || '', // Ensure description exists
        iconUrl: achievement.iconUrl || '', // Can be empty string
        unlocked: achievement.unlocked || false,
        unlockedAt: achievement.unlockedAt || achievement.unlocked_at || undefined,
      }));
      
      setAchievements(mappedAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(a => 
    selectedCategory === 'all' || getCategory(a.id) === selectedCategory
  );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = totalCount > 0 ? unlockedCount / totalCount : 0;

  const handleCategorySelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(id);
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const renderItem = ({ item, index }: { item: Achievement; index: number }) => {
    const isUnlocked = item.unlocked;
    
    return (
      <Animated.View key={item.id} entering={FadeInDown.delay(index * 50).springify()}>
        <GlassCard 
          style={[styles.card, !isUnlocked && styles.cardLocked]}
          variant={isUnlocked ? 'elevated' : 'subtle'}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, !isUnlocked && styles.iconContainerLocked]}>
              {item.iconUrl ? (
                <Image source={{ uri: item.iconUrl }} style={styles.icon} />
              ) : (
                <Trophy size={24} color={isUnlocked ? DarkTheme.colors.primary : DarkTheme.colors.textDisabled} />
              )}
              {!isUnlocked && (
                <View style={styles.lockBadge}>
                  <Lock size={10} color="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, !isUnlocked && styles.nameLocked]}>
                  {item.name}
                </Text>
                {isUnlocked && (
                  <CheckCircle2 size={16} color={DarkTheme.colors.success} />
                )}
              </View>
              
              <Text style={styles.description}>{item.description}</Text>
              
              {isUnlocked && item.unlockedAt && (
                <Text style={styles.unlockedDate}>
                  Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
                </Text>
              )}
              
              {/* Progress bar for locked items - simulated for now as API doesn't return progress yet */}
              {!isUnlocked && (
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: '0%' }]} />
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <BackHeader title="Achievements" variant="large" />

      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.totalProgressContainer}>
          <View style={styles.totalProgressTextRow}>
            <Text style={styles.totalProgressTitle}>Total Progress</Text>
            <Text style={styles.totalProgressValue}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.totalProgressBarBg}>
            <LinearGradient
              colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.totalProgressBar, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.totalProgressSubtitle}>
            {unlockedCount} of {totalCount} achievements unlocked
          </Text>
        </View>

        <View style={styles.categories}>
          <FlatList
            horizontal
            data={CATEGORIES}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected
                  ]}
                  onPress={() => handleCategorySelect(item.id)}
                >
                  <Icon 
                    size={14} 
                    color={isSelected ? DarkTheme.colors.background : DarkTheme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAchievements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    paddingTop: DarkTheme.spacing.sm,
  },
  totalProgressContainer: {
    marginHorizontal: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.lg,
  },
  totalProgressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  totalProgressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  totalProgressBarBg: {
    height: 8,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  totalProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  totalProgressSubtitle: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  categories: {
    marginBottom: DarkTheme.spacing.md,
  },
  categoriesList: {
    paddingHorizontal: DarkTheme.spacing.lg,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  categoryChipSelected: {
    backgroundColor: DarkTheme.colors.primary,
    borderColor: DarkTheme.colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  categoryTextSelected: {
    color: DarkTheme.colors.background,
    fontWeight: '600',
  },
  list: {
    padding: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.xs,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${DarkTheme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
    position: 'relative',
  },
  iconContainerLocked: {
    backgroundColor: DarkTheme.colors.surface,
  },
  icon: {
    width: 32,
    height: 32,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: DarkTheme.colors.textDisabled,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DarkTheme.colors.card,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    flex: 1,
    marginRight: 8,
  },
  nameLocked: {
    color: DarkTheme.colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 6,
    lineHeight: 18,
  },
  unlockedDate: {
    fontSize: 11,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: DarkTheme.colors.textDisabled,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: DarkTheme.spacing.lg,
  },
});
