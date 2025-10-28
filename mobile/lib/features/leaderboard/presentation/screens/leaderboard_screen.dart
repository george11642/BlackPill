import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/api_service.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../widgets/leaderboard_item.dart';
import '../widgets/leaderboard_filter_chips.dart';

enum LeaderboardFilter { thisWeek, allTime, byLocation }

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen> {
  LeaderboardFilter _selectedFilter = LeaderboardFilter.thisWeek;
  List<Map<String, dynamic>> _leaderboard = [];
  Map<String, dynamic>? _currentUserRank;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLeaderboard();
    ref.read(analyticsServiceProvider).trackLeaderboardViewed();
  }

  Future<void> _loadLeaderboard() async {
    setState(() => _isLoading = true);

    try {
      final apiService = ref.read(apiServiceProvider);
      
      // Get leaderboard data
      final data = await apiService.getLeaderboard(limit: 100);
      
      // Get current user info
      final userProfile = await apiService.getUserProfile();
      final userId = userProfile['id'];
      
      // Find current user's rank
      final userRankIndex = data.indexWhere((item) => item['user_id'] == userId);
      
      setState(() {
        _leaderboard = List<Map<String, dynamic>>.from(data);
        if (userRankIndex != -1) {
          _currentUserRank = _leaderboard[userRankIndex];
        }
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading leaderboard: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  void _onFilterChanged(LeaderboardFilter filter) {
    setState(() => _selectedFilter = filter);
    _loadLeaderboard();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leaderboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLeaderboard,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Filter chips
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: LeaderboardFilterChips(
                    selectedFilter: _selectedFilter,
                    onFilterChanged: _onFilterChanged,
                  ),
                ),
                
                // Your rank card
                if (_currentUserRank != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your Rank',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 12),
                          LeaderboardItem(
                            rank: _currentUserRank!['rank'] ?? 0,
                            username: _currentUserRank!['username'] ?? 'You',
                            score: _currentUserRank!['score']?.toDouble() ?? 0.0,
                            avatarUrl: _currentUserRank!['avatar_url'],
                            isCurrentUser: true,
                          ),
                        ],
                      ),
                    ),
                  ),
                
                // Leaderboard list
                Expanded(
                  child: _leaderboard.isEmpty
                      ? Center(
                          child: Text(
                            'No rankings yet.\nBe the first!',
                            style: Theme.of(context).textTheme.bodyLarge,
                            textAlign: TextAlign.center,
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _leaderboard.length,
                          itemBuilder: (context, index) {
                            final item = _leaderboard[index];
                            final rank = index + 1;
                            
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: LeaderboardItem(
                                rank: rank,
                                username: item['username'] ?? 'Anonymous',
                                score: item['score']?.toDouble() ?? 0.0,
                                avatarUrl: item['avatar_url'],
                                isTopThree: rank <= 3,
                                showBadge: rank <= 3,
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}

