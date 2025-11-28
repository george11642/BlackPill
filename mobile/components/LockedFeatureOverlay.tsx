import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock, Crown } from 'lucide-react-native';
import { DarkTheme } from '../lib/theme';
import { PrimaryButton } from './PrimaryButton';
import { useNavigation } from '@react-navigation/native';

interface LockedFeatureOverlayProps {
  isVisible: boolean;
  title?: string;
  description?: string;
  style?: ViewStyle;
}

export function LockedFeatureOverlay({ 
  isVisible, 
  title = "Premium Feature", 
  description = "Subscribe to Pro or Elite to unlock this feature.",
  style 
}: LockedFeatureOverlayProps) {
  const navigation = useNavigation();

  if (!isVisible) return null;

  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Crown size={32} color={DarkTheme.colors.primary} fill={DarkTheme.colors.primary} />
          <View style={styles.lockBadge}>
            <Lock size={12} color="#000" />
          </View>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <PrimaryButton
          title="Unlock Access"
          onPress={() => navigation.navigate('Subscription' as never)}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: DarkTheme.colors.text,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: DarkTheme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: DarkTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    width: 200,
  },
});

