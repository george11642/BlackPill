import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CameraScreen } from './CameraScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ProgressScreen } from './ProgressScreen';
import { HistoryScreen } from './HistoryScreen';
import { DarkTheme } from '../lib/theme';

const Tab = createBottomTabNavigator();

export function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: DarkTheme.colors.primary,
        tabBarInactiveTintColor: DarkTheme.colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>📷</Text>,
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>🏆</Text>,
          tabBarLabel: 'Leaderboard',
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>📊</Text>,
          tabBarLabel: 'Progress',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>📸</Text>,
          tabBarLabel: 'History',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: DarkTheme.colors.card,
    borderTopColor: DarkTheme.colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: DarkTheme.typography.fontFamily,
    fontWeight: '500',
  },
  icon: {
    fontSize: 24,
  },
});

