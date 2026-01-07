import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Share,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Upload, Crown, Medal, ChevronRight, Share2, Globe, MapPin, Calendar, Building2, Map } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { apiGet, apiPatch, apiPut } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
import { GradientText } from '../components/GradientText';
import { LeaderboardEntry } from '../lib/types';
import { DarkTheme, getScoreColor } from '../lib/theme';
import { showAlert } from '../lib/utils/alert';
import { UsernameModal } from '../components/UsernameModal';

interface UserAnalysis {
  id: string;
  score: number;
  is_public: boolean;
  created_at: string;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
}

export function LeaderboardScreen() {
  const { session, user } = useAuth();
  const navigation = useNavigation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'referrals'>('all');
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all');
  const [region, setRegion] = useState<'global' | 'country' | 'state' | 'city'>('global');
  const [userAnalysis, setUserAnalysis] = useState<UserAnalysis | null>(null);
  const [bestAnalysis, setBestAnalysis] = useState<UserAnalysis | null>(null);
  const [currentPublicAnalysis, setCurrentPublicAnalysis] = useState<UserAnalysis | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sharingToLeaderboard, setSharingToLeaderboard] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingJoinAnalysisId, setPendingJoinAnalysisId] = useState<string | null>(null);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
      loadUserAnalysis();
    }, [filter, timeFrame, region])
  );

  useEffect(() => {
    loadLeaderboard();
    loadUserAnalysis();
  }, [filter, timeFrame, region]);

  // Check for better score and prompt to update
  useEffect(() => {
    if (bestAnalysis && currentPublicAnalysis && bestAnalysis.score > currentPublicAnalysis.score && !sharingToLeaderboard) {
      // User has a better score - we'll show it in the UI, but don't auto-prompt
      // The update button in the status card will handle this
    }
  }, [bestAnalysis, currentPublicAnalysis, sharingToLeaderboard]);

  const loadLeaderboard = async (forceRefresh = false) => {
    try {
      let endpoint =
        filter === 'referrals'
          ? '/api/leaderboard/referrals'
          : '/api/leaderboard';
      
      const params = new URLSearchParams();
      if (timeFrame !== 'all') params.append('timeframe', timeFrame);
      if (region !== 'global') params.append('scope', region);
      if (forceRefresh) params.append('refresh', 'true');
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const data = await apiGet<LeaderboardResponse>(
        endpoint,
        session?.access_token
      );
      setEntries(data.entries || []);
      
      // Find user's rank if they're on the leaderboard
      if (user?.id && data.entries) {
        const userIndex = data.entries.findIndex(e => e.userId === user.id);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        } else {
          setUserRank(null);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserAnalysis = async () => {
    if (!session?.access_token) return;
    
    try {
      // Get user's best score analysis
      const bestData = await apiGet<{ analyses: UserAnalysis[] }>(
        '/api/analyses/history?sort_by=score&order=desc&limit=1',
        session.access_token
      );
      
      // Get all analyses to find which one is currently public
      const allData = await apiGet<{ analyses: UserAnalysis[] }>(
        '/api/analyses/history?limit=100',
        session.access_token
      );
      
      if (bestData.analyses && bestData.analyses.length > 0) {
        const best = bestData.analyses[0];
        setBestAnalysis({
          ...best,
          is_public: best.is_public === true,
        });
        
        // Find the currently public analysis (if any)
        const publicAnalysis = allData.analyses?.find(a => a.is_public === true);
        if (publicAnalysis) {
          setCurrentPublicAnalysis({
            ...publicAnalysis,
            is_public: true,
            created_at: publicAnalysis.created_at,
          });
          // Use the public one for display if it exists
          setUserAnalysis({
            ...publicAnalysis,
            is_public: true,
            created_at: publicAnalysis.created_at,
          });
        } else {
          // No public analysis, use best score
        setUserAnalysis({
            ...best,
            is_public: false,
            created_at: best.created_at,
          });
          setCurrentPublicAnalysis(null);
        }
        
        // Check if user has a better score than what's currently public
        if (publicAnalysis && best.score > publicAnalysis.score) {
          // User has a better score - they can update
          // This will be handled in the UI
        }
      }
    } catch (error) {
      console.error('Failed to load user analysis:', error);
    }
  };

  const handleSetUsername = async (username: string) => {
    if (!session?.access_token) return;

    try {
      // Update username
      await apiPut(
        '/api/user/profile',
        { username },
        session.access_token
      );

      // Now try to join the leaderboard with the newly set username using best score
      if (bestAnalysis) {
        await apiPatch(
          `/api/analyses/${bestAnalysis.id}/visibility`,
          { is_public: true },
          session.access_token
        );
        setCurrentPublicAnalysis({ ...bestAnalysis, is_public: true });
        setUserAnalysis({ ...bestAnalysis, is_public: true });
        loadLeaderboard(true); // Force refresh to bypass cache
        loadUserAnalysis();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          title: 'Success!',
          message: 'Username set and your best score is now on the leaderboard!'
        });
        setShowUsernameModal(false);
      }
    } catch (error: any) {
      console.error('Failed to set username:', error);
      throw new Error(error.data?.message || error.message || 'Failed to set username');
    }
  };

  const handleShareRank = async () => {
    if (!userRank) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const appUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://www.shemax.app';
    try {
      await Share.share({
        message: `I'm ranked #${userRank} globally on SheMax! 🏆 Can you beat my face score? ${appUrl}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleShareToLeaderboard = async () => {
    console.log('handleShareToLeaderboard called', { bestAnalysis, currentPublicAnalysis, hasToken: !!session?.access_token });
    
    if (!bestAnalysis || !session?.access_token) {
      showAlert({
        title: 'No Analysis Found',
        message: 'Take a photo scan first to get your score and join the leaderboard!',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Scan', 
            onPress: () => (navigation as any).navigate('Camera')
          }
        ]
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if user has a better score than what's currently public
    const hasBetterScore = currentPublicAnalysis && bestAnalysis.score > currentPublicAnalysis.score;
    const isCurrentlyPublic = currentPublicAnalysis?.id === bestAnalysis.id && currentPublicAnalysis.is_public;

    if (isCurrentlyPublic) {
      // Already on leaderboard with best score - offer to remove
      showAlert({
        title: 'Leave Leaderboard?',
        message: 'Your best score will no longer appear in the rankings.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              setSharingToLeaderboard(true);
              try {
                await apiPatch(
                  `/api/analyses/${currentPublicAnalysis.id}/visibility`,
                  { is_public: false },
                  session.access_token
                );
                setCurrentPublicAnalysis(null);
                setUserAnalysis({ ...bestAnalysis, is_public: false });
                setUserRank(null);
                loadLeaderboard();
                loadUserAnalysis();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error: any) {
                showAlert({
                  title: 'Error',
                  message: error.message || 'Failed to update visibility'
                });
              } finally {
                setSharingToLeaderboard(false);
              }
            }
          }
        ]
      });
    } else if (hasBetterScore && currentPublicAnalysis) {
      // User has a better score - offer to update
      showAlert({
        title: 'Update Leaderboard?',
        message: `You have a better score (${bestAnalysis.score.toFixed(1)}) than what's currently shared (${currentPublicAnalysis.score.toFixed(1)}). Your photo and new best score will be visible to other users.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Update',
            onPress: async () => {
              setSharingToLeaderboard(true);
              try {
                // First, remove the old public analysis
                await apiPatch(
                  `/api/analyses/${currentPublicAnalysis.id}/visibility`,
                  { is_public: false },
                  session.access_token
                );
                // Then make the best score public
                await apiPatch(
                  `/api/analyses/${bestAnalysis.id}/visibility`,
                  { is_public: true },
                  session.access_token
                );
                setCurrentPublicAnalysis({ ...bestAnalysis, is_public: true });
                setUserAnalysis({ ...bestAnalysis, is_public: true });
                loadLeaderboard(true); // Force refresh to bypass cache
                loadUserAnalysis();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert({
                  title: 'Success!',
                  message: 'Your best score has been updated on the leaderboard!'
                });
              } catch (error: any) {
                console.error('API error:', error);
                if (error.data?.message) {
                  // Username required - show username modal
                  setPendingJoinAnalysisId(bestAnalysis.id);
                  setShowUsernameModal(true);
                } else {
                  showAlert({
                    title: 'Error',
                    message: error.message || 'Failed to update leaderboard'
                  });
                }
              } finally {
                setSharingToLeaderboard(false);
              }
            }
          }
        ]
      });
    } else {
      // Not on leaderboard - confirm to join with picture warning
      showAlert({
        title: 'Join Leaderboard',
        message: `Share your best score (${bestAnalysis.score.toFixed(1)})? Your photo and score will be visible to other users on the leaderboard.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              console.log('Share button pressed, calling API...');
              setSharingToLeaderboard(true);
              try {
                const result = await apiPatch(
                  `/api/analyses/${bestAnalysis.id}/visibility`,
                  { is_public: true },
                  session.access_token
                );
                console.log('API result:', result);
                setCurrentPublicAnalysis({ ...bestAnalysis, is_public: true });
                setUserAnalysis({ ...bestAnalysis, is_public: true });
                loadLeaderboard(true); // Force refresh to bypass cache
                loadUserAnalysis();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert({
                  title: 'Success!',
                  message: 'Your best score is now on the leaderboard!'
                });
              } catch (error: any) {
                console.error('API error:', error);
                if (error.data?.message) {
                  // Username required - show username modal
                  setPendingJoinAnalysisId(bestAnalysis.id);
                  setShowUsernameModal(true);
                } else {
                  showAlert({
                    title: 'Error',
                    message: error.message || 'Failed to join leaderboard'
                  });
                }
              } finally {
                setSharingToLeaderboard(false);
              }
            }
          }
        ]
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
    loadUserAnalysis();
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = user?.id === item.userId;
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

    return (
      <GlassCard 
        style={{
          ...styles.card, 
          ...(isCurrentUser ? styles.currentUserCard : {})
        }}
      >
        <View style={styles.row}>
          <View style={styles.rank}>
            {medal ? (
              <Text style={styles.medal}>{medal}</Text>
            ) : (
              <Text style={styles.rankText}>#{item.rank}</Text>
            )}
          </View>
          {item.avatarUrl ? (
            <Image 
              source={{ uri: item.avatarUrl }} 
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {(item.username || 'A')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>
                {item.username || 'Anonymous'}
              </Text>
              {isCurrentUser && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={[styles.score, { color: getScoreColor(item.score) }]}>
              {item.score.toFixed(1)} points
            </Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderUserStatus = () => {
    if (!session?.access_token) return null;

    const hasBetterScore = currentPublicAnalysis && bestAnalysis && bestAnalysis.score > currentPublicAnalysis.score;
    const isOnLeaderboard = currentPublicAnalysis?.is_public && userRank;

    return (
      <GlassCard variant="elevated" style={styles.statusCard}>
        {isOnLeaderboard ? (
          // User is on leaderboard
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <Crown size={24} color={DarkTheme.colors.primary} />
            </View>
            <View style={styles.statusInfo}>
              <GradientText 
                text={`You're ranked #${userRank}`}
                fontSize={24}
                fontWeight="700"
                colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={styles.statusActions}>
                <TouchableOpacity onPress={handleShareRank} style={styles.shareButton}>
                  <Share2 size={14} color={DarkTheme.colors.primary} />
                  <Text style={styles.shareButtonText}>Share Rank</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.leaveButton}
              onPress={handleShareToLeaderboard}
              disabled={sharingToLeaderboard}
            >
              <Text style={styles.leaveButtonText}>
                {hasBetterScore ? 'Update' : 'Leave'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : bestAnalysis ? (
          // User has analysis but not on leaderboard
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <Upload size={24} color={DarkTheme.colors.textSecondary} />
            </View>
            <View style={styles.statusInfo}>
              <GradientText 
                text="Join the Competition"
                fontSize={24}
                fontWeight="700"
                colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.statusSubtitle}>
                Share your best score: {bestAnalysis.score.toFixed(1)}
              </Text>
            </View>
            <PrimaryButton
              title={sharingToLeaderboard ? 'Sharing...' : 'Share'}
              onPress={handleShareToLeaderboard}
              variant="primary"
              size="sm"
              disabled={sharingToLeaderboard}
              style={styles.joinButton}
            />
          </View>
        ) : (
          // User has no analysis
          <View style={styles.statusContent}>
            <View style={styles.statusIcon}>
              <Trophy size={24} color={DarkTheme.colors.textSecondary} />
            </View>
            <View style={styles.statusInfo}>
              <GradientText 
                text="Get Your Score"
                fontSize={24}
                fontWeight="700"
                colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.statusSubtitle}>
                Take a scan to compete
              </Text>
            </View>
            <PrimaryButton
              title="Scan Now"
              onPress={() => (navigation as any).navigate('Camera')}
              variant="outline"
              size="sm"
              style={styles.joinButton}
            />
          </View>
        )}
      </GlassCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[DarkTheme.colors.card, DarkTheme.colors.cardElevated]}
        style={styles.emptyIcon}
      >
        <Trophy size={48} color={DarkTheme.colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'referrals'
          ? 'Invite friends to see referral rankings here.'
          : 'Be the first to join the leaderboard!'}
      </Text>
      {filter === 'all' && bestAnalysis && !currentPublicAnalysis?.is_public && (
        <PrimaryButton
          title="Share Your Best Score"
          onPress={handleShareToLeaderboard}
          variant="primary"
          icon={<Upload size={18} color={DarkTheme.colors.background} />}
          style={styles.emptyButton}
        />
      )}
      <View style={styles.emptyTip}>
        <Users size={16} color={DarkTheme.colors.textTertiary} />
        <Text style={styles.emptyTipText}>
          Be among the first to appear on the leaderboard
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <BackHeader title="Leaderboard" variant="large" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Leaderboard" variant="large" />
      
      {/* User Status Card */}
      <View style={styles.statusContainer}>
        {renderUserStatus()}
      </View>

      {/* Main Filters - Score and Referrals */}
      <View style={styles.mainFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mainFilters} nestedScrollEnabled={true}>
          <TouchableOpacity
            style={[styles.mainFilter, filter === 'all' && styles.mainFilterActive]}
            onPress={() => setFilter('all')}
          >
            <Trophy size={16} color={filter === 'all' ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary} />
            <Text style={[styles.mainFilterText, filter === 'all' && styles.mainFilterTextActive]}>
              Score
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainFilter, filter === 'referrals' && styles.mainFilterActive]}
            onPress={() => setFilter('referrals')}
          >
            <Users size={16} color={filter === 'referrals' ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary} />
            <Text style={[styles.mainFilterText, filter === 'referrals' && styles.mainFilterTextActive]}>
              Referrals
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Sub-Filters - Time and Region (only shown when Score filter is active) */}
      {filter === 'all' && (
        <View style={styles.subFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subFilters} nestedScrollEnabled={true}>
            {/* Time Filter */}
            <TouchableOpacity
              style={[styles.subFilter, timeFrame !== 'all' && styles.subFilterActive]}
              onPress={() => {
                const next = timeFrame === 'all' ? 'month' : timeFrame === 'month' ? 'week' : 'all';
                setTimeFrame(next);
              }}
            >
              <Calendar size={16} color={timeFrame !== 'all' ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary} />
              <Text style={[styles.subFilterText, timeFrame !== 'all' && styles.subFilterTextActive]}>
                {timeFrame === 'all' ? 'All Time' : timeFrame === 'month' ? 'Monthly' : 'Weekly'}
              </Text>
            </TouchableOpacity>

            {/* Region Filter */}
            <TouchableOpacity
              style={[styles.subFilter, region !== 'global' && styles.subFilterActive]}
              onPress={() => {
                const next = region === 'global' ? 'country' : region === 'country' ? 'state' : region === 'state' ? 'city' : 'global';
                setRegion(next);
              }}
            >
              {region === 'global' ? (
                <Globe size={16} color={DarkTheme.colors.textTertiary} />
              ) : region === 'country' ? (
                <MapPin size={16} color={DarkTheme.colors.primary} />
              ) : region === 'state' ? (
                <Map size={16} color={DarkTheme.colors.primary} />
              ) : (
                <Building2 size={16} color={DarkTheme.colors.primary} />
              )}
              <Text style={[styles.subFilterText, region !== 'global' && styles.subFilterTextActive]}>
                {region === 'global' ? 'Global' : region === 'country' ? 'My Country' : region === 'state' ? 'My State' : 'My City'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {entries.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DarkTheme.colors.primary}
            />
          }
        />
      )}

      <UsernameModal
        visible={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onSubmit={handleSetUsername}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  statusContainer: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.sm,
  },
  statusCard: {
    marginBottom: DarkTheme.spacing.sm,
    minHeight: 100, // Prevent card collapse
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DarkTheme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DarkTheme.spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  statusSubtitle: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  statusActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  joinButton: {
    minWidth: 80,
  },
  leaveButton: {
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
  },
  leaveButtonText: {
    fontSize: 14,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  header: {
    paddingBottom: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.sm,
  },
  // Main Filters (Score/Referrals)
  mainFiltersContainer: {
    paddingTop: DarkTheme.spacing.sm,
    paddingBottom: DarkTheme.spacing.xs,
  },
  mainFilters: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  mainFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
    paddingVertical: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.lg,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.card,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  mainFilterActive: {
    backgroundColor: DarkTheme.colors.primaryDark,
    borderColor: DarkTheme.colors.primary,
  },
  mainFilterText: {
    fontSize: 15,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '500',
  },
  mainFilterTextActive: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
  // Sub-Filters (Time/Region)
  subFiltersContainer: {
    paddingTop: DarkTheme.spacing.xs,
    paddingBottom: DarkTheme.spacing.md,
    marginTop: DarkTheme.spacing.xs,
  },
  subFilters: {
    flexDirection: 'row',
    gap: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.sm,
  },
  subFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
    paddingVertical: DarkTheme.spacing.sm,
    paddingHorizontal: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.card,
  },
  subFilterActive: {
    backgroundColor: DarkTheme.colors.primaryDark,
  },
  subFilterText: {
    fontSize: 14,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  subFilterTextActive: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: DarkTheme.spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: DarkTheme.spacing.sm,
  },
  currentUserCard: {
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  rank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  medal: {
    fontSize: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    minWidth: 72,
    minHeight: 72,
    borderRadius: 36,
    marginHorizontal: DarkTheme.spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: DarkTheme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.xs,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  youBadge: {
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DarkTheme.borderRadius.sm,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  score: {
    fontSize: 13,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 14,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyButton: {
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.card,
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    gap: DarkTheme.spacing.sm,
  },
  emptyTipText: {
    fontSize: 13,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});
