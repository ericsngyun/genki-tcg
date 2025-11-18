import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface QueueItem {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add access token to requests
    this.client.interceptors.request.use(async (config) => {
      const accessToken = await AsyncStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Handle auth errors and auto-refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(async (token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = data;
            await AsyncStorage.setItem('access_token', accessToken);

            // Retry all queued requests with new token
            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear all tokens and reject queued requests
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];

            await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'auth_token']);
            // TODO: Navigate to login screen
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
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

    // Store both tokens from new format
    if (data.accessToken && data.refreshToken) {
      await AsyncStorage.multiSet([
        ['access_token', data.accessToken],
        ['refresh_token', data.refreshToken],
      ]);
      // Remove old token format if it exists
      await AsyncStorage.removeItem('auth_token');
    }
    // Backward compatibility: if old format is still returned
    else if (data.token) {
      await AsyncStorage.setItem('access_token', data.token);
      await AsyncStorage.removeItem('auth_token');
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

    // Store both tokens from new format
    if (data.accessToken && data.refreshToken) {
      await AsyncStorage.multiSet([
        ['access_token', data.accessToken],
        ['refresh_token', data.refreshToken],
      ]);
      // Remove old token format if it exists
      await AsyncStorage.removeItem('auth_token');
    }
    // Backward compatibility: if old format is still returned
    else if (data.token) {
      await AsyncStorage.setItem('access_token', data.token);
      await AsyncStorage.removeItem('auth_token');
    }

    return data;
  }

  async getMe() {
    const { data} = await this.client.get('/auth/me');
    return data;
  }

  async logout() {
    try {
      // Call backend to revoke refresh token
      await this.client.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if backend call fails
      console.error('Logout error:', error);
    } finally {
      // Clear all tokens from local storage
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'auth_token']);
    }
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

  // Matches - Player Self-Reporting
  async reportMatchResult(matchId: string, result: string, gamesWonA: number, gamesWonB: number) {
    const { data } = await this.client.post(`/matches/${matchId}/report-result`, {
      result,
      gamesWonA,
      gamesWonB,
    });
    return data;
  }

  async confirmMatchResult(matchId: string, confirm: boolean, counterResult?: string, counterGamesWonA?: number, counterGamesWonB?: number) {
    const { data } = await this.client.post(`/matches/${matchId}/confirm-result`, {
      confirm,
      counterResult,
      counterGamesWonA,
      counterGamesWonB,
    });
    return data;
  }

  async getActiveMatch(eventId: string) {
    const { data } = await this.client.get(`/events/${eventId}/my-active-match`);
    return data;
  }

  // Player Drop
  async dropFromEvent(eventId: string, currentRound?: number) {
    const { data } = await this.client.post(`/events/${eventId}/drop`, {
      currentRound,
    });
    return data;
  }
}

export const api = new ApiClient();
