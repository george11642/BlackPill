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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Search, Filter, ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { BackHeader } from '../components/BackHeader';
import { ProductCard } from '../components/ProductCard';
import { getProducts } from '../lib/api/products';
import { GradientText } from '../components/GradientText';
import { Product } from '../lib/types';
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

  // Initial load
  useEffect(() => {
    loadProducts(true);
  }, [selectedCategory]); // Reload when category changes

  // Debounced search effect could be added here, but for now we'll search on submit or explicit button press 
  // to avoid too many API calls if not debounced. 
  // However, simple approach: trigger load on search submit.

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
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadProducts(false);
    }
  };

  const handleSearchSubmit = () => {
    loadProducts(true);
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
});

