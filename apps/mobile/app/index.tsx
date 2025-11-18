import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check for both new and old token formats
      const accessToken = await AsyncStorage.getItem('access_token');
      const oldToken = await AsyncStorage.getItem('auth_token');

      if (accessToken || oldToken) {
        // Migrate old token to new format if needed
        if (oldToken && !accessToken) {
          await AsyncStorage.setItem('access_token', oldToken);
          await AsyncStorage.removeItem('auth_token');
        }
        router.replace('/events');
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
