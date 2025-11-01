import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../comparison/presentation/screens/comparison_screen.dart';

/// Provider for photo history
final photoHistoryProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, Map<String, dynamic>>((ref, params) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getPhotoHistory(
    limit: params['limit'] ?? 50,
    offset: params['offset'] ?? 0,
    sortBy: params['sort_by'] ?? 'created_at',
    order: params['order'] ?? 'desc',
  );
});

class PhotoHistoryScreen extends ConsumerStatefulWidget {
  const PhotoHistoryScreen({super.key});

  @override
  ConsumerState<PhotoHistoryScreen> createState() => _PhotoHistoryScreenState();
}

class _PhotoHistoryScreenState extends ConsumerState<PhotoHistoryScreen> {
  String _viewMode = 'grid'; // 'grid' or 'timeline'
  String _sortBy = 'created_at';
  String _order = 'desc';
  int _offset = 0;
  final int _limit = 50;

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(photoHistoryProvider({
      'limit': _limit,
      'offset': _offset,
      'sort_by': _sortBy,
      'order': _order,
    }));

    return Scaffold(
      backgroundColor: AppColors.deepBlack,
      appBar: AppBar(
        title: const Text('My Journey'),
        backgroundColor: AppColors.darkGray,
        actions: [
          IconButton(
            icon: Icon(_viewMode == 'grid' ? Icons.view_timeline : Icons.grid_view),
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == 'grid' ? 'timeline' : 'grid';
              });
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                if (value.startsWith('sort_')) {
                  _sortBy = value.replaceFirst('sort_', '');
                } else if (value.startsWith('order_')) {
                  _order = value.replaceFirst('order_', '');
                }
                _offset = 0; // Reset pagination
              });
              ref.invalidate(photoHistoryProvider({
                'limit': _limit,
                'offset': 0,
                'sort_by': _sortBy,
                'order': _order,
              }));
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'sort_created_at',
                child: Text('Sort by Date'),
              ),
              const PopupMenuItem(
                value: 'sort_score',
                child: Text('Sort by Score'),
              ),
              const PopupMenuItem(
                value: 'order_desc',
                child: Text('Newest First'),
              ),
              const PopupMenuItem(
                value: 'order_asc',
                child: Text('Oldest First'),
              ),
            ],
          ),
        ],
      ),
      body: historyAsync.when(
        data: (data) {
          final analyses = (data['analyses'] as List<dynamic>?) ?? [];
          final total = data['total'] ?? 0;

          if (analyses.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.photo_library,
                    size: 64,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No photos yet',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return _viewMode == 'grid'
              ? _buildGridView(analyses, total)
              : _buildTimelineView(analyses, total);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text(
            'Error: $error',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/comparison');
        },
        icon: const Icon(Icons.compare_arrows),
        label: const Text('Compare'),
        backgroundColor: AppColors.neonPink,
      ),
    );
  }

  Widget _buildGridView(List<dynamic> analyses, int total) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: analyses.length,
      itemBuilder: (context, index) {
        final analysis = analyses[index];
        return _buildPhotoCard(analysis);
      },
    );
  }

  Widget _buildTimelineView(List<dynamic> analyses, int total) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: analyses.length,
      itemBuilder: (context, index) {
        final analysis = analyses[index];
        return _buildTimelineItem(analysis, index == 0);
      },
    );
  }

  Widget _buildPhotoCard(Map<String, dynamic> analysis) {
    final imageUrl = analysis['image_thumbnail_url'] ?? analysis['image_url'];
    final score = analysis['score']?.toDouble() ?? 0.0;
    final date = DateTime.tryParse(analysis['created_at'] ?? '');

    return GestureDetector(
      onTap: () {
        // Navigate to analysis details
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(11),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.darkGray,
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.darkGray,
                        child: Icon(
                          Icons.error,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    )
                  : Container(
                      color: AppColors.darkGray,
                      child: Icon(
                        Icons.image_not_supported,
                        color: AppColors.textTertiary,
                      ),
                    ),
            ),
            // Score overlay
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.8),
                    ],
                  ),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(11),
                    bottomRight: Radius.circular(11),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${score.toStringAsFixed(1)}/10',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (date != null)
                      Text(
                        '${date.month}/${date.day}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineItem(Map<String, dynamic> analysis, bool isFirst) {
    final imageUrl = analysis['image_thumbnail_url'] ?? analysis['image_url'];
    final score = analysis['score']?.toDouble() ?? 0.0;
    final date = DateTime.tryParse(analysis['created_at'] ?? '');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.neonPink,
                ),
              ),
              if (!isFirst)
                Container(
                  width: 2,
                  height: 80,
                  color: AppColors.glassBorder,
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Photo
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.glassBorder),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(7),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: AppColors.darkGray,
                      ),
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.darkGray,
                        child: Icon(
                          Icons.error,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    )
                  : Container(
                      color: AppColors.darkGray,
                    ),
            ),
          ),
          const SizedBox(width: 16),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${score.toStringAsFixed(1)}/10',
                  style: TextStyle(
                    color: AppColors.neonPink,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (date != null)
                  Text(
                    _formatDate(date),
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}

