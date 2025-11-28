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
import { apiGet, apiPut } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { BackHeader } from '../components/BackHeader';
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
      await apiPut(
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
        <BackHeader title="Privacy & Wellness" variant="large" />
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader title="Privacy & Wellness" variant="large" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Analysis Features</Text>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Age Estimation</Text>
            <Text style={styles.settingDescription}>Allow AI to estimate age in analysis</Text>
          </View>
          <Switch
            value={settings?.age_estimation ?? true}
            onValueChange={(value) => updateSetting('age_estimation', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Advanced Features</Text>
            <Text style={styles.settingDescription}>Enable detailed breakdown analysis</Text>
          </View>
          <Switch
            value={settings?.advanced_features ?? true}
            onValueChange={(value) => updateSetting('advanced_features', value)}
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
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Wellness Checks</Text>
            <Text style={styles.settingDescription}>Periodic check-ins for mental health</Text>
          </View>
          <Switch
            value={settings?.enable_wellness_checks ?? true}
            onValueChange={(value) => updateSetting('enable_wellness_checks', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Resources on Low Scores</Text>
            <Text style={styles.settingDescription}>Display mental health resources when needed</Text>
          </View>
          <Switch
            value={settings?.show_resources_on_low_scores ?? true}
            onValueChange={(value) => updateSetting('show_resources_on_low_scores', value)}
            trackColor={{
              false: DarkTheme.colors.card,
              true: DarkTheme.colors.primary,
            }}
            thumbColor={DarkTheme.colors.text}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.cardTitle}>Leaderboard</Text>
        <Text style={styles.cardDescription}>
          To share your score on the leaderboard, go to the Leaderboard screen and tap "Join" or use the Leaderboard button on your analysis results.
        </Text>
      </GlassCard>

      <PrimaryButton
          title="View Mental Health Resources"
          onPress={showResources}
          variant="secondary"
          style={styles.button}
        />
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
  settingInfo: {
    flex: 1,
    marginRight: DarkTheme.spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  settingDescription: {
    fontSize: 12,
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 20,
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

