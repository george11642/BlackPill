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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Circle, Play, Calendar } from 'lucide-react-native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { DarkTheme, getScoreColor } from '../lib/theme';

interface Analysis {
  id: string;
  image_url?: string;
  photoUrl?: string;
  score: number;
  created_at?: string;
  createdAt?: string;
}

export function TimelapseSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get pre-selected analyses from route params (if coming from HistoryScreen selection mode)
  const preselectedIds = (route.params as any)?.selectedIds || [];

  useEffect(() => {
    loadAnalyses();
    if (preselectedIds.length > 0) {
      setSelectedIds(new Set(preselectedIds));
    }
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history?limit=50&sort_by=created_at&order=asc',
        session?.access_token
      );
      // Sort by date (oldest first) for proper timelapse order
      const sorted = (data.analyses || []).sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        return dateA - dateB;
      });
      setAnalyses(sorted);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  }, []);

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (newSet.size >= 20) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return prev; // Max 20 analyses
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleGenerate = () => {
    if (selectedIds.size < 2) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    (navigation as any).navigate('TimelapseGeneration', {
      analysisIds: Array.from(selectedIds),
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item, index }: { item: Analysis; index: number }) => {
    const imageUrl = item.image_url || item.photoUrl;
    const createdAt = item.created_at || item.createdAt || new Date().toISOString();
    const isSelected = selectedIds.has(item.id);
    const scoreColor = getScoreColor(item.score);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleSelection(item.id)}
        style={styles.gridItem}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Calendar size={24} color={DarkTheme.colors.textTertiary} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.overlay}>
            <Text style={[styles.score, { color: scoreColor }]}>
              {item.score.toFixed(1)}
            </Text>
            <Text style={styles.date}>{formatDate(createdAt)}</Text>
          </View>
          <View style={styles.checkboxContainer}>
            {isSelected ? (
              <CheckCircle2 size={24} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
            ) : (
              <Circle size={24} color={DarkTheme.colors.border} />
            )}
          </View>
        </View>
        {isSelected && (
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>
              {Array.from(selectedIds).indexOf(item.id) + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading your photos...</Text>
      </View>
    );
  }

  const selectedCount = selectedIds.size;
  const canGenerate = selectedCount >= 2 && selectedCount <= 20;

  return (
    <View style={styles.container}>
      <BackHeader 
        title="Create Timelapse"
        subtitle={selectedCount > 0 ? `${selectedCount} selected` : undefined}
      />
      
      <View style={styles.content}>
        <GlassCard variant="subtle" style={styles.infoCard}>
          <Text style={styles.infoText}>
            Select 2-20 photos to create your timelapse video. Photos will be shown in chronological order.
          </Text>
        </GlassCard>

        <FlatList
          data={analyses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DarkTheme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No photos found</Text>
            </View>
          }
        />
      </View>

      <View style={styles.footer}>
        <GlassCard variant="elevated" style={styles.footerCard}>
          <View style={styles.footerContent}>
            <View>
              <Text style={styles.footerLabel}>Selected Photos</Text>
              <Text style={styles.footerValue}>
                {selectedCount} / 20
              </Text>
            </View>
            <PrimaryButton
              title={canGenerate ? "Generate Timelapse" : `Select ${2 - selectedCount} more`}
              onPress={handleGenerate}
              disabled={!canGenerate}
              icon={<Play size={18} color={DarkTheme.colors.background} />}
            />
          </View>
        </GlassCard>
      </View>
    </View>
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
    gap: DarkTheme.spacing.md,
  },
  loadingText: {
    color: DarkTheme.colors.textSecondary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  content: {
    flex: 1,
    paddingHorizontal: DarkTheme.spacing.md,
  },
  infoCard: {
    marginVertical: DarkTheme.spacing.md,
    padding: DarkTheme.spacing.md,
  },
  infoText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 20,
  },
  list: {
    paddingBottom: 100,
  },
  gridItem: {
    width: '48%',
    margin: '1%',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: DarkTheme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DarkTheme.spacing.sm,
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  date: {
    fontSize: 11,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  checkboxContainer: {
    position: 'absolute',
    top: DarkTheme.spacing.xs,
    right: DarkTheme.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: DarkTheme.borderRadius.full,
    padding: 4,
  },
  orderBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DarkTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DarkTheme.colors.background,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: DarkTheme.colors.background,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  emptyContainer: {
    padding: DarkTheme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: DarkTheme.colors.textTertiary,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DarkTheme.spacing.md,
    paddingBottom: DarkTheme.spacing.lg,
    backgroundColor: DarkTheme.colors.background,
  },
  footerCard: {
    padding: DarkTheme.spacing.md,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

