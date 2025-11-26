import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { apiGet, apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { DarkTheme } from '../lib/theme';

export function EthicalSettingsScreen() {
  const { session } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiGet<{ settings: any }>(
        '/api/ethical/settings',
        session?.access_token
      );
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      await apiPost(
        '/api/ethical/settings',
        { [key]: value },
        session?.access_token
      );
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const showResources = () => {
    Alert.alert(
      'Mental Health Resources',
      'If you need support, please reach out to:\n\n• Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n• Your local mental health services'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy & Wellness</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Privacy Settings</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Public Profile</Text>
          <Switch
            value={settings?.publicProfile || false}
            onValueChange={(value) => updateSetting('publicProfile', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Share Analytics</Text>
          <Switch
            value={settings?.shareAnalytics || false}
            onValueChange={(value) => updateSetting('shareAnalytics', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Wellness Controls</Text>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Daily Reminders</Text>
          <Switch
            value={settings?.dailyReminders || false}
            onValueChange={(value) => updateSetting('dailyReminders', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Wellness Checks</Text>
          <Switch
            value={settings?.wellnessChecks || false}
            onValueChange={(value) => updateSetting('wellnessChecks', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
      </GlassCard>

      <PrimaryButton
        title="View Mental Health Resources"
        onPress={showResources}
        variant="secondary"
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  content: {
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
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
  button: {
    marginTop: DarkTheme.spacing.md,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

