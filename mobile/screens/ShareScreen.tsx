import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { apiPost } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { PrimaryButton } from '../components/PrimaryButton';
import { GlassCard } from '../components/GlassCard';
import { DarkTheme } from '../lib/theme';

export function ShareScreen() {
  const route = useRoute();
  const { session } = useAuth();
  const { analysisId } = route.params as { analysisId: string };
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateShareCard = async () => {
    setLoading(true);
    try {
      const data = await apiPost<{ cardUrl: string }>(
        '/api/share/generate-card',
        { analysisId },
        session?.access_token
      );
      setShareCardUrl(data.cardUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate share card');
    } finally {
      setLoading(false);
    }
  };

  const shareCard = async () => {
    if (!shareCardUrl) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(shareCardUrl);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share card');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Your Progress</Text>
      </View>

      {shareCardUrl ? (
        <View style={styles.content}>
          <Image source={{ uri: shareCardUrl }} style={styles.cardImage} />
          <PrimaryButton
            title="Share Card"
            onPress={shareCard}
            style={styles.button}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <GlassCard style={styles.card}>
            <Text style={styles.cardText}>
              Generate a shareable card with your analysis results
            </Text>
          </GlassCard>
          <PrimaryButton
            title="Generate Share Card"
            onPress={generateShareCard}
            loading={loading}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    padding: DarkTheme.spacing.lg,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  content: {
    flex: 1,
    padding: DarkTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: DarkTheme.spacing.xl,
    padding: DarkTheme.spacing.xl,
  },
  cardText: {
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
  },
  cardImage: {
    width: '100%',
    height: 400,
    borderRadius: DarkTheme.borderRadius.lg,
    marginBottom: DarkTheme.spacing.xl,
  },
  button: {
    width: '100%',
  },
});

