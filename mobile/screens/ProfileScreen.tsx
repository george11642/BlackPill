import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth/context';
import { apiGet } from '../lib/api/client';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { User } from '../lib/types';
import { DarkTheme } from '../lib/theme';

export function ProfileScreen() {
  const navigation = useNavigation();
  const { user, session, signOut } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiGet<{ user: User }>(
        '/api/auth/me',
        session?.access_token
      );
      setProfile(data.user);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile?.avatarUrl && (
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
        )}
        <Text style={styles.name}>{profile?.username || user?.email}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <GlassCard style={styles.card}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Text style={styles.menuText}>⚙️ Settings</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Subscription' as never)}
        >
          <Text style={styles.menuText}>💎 Subscription</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('EthicalSettings' as never)}
        >
          <Text style={styles.menuText}>🛡️ Privacy & Wellness</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </GlassCard>

      <PrimaryButton
        title="Sign Out"
        onPress={signOut}
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
    alignItems: 'center',
    marginBottom: DarkTheme.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: DarkTheme.spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
    marginBottom: DarkTheme.spacing.xs,
  },
  email: {
    fontSize: 14,
    color: DarkTheme.colors.textSecondary,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  card: {
    marginBottom: DarkTheme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DarkTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  menuText: {
    fontSize: 16,
    color: DarkTheme.colors.text,
    fontFamily: DarkTheme.typography.fontFamily,
  },
  arrow: {
    fontSize: 18,
    color: DarkTheme.colors.textTertiary,
  },
  button: {
    marginTop: DarkTheme.spacing.md,
  },
});

