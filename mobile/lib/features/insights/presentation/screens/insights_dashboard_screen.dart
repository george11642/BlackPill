import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

class InsightsDashboardScreen extends ConsumerStatefulWidget {
  const InsightsDashboardScreen({super.key});

  @override
  ConsumerState<InsightsDashboardScreen> createState() => _InsightsDashboardScreenState();
}

class _InsightsDashboardScreenState extends ConsumerState<InsightsDashboardScreen> {
  List<dynamic> _insights = [];
  bool _isLoading = true;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _loadInsights();
  }

  Future<void> _loadInsights() async {
    setState(() => _isLoading = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.dio.get('/api/insights/list');
      
      setState(() {
        _insights = response.data['insights'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load insights: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _generateInsights() async {
    setState(() => _isGenerating = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.dio.post('/api/insights/generate');
      
      // Reload insights
      await _loadInsights();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('New insights generated!'),
            backgroundColor: AppColors.neonGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to generate insights: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  Future<void> _dismissInsight(String insightId) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.dio.put(
        '/api/insights/mark-viewed',
        data: {'insightId': insightId},
      );
      
      setState(() {
        _insights.removeWhere((insight) => insight['id'] == insightId);
      });
    } catch (e) {
      // Fail silently
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Insights Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isGenerating ? null : _generateInsights,
            tooltip: 'Generate New Insights',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with Refresh Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Your Insights',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      PrimaryButton(
                        text: 'Generate',
                        icon: Icons.auto_awesome,
                        onPressed: _isGenerating ? null : _generateInsights,
                        isLoading: _isGenerating,
                        isGradient: false,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),

                  // Insights List
                  if (_insights.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          children: [
                            Icon(
                              Icons.insights,
                              size: 64,
                              color: AppColors.textTertiary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No insights yet',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Generate insights to discover patterns in your progress',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textTertiary,
                                  ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 24),
                            PrimaryButton(
                              text: 'Generate Insights',
                              icon: Icons.auto_awesome,
                              onPressed: _generateInsights,
                              isLoading: _isGenerating,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._insights.map((insight) => _buildInsightCard(insight)),
                ],
              ),
            ),
    );
  }

  Widget _buildInsightCard(Map<String, dynamic> insight) {
    final insightType = insight['insight_type'] as String? ?? 'correlation';
    final title = insight['title'] as String? ?? 'Insight';
    final description = insight['description'] as String? ?? '';
    final actionable = insight['actionable_recommendation'] as String?;
    final confidence = insight['confidence_score'] as num? ?? 0.7;
    final dataPoints = insight['data_points'] as Map<String, dynamic>?;

    IconData icon;
    Color color;
    
    switch (insightType) {
      case 'correlation':
        icon = Icons.trending_up;
        color = AppColors.neonCyan;
        break;
      case 'timing':
        icon = Icons.access_time;
        color = AppColors.neonPurple;
        break;
      case 'prediction':
        icon = Icons.crystal_ball;
        color = AppColors.neonPink;
        break;
      case 'comparison':
        icon = Icons.compare_arrows;
        color = AppColors.neonYellow;
        break;
      default:
        icon = Icons.insights;
        color = AppColors.neonGreen;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '${(confidence * 100).toStringAsFixed(0)}% confidence',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textTertiary,
                                ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 4,
                            height: 4,
                            decoration: const BoxDecoration(
                              color: AppColors.textTertiary,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            insightType.toUpperCase(),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppColors.textTertiary,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  color: AppColors.textTertiary,
                  onPressed: () => _dismissInsight(insight['id'] as String),
                  tooltip: 'Dismiss',
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Description
            Text(
              description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
            
            // Chart if data points available
            if (dataPoints != null && dataPoints.containsKey('trend')) ...[
              const SizedBox(height: 16),
              SizedBox(
                height: 120,
                child: _buildTrendChart(dataPoints['trend'] as List<dynamic>?),
              ),
            ],
            
            // Actionable recommendation
            if (actionable != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.neonGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.neonGreen.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.lightbulb,
                      color: AppColors.neonGreen,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        actionable,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neonGreen,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTrendChart(List<dynamic>? trendData) {
    if (trendData == null || trendData.isEmpty) {
      return const SizedBox.shrink();
    }

    final points = trendData.map((d) => FlSpot(
          (trendData.indexOf(d)).toDouble(),
          (d['value'] as num?)?.toDouble() ?? 0.0,
        )).toList();

    return LineChart(
      LineChartData(
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (value) {
            return FlLine(
              color: AppColors.glassBorder,
              strokeWidth: 1,
            );
          },
        ),
        titlesData: FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: points,
            isCurved: true,
            color: AppColors.neonPink,
            barWidth: 3,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, percent, barData, index) {
                return FlDotCirclePainter(
                  radius: 4,
                  color: AppColors.neonPink,
                  strokeWidth: 2,
                  strokeColor: AppColors.deepBlack,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              color: AppColors.neonPink.withOpacity(0.1),
            ),
          ),
        ],
        minY: points.map((p) => p.y).reduce((a, b) => a < b ? a : b) - 0.5,
        maxY: points.map((p) => p.y).reduce((a, b) => a > b ? a : b) + 0.5,
      ),
    );
  }
}

