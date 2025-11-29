import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { showAlert } from '../lib/utils/alert';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Settings,
  ChevronRight,
  Crown,
  Users,
  Trophy,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Sparkles,
  DollarSign,
  Flame,
  Clock,
  Globe,
  Trash2,
} from 'lucide-react-native';

import { apiGet, apiDelete } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { useSubscription } from '../lib/subscription/context';
import { GlassCard } from '../components/GlassCard';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { PrimaryButton, IconButton } from '../components/PrimaryButton';
import { DarkTheme, getScoreColor } from '../lib/theme';

interface UserStats {
  score: number;
  potential: number;
  streak: number;
  weeklyStreak?: number;
  monthlyStreak?: number;
  scansRemaining: number;
  tier: string;
  avatarUrl?: string;
  latestAnalysisImage?: string;
  globalRank?: number;
}

interface UserStatsResponse {
  overall_score: number;
  potential_score: number;
  streak: number;
  weekly_streak?: number;
  monthly_streak?: number;
  tier: string;
  scans_remaining: number;
  total_analyses: number;
  avatar_url?: string;
  username: string;
  email: string;
  latest_analysis_image?: string;
  global_rank?: number;
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, signOut, session } = useAuth();
  const { tier: subscriptionTier } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    score: 0,
    potential: 0,
    streak: 0,
    weeklyStreak: 0,
    monthlyStreak: 0,
    scansRemaining: 0,
    tier: 'free',
    avatarUrl: undefined,
    latestAnalysisImage: undefined,
    globalRank: undefined,
  });
  const [achievementCount, setAchievementCount] = useState({ unlocked: 0, total: 0 });

  // Use subscription context tier as the source of truth
  const currentTier = subscriptionTier || stats.tier;

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserStats();
      loadAchievements();
    }, [])
  );

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const data = await apiGet<UserStatsResponse>(
        '/api/user/stats',
        session?.access_token
      );
      
      setStats({
        score: data.overall_score,
        potential: data.potential_score,
        streak: data.streak,
        weeklyStreak: data.weekly_streak || 0,
        monthlyStreak: data.monthly_streak || 0,
        scansRemaining: data.scans_remaining,
        tier: data.tier,
        avatarUrl: data.avatar_url,
        latestAnalysisImage: data.latest_analysis_image,
        globalRank: data.global_rank,
      });
      
      startAnimations();
    } catch (error) {
      console.error('Failed to load user stats:', error);
      startAnimations();
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const data = await apiGet<{ achievements: any[] }>(
        '/api/achievements',
        session?.access_token
      );
      const achievements = data.achievements || [];
      const unlocked = achievements.filter(a => a.unlocked).length;
      setAchievementCount({ unlocked, total: achievements.length });
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
    });
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete('/api/user/delete', session?.access_token);
              // Sign out after successful deletion
              await signOut();
            } catch (error: any) {
              console.error('Failed to delete account:', error);
              showAlert({
                title: 'Error',
                message: error?.data?.error || error?.message || 'Failed to delete account. Please try again.',
                buttons: [{ text: 'OK' }],
              });
            }
          },
        },
      ],
    });
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: (1 - headerOpacity.value) * 20 }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 30 }],
  }));

  const getTierDisplayName = (tier: string) => {
    if (tier === 'unlimited') return 'Elite';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const menuItems = [
    {
      icon: Crown,
      label: 'Subscription',
      sublabel: currentTier === 'free' ? 'Upgrade to Pro' : `${getTierDisplayName(currentTier)} Plan`,
      onPress: () => navigation.navigate('Subscription' as never),
      highlight: currentTier === 'free',
    },
    {
      icon: Sparkles,
      label: 'See Yourself as a 10/10',
      sublabel: 'Visualize your potential',
      onPress: () => navigation.navigate('AITransform' as never),
      highlight: true,
    },
    ...(currentTier !== 'free' ? [{
      icon: DollarSign,
      label: 'Affiliate Program',
      sublabel: 'Earn commissions',
      onPress: () => navigation.navigate('Affiliate' as never),
      highlight: false,
    }] : []),
    {
      icon: Users,
      label: 'Referrals',
      sublabel: 'Invite friends, earn scans',
      onPress: () => navigation.navigate('Referrals' as never),
    },
    {
      icon: Trophy,
      label: 'Challenges',
      sublabel: 'Join community events',
      onPress: () => navigation.navigate('Challenges' as never),
    },
    {
      icon: Clock,
      label: 'Scan History',
      sublabel: 'View analyses & create time-lapse',
      onPress: () => navigation.navigate('History' as never),
    },
    {
      icon: Trophy,
      label: 'Achievements',
      sublabel: `${achievementCount.unlocked} badges earned`,
      onPress: () => navigation.navigate('Achievements' as never),
    },
    {
      icon: Bell,
      label: 'Notifications',
      sublabel: 'Manage alerts',
      onPress: () => navigation.navigate('Notifications' as never),
    },
    {
      icon: Shield,
      label: 'Privacy & Ethics',
      sublabel: 'Data & AI settings',
      onPress: () => navigation.navigate('EthicalSettings' as never),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      sublabel: 'FAQs and contact',
      onPress: () => navigation.navigate('HelpAndSupport' as never),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Settings */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profile</Text>
        <IconButton
          icon={<Settings size={22} color={DarkTheme.colors.textSecondary} />}
          onPress={() => navigation.navigate('Settings' as never)}
          variant="ghost"
        />
      </View>

      {/* Profile Card - Identity focused */}
      <Animated.View style={headerAnimatedStyle}>
        <GlassCard variant="gold" style={styles.profileCard}>
          <View style={styles.profileContent}>
            <ProfileAvatar
              imageUrl={stats.latestAnalysisImage || stats.avatarUrl || user?.avatar_url}
              size="lg"
              showGoldRing
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.username || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.tierBadge}>
                  <Crown size={14} color={DarkTheme.colors.primary} />
                  <Text style={styles.tierText}>
                    {getTierDisplayName(currentTier)}
                  </Text>
                </View>
                {stats.globalRank && (
                  <View style={styles.rankBadge}>
                    <Globe size={12} color={DarkTheme.colors.background} />
                    <Text style={styles.rankText}>#{stats.globalRank}</Text>
                  </View>
                )}
              </View>
            </View>
            {/* Scores Section - Stacked vertically */}
            <View style={styles.scoresSection}>
              <View style={styles.scoreStack}>
                <Text style={[styles.scoreValuePrimary, { color: getScoreColor(stats.score) }]}>
                  {stats.score.toFixed(1)}
                </Text>
                <View style={styles.scoreSeparator} />
                <Text style={[styles.scoreValueSecondary, { color: getScoreColor(stats.potential) }]}>
                  {stats.potential.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          {/* Streak Counter - The one unique stat for Profile */}
          <View style={styles.streakRow}>
            <Flame size={18} color={DarkTheme.colors.warning} />
            <Text style={styles.streakValue}>{stats.streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Scans Remaining */}
      <Animated.View style={contentAnimatedStyle}>
        <GlassCard variant="elevated" style={styles.scansCard}>
          <View style={styles.scansContent}>
            <View>
              <Text style={styles.scansLabel}>Scans Remaining</Text>
              <Text style={styles.scansValue}>{stats.scansRemaining}</Text>
            </View>
            {currentTier === 'free' && (
              <PrimaryButton
                title="Get More"
                onPress={() => navigation.navigate('Subscription' as never)}
                size="sm"
                icon={<Sparkles size={16} color={DarkTheme.colors.background} />}
              />
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Menu Items */}
      <Animated.View style={[styles.menuContainer, contentAnimatedStyle]}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            sublabel={item.sublabel}
            onPress={item.onPress}
            highlight={item.highlight}
            delay={index * 50}
          />
        ))}
      </Animated.View>

      {/* Sign Out */}
      <Animated.View style={[styles.signOutContainer, contentAnimatedStyle]}>
        <GlassCard variant="subtle" onPress={handleSignOut}>
          <View style={styles.signOutContent}>
            <LogOut size={20} color={DarkTheme.colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Delete Account */}
      <Animated.View style={[styles.deleteAccountContainer, contentAnimatedStyle]}>
        <GlassCard variant="subtle" onPress={handleDeleteAccount}>
          <View style={styles.deleteAccountContent}>
            <Trash2 size={20} color={DarkTheme.colors.error} />
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* App Version */}
      <Text style={styles.version}>BlackPill v1.0.0</Text>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// Menu Item Component
