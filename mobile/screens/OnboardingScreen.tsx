import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { PrimaryButton } from '../components/PrimaryButton';
import { GlassCard } from '../components/GlassCard';
import { DarkTheme } from '../lib/theme';

export function OnboardingScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      if (!cameraStatus.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Black Pill needs camera access to analyze your photos.'
        );
        return false;
      }

      // Request notification permission
      const notificationStatus = await Notifications.requestPermissionsAsync();
      if (!notificationStatus.granted) {
        Alert.alert(
          'Notifications',
          'You can enable notifications later in settings.'
        );
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to request permissions');
      return false;
    }
  };

  const handleContinue = async () => {
    if (step === 0) {
      const granted = await requestPermissions();
      if (granted) {
        setStep(1);
      }
    } else {
      navigation.navigate('Home' as never);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 0 ? 'Welcome to Black Pill' : 'Important Disclaimers'}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          {step === 0 ? (
            <View>
              <Text style={styles.disclaimerTitle}>Permissions Needed</Text>
              <Text style={styles.disclaimerText}>
                • Camera: To take photos for AI analysis{'\n'}
                • Notifications: To remind you about routines and progress
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
              <Text style={styles.disclaimerText}>
                Black Pill provides AI-powered attractiveness analysis for
                informational purposes only. This app is not a substitute for
                professional medical, psychological, or cosmetic advice.
                {'\n\n'}
                Results are based on AI analysis and should not be considered
                definitive assessments of attractiveness or self-worth.
                {'\n\n'}
                If you experience negative emotional impacts, please seek
                professional support.
              </Text>
            </View>
          )}
        </GlassCard>

        <PrimaryButton
          title={step === 0 ? 'Grant Permissions' : 'I Understand'}
          onPress={handleContinue}
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
  scrollContent: {
    flexGrow: 1,
    padding: DarkTheme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  card: {
    marginBottom: DarkTheme.spacing.xl,
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.md,
  },
  disclaimerText: {
    fontSize: DarkTheme.typography.body.fontSize,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    lineHeight: 22,
  },
  button: {
    marginTop: DarkTheme.spacing.md,
  },
});

