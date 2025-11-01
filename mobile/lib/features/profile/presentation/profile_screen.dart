import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../shared/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final profile = await apiService.getUserProfile();
      
      setState(() {
        _userProfile = profile;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _refreshProfile() async {
    setState(() => _isRefreshing = true);
    
    try {
      final apiService = ref.read(apiServiceProvider);
      
      // Force refresh subscription status first
      final subscriptionStatus = await apiService.getSubscriptionStatus();
      
      // Then refresh full profile
      final profile = await apiService.getUserProfile();
      
      setState(() {
        _userProfile = profile;
        _isRefreshing = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Profile updated - Tier: ${subscriptionStatus['tier']?.toString().toUpperCase() ?? 'FREE'}'),
            backgroundColor: AppColors.neonGreen,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      setState(() => _isRefreshing = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to refresh: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _openPrivacyPolicy() async {
    try {
      final url = Uri.parse('https://black-pill.app/privacy');
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not launch privacy policy URL');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to open privacy policy: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _openTermsOfService() async {
    try {
      final url = Uri.parse('https://black-pill.app/terms');
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not launch terms of service URL');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to open terms of service: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _signOut() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.darkGray,
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final authService = ref.read(authServiceProvider);
      await authService.signOut();
      
      if (mounted) {
        context.go('/auth/login');
      }
    }
  }

  Future<void> _deleteAccount() async {
    // Show warning dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.darkGray,
        title: const Text('Delete Account'),
        content: const Text(
          'This action cannot be undone. All your data, analyses, and subscription will be permanently deleted.\n\nAre you absolutely sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.neonYellow,
            ),
            child: const Text('Delete Forever'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // Show loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      try {
        final authService = ref.read(authServiceProvider);
        await authService.deleteAccount();
        
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account deleted successfully'),
              backgroundColor: AppColors.neonGreen,
            ),
          );
          
          // Navigate to login
          context.go('/auth/login');
        }
      } catch (e) {
        if (mounted) {
          Navigator.pop(context); // Close loading dialog
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete account: ${e.toString()}'),
              backgroundColor: AppColors.neonYellow,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: _isRefreshing 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isRefreshing ? null : _refreshProfile,
            tooltip: 'Refresh subscription status',
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Navigate to settings
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refreshProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                  // Profile header
                  CircleAvatar(
                    radius: 60,
                    backgroundColor: AppColors.charcoal,
                    child: _userProfile?['avatar_url'] != null
                        ? null
                        : const Icon(
                            Icons.person,
                            size: 60,
                            color: AppColors.textSecondary,
                          ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  Text(
                    _userProfile?['username'] ?? 'User',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    _userProfile?['email'] ?? '',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Stats
                  GlassCard(
                    child: Column(
                      children: [
                        _buildStatRow(
                          'Subscription Tier',
                          (_userProfile?['tier'] ?? 'free').toString().toUpperCase(),
                          Icons.workspace_premium,
                        ),
                        const Divider(height: 32),
                        _buildStatRow(
                          'Scans Remaining',
                          _userProfile?['scans_remaining']?.toString() ?? '0',
                          Icons.photo_camera,
                        ),
                        const Divider(height: 32),
                        _buildStatRow(
                          'Referral Code',
                          _userProfile?['referral_code'] ?? '',
                          Icons.card_giftcard,
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Menu items
                  _buildMenuItem(
                    'Referral Stats',
                    Icons.people,
                    () => context.push('/referral/stats'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Subscription',
                    Icons.payment,
                    () => context.push('/paywall'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Privacy Policy',
                    Icons.privacy_tip,
                    _openPrivacyPolicy,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Terms of Service',
                    Icons.description,
                    _openTermsOfService,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Ethical Settings',
                    Icons.favorite,
                    () => context.push('/ethical/settings'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Wellness Dashboard',
                    Icons.fitness_center,
                    () => context.push('/wellness'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Challenges',
                    Icons.emoji_events,
                    () => context.push('/challenges'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Marketplace',
                    Icons.shopping_bag,
                    () => context.push('/marketplace'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  _buildMenuItem(
                    'Insights Dashboard',
                    Icons.insights,
                    () => context.push('/insights'),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Account deletion button
                  OutlinedButton.icon(
                    onPressed: _deleteAccount,
                    icon: const Icon(Icons.delete_forever),
                    label: const Text('Delete Account'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.neonYellow,
                      side: const BorderSide(color: AppColors.neonYellow),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Sign out button
                  OutlinedButton.icon(
                    onPressed: _signOut,
                    icon: const Icon(Icons.logout),
                    label: const Text('Sign Out'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: BorderSide(color: AppColors.glassBorder),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.neonCyan, size: 24),
        const SizedBox(width: 16),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.neonPink,
              ),
        ),
      ],
    );
  }

  Widget _buildMenuItem(String title, IconData icon, VoidCallback onTap) {
    return GlassCard(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: AppColors.neonCyan),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

