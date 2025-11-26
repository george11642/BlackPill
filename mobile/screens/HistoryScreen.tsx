import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet } from '../lib/api/client';
import { useAuth } from '../lib/auth/context';
import { GlassCard } from '../components/GlassCard';
import { Analysis } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function HistoryScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiGet<{ analyses: Analysis[] }>(
        '/api/analyses/history',
        session?.access_token
      );
      setAnalyses(data.analyses);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Analysis }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('AnalysisResult' as never, {
          analysisId: item.id,
        } as never)
      }
    >
      <GlassCard style={styles.card}>
        <Image source={{ uri: item.photoUrl }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.score}>{item.score.toFixed(1)}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo History</Text>
      </View>
      <FlatList
        data={analyses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
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
  list: {
    padding: DarkTheme.spacing.md,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: DarkTheme.spacing.md,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: DarkTheme.borderRadius.md,
    marginBottom: DarkTheme.spacing.sm,
  },
  info: {
    alignItems: 'center',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.primary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  date: {
    fontSize: 12,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: DarkTheme.spacing.xs,
  },
  loading: {
    color: DarkTheme.colors.text,
    fontSize: 16,
    fontFamily: DarkTheme.typography.fontFamily,
    textAlign: 'center',
    marginTop: DarkTheme.spacing.xl,
  },
});

