import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput as RNTextInput,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, Filter, ArrowLeft, ShoppingBag, Sparkles, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkTheme } from '../lib/theme';
import { BackHeader } from '../components/BackHeader';
import { ProductCard } from '../components/ProductCard';
import { getProducts, getPersonalizedRecommendations } from '../lib/api/products';
import { getLatestAnalysis } from '../lib/api/analyses';
import { GradientText } from '../components/GradientText';
import { Product, RecommendedProduct } from '../lib/types';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - DarkTheme.spacing.md * 3) / 2;

const CATEGORIES = ['All', 'Skincare', 'Grooming', 'Fitness', 'Style'];

export function MarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = useAuth();
  
  // Route params for pre-filling search or category
  const params = route.params as { search?: string; category?: string } | undefined;

  const [searchQuery, setSearchQuery] = useState(params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState(params?.category || 'All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [hasAnalysis, setHasAnalysis] = useState(false);

  // Initial load
  useEffect(() => {
    loadProducts(true);
    loadRecommendations();
  }, [selectedCategory]); // Reload when category changes

  // Debounced search effect could be added here, but for now we'll search on submit or explicit button press 
  // to avoid too many API calls if not debounced. 
  // However, simple approach: trigger load on search submit.

  const loadRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const analysis = await getLatestAnalysis(session?.access_token);
      
      if (analysis) {
        setHasAnalysis(true);
        const recs = await getPersonalizedRecommendations(analysis.id, session?.access_token);
        setRecommendations(recs);
      } else {
        setHasAnalysis(false);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const loadProducts = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const response = await getProducts(
        {
          category: selectedCategory === 'All' ? undefined : selectedCategory.toLowerCase(),
          search: searchQuery || undefined,
          limit: 20,
          offset: currentOffset,
        },
        session?.access_token
      );

      if (reset) {
        setProducts(response.products);
      } else {
        setProducts((prev) => [...prev, ...response.products]);
      }

      setHasMore(response.products.length === 20);
      setOffset(currentOffset + 20);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
    loadRecommendations();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadProducts(false);
    }
  };

  const handleSearchSubmit = () => {
    loadProducts(true);
  };

  const renderRecommendations = () => {
    if (selectedCategory !== 'All' || searchQuery) return null;

    if (loadingRecommendations) {
      return (
        <View style={styles.recommendationsLoader}>
          <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
        </View>
      );
    }

    if (!hasAnalysis) {
      return (
        <View style={styles.recommendationContainer}>
          <LinearGradient
            colors={[DarkTheme.colors.primary + '20', 'transparent']}
            style={styles.recommendationGradient}
          />
          <View style={styles.recommendationHeader}>
            <View style={styles.recommendationTitleRow}>
              <Sparkles size={20} color={DarkTheme.colors.primary} />
              <Text style={styles.recommendationTitle}>Recommended for You</Text>
            </View>
          </View>
          
          <GlassCard variant="subtle" style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Get Personalized Picks</Text>
            <Text style={styles.ctaText}>
              Analyze your face to get AI-powered product recommendations tailored to your needs.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('DailyRoutine' as never)} // Navigate to scan/home
            >
              <Text style={styles.ctaButtonText}>Analyze Face</Text>
              <ChevronRight size={16} color={DarkTheme.colors.background} />
            </TouchableOpacity>
          </GlassCard>
        </View>
      );
    }

    if (recommendations.length === 0) return null;

    return (
      <View style={styles.recommendationContainer}>
        <LinearGradient
          colors={[DarkTheme.colors.primary + '20', 'transparent']}
          style={styles.recommendationGradient}
        />
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationTitleRow}>
            <Sparkles size={20} color={DarkTheme.colors.primary} />
            <Text style={styles.recommendationTitle}>Recommended for You</Text>
          </View>
        </View>

        <FlatList
          data={recommendations}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendationsList}
          renderItem={({ item }) => (
            <View style={styles.recommendationCardWrapper}>
              <ProductCard product={item} />
              <View style={styles.reasonBadge}>
                <Text style={styles.reasonText} numberOfLines={1}>
                  {item.recommendation?.reason || 'Best match'}
                </Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => `rec-${item.id}`}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <GlassCard variant="subtle" style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Search size={20} color={DarkTheme.colors.primary} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={DarkTheme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                loadProducts(true);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>

      {renderRecommendations()}

      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={DarkTheme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <GlassCard variant="subtle" style={styles.emptyCard}>
          <ShoppingBag size={48} color={DarkTheme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Check back soon for new products'}
          </Text>
          {(searchQuery || selectedCategory !== 'All') && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                loadProducts(true);
              }}
            >
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={DarkTheme.colors.primary} />
        </TouchableOpacity>
        <GradientText 
          text="Marketplace"
          fontSize={32}
          fontWeight="700"
          style={styles.screenTitle}
        />
        <View style={{ width: 24 }} /> 
      </View>

      {renderHeader()}

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item, index }) => (
            <View style={[styles.productWrapper, index % 2 === 0 && styles.productWrapperLeft]}>
              <ProductCard product={item} />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  screenTitle: {
    textAlign: 'center',
  },
  headerContainer: {
    paddingBottom: DarkTheme.spacing.md,
    paddingHorizontal: DarkTheme.spacing.md,
  },
  searchCard: {
    marginBottom: DarkTheme.spacing.md,
    padding: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DarkTheme.spacing.md,
    height: 48,
    gap: DarkTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: DarkTheme.colors.text,
    fontSize: 15,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontWeight: '600',
  },
  categoriesContainer: {
    height: 44,
  },
  categoriesList: {
    gap: DarkTheme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: DarkTheme.spacing.md,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DarkTheme.colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    overflow: 'hidden',
  },
  categoryChipActive: {
    borderColor: DarkTheme.colors.primary,
    backgroundColor: DarkTheme.colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  categoryTextActive: {
    color: DarkTheme.colors.background,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  listContent: {
    padding: DarkTheme.spacing.md,
    paddingTop: DarkTheme.spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: CARD_WIDTH,
  },
  productWrapperLeft: {
    marginRight: DarkTheme.spacing.sm,
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: DarkTheme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: DarkTheme.spacing.xl,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    marginTop: DarkTheme.spacing.md,
    marginBottom: DarkTheme.spacing.xs,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  emptyText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: DarkTheme.spacing.lg,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 20,
  },
  resetButton: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    backgroundColor: DarkTheme.colors.primaryDark,
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary,
  },
  resetText: {
    fontSize: 14,
    color: DarkTheme.colors.primary,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  recommendationContainer: {
    marginBottom: DarkTheme.spacing.lg,
    position: 'relative',
  },
  recommendationGradient: {
    position: 'absolute',
    top: 0,
    left: -DarkTheme.spacing.md,
    right: -DarkTheme.spacing.md,
    height: 100,
    opacity: 0.5,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DarkTheme.spacing.sm,
    paddingHorizontal: 4,
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  recommendationsLoader: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationsList: {
    gap: DarkTheme.spacing.md,
    paddingRight: DarkTheme.spacing.md,
  },
  recommendationCardWrapper: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  reasonBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: DarkTheme.colors.primary + '40',
  },
  reasonText: {
    color: DarkTheme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: DarkTheme.typography.fontFamily,
  },
  ctaCard: {
    padding: DarkTheme.spacing.lg,
    alignItems: 'center',
    marginTop: DarkTheme.spacing.xs,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  ctaText: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: DarkTheme.spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingVertical: DarkTheme.spacing.sm,
    borderRadius: DarkTheme.borderRadius.md,
    gap: 8,
  },
  ctaButtonText: {
    color: DarkTheme.colors.background,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

