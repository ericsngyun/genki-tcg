import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // TODO: Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', {
      email,
      password,
    });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  async signup(email: string, password: string, name: string, inviteCode: string) {
    const { data } = await this.client.post('/auth/signup', {
      email,
      password,
      name,
      inviteCode,
    });
    if (data.token) {
      await AsyncStorage.setItem('auth_token', data.token);
    }
    return data;
  }

  async getMe() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  // Events
  async getEvents(status?: string) {
    const { data } = await this.client.get('/events', {
      params: { status },
    });
    return data;
  }

  async getEvent(id: string) {
    const { data } = await this.client.get(`/events/${id}`);
    return data;
  }

  async registerForEvent(eventId: string) {
    const { data } = await this.client.post(`/events/${eventId}/register`);
    return data;
  }

  async selfCheckIn(eventId: string) {
    const { data } = await this.client.post(`/events/${eventId}/self-check-in`);
    return data;
  }

  // Pairings
  async getPairings(roundId: string) {
    const { data } = await this.client.get(`/rounds/${roundId}/pairings`);
    return data;
  }

  // Standings
  async getStandings(eventId: string) {
    const { data } = await this.client.get(`/standings/events/${eventId}`);
    return data;
  }

  // Credits
  async getMyBalance() {
    const { data } = await this.client.get('/credits/me');
    return data;
  }
}

export const api = new ApiClient();
