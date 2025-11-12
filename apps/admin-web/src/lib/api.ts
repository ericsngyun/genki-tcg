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

  // Rounds
  async createNextRound(eventId: string) {
    const { data } = await this.client.post(`/rounds/events/${eventId}/next`);
    return data;
  }

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

  async getUserBalance(userId: string) {
    const { data } = await this.client.get(`/credits/balance/${userId}`);
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
