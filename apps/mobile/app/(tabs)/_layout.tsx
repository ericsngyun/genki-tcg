import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // For Android, use dynamic insets to handle navigation bar
  // For iOS, keep the existing hardcoded values that work well
  const bottomPadding = Platform.OS === 'ios' ? 24 : Math.max(insets.bottom, 8);
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 60 + Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.card,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 4 : 2,
        },
        headerStyle: {
          backgroundColor: theme.colors.background.card,
          borderBottomColor: theme.colors.border.light,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      {/* Hide wallet tab - functionality merged into profile */}
      <Tabs.Screen
        name="wallet"
        options={{
          href: null, // This hides the tab from navigation
        }}
      />
    </Tabs>
  );
}
