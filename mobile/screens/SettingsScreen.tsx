import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { GlassCard } from '../components/GlassCard';
import { BackHeader } from '../components/BackHeader';
import { DarkTheme } from '../lib/theme';

export function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  return (
    <View style={styles.container}>
      <BackHeader title="Settings" variant="large" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Analytics</Text>
          <Switch
            value={analytics}
            onValueChange={setAnalytics}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
      </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: DarkTheme.spacing.lg,
    paddingTop: DarkTheme.spacing.md,
  },
  card: {
    marginBottom: DarkTheme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  version: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  link: {
    paddingVertical: DarkTheme.spacing.sm,
  },
  linkText: {
    fontSize: 14,
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
});