interface MenuItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sublabel: string;
  onPress: () => void;
  highlight?: boolean;
  delay: number;
}

function MenuItem({ icon: Icon, label, sublabel, onPress, highlight, delay }: MenuItemProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard
        variant={highlight ? 'gold' : 'subtle'}
        onPress={handlePress}
        style={styles.menuItem}
      >
        <View style={styles.menuItemContent}>
          <View style={[styles.menuIconContainer, highlight && styles.menuIconHighlight]}>
            <Icon size={20} color={highlight ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuLabel, highlight && styles.menuLabelHighlight]}>
              {label}
            </Text>
            <Text style={styles.menuSublabel}>{sublabel}</Text>
          </View>
          <ChevronRight size={20} color={DarkTheme.colors.textTertiary} />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  profileCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: DarkTheme.spacing.md,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  userEmail: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DarkTheme.colors.primary}20`,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: DarkTheme.borderRadius.full,
    gap: 4,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: 4,
    borderRadius: DarkTheme.borderRadius.full,
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoresSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: DarkTheme.spacing.sm,
  },
  scoreStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValuePrimary: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 32,
  },
  scoreSeparator: {
    width: 24,
    height: 2,
    backgroundColor: DarkTheme.colors.borderSubtle,
    marginVertical: 4,
    borderRadius: 1,
  },
  scoreValueSecondary: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 24,
    opacity: 0.85,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
    gap: DarkTheme.spacing.xs,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.warning,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  streakLabel: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scansCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  scansContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scansLabel: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scansValue: {
    fontSize: 32,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  menuContainer: {
    gap: DarkTheme.spacing.sm,
    marginBottom: DarkTheme.spacing.lg,
  },
  menuItem: {
    marginBottom: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  menuIconHighlight: {
    backgroundColor: `${DarkTheme.colors.primary}20`,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  menuLabelHighlight: {
    color: DarkTheme.colors.primary,
  },
  menuSublabel: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  signOutContainer: {
    marginBottom: DarkTheme.spacing.md,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.error,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  deleteAccountContainer: {
    marginBottom: DarkTheme.spacing.lg,
  },
  deleteAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DarkTheme.spacing.sm,
  },
  deleteAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.error,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  version: {
    fontSize: 12,
    color: DarkTheme.colors.textDisabled,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ProfileScreen;
