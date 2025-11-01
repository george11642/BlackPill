import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/api_service.dart';
import '../../../../shared/theme/app_colors.dart';
import '../../../../shared/widgets/glass_card.dart';
import '../../../../shared/widgets/primary_button.dart';

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  List<dynamic> _products = [];
  List<dynamic> _recommendations = [];
  String? _selectedCategory;
  bool _isLoading = true;
  final Set<String> _wishlist = {};

  final List<String> _categories = [
    'All',
    'Skincare',
    'Grooming',
    'Fitness',
    'Style',
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _loadRecommendations();
  }

  Future<void> _loadProducts() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.dio.get(
        '/api/products/list',
        queryParameters: _selectedCategory != null && _selectedCategory != 'All'
            ? {'category': _selectedCategory?.toLowerCase()}
            : {},
      );

      setState(() {
        _products = response.data['products'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load products: ${e.toString()}'),
            backgroundColor: AppColors.neonYellow,
          ),
        );
      }
    }
  }

  Future<void> _loadRecommendations() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.dio.post('/api/products/recommend');
      
      setState(() {
        _recommendations = response.data['recommendations'] ?? [];
      });
    } catch (e) {
      // Recommendations are optional, fail silently
    }
  }

  Future<void> _handleProductClick(Map<String, dynamic> product) async {
    try {
      final apiService = ref.read(apiServiceProvider);
      await apiService.dio.post(
        '/api/products/click',
        data: {'productId': product['id']},
      );

      // Get affiliate link
      final clickResponse = await apiService.dio.post(
        '/api/products/click',
        data: {'productId': product['id']},
      );

      final affiliateLink = clickResponse.data['affiliate_link'] as String?;
      
      if (affiliateLink != null && mounted) {
        final uri = Uri.parse(affiliateLink);
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      // Fail silently
    }
  }

  void _toggleWishlist(String productId) {
    setState(() {
      if (_wishlist.contains(productId)) {
        _wishlist.remove(productId);
      } else {
        _wishlist.add(productId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Recommended For You Section
                  if (_recommendations.isNotEmpty) ...[
                    Text(
                      'Recommended For You',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 220,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _recommendations.length,
                        itemBuilder: (context, index) {
                          final product = _recommendations[index];
                          return _buildProductCard(product, isRecommended: true);
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],

                  // Categories Filter
                  SizedBox(
                    height: 40,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      itemBuilder: (context, index) {
                        final category = _categories[index];
                        final isSelected = _selectedCategory == category ||
                            (_selectedCategory == null && category == 'All');
                        
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: FilterChip(
                            label: Text(category),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                _selectedCategory = selected ? category : null;
                              });
                              _loadProducts();
                            },
                            selectedColor: AppColors.neonPink.withOpacity(0.2),
                            checkmarkColor: AppColors.neonPink,
                          ),
                        );
                      },
                    ),
                  ),
                  
                  const SizedBox(height: 24),

                  // Products Grid
                  Text(
                    _selectedCategory != null && _selectedCategory != 'All'
                        ? _selectedCategory!
                        : 'All Products',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  
                  if (_products.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text(
                          'No products available yet',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ),
                    )
                  else
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 0.7,
                      ),
                      itemCount: _products.length,
                      itemBuilder: (context, index) {
                        return _buildProductCard(_products[index]);
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product, {bool isRecommended = false}) {
    final width = isRecommended ? 180.0 : null;
    final productId = product['id'] as String;
    final isWishlisted = _wishlist.contains(productId);

    return Container(
      width: width,
      margin: isRecommended ? const EdgeInsets.only(right: 16) : null,
      child: GlassCard(
        child: InkWell(
          onTap: () => _handleProductClick(product),
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: product['image_url'] != null
                        ? CachedNetworkImage(
                            imageUrl: product['image_url'] as String,
                            width: double.infinity,
                            height: isRecommended ? 120 : 140,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: AppColors.charcoal,
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: AppColors.charcoal,
                              child: const Icon(
                                Icons.image_not_supported,
                                color: AppColors.textTertiary,
                              ),
                            ),
                          )
                        : Container(
                            width: double.infinity,
                            height: isRecommended ? 120 : 140,
                            color: AppColors.charcoal,
                            child: const Icon(
                              Icons.image_not_supported,
                              color: AppColors.textTertiary,
                            ),
                          ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: IconButton(
                      icon: Icon(
                        isWishlisted ? Icons.favorite : Icons.favorite_border,
                        color: isWishlisted ? AppColors.neonPink : AppColors.textSecondary,
                      ),
                      onPressed: () => _toggleWishlist(productId),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Product Name
              Text(
                product['name'] as String? ?? 'Product',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              
              const SizedBox(height: 4),
              
              // Category
              Text(
                product['category'] as String? ?? '',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textTertiary,
                    ),
              ),
              
              const Spacer(),
              
              // Price and Rating
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    product['price'] != null
                        ? '\$${product['price']}'
                        : 'N/A',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.neonPink,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  if (product['rating'] != null)
                    Row(
                      children: [
                        const Icon(
                          Icons.star,
                          size: 16,
                          color: AppColors.neonYellow,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          (product['rating'] as num).toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                ],
              ),
              
              if (isRecommended && product['recommendation'] != null) ...[
                const SizedBox(height: 8),
                Text(
                  product['recommendation']['reason'] as String? ?? '',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.neonCyan,
                        fontSize: 11,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

