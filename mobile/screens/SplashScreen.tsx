import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DarkTheme } from '../lib/theme';

export function SplashScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.navigate('Login' as never);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>👤</Text>
        </View>
        <Text style={styles.title}>Black Pill</Text>
        <Text style={styles.subtitle}>Be Honest About Yourself</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DarkTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.lg,
  },
  logoIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: DarkTheme.typography.h1.fontSize,
    fontWeight: DarkTheme.typography.h1.fontWeight as any,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.sm,
  },
  subtitle: {
    fontSize: DarkTheme.typography.body.fontSize,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

