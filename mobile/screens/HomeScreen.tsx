import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Home, TrendingUp, MessageCircle, Trophy, User, ShoppingBag } from 'lucide-react-native';

import { DailyRoutineScreen } from './DailyRoutineScreen';
import { ProgressScreen } from './ProgressScreen';
import { AICoachScreen } from './AICoachScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { ProfileScreen } from './ProfileScreen';
import { MarketplaceScreen } from './MarketplaceScreen';
import { DarkTheme } from '../lib/theme';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  label: string;
}

function TabIcon({ focused, Icon, label }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      {focused && (
        <LinearGradient
          colors={[DarkTheme.colors.primaryDark, DarkTheme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabIconBackground}
        />
      )}
      <Icon
        size={24}
        color={focused ? DarkTheme.colors.background : DarkTheme.colors.textTertiary}
        strokeWidth={focused ? 2.5 : 2}
      />
      <Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: DarkTheme.colors.primary,
        tabBarInactiveTintColor: DarkTheme.colors.textTertiary,
      }}
    >
      <Tab.Screen
        name="DailyRoutine"
        component={DailyRoutineScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Home} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={TrendingUp} label="Progress" />
          ),
        }}
      />
      <Tab.Screen
        name="Shop"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={ShoppingBag} label="Shop" />
          ),
        }}
      />
      <Tab.Screen
        name="Coach"
        component={AICoachScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={MessageCircle} label="Coach" />
          ),
        }}
      />
      <Tab.Screen
        name="Ranks"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Trophy} label="Ranks" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: DarkTheme.colors.card,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.borderSubtle,
    height: 80,
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 46,
    position: 'relative',
  },
  tabIconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: DarkTheme.borderRadius.md,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: DarkTheme.colors.textTertiary,
    fontFamily: DarkTheme.typography.fontFamily,
    marginTop: 2,
  },
  tabLabelActive: {
    color: DarkTheme.colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;
