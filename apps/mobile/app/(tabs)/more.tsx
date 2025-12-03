import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { logger } from '../../lib/logger';
import { useRouter } from 'expo-router';
import { theme } from '../../lib/theme';
import { shadows } from '../../lib/shadows';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../lib/api';
import { AppHeader } from '../../components';

export default function MoreScreen() {
  const router = useRouter();

  const performLogout = () => {
    api.logout()
      .then(() => {
        router.replace('/login');
      })
      .catch((error) => {
        logger.error('Logout error:', error);
        // Still navigate to login even on error
        router.replace('/login');
      });
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Use browser confirm on web since Alert.alert doesn't work
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      // Use native Alert on iOS/Android
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

  const menuItems = [
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Manage your notifications',
      onPress: () => router.push('/notifications'),
    },
    {
      icon: 'podium',
      title: 'Leaderboard',
      subtitle: 'View player rankings',
      onPress: () => router.push('/leaderboard'),
    },
    {
      icon: 'time',
      title: 'Match History',
      subtitle: 'View your past matches',
      onPress: () => alert('Coming soon'),
    },
    {
      icon: 'trophy',
      title: 'Achievements',
      subtitle: 'View your achievements',
      onPress: () => alert('Coming soon'),
    },
    {
      icon: 'location',
      title: 'Store Locator',
      subtitle: 'Find nearby stores',
      onPress: () => alert('Coming soon'),
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      onPress: () => alert('Coming soon'),
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => alert('Coming soon'),
    },
    {
      icon: 'information-circle',
      title: 'About',
      subtitle: 'Version 0.1.0',
      onPress: () => alert('Genki TCG Mobile App\nVersion 0.1.0'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <AppHeader title="More" subtitle="Settings and options" />

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as any} size={24} color={theme.colors.primary.main} />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="log-out" size={24} color={theme.colors.error.main} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: theme.colors.error.main }]}>Logout</Text>
            <Text style={styles.menuSubtitle}>Sign out of your account</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Genki TCG</Text>
        <Text style={styles.footerSubtext}>Tournament Management System</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...shadows.sm,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.error.main + '30',
    ...shadows.error,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
});
