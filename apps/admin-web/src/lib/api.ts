import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
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
      localStorage.setItem('auth_token', data.token);
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
      localStorage.setItem('auth_token', data.token);
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
    const { data } = await this.client.post('/credits/redeem', {
      userId,
      amount,
      memo,
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
