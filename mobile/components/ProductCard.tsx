import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ExternalLink, Star, Tag } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { DarkTheme } from '../lib/theme';
import { Product } from '../lib/types';
import { trackProductClick } from '../lib/api/products';
import { useAuth } from '../lib/auth/context';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { session } = useAuth();

  const handlePress = async () => {
    // Track click then open link
    try {
      await trackProductClick(product.id, session?.access_token);
    } catch (err) {
      // Ignore tracking error
      console.log('Tracking error', err);
    }

    if (product.affiliate_link) {
      Linking.openURL(product.affiliate_link);
    }
    
    if (onPress) {
      onPress();
    }
  };

  return (
    <GlassCard style={styles.container}>
      <TouchableOpacity onPress={handlePress} style={styles.touchable}>
        {/* Product Image or Placeholder */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Tag color={DarkTheme.colors.textTertiary} size={32} />
            </View>
          )}
          {product.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Tag */}
          <View style={styles.categoryRow}>
            <Text style={styles.category}>{product.category} {product.subcategory ? `• ${product.subcategory}` : ''}</Text>
            {product.rating && (
              <View style={styles.ratingContainer}>
                <Star size={12} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
                <Text style={styles.rating}>{product.rating}</Text>
                <Text style={styles.reviewCount}>({product.review_count})</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>{product.name}</Text>
          
          {/* Description */}
          {product.description && (
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
          )}

          {/* Footer: Price & Action */}
          <View style={styles.footer}>
            <Text style={styles.price}>
              {product.price ? `$${product.price.toFixed(2)}` : 'View Price'}
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={handlePress}>
              <Text style={styles.buttonText}>Shop Now</Text>
              <ExternalLink size={14} color={DarkTheme.colors.background} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: DarkTheme.spacing.md,
  },
  touchable: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: '100%',
    backgroundColor: DarkTheme.colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: 120, // Min height
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DarkTheme.colors.surface,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: DarkTheme.colors.background,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 10,
    color: DarkTheme.colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 11,
    color: DarkTheme.colors.textSecondary,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 10,
    color: DarkTheme.colors.textTertiary,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    marginBottom: 4,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  description: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DarkTheme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DarkTheme.colors.background,
  },
});

