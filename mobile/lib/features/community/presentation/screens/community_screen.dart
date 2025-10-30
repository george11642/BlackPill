import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

class CommunityScreen extends ConsumerStatefulWidget {
  const CommunityScreen({super.key});

  @override
  ConsumerState<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends ConsumerState<CommunityScreen> {
  late List<Map<String, dynamic>> _publicAnalyses;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _publicAnalyses = [];
    _loadPublicAnalyses();
  }

  Future<void> _loadPublicAnalyses() async {
    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      final analyses = await apiService.getPublicAnalyses(limit: 20);
      
      setState(() {
        _publicAnalyses = List<Map<String, dynamic>>.from(analyses);
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading public analyses: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load community feed: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _showCommunityGuidelines(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildContent(),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          GlassCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(
                  Icons.groups,
                  size: 48,
                  color: AppColors.neonPurple,
                ),
                const SizedBox(height: 12),
                Text(
                  'Community Hub',
                  style: Theme.of(context).textTheme.displaySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Share your journey and support others',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Community Guidelines Card
          GlassCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.favorite,
                      color: AppColors.neonPink,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Community Guidelines',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildGuideline('Be constructive and supportive'),
                _buildGuideline('No harassment or hate speech'),
                _buildGuideline('Respect privacy - no sharing without consent'),
                _buildGuideline('No spam or self-promotion'),
                const SizedBox(height: 16),
                Text(
                  'Violations will result in warnings, temporary bans, or permanent removal.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textTertiary,
                      ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Public Analyses (placeholder)
          Text(
            'Public Analyses',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          
          const SizedBox(height: 16),
          
          if (_publicAnalyses.isEmpty)
            GlassCard(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  Icon(
                    Icons.photo_library_outlined,
                    size: 64,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No public analyses yet',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Be the first to share your results with the community!',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  PrimaryButton(
                    text: 'Share Your Results',
                    icon: Icons.share,
                    onPressed: () {
                      // Navigate to results screen to make public
                    },
                  ),
                ],
              ),
            )
          else
            // Display public analyses
            ..._publicAnalyses.map((analysis) => _buildAnalysisCard(analysis)),
        ],
      ),
    );
  }

  Widget _buildGuideline(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle,
            color: AppColors.neonGreen,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  void _showCommunityGuidelines() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.darkGray,
        title: const Text('Community Guidelines'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Our community is built on mutual respect and support. Please follow these guidelines:',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              _buildGuideline('Be constructive and supportive'),
              _buildGuideline('No harassment, bullying, or hate speech'),
              _buildGuideline('No sharing others\' photos without consent'),
              _buildGuideline('No spamming or excessive self-promotion'),
              _buildGuideline('Keep discussions focused on self-improvement'),
              const SizedBox(height: 16),
              Text(
                'Moderation',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                '• 1st violation: Warning\n• 2nd violation: 7-day ban\n• 3rd violation: Permanent removal',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              Text(
                'All content is monitored by AI and our moderation team. Report any violations using the report button.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisCard(Map<String, dynamic> analysis) {
    final user = analysis['users'] ?? {};
    final username = user['username'] ?? 'Anonymous';
    final avatarUrl = user['avatar_url'];
    final score = analysis['score']?.toDouble() ?? 0.0;
    final thumbnailUrl = analysis['image_thumbnail_url'];
    final likeCount = analysis['like_count'] ?? 0;
    final viewCount = analysis['view_count'] ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User info
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null
                      ? Text(
                          username.isNotEmpty ? username[0].toUpperCase() : '?',
                          style: const TextStyle(color: AppColors.neonPink),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        username,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        'Score: ${score.toStringAsFixed(1)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.neonCyan,
                            ),
                      ),
                    ],
                  ),
                ),
                // Stats
                Row(
                  children: [
                    Icon(Icons.favorite, size: 16, color: AppColors.neonPink),
                    const SizedBox(width: 4),
                    Text('$likeCount', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(width: 16),
                    Icon(Icons.visibility, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text('$viewCount', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ],
            ),
            
            // Thumbnail if available
            if (thumbnailUrl != null) ...[
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  thumbnailUrl,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 200,
                    color: AppColors.darkGray,
                    child: const Icon(Icons.image_not_supported, size: 48),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

