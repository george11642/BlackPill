import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Clock, TrendingUp, TrendingDown, Minus, Grid, List, Trash2, Copy, Film, CheckCircle2, Circle, ChevronLeft } from 'lucide-react-native';
import { apiGet, apiDelete } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { IconButton } from '../components/PrimaryButton';
import { DarkTheme, getScoreColor } from '../lib/theme';

interface Analysis {
  id: string;
  image_url?: string;
  photoUrl?: string;
  score: number;
  potential_score?: number;
  created_at?: string;
  createdAt?: string;
}

export function HistoryScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history',
        session?.access_token
      );
      setAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const enterSelectionMode = (initialId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Analyses',
      `Are you sure you want to delete ${selectedIds.size} analyses? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await Promise.all(
                Array.from(selectedIds).map(id => 
                  apiDelete(`/api/analyses/${id}`, session?.access_token)
                )
              );
              await loadHistory();
              exitSelectionMode();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some items');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompareSelected = () => {
    if (selectedIds.size !== 2) {
      Alert.alert('Comparison', 'Please select exactly 2 analyses to compare.');
      return;
    }
    const ids = Array.from(selectedIds);
    navigation.navigate('Comparison' as never, {
      analysisId1: ids[0],
      analysisId2: ids[1]
    } as never);
    exitSelectionMode();
  };

  const handleCreateTimelapse = () => {
    if (analyses.length < 2) {
      Alert.alert(
        'Not Enough Scans',
        'You need at least 2 scans to create a timelapse. Take more scans to see your progress over time.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectionMode && selectedIds.size >= 2) {
      // Navigate with pre-selected analyses
      (navigation as any).navigate('TimelapseSelection', {
        selectedIds: Array.from(selectedIds),
      });
      exitSelectionMode();
    } else {
      // Navigate to selection screen with all analyses
      (navigation as any).navigate('TimelapseSelection');
    }
  };

  const getScoreTrend = (index: number) => {
    if (index >= analyses.length - 1) return 'neutral';
    const currentScore = analyses[index].score;
    const previousScore = analyses[index + 1].score;
    if (currentScore > previousScore) return 'up';
    if (currentScore < previousScore) return 'down';
    return 'neutral';
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }: { item: Analysis; index: number }) => {
    const imageUrl = item.image_url || item.photoUrl;
    const createdAt = item.created_at || item.createdAt || new Date().toISOString();
    const trend = getScoreTrend(index);
    const scoreColor = getScoreColor(item.score);
    const isSelected = selectedIds.has(item.id);

    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (selectionMode) {
              toggleSelection(item.id);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('AnalysisResult' as never, {
                analysisId: item.id,
              } as never);
            }
          }}
          onLongPress={() => enterSelectionMode(item.id)}
          style={styles.gridItemContainer}
        >
          <GlassCard style={[styles.gridCard, isSelected && styles.selectedCard]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.gridThumbnail} />
            ) : (
              <View style={[styles.gridThumbnail, styles.placeholderImage]}>
                <Clock size={24} color={DarkTheme.colors.textTertiary} />
              </View>
            )}
            <View style={styles.gridOverlay}>
              <Text style={[styles.gridScore, { color: scoreColor }]}>
                {item.score.toFixed(1)}
              </Text>
            </View>
            {selectionMode && (
              <View style={styles.selectionOverlay}>
                {isSelected ? (
                  <CheckCircle2 size={24} color={DarkTheme.colors.primary} fill={DarkTheme.colors.background} />
                ) : (
                  <Circle size={24} color="white" />
                )}
              </View>
            )}
          </GlassCard>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('AnalysisResult' as never, {
              analysisId: item.id,
            } as never);
          }
        }}
        onLongPress={() => enterSelectionMode(item.id)}
      >
        <GlassCard style={[styles.card, isSelected && styles.selectedCard]}>
          <View style={styles.cardContent}>
            <View style={styles.thumbnailContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.placeholderImage]}>
                  <Clock size={24} color={DarkTheme.colors.textTertiary} />
                </View>
              )}
              {selectionMode && (
                <View style={styles.listSelectionOverlay}>
                  {isSelected ? (
                    <CheckCircle2 size={20} color={DarkTheme.colors.primary} fill={DarkTheme.colors.background} />
                  ) : (
                    <Circle size={20} color={DarkTheme.colors.textTertiary} />
                  )}
                </View>
              )}
            </View>
            <View style={styles.info}>
              <View style={styles.scoreRow}>
                <Text style={[styles.score, { color: scoreColor }]}>
                  {item.score.toFixed(1)}
                </Text>
                {trend === 'up' && (
                  <View style={[styles.trendBadge, styles.trendUp]}>
                    <TrendingUp size={12} color={DarkTheme.colors.success} />
                  </View>
                )}
                {trend === 'down' && (
                  <View style={[styles.trendBadge, styles.trendDown]}>
                    <TrendingDown size={12} color={DarkTheme.colors.error} />
                  </View>
                )}
                {trend === 'neutral' && analyses.length > 1 && index < analyses.length - 1 && (
                  <View style={[styles.trendBadge, styles.trendNeutral]}>
                    <Minus size={12} color={DarkTheme.colors.textTertiary} />
                  </View>
                )}
              </View>
              {item.potential_score && (
                <Text style={styles.potential}>
                  Potential: {item.potential_score.toFixed(1)}
          </Text>
              )}
              <Text style={styles.date}>{formatDate(createdAt)}</Text>
            </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[DarkTheme.colors.card, DarkTheme.colors.cardElevated]}
        style={styles.emptyIcon}
      >
        <Clock size={40} color={DarkTheme.colors.textTertiary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No scans yet</Text>
      <Text style={styles.emptySubtitle}>
        Your analysis history will appear here after your first scan.
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('Camera' as never);
        }}
      >
        <LinearGradient
          colors={[DarkTheme.colors.primary, DarkTheme.colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.scanButtonGradient}
        >
          <Text style={styles.scanButtonText}>Take your first scan</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <IconButton
              icon={<ChevronLeft size={24} color={DarkTheme.colors.text} />}
              onPress={() => navigation.goBack()}
              variant="ghost"
            />
            <Text style={styles.title}>History</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton
            icon={<ChevronLeft size={24} color={DarkTheme.colors.text} />}
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
          <Text style={styles.title}>{selectionMode ? `${selectedIds.size} Selected` : 'History'}</Text>
          <View style={styles.headerActions}>
            {selectionMode ? (
              <TouchableOpacity onPress={exitSelectionMode}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={[
                    styles.timelapseButton,
                    analyses.length < 2 && styles.timelapseButtonDisabled
                  ]}
                  onPress={handleCreateTimelapse}
                  disabled={analyses.length < 2}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      analyses.length >= 2
                        ? [DarkTheme.colors.primaryDark, DarkTheme.colors.primary, DarkTheme.colors.primaryLight]
                        : [DarkTheme.colors.textDisabled, DarkTheme.colors.textDisabled]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.timelapseButtonGradient}
                  >
                    <Film size={16} color={DarkTheme.colors.background} />
                    <Text style={styles.timelapseButtonText}>Timelapse</Text>
                    {analyses.length >= 2 && (
                      <View style={styles.timelapseBadge}>
                        <Text style={styles.timelapseBadgeText}>
                          {analyses.length}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
                >
                  {viewMode === 'list' ? (
                    <Grid size={22} color={DarkTheme.colors.text} />
                  ) : (
                    <List size={22} color={DarkTheme.colors.text} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {!selectionMode && analyses.length > 0 && (
          <Text style={styles.subtitle}>{analyses.length} scans</Text>
        )}
      </View>
      
      {analyses.length === 0 ? (
        renderEmptyState()
      ) : (
      <FlatList
        data={analyses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={viewMode === 'grid' ? 3 : 1}
        key={viewMode} // Force re-render when changing columns
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={DarkTheme.colors.primary}
          />
        }
      />
      )}

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.bottomBarButton} 
            onPress={handleDeleteSelected}
            disabled={selectedIds.size === 0}
          >
            <Trash2 size={24} color={selectedIds.size > 0 ? DarkTheme.colors.error : DarkTheme.colors.textDisabled} />
            <Text style={[styles.bottomBarText, selectedIds.size === 0 && styles.disabledText]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomBarButton} 
            onPress={handleCompareSelected}
            disabled={selectedIds.size !== 2}
          >
            <Copy size={24} color={selectedIds.size === 2 ? DarkTheme.colors.primary : DarkTheme.colors.textDisabled} />
            <Text style={[styles.bottomBarText, selectedIds.size !== 2 && styles.disabledText]}>Compare</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 60,
    paddingBottom: DarkTheme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  timelapseButton: {
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
    ...DarkTheme.shadows.sm,
  },
  timelapseButtonDisabled: {
    opacity: 0.5,
  },
  timelapseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  timelapseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: 0.3,
  },
  timelapseBadge: {
    backgroundColor: DarkTheme.colors.background,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelapseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  cancelText: {
    color: DarkTheme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: DarkTheme.spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: DarkTheme.spacing.md,
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  selectedCard: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: `${DarkTheme.colors.primary}10`,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: DarkTheme.spacing.md,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: DarkTheme.borderRadius.md,
  },
  listSelectionOverlay: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: DarkTheme.colors.card,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  trendBadge: {
    marginLeft: DarkTheme.spacing.sm,
    padding: 4,
    borderRadius: DarkTheme.borderRadius.xs,
  },
  trendUp: {
    backgroundColor: DarkTheme.colors.success + '20',
  },
  trendDown: {
    backgroundColor: DarkTheme.colors.error + '20',
  },
  trendNeutral: {
    backgroundColor: DarkTheme.colors.textTertiary + '20',
  },
  potential: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 4,
  },
  // Grid Styles
  gridItemContainer: {
    flex: 1/3,
    aspectRatio: 0.8,
    padding: 4,
  },
  gridCard: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  gridThumbnail: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    alignItems: 'center',
  },
  gridScore: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    padding: 8,
  },
  // Bottom Bar Styles
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DarkTheme.colors.card,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 30,
  },
  bottomBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bottomBarText: {
    fontSize: 12,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  disabledText: {
    color: DarkTheme.colors.textDisabled,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: DarkTheme.spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
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
    marginBottom: DarkTheme.spacing.xl,
  },
  scanButton: {
    width: '100%',
  },
  scanButtonGradient: {
    paddingVertical: DarkTheme.spacing.md,
    borderRadius: DarkTheme.borderRadius.md,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});
