import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DarkTheme, LightTheme } from '../lib/theme';
import { GradientText } from './GradientText';

interface BackHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
  subtitle?: string;
  variant?: 'default' | 'large';
  transparent?: boolean;
}

export function BackHeader({ title, rightElement, onBackPress, subtitle, variant = 'default', transparent = false }: BackHeaderProps) {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const dynamicStyles = useMemo(() => StyleSheet.create({
    header: {
      flexDirection: variant === 'large' ? 'column' : 'row',
      alignItems: variant === 'large' ? 'stretch' : 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingTop: insets.top + 4,
      paddingBottom: 4,
      backgroundColor: transparent ? 'transparent' : theme.colors.background,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: variant === 'large' ? theme.spacing.xs : 0,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
    },
    backButtonPressed: {
      backgroundColor: theme.colors.surface,
    },
    titleContainer: {
      flex: variant === 'large' ? undefined : 1,
      alignItems: 'center',
    },
    title: {
      fontSize: variant === 'large' ? 32 : 18,
      fontWeight: variant === 'large' ? '700' : '600',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily,
      textAlign: 'center',
      marginTop: 2,
    },
    rightContainer: {
      width: 44,
      alignItems: 'flex-end',
    },
    placeholder: {
      width: 44,
    },
  }), [theme, variant, insets.top]);

  if (variant === 'large') {
    return (
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerTopRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              dynamicStyles.backButton,
              pressed && dynamicStyles.backButtonPressed,
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color={theme.colors.primary} />
          </Pressable>
          <View style={dynamicStyles.rightContainer}>
            {rightElement || <View style={dynamicStyles.placeholder} />}
          </View>
        </View>
        <View style={dynamicStyles.titleContainer}>
          <GradientText
            text={title}
            fontSize={32}
            fontWeight="700"
            colors={[theme.colors.primary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            numberOfLines={1}
            align="center"
          />
          {subtitle && <Text style={dynamicStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.header}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          dynamicStyles.backButton,
          pressed && dynamicStyles.backButtonPressed,
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeft size={28} color={theme.colors.primary} />
      </Pressable>
      <View style={dynamicStyles.titleContainer}>
        <GradientText
          text={title}
          fontSize={20}
          fontWeight="600"
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          numberOfLines={1}
          align="center"
        />
        {subtitle && <Text style={dynamicStyles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={dynamicStyles.rightContainer}>
        {rightElement || <View style={dynamicStyles.placeholder} />}
      </View>
    </View>
  );
}

export default BackHeader;

