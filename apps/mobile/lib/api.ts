import { logger } from './logger';
import { getFriendlyError } from './errors';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from './secure-storage';

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
      const accessToken = await secureStorage.getItem('access_token');
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
            const refreshToken = await secureStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = data;
            await secureStorage.setItem('access_token', accessToken);

            // Retry all queued requests with new token
            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear all tokens and reject queued requests
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];

            await secureStorage.multiRemove(['access_token', 'refresh_token', 'auth_token']);

            // Token refresh failed - user needs to log in again
            // The app will handle this via error boundaries and auth guards
            logger.warn('Token refresh failed, user needs to re-authenticate');

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Add friendly error message
        const friendlyError = getFriendlyError(error);
        error.friendlyMessage = friendlyError;

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
      await secureStorage.setItem('access_token', data.accessToken);
      await secureStorage.setItem('refresh_token', data.refreshToken);
      // Remove old token format if it exists
      await secureStorage.removeItem('auth_token');
    }
    // Backward compatibility: if old format is still returned
    else if (data.token) {
      await secureStorage.setItem('access_token', data.token);
      await secureStorage.removeItem('auth_token');
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
      await secureStorage.setItem('access_token', data.accessToken);
      await secureStorage.setItem('refresh_token', data.refreshToken);
      // Remove old token format if it exists
      await secureStorage.removeItem('auth_token');
    }
    // Backward compatibility: if old format is still returned
    else if (data.token) {
      await secureStorage.setItem('access_token', data.token);
      await secureStorage.removeItem('auth_token');
    }

    return data;
  }

  async appleLogin(credentials: {
    identityToken: string;
    fullName?: { givenName?: string | null; familyName?: string | null };
    email?: string;
    user: string;
  }) {
    const { data } = await this.client.post('/auth/apple/callback', credentials);

    // Store tokens
    if (data.accessToken && data.refreshToken) {
      await secureStorage.setItem('access_token', data.accessToken);
      await secureStorage.setItem('refresh_token', data.refreshToken);
      await secureStorage.removeItem('auth_token');
    }

    return data;
  }

  async getMe() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async logout() {
    try {
      // Get refresh token to revoke it on backend
      const refreshToken = await secureStorage.getItem('refresh_token');

      // Call backend to revoke refresh token if it exists
      if (refreshToken) {
        await this.client.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Continue with local logout even if backend call fails
      logger.error('Logout error:', error);
    } finally {
      // Clear all tokens from local storage
      await secureStorage.multiRemove(['access_token', 'refresh_token', 'auth_token']);
    }
  }

  /**
   * Permanently delete the user's account and all associated data.
   * This action is irreversible.
   */
  async deleteAccount(): Promise<{ message: string }> {
    const { data } = await this.client.delete('/auth/me');
    // Clear all tokens after successful deletion
    await secureStorage.multiRemove(['access_token', 'refresh_token', 'auth_token']);
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

  // Discord OAuth
  async getDiscordAuthUrl(redirectUri: string) {
    const { data } = await this.client.post('/auth/discord/url', {
      redirectUri,
    });
    return data;
  }

  async handleDiscordCallback(code: string, state: string, redirectUri: string) {
    const { data } = await this.client.post('/auth/discord/callback', {
      code,
      state,
      redirectUri,
    });

    // Store both tokens from response
    if (data.accessToken && data.refreshToken) {
      await secureStorage.setItem('access_token', data.accessToken);
      await secureStorage.setItem('refresh_token', data.refreshToken);
      await secureStorage.removeItem('auth_token');
    }

    return data;
  }

  async linkDiscordAccount(code: string, redirectUri: string) {
    const { data } = await this.client.post('/auth/discord/link', {
      code,
      redirectUri,
    });
    return data;
  }

  async unlinkDiscordAccount() {
    const { data } = await this.client.post('/auth/discord/unlink');
    return data;
  }

  // Notifications
  async getNotifications(params?: { status?: string; type?: string; limit?: number; offset?: number }) {
    const { data } = await this.client.get('/notifications', { params });
    return data;
  }

  async getUnreadCount() {
    const { data } = await this.client.get('/notifications/unread-count');
    return data;
  }

  async markNotificationsAsRead(ids: string[]) {
    const { data } = await this.client.patch('/notifications/read', { ids });
    return data;
  }

  async markAllNotificationsAsRead() {
    const { data } = await this.client.patch('/notifications/read-all');
    return data;
  }

  async deleteNotification(id: string) {
    const { data } = await this.client.delete(`/notifications/${id}`);
    return data;
  }

  async getNotificationPreferences() {
    const { data } = await this.client.get('/notifications/preferences');
    return data;
  }

  async updateNotificationPreference(
    notificationType: string,
    preferences: { enableInApp?: boolean; enablePush?: boolean; enableEmail?: boolean }
  ) {
    const { data } = await this.client.patch('/notifications/preferences', {
      notificationType,
      ...preferences,
    });
    return data;
  }

  async registerPushToken(token: string, platform: 'IOS' | 'ANDROID' | 'WEB') {
    const { data } = await this.client.post('/notifications/tokens', {
      token,
      platform,
    });
    return data;
  }

  async unregisterPushToken(token: string) {
    const { data } = await this.client.delete(`/notifications/tokens/${token}`);
    return data;
  }

  // Leaderboard
  async getLifetimeLeaderboard(gameType: string, params?: { limit?: number; offset?: number }) {
    const { data } = await this.client.get('/leaderboard/lifetime', {
      params: {
        gameType,
        ...params,
      },
    });
    return data;
  }

  // Player Stats & Profile
  async getMyRanks() {
    const { data } = await this.client.get('/ratings/me/ranks');
    return data;
  }

  async getMyLifetimeRatings() {
    const { data } = await this.client.get('/ratings/me/lifetime');
    return data;
  }

  async getPlayerRanks(playerId: string) {
    const { data } = await this.client.get(`/ratings/players/${playerId}/ranks`);
    return data;
  }

  async getMyRatingHistory(gameType?: string) {
    const { data } = await this.client.get('/ratings/me/history', {
      params: { gameType },
    });
    return data;
  }

  async getMyEvents(params?: { status?: string; limit?: number; offset?: number }) {
    const { data } = await this.client.get('/events/me', { params });
    return data;
  }

  async getMyMatches(eventId: string) {
    const { data } = await this.client.get(`/events/${eventId}/my-matches`);
    return data;
  }

  async getMyTournamentHistory(params?: { limit?: number; offset?: number }) {
    const { data } = await this.client.get('/events/me/history', { params });
    return data;
  }

  async updateProfile(updates: { name?: string; avatarUrl?: string }) {
    const { data } = await this.client.patch('/auth/me', updates);
    return data;
  }
}

export const api = new ApiClient();
