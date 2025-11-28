import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';

interface ProfileAvatarProps {
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGoldRing?: boolean;
}

const SIZES = {
  sm: 40,
  md: 64,
  lg: 96,
  xl: 120,
};

const RING_WIDTHS = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

const ICON_SIZES = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 60,
};

export function ProfileAvatar({
  imageUrl,
  size = 'md',
  showGoldRing = true,
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dimension = SIZES[size];
  const ringWidth = RING_WIDTHS[size];
  const innerSize = dimension - ringWidth * 2;
  const iconSize = ICON_SIZES[size];

  // Check if we have a valid image URL
  const hasValidUrl = imageUrl && imageUrl.trim().length > 0 && !imageError;

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {showGoldRing && (
        <LinearGradient
          colors={[DarkTheme.colors.primaryLight, DarkTheme.colors.primary, DarkTheme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ring,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.imageContainer,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {hasValidUrl ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                  opacity: imageLoaded ? 1 : 0,
                },
              ]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.log('[ProfileAvatar] Image failed to load:', imageUrl);
                setImageError(true);
              }}
            />
            {/* Show placeholder while loading */}
            {!imageLoaded && (
              <View
                style={[
                  styles.placeholder,
                  styles.loadingPlaceholder,
                  {
                    width: innerSize,
                    height: innerSize,
                    borderRadius: innerSize / 2,
                  },
                ]}
              >
                <User size={iconSize} color={DarkTheme.colors.textSecondary} />
              </View>
            )}
          </>
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              },
            ]}
          >
            <User size={iconSize} color={DarkTheme.colors.textSecondary} />
          </View>
        )}
      </View>
      {/* Glow effect */}
      {showGoldRing && (
        <View
          style={[
            styles.glow,
            {
              width: dimension + 20,
              height: dimension + 20,
              borderRadius: (dimension + 20) / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    ...DarkTheme.shadows.gold,
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: DarkTheme.colors.card,
  },
  image: {
    backgroundColor: DarkTheme.colors.surface,
  },
  placeholder: {
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPlaceholder: {
    position: 'absolute',
  },
  glow: {
    position: 'absolute',
    backgroundColor: DarkTheme.colors.primary,
    opacity: 0.1,
    zIndex: -1,
  },
});

export default ProfileAvatar;

