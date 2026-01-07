import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bell, Mail, MessageSquare, Zap } from 'lucide-react-native';

import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { DarkTheme } from '../lib/theme';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  enabled: boolean;
}

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'push',
      label: 'Push Notifications',
      description: 'Receive push notifications for important updates',
      icon: Bell,
      enabled: true,
    },
    {
      id: 'email',
      label: 'Email Notifications',
      description: 'Get notified via email about your progress',
      icon: Mail,
      enabled: true,
    },
    {
      id: 'reminders',
      label: 'Daily Reminders',
      description: 'Receive reminders to complete your daily routine',
      icon: Zap,
      enabled: true,
    },
    {
      id: 'social',
      label: 'Social Updates',
      description: 'Notifications about achievements and leaderboard changes',
      icon: MessageSquare,
      enabled: false,
    },
  ]);

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 20 }],
  }));

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader title="Notifications" variant="large" />
      <View style={styles.content}>

      {/* Introduction */}
      <Animated.View style={contentAnimatedStyle}>
        <Text style={styles.description}>
          Manage how you receive updates and reminders about your SheMax journey.
        </Text>
      </Animated.View>

      {/* Notification Settings */}
      <Animated.View style={[styles.settingsContainer, contentAnimatedStyle]}>
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <GlassCard key={notification.id} variant="subtle" style={styles.settingCard}>
              <View style={styles.settingContent}>
                <View style={styles.settingIconContainer}>
                  <View style={[styles.settingIcon, notification.enabled && styles.settingIconActive]}>
                    <Icon
                      size={20}
                      color={notification.enabled ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary}
                    />
                  </View>
                </View>

                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingLabel, !notification.enabled && styles.settingLabelDisabled]}>
                    {notification.label}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {notification.description}
                  </Text>
                </View>

                <Switch
                  value={notification.enabled}
                  onValueChange={() => handleToggle(notification.id)}
                  trackColor={{
                    false: DarkTheme.colors.surface,
                    true: `${DarkTheme.colors.primary}40`,
                  }}
                  thumbColor={notification.enabled ? DarkTheme.colors.primary : DarkTheme.colors.textTertiary}
                />
              </View>
            </GlassCard>
          );
        })}
      </Animated.View>

      {/* Info Box */}
      <Animated.View style={[styles.infoBox, contentAnimatedStyle]}>
        <GlassCard variant="subtle">
          <View>
            <Text style={styles.infoTitle}>📱 Device Settings</Text>
            <Text style={styles.infoText}>
              To receive push notifications, make sure notifications are enabled in your device settings for the SheMax app.
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  content: {
    paddingHorizontal: DarkTheme.spacing.lg,
    paddingTop: 16,
  },
  description: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.lg,
    lineHeight: 20,
  },
  settingsContainer: {
    marginBottom: DarkTheme.spacing.lg,
    gap: DarkTheme.spacing.md,
  },
  settingCard: {
    marginBottom: 0,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DarkTheme.spacing.md,
  },
  settingIconContainer: {
    marginRight: DarkTheme.spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DarkTheme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconActive: {
    backgroundColor: `${DarkTheme.colors.primary}20`,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: 4,
  },
  settingLabelDisabled: {
    color: DarkTheme.colors.textSecondary,
  },
  settingDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  infoBox: {
    marginBottom: DarkTheme.spacing.lg,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default NotificationsScreen;

