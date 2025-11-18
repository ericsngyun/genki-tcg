import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add access token to requests
    this.client.interceptors.request.use((config) => {
      const accessToken = localStorage.getItem('access_token');
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

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token');
            }

            // Call refresh endpoint
            const { data } = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = data;

            // Save new access token
            localStorage.setItem('access_token', accessToken);

            // Retry all queued requests
            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';

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
    // New token format: accessToken + refreshToken
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
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
    // New token format: accessToken + refreshToken
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    return data;
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // Revoke refresh token on server
        await this.client.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore errors during logout
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async getMe() {
    const { data } = await this.client.get('/auth/me');
    return data;
  }

  async forgotPassword(email: string) {
    const { data } = await this.client.post('/auth/forgot-password', {
      email,
    });
    return data;
  }

  async resetPassword(token: string, newPassword: string) {
    const { data } = await this.client.post('/auth/reset-password', {
      token,
      newPassword,
    });
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

  async createEvent(eventData: any) {
    const { data } = await this.client.post('/events', eventData);
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

  async checkInEntry(entryId: string) {
    const { data } = await this.client.post(`/events/entries/${entryId}/check-in`);
    return data;
  }

  async markEntryAsPaid(entryId: string, amount?: number) {
    const { data } = await this.client.post(`/events/entries/${entryId}/mark-paid`, {
      amount,
    });
    return data;
  }

  async distributePrizes(eventId: string, distributions: Array<{ userId: string; amount: number; placement: number }>) {
    const { data } = await this.client.post(`/events/${eventId}/distribute-prizes`, {
      distributions,
    });
    return data;
  }

  async dropPlayer(entryId: string, currentRound?: number) {
    const { data } = await this.client.post(`/events/entries/${entryId}/drop`, {
      currentRound,
    });
    return data;
  }

  async updateEvent(eventId: string, eventData: any) {
    const { data } = await this.client.patch(`/events/${eventId}`, eventData);
    return data;
  }

  async addLatePlayer(eventId: string, userId: string) {
    const { data} = await this.client.post(`/events/${eventId}/add-late-player`, {
      userId,
    });
    return data;
  }

  async getMyMatches(eventId: string) {
    const { data } = await this.client.get(`/events/${eventId}/my-matches`);
    return data;
  }

  // Rounds
  async createNextRound(eventId: string) {
    const { data } = await this.client.post(`/rounds/events/${eventId}/next`);
    return data;
  }

  async getPairings(roundId: string) {
    const { data } = await this.client.get(`/rounds/${roundId}/pairings`);
    return data;
  }

  // Matches
  async reportMatchResult(matchId: string, result: string, gamesWonA: number, gamesWonB: number) {
    const { data } = await this.client.post('/matches/report', {
      matchId,
      result,
      gamesWonA,
      gamesWonB,
    });
    return data;
  }

  async overrideMatchResult(matchId: string, result: string, gamesWonA: number, gamesWonB: number) {
    const { data } = await this.client.post(`/matches/${matchId}/override`, {
      result,
      gamesWonA,
      gamesWonB,
    });
    return data;
  }

  // Standings
  async getStandings(eventId: string) {
    const { data } = await this.client.get(`/standings/events/${eventId}`);
    return data;
  }

  async exportStandings(eventId: string) {
    // Use proper authentication via headers instead of URL
    const response = await this.client.get(`/standings/events/${eventId}/export`, {
      responseType: 'blob',
    });

    // Create download programmatically
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `standings-${eventId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Decklists
  async submitDecklist(entryId: string, deckName?: string, mainDeckUrl?: string) {
    const { data } = await this.client.post('/decklists', {
      entryId,
      deckName,
      mainDeckUrl,
    });
    return data;
  }

  async getMyDecklist(entryId: string) {
    const { data } = await this.client.get(`/decklists/entry/${entryId}`);
    return data;
  }

  async getDecklistsForEvent(eventId: string) {
    const { data } = await this.client.get(`/decklists/event/${eventId}`);
    return data;
  }

  async lockDecklist(entryId: string) {
    const { data } = await this.client.post(`/decklists/entry/${entryId}/lock`);
    return data;
  }

  async lockAllDecklists(eventId: string) {
    const { data } = await this.client.post(`/decklists/event/${eventId}/lock-all`);
    return data;
  }

  // Credits
  async getMyBalance() {
    const { data } = await this.client.get('/credits/me');
    return data;
  }

  async getUserBalance(userId: string) {
    const { data } = await this.client.get(`/credits/balance/${userId}`);
    return data;
  }

  async getUserTransactionHistory(userId: string, params?: { limit?: number; cursor?: string; reasonCode?: string; startDate?: string; endDate?: string }) {
    const { data } = await this.client.get(`/credits/history/${userId}`, { params });
    return data;
  }

  async exportUserCreditsHistory(userId: string, params?: { reasonCode?: string; startDate?: string; endDate?: string }) {
    return await this.client.get(`/credits/history/${userId}/export`, {
      params,
      responseType: 'text',
    });
  }

  async getAllUserBalances() {
    const { data } = await this.client.get('/credits/all-balances');
    return data;
  }

  async adjustCredits(userId: string, amount: number, reasonCode: string, memo?: string) {
    const { data } = await this.client.post('/credits/adjust', {
      userId,
      amount,
      reasonCode,
      memo,
    });
    return data;
  }

  async redeemCredits(userId: string, amount: number, memo?: string) {
    const { data} = await this.client.post('/credits/redeem', {
      userId,
      amount,
      memo,
    });
    return data;
  }

  async bulkAdjustCredits(adjustments: Array<{ userId: string; amount: number; memo?: string }>, reasonCode: string, globalMemo?: string, relatedEventId?: string) {
    const { data } = await this.client.post('/credits/bulk-adjust', {
      adjustments,
      reasonCode,
      globalMemo,
      relatedEventId,
    });
    return data;
  }

  async getCreditAnalytics(params?: { period?: string; startDate?: string; endDate?: string }) {
    const { data } = await this.client.get('/credits/analytics', { params });
    return data;
  }

  // Reward Templates
  async getRewardTemplates(activeOnly: boolean = false) {
    const { data } = await this.client.get('/credits/templates', {
      params: { activeOnly: activeOnly ? 'true' : 'false' },
    });
    return data;
  }

  async getRewardTemplate(templateId: string) {
    const { data } = await this.client.get(`/credits/templates/${templateId}`);
    return data;
  }

  async createRewardTemplate(template: { name: string; description?: string; amount: number; reasonCode: string; isActive?: boolean }) {
    const { data } = await this.client.post('/credits/templates', template);
    return data;
  }

  async updateRewardTemplate(templateId: string, updates: { name?: string; description?: string; amount?: number; reasonCode?: string; isActive?: boolean }) {
    const { data } = await this.client.put(`/credits/templates/${templateId}`, updates);
    return data;
  }

  async deleteRewardTemplate(templateId: string) {
    const { data } = await this.client.delete(`/credits/templates/${templateId}`);
    return data;
  }

  async applyRewardTemplate(templateId: string, userId: string, memo?: string) {
    const { data } = await this.client.post('/credits/templates/apply', {
      templateId,
      userId,
      memo,
    });
    return data;
  }

  async bulkApplyRewardTemplate(templateId: string, userIds: string[], globalMemo?: string) {
    const { data } = await this.client.post('/credits/templates/bulk-apply', {
      templateId,
      userIds,
      globalMemo,
    });
    return data;
  }

  // Org
  async getOrg() {
    const { data } = await this.client.get('/orgs/me');
    return data;
  }

  async getOrgUsers(search?: string) {
    const { data } = await this.client.get('/orgs/users', {
      params: { search },
    });
    return data;
  }
}

export const api = new ApiClient();
