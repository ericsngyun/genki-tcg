import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Genki TCG</Text>
        <Text style={styles.subtitle}>One Piece TCG Tournaments</Text>
      </View>

      <View style={styles.menu}>
        <Link href="/events" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📅</Text>
            <Text style={styles.menuText}>Events</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/wallet" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={styles.menuText}>Credits</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>Standings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Setup required: Configure API URL in .env
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: '#4F46E5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  menu: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#1E40AF',
    textAlign: 'center',
  },
});
