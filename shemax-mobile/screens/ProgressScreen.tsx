import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
  TouchableOpacity,
  FlatList,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TrendingUp, Flame, Target, CheckCircle, Award, ChevronRight, Clock, Plus, ChevronDown, ChevronUp, Settings } from 'lucide-react-native';

import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { GradientText } from '../components/GradientText';
import { DarkTheme, getScoreColor } from '../lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

interface Stats {
  weeklyScores: number[];
  monthlyScores?: number[];
  yearlyScores?: number[];
  totalAnalyses: number;
  currentStreak: number;
  averageScore: number;
  completedTasks: number;
  bestScore: number;
  improvement: number;
}

interface Analysis {
  id: string;
  image_url?: string;
  photoUrl?: string;
  score: number;
  breakdown?: {
    femininity?: { score: number };
    skin?: { score: number };
    jawline?: { score: number };
    cheekbones?: { score: number };
    eyes?: { score: number };
    symmetry?: { score: number };
    lips?: { score: number };
    hair?: { score: number };
  };
  created_at?: string;
  createdAt?: string;
}

type CategoryFilter = 'overall' | 'femininity' | 'skin' | 'jawline' | 'cheekbones' | 'eyes' | 'symmetry' | 'lips' | 'hair';

interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
  current_value?: number;
  deadline: string;
  status: string;
  created_at: string;
  goal_milestones?: Array<{
    id: string;
    milestone_name: string;
    target_value: number;
    target_date: string;
    completed: boolean;
    completed_at?: string;
  }>;
}

