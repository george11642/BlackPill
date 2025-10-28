import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../widgets/stat_card.dart';
import '../widgets/achievement_badge.dart';

enum TimeRange { month30, month90, year }

class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends ConsumerState<ProgressScreen> {
  TimeRange _selectedRange = TimeRange.month30;
  List<Map<String, dynamic>> _analyses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProgress();
  }

  Future<void> _loadProgress() async {
    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final data = await apiService.getAnalyses(limit: 100);
      
      setState(() {
        _analyses = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading progress: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> _getFilteredAnalyses() {
    final now = DateTime.now();
    int days;
    
    switch (_selectedRange) {
      case TimeRange.month30:
        days = 30;
        break;
      case TimeRange.month90:
        days = 90;
        break;
      case TimeRange.year:
        days = 365;
        break;
    }
    
    final cutoff = now.subtract(Duration(days: days));
    
    return _analyses.where((analysis) {
      final date = DateTime.parse(analysis['created_at']);
      return date.isAfter(cutoff);
    }).toList();
  }

  double _getAverageScore() {
    final filtered = _getFilteredAnalyses();
    if (filtered.isEmpty) return 0.0;
    
    final sum = filtered.fold<double>(
      0.0,
      (sum, analysis) => sum + (analysis['score']?.toDouble() ?? 0.0),
    );
    
    return sum / filtered.length;
  }

  double _getBestScore() {
    final filtered = _getFilteredAnalyses();
    if (filtered.isEmpty) return 0.0;
    
    return filtered.fold<double>(
      0.0,
      (best, analysis) {
        final score = analysis['score']?.toDouble() ?? 0.0;
        return score > best ? score : best;
      },
    );
  }

  double _getImprovementPercentage() {
    final filtered = _getFilteredAnalyses();
    if (filtered.length < 2) return 0.0;
    
    final first = filtered.last['score']?.toDouble() ?? 0.0;
    final last = filtered.first['score']?.toDouble() ?? 0.0;
    
    if (first == 0) return 0.0;
    
    return ((last - first) / first) * 100;
  }

  List<FlSpot> _getChartData() {
    final filtered = _getFilteredAnalyses();
    if (filtered.isEmpty) return [];
    
    return filtered.asMap().entries.map((entry) {
      return FlSpot(
        entry.key.toDouble(),
        entry.value['score']?.toDouble() ?? 0.0,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Progress Tracking'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProgress,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title
                  Text(
                    'Your Journey',
                    style: Theme.of(context).textTheme.displayMedium,
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    'Track your self-improvement progress',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Time range selector
                  _buildTimeRangeSelector(),
                  
                  const SizedBox(height: 24),
                  
                  // Stats cards
                  Row(
                    children: [
                      Expanded(
                        child: StatCard(
                          title: 'Average',
                          value: _getAverageScore().toStringAsFixed(1),
                          icon: Icons.timeline,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          title: 'Best Score',
                          value: _getBestScore().toStringAsFixed(1),
                          icon: Icons.stars,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Improvement card
                  StatCard(
                    title: 'Improvement',
                    value: '${_getImprovementPercentage().toStringAsFixed(1)}%',
                    subtitle: _getImprovementPercentage() >= 0
                        ? 'Keep up the great work!'
                        : 'Every journey has ups and downs',
                    icon: _getImprovementPercentage() >= 0
                        ? Icons.trending_up
                        : Icons.trending_down,
                    color: _getImprovementPercentage() >= 0
                        ? AppColors.neonGreen
                        : AppColors.neonYellow,
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Chart
                  GlassCard(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Score Over Time',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 200,
                          child: _analyses.isEmpty
                              ? Center(
                                  child: Text(
                                    'Complete more scans\nto see your progress',
                                    style: Theme.of(context).textTheme.bodyMedium,
                                    textAlign: TextAlign.center,
                                  ),
                                )
                              : LineChart(
                                  LineChartData(
                                    gridData: FlGridData(
                                      show: true,
                                      drawVerticalLine: false,
                                      getDrawingHorizontalLine: (value) {
                                        return FlLine(
                                          color: AppColors.charcoal,
                                          strokeWidth: 1,
                                        );
                                      },
                                    ),
                                    titlesData: FlTitlesData(
                                      leftTitles: AxisTitles(
                                        sideTitles: SideTitles(
                                          showTitles: true,
                                          reservedSize: 40,
                                          getTitlesWidget: (value, meta) {
                                            return Text(
                                              value.toInt().toString(),
                                              style: Theme.of(context).textTheme.bodySmall,
                                            );
                                          },
                                        ),
                                      ),
                                      bottomTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                      topTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                      rightTitles: AxisTitles(
                                        sideTitles: SideTitles(showTitles: false),
                                      ),
                                    ),
                                    borderData: FlBorderData(show: false),
                                    minY: 0,
                                    maxY: 10,
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: _getChartData(),
                                        isCurved: true,
                                        gradient: AppColors.primaryGradient,
                                        barWidth: 3,
                                        isStrokeCapRound: true,
                                        dotData: FlDotData(
                                          show: true,
                                          getDotPainter: (spot, percent, barData, index) {
                                            return FlDotCirclePainter(
                                              radius: 4,
                                              color: AppColors.textPrimary,
                                              strokeWidth: 2,
                                              strokeColor: AppColors.neonPink,
                                            );
                                          },
                                        ),
                                        belowBarData: BarAreaData(
                                          show: true,
                                          gradient: LinearGradient(
                                            colors: [
                                              AppColors.neonPink.withOpacity(0.3),
                                              AppColors.neonCyan.withOpacity(0.1),
                                            ],
                                            begin: Alignment.topCenter,
                                            end: Alignment.bottomCenter,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Achievements
                  _buildAchievements(),
                ],
              ),
            ),
    );
  }

  Widget _buildTimeRangeSelector() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.charcoal,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildTimeRangeButton('30 Days', TimeRange.month30),
          ),
          Expanded(
            child: _buildTimeRangeButton('90 Days', TimeRange.month90),
          ),
          Expanded(
            child: _buildTimeRangeButton('1 Year', TimeRange.year),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeRangeButton(String label, TimeRange range) {
    final isSelected = _selectedRange == range;

    return GestureDetector(
      onTap: () => setState(() => _selectedRange = range),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? AppColors.primaryGradient : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: isSelected ? AppColors.deepBlack : AppColors.textSecondary,
              ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildAchievements() {
    final bestScore = _getBestScore();
    final totalScans = _analyses.length;
    
    return GlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Achievements',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              if (totalScans >= 5)
                const AchievementBadge(
                  icon: Icons.star,
                  label: '5-Scan Streak',
                  unlocked: true,
                ),
              if (bestScore >= 8.0)
                const AchievementBadge(
                  icon: Icons.emoji_events,
                  label: 'First 8.0+',
                  unlocked: true,
                ),
              if (totalScans >= 10)
                const AchievementBadge(
                  icon: Icons.whatshot,
                  label: '10 Scans',
                  unlocked: true,
                ),
              if (_getImprovementPercentage() >= 10)
                const AchievementBadge(
                  icon: Icons.trending_up,
                  label: '10% Improvement',
                  unlocked: true,
                ),
              // Locked achievements
              if (totalScans < 5)
                const AchievementBadge(
                  icon: Icons.star_outline,
                  label: '5-Scan Streak',
                  unlocked: false,
                ),
              if (bestScore < 8.0)
                const AchievementBadge(
                  icon: Icons.emoji_events_outlined,
                  label: 'First 8.0+',
                  unlocked: false,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