export function ProgressScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('overall');
  const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [showAverageLine, setShowAverageLine] = useState(true);
  const [showGridLines, setShowGridLines] = useState(true);
  const [showDataPoints, setShowDataPoints] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const chartOpacity = useSharedValue(0);
  const statsOpacity = useSharedValue(0);

  useEffect(() => {
    loadData();
  }, []);

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    chartOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    statsOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  };

  const loadStats = async () => {
    try {
      const data = await apiGet<{ stats: Stats }>(
        '/api/routines/stats',
        session?.access_token
      );
      setStats(data.stats || {
        weeklyScores: [6.5, 6.7, 6.8, 7.0, 7.2, 7.1, 7.3],
        totalAnalyses: 12,
        currentStreak: 7,
        averageScore: 7.0,
        completedTasks: 45,
        bestScore: 8.2,
        improvement: 0.8,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set mock data for demo
      setStats({
        weeklyScores: [6.5, 6.7, 6.8, 7.0, 7.2, 7.1, 7.3],
        totalAnalyses: 12,
        currentStreak: 7,
        averageScore: 7.0,
        completedTasks: 45,
        bestScore: 8.2,
        improvement: 0.8,
      });
    }
  };

  const loadRecentAnalyses = async () => {
    try {
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history?limit=10',
        session?.access_token
      );
      setRecentAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to load recent analyses:', error);
    }
  };

  const loadAllAnalyses = async () => {
    try {
      // Load more analyses to get better trend data
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history?limit=100',
        session?.access_token
      );
      setAllAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Failed to load all analyses:', error);
      setAllAnalyses([]);
    }
  };

  const loadActiveGoals = async () => {
    try {
      const data = await apiGet<{ goals: Goal[] }>(
        '/api/goals?status=active',
        session?.access_token
      );
      setActiveGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadRecentAnalyses(), loadActiveGoals(), loadAllAnalyses()]);
    startAnimations();
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: (1 - headerOpacity.value) * 20 }],
  }));

  const chartAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chartOpacity.value,
    transform: [{ scale: 0.95 + chartOpacity.value * 0.05 }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: (1 - statsOpacity.value) * 30 }],
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const getScoreColorForChart = (score: number): string => {
    // Match analysis screen color scheme: >= 8 green, 5-7.9 amber, < 5 red
    if (score >= 8) return DarkTheme.colors.success; // Green for high scores
    if (score >= 5) return DarkTheme.colors.warning; // Amber for mid scores
    return DarkTheme.colors.error; // Red for low scores
  };

  const getCategoryScore = (analysis: Analysis, category: CategoryFilter): number => {
    if (category === 'overall') {
      return analysis.score;
    }
    return analysis.breakdown?.[category]?.score || analysis.score;
  };

  const processAnalysesByPeriod = (analyses: Analysis[], period: 'weekly' | 'monthly' | 'yearly', category: CategoryFilter): number[] => {
    if (analyses.length === 0) {
      return period === 'weekly' ? [0, 0, 0, 0, 0, 0, 0] : period === 'monthly' ? [0, 0, 0, 0] : [0, 0, 0, 0];
    }

    const now = new Date();
    const scores: number[] = [];

    if (period === 'weekly') {
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);
        targetDate.setHours(0, 0, 0, 0);

        const dayAnalyses = analyses.filter(a => {
          const analysisDate = new Date(a.created_at || a.createdAt || 0);
          analysisDate.setHours(0, 0, 0, 0);
          return analysisDate.getTime() === targetDate.getTime();
        });

        if (dayAnalyses.length > 0) {
          const avgScore = dayAnalyses.reduce((sum, a) => sum + getCategoryScore(a, category), 0) / dayAnalyses.length;
          scores.push(avgScore);
        } else {
          scores.push(0);
        }
      }
    } else if (period === 'monthly') {
      // Get last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekAnalyses = analyses.filter(a => {
          const analysisDate = new Date(a.created_at || a.createdAt || 0);
          return analysisDate >= weekStart && analysisDate < weekEnd;
        });

        if (weekAnalyses.length > 0) {
          const avgScore = weekAnalyses.reduce((sum, a) => sum + getCategoryScore(a, category), 0) / weekAnalyses.length;
          scores.push(avgScore);
        } else {
          scores.push(0);
        }
      }
    } else {
      // Get last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const quarterStart = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const quarterEnd = new Date(now.getFullYear(), now.getMonth() - ((i - 1) * 3), 1);

        const quarterAnalyses = analyses.filter(a => {
          const analysisDate = new Date(a.created_at || a.createdAt || 0);
          return analysisDate >= quarterStart && analysisDate < quarterEnd;
        });

        if (quarterAnalyses.length > 0) {
          const avgScore = quarterAnalyses.reduce((sum, a) => sum + getCategoryScore(a, category), 0) / quarterAnalyses.length;
          scores.push(avgScore);
        } else {
          scores.push(0);
        }
      }
    }

    return scores;
  };

  const getChartData = () => {
    let labels: string[] = [];
    let data: number[] = [];
    let periodColor: string;

    // Process analyses data based on selected category
    const processedData = processAnalysesByPeriod(allAnalyses, period, categoryFilter);

    if (period === 'weekly') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = processedData.length === 7 ? processedData : (stats?.weeklyScores || [0, 0, 0, 0, 0, 0, 0]);
      periodColor = 'rgba(212, 175, 55, %opacity%)'; // Gold base
    } else if (period === 'monthly') {
      labels = ['W1', 'W2', 'W3', 'W4'];
      data = processedData.length === 4 ? processedData : (stats?.monthlyScores || [6.5, 6.8, 7.0, 7.2]);
      periodColor = 'rgba(0, 217, 255, %opacity%)'; // Cyan base
    } else {
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      data = processedData.length === 4 ? processedData : (stats?.yearlyScores || [6.5, 6.8, 7.0, 7.3]);
      periodColor = 'rgba(76, 175, 80, %opacity%)'; // Green base
    }

    const datasets = [
      {
        data,
        color: (opacity = 1) => periodColor.replace('%opacity%', opacity.toString()),
        strokeWidth: 3,
      },
    ];

    // Add average line dataset if enabled
    if (showAverageLine && data.length > 0) {
      const average = data.filter(d => d > 0).length > 0 
        ? data.filter(d => d > 0).reduce((sum, val) => sum + val, 0) / data.filter(d => d > 0).length
        : data.reduce((sum, val) => sum + val, 0) / data.length;
      const averageData = new Array(data.length).fill(average);
      
      datasets.push({
        data: averageData,
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity * 0.5})`, // Semi-transparent gray
        strokeWidth: 2,
      });
    }

    return {
      labels,
      datasets,
      scoreColors: data.map(getScoreColorForChart),
    };
  };

  const chartData = getChartData();

  const statCards = [
    {
      icon: Target,
      value: stats?.totalAnalyses || 0,
      label: 'Total Scans',
      color: DarkTheme.colors.primary,
    },
    {
      icon: Flame,
      value: stats?.currentStreak || 0,
      label: 'Day Streak',
      color: DarkTheme.colors.warning,
    },
    {
      icon: Award,
      value: stats?.bestScore?.toFixed(1) || '0.0',
      label: 'Best Score',
      color: DarkTheme.colors.success,
    },
    {
      icon: CheckCircle,
      value: stats?.completedTasks || 0,
      label: 'Tasks Done',
      color: DarkTheme.colors.info,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DarkTheme.colors.primary}
        />
      }
    >
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <GradientText
          text="Your Progress"
          colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
          fontSize={28}
          fontWeight="700"
          style={styles.title}
        />
        <View style={styles.headerRight}>
          {stats?.improvement && stats.improvement > 0 && (
            <View style={styles.improvementBadge}>
              <TrendingUp size={16} color={DarkTheme.colors.success} />
              <Text style={styles.improvementText}>
                +{stats.improvement.toFixed(1)} this month
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('CreateGoal' as never);
            }}
          >
            <Plus size={20} color={DarkTheme.colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Average Score Card */}
      <Animated.View style={chartAnimatedStyle}>
        <GlassCard variant="gold" style={styles.scoreCard}>
          <View style={styles.scoreCardContent}>
            <View>
              <Text style={styles.scoreLabel}>Average Score</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(stats?.averageScore || 0) }]}>
                {stats?.averageScore?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={styles.scoreTrend}>
              <TrendingUp size={24} color={DarkTheme.colors.success} />
              <Text style={styles.trendText}>Improving</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Chart */}
      <Animated.View style={chartAnimatedStyle}>
        <GlassCard variant="elevated" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {categoryFilter === 'overall' 
                  ? 'Score Trend' 
                  : `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Trend`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowChartSettings(!showChartSettings)}
              style={{ padding: 8 }}
            >
              <Settings size={20} color={DarkTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Chart Settings Panel */}
          {showChartSettings && (
            <View style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: `${DarkTheme.colors.border}30`,
              borderRadius: 8,
              gap: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: DarkTheme.colors.text }}>Average Line</Text>
                  {showAverageLine && chartData.datasets[0].data.length > 0 && (
                    <Text style={{ fontSize: 10, color: DarkTheme.colors.textTertiary, marginTop: 2 }}>
                      Avg: {(
                        chartData.datasets[0].data.filter(d => d > 0).length > 0
                          ? chartData.datasets[0].data.filter(d => d > 0).reduce((sum, val) => sum + val, 0) / chartData.datasets[0].data.filter(d => d > 0).length
                          : chartData.datasets[0].data.reduce((sum, val) => sum + val, 0) / chartData.datasets[0].data.length
                      ).toFixed(1)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={showAverageLine}
                  onValueChange={setShowAverageLine}
                  trackColor={{ false: DarkTheme.colors.border, true: `${DarkTheme.colors.primary}80` }}
                  thumbColor={showAverageLine ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: DarkTheme.colors.text }}>Grid Lines</Text>
                <Switch
                  value={showGridLines}
                  onValueChange={setShowGridLines}
                  trackColor={{ false: DarkTheme.colors.border, true: `${DarkTheme.colors.primary}80` }}
                  thumbColor={showGridLines ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: DarkTheme.colors.text }}>Data Points</Text>
                <Switch
                  value={showDataPoints}
                  onValueChange={setShowDataPoints}
                  trackColor={{ false: DarkTheme.colors.border, true: `${DarkTheme.colors.primary}80` }}
                  thumbColor={showDataPoints ? DarkTheme.colors.primary : DarkTheme.colors.textSecondary}
                />
              </View>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.categoryFilterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterScroll}
            >
              {([
                { key: 'overall', label: 'Overall' },
                { key: 'femininity', label: 'Femininity' },
                { key: 'skin', label: 'Skin' },
                { key: 'jawline', label: 'Jawline' },
                { key: 'cheekbones', label: 'Cheekbones' },
                { key: 'eyes', label: 'Eyes' },
                { key: 'symmetry', label: 'Symmetry' },
                { key: 'lips', label: 'Lips' },
                { key: 'hair', label: 'Hair' },
              ] as const).map((category) => (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategoryFilter(category.key as CategoryFilter);
                  }}
                  style={[
                    styles.categoryFilterButton,
                    categoryFilter === category.key && styles.categoryFilterButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryFilterButtonText,
                      categoryFilter === category.key && styles.categoryFilterButtonTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.chartHeader}>
            <View style={styles.periodSelector}>
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPeriod(p);
                  }}
                  style={[
                    styles.periodButton,
                    period === p && styles.periodButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      period === p && styles.periodButtonTextActive,
                    ]}
                  >
                    {p === 'weekly' ? 'Weekly' : p === 'monthly' ? 'Monthly' : 'Yearly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <LineChart
            data={chartData}
            width={CHART_WIDTH}
            height={200}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: DarkTheme.colors.card,
              backgroundGradientTo: DarkTheme.colors.cardElevated,
              decimalPlaces: 1,
              color: (opacity = 1) => {
                if (period === 'weekly') return `rgba(212, 175, 55, ${opacity})`;
                if (period === 'monthly') return `rgba(0, 217, 255, ${opacity})`;
                return `rgba(76, 175, 80, ${opacity})`;
              },
              labelColor: () => DarkTheme.colors.textTertiary,
              style: {
                borderRadius: 16,
              },
              propsForDots: showDataPoints ? {
                r: '6',
                strokeWidth: '3',
              } : {
                r: '0',
                strokeWidth: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: DarkTheme.colors.borderSubtle,
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={showGridLines}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={showGridLines}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={false}
            yAxisInterval={1}
            decorator={() => {
              // Decorator can be used for additional visual elements if needed
              return null;
            }}
          />

          {/* Score Legend */}
          <View style={styles.scoreLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>8.5+</Text>
              <View style={[styles.legendDot, { backgroundColor: '#8BC34A' }]} />
              <Text style={styles.legendText}>7.5-8.5</Text>
              <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
              <Text style={styles.legendText}>6.5-7.5</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>5.5-6.5</Text>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Below 5.5</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View style={[styles.statsGrid, statsAnimatedStyle]}>
        {statCards.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            delay={index * 100}
          />
        ))}
      </Animated.View>

      {/* Active Goals Section */}
      {activeGoals.length > 0 && (
        <Animated.View style={[styles.goalsSection, statsAnimatedStyle]}>
          <View style={styles.goalsHeader}>
            <GradientText 
              text="Active Goals"
              fontSize={18}
              fontWeight="600"
              colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('CreateGoal' as never);
              }}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>New Goal</Text>
              <Plus size={16} color={DarkTheme.colors.primary} />
            </TouchableOpacity>
          </View>
          {activeGoals.map((goal) => {
            const progress = goal.current_value 
              ? Math.min(100, ((goal.current_value / goal.target_value) * 100))
              : 0;
            const daysLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            const isExpanded = expandedGoals.has(goal.id);
            const milestones = goal.goal_milestones || [];
            const nextMilestone = milestones.find(m => !m.completed);
            
            return (
              <GlassCard key={goal.id} style={styles.goalCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpandedGoals(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(goal.id)) {
                        newSet.delete(goal.id);
                      } else {
                        newSet.add(goal.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Target size={18} color={DarkTheme.colors.primary} />
                      <Text style={styles.goalType}>
                        {goal.goal_type === 'score_improvement' ? 'Overall Score' :
                         goal.goal_type === 'category_improvement' ? 'Category Improvement' :
                         goal.goal_type === 'routine_consistency' ? 'Routine Consistency' :
                         'Goal'}
                      </Text>
                    </View>
                    <View style={styles.goalHeaderRight}>
                      <Text style={styles.goalDeadline}>
                        {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                      </Text>
                      {milestones.length > 0 && (
                        isExpanded ? (
                          <ChevronUp size={16} color={DarkTheme.colors.textTertiary} />
                        ) : (
                          <ChevronDown size={16} color={DarkTheme.colors.textTertiary} />
                        )
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.goalProgress}>
                  <View style={styles.goalValues}>
                    <Text style={styles.goalCurrent}>
                      {goal.current_value?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={styles.goalTarget}>
                      → {goal.target_value.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${progress}%` }
                      ]} 
                    />
                  </View>
                </View>

                {/* Milestones */}
                {isExpanded && milestones.length > 0 && (
                  <View style={styles.milestonesContainer}>
                    {milestones.map((milestone, index) => {
                      const milestoneProgress = goal.current_value && milestone.target_value
                        ? Math.min(100, ((goal.current_value / milestone.target_value) * 100))
                        : 0;
                      const milestoneDate = new Date(milestone.target_date);
                      const milestoneDaysLeft = Math.ceil(
                        (milestoneDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <View key={milestone.id} style={styles.milestoneItem}>
                          <View style={styles.milestoneHeader}>
                            <View style={styles.milestoneCheckContainer}>
                              {milestone.completed ? (
                                <CheckCircle size={16} color={DarkTheme.colors.success} />
                              ) : (
                                <View style={styles.milestoneCheckEmpty} />
                              )}
                            </View>
                            <View style={styles.milestoneInfo}>
                              <Text style={[
                                styles.milestoneName,
                                milestone.completed && styles.milestoneNameCompleted
                              ]}>
                                {milestone.milestone_name}
                              </Text>
                              <Text style={styles.milestoneDate}>
                                {milestoneDaysLeft > 0 
                                  ? `${milestoneDaysLeft}d left` 
                                  : milestoneDaysLeft === 0
                                  ? 'Today'
                                  : 'Overdue'}
                              </Text>
                            </View>
                            <Text style={styles.milestoneTarget}>
                              {milestone.target_value.toFixed(1)}
                            </Text>
                          </View>
                          {!milestone.completed && (
                            <View style={styles.milestoneProgressBar}>
                              <View 
                                style={[
                                  styles.milestoneProgressFill, 
                                  { width: `${milestoneProgress}%` }
                                ]} 
                              />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Next Milestone Preview */}
                {!isExpanded && nextMilestone && (
                  <View style={styles.nextMilestonePreview}>
                    <Text style={styles.nextMilestoneText}>
                      Next: {nextMilestone.milestone_name} ({nextMilestone.target_value.toFixed(1)})
                    </Text>
                  </View>
                )}
              </GlassCard>
            );
          })}
        </Animated.View>
      )}

      {/* Recent Scans Section */}
      {recentAnalyses.length > 0 && (
        <Animated.View style={[styles.recentScansSection, statsAnimatedStyle]}>
          <View style={styles.recentScansHeader}>
            <GradientText 
              text="Recent Scans"
              fontSize={18}
              fontWeight="600"
              colors={[DarkTheme.colors.primary, DarkTheme.colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('History' as never);
              }}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={DarkTheme.colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScansList}
            nestedScrollEnabled={true}
          >
            {recentAnalyses.map((analysis, index) => {
              const imageUrl = analysis.image_url || analysis.photoUrl;
              const createdAt = analysis.created_at || analysis.createdAt || new Date().toISOString();
              const scoreColor = getScoreColor(analysis.score);
              
              return (
                <TouchableOpacity
                  key={analysis.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('AnalysisResult' as never, {
                      analysisId: analysis.id,
                    } as never);
                  }}
                  style={styles.recentScanCard}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.recentScanImage} />
                  ) : (
                    <View style={[styles.recentScanImage, styles.recentScanPlaceholder]}>
                      <Clock size={24} color={DarkTheme.colors.textTertiary} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.recentScanGradient}
                  />
                  <View style={styles.recentScanOverlay}>
                    <Text style={[styles.recentScanScore, { color: scoreColor }]}>
                      {analysis.score.toFixed(1)}
                    </Text>
                    <Text style={styles.recentScanDate}>
                      {formatDate(createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  value: number | string;
  label: string;
  color: string;
  delay: number;
}

function StatCard({ icon: Icon, value, label, color, delay }: StatCardProps) {
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

  return (
    <Animated.View style={[styles.statCardWrapper, animatedStyle]}>
      <GlassCard variant="subtle" style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  addGoalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${DarkTheme.colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    letterSpacing: -0.5,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${DarkTheme.colors.success}20`,
    paddingHorizontal: DarkTheme.spacing.sm,
    paddingVertical: DarkTheme.spacing.xs,
    borderRadius: DarkTheme.borderRadius.full,
    gap: 4,
  },
  improvementText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.success,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoreCard: {
    marginBottom: DarkTheme.spacing.lg,
  },
  scoreCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  scoreTrend: {
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.success,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 4,
  },
  chartCard: {
    marginBottom: DarkTheme.spacing.lg,
    paddingVertical: DarkTheme.spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: `${DarkTheme.colors.border}40`,
    padding: 4,
    borderRadius: DarkTheme.borderRadius.md,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DarkTheme.borderRadius.sm,
    backgroundColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: DarkTheme.colors.primary,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  periodButtonTextActive: {
    color: DarkTheme.colors.background,
  },
  categoryFilterContainer: {
    paddingHorizontal: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.md,
  },
  categoryFilterScroll: {
    gap: 8,
  },
  categoryFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: `${DarkTheme.colors.border}40`,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: `${DarkTheme.colors.primary}20`,
    borderColor: DarkTheme.colors.primary,
  },
  categoryFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  categoryFilterButtonTextActive: {
    color: DarkTheme.colors.primary,
  },
  scoreLegend: {
    marginTop: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginRight: 8,
  },
  chart: {
    marginVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    marginLeft: -16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: DarkTheme.spacing.sm,
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.lg,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  recentScansSection: {
    marginTop: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.md,
  },
  recentScansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  recentScansTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  recentScansList: {
    paddingRight: DarkTheme.spacing.lg,
    gap: DarkTheme.spacing.md,
  },
  recentScanCard: {
    width: 120,
    height: 160,
    borderRadius: DarkTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.surface,
  },
  recentScanImage: {
    width: '100%',
    height: '100%',
  },
  recentScanPlaceholder: {
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentScanGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  recentScanOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DarkTheme.spacing.sm,
  },
  recentScanScore: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  recentScanDate: {
    fontSize: 11,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  goalsSection: {
    marginTop: DarkTheme.spacing.lg,
    marginBottom: DarkTheme.spacing.md,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.md,
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalCard: {
    marginBottom: DarkTheme.spacing.md,
    padding: DarkTheme.spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.sm,
  },
  goalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.sm,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalDeadline: {
    fontSize: 12,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalProgress: {
    marginTop: DarkTheme.spacing.sm,
  },
  goalValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: DarkTheme.spacing.xs,
    marginBottom: DarkTheme.spacing.xs,
  },
  goalCurrent: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  goalTarget: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  progressBar: {
    height: 6,
    backgroundColor: DarkTheme.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 3,
  },
  milestonesContainer: {
    marginTop: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
  },
  milestoneItem: {
    marginBottom: DarkTheme.spacing.md,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xs,
  },
  milestoneCheckContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: DarkTheme.spacing.sm,
  },
  milestoneCheckEmpty: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: DarkTheme.colors.borderSubtle,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  milestoneNameCompleted: {
    color: DarkTheme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  milestoneDate: {
    fontSize: 11,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  milestoneTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  milestoneProgressBar: {
    height: 4,
    backgroundColor: DarkTheme.colors.borderSubtle,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: DarkTheme.spacing.xs,
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 2,
  },
  nextMilestonePreview: {
    marginTop: DarkTheme.spacing.sm,
    paddingTop: DarkTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
  },
  nextMilestoneText: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ProgressScreen;
