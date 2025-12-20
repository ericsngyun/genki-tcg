import axios from 'axios';
import { api } from '../../lib/api';
import { secureStorage } from '../../lib/secure-storage';

// Mock dependencies
jest.mock('axios');
jest.mock('../../lib/secure-storage');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
        },
      };

      mockedAxios.create = jest.fn(() => ({
        ...mockedAxios,
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      }) as any);

      const result = await api.login('test@example.com', 'password123');

      expect(result).toEqual(mockResponse.data);
      expect(mockedSecureStorage.setItem).toHaveBeenCalledWith('access_token', 'test-access-token');
      expect(mockedSecureStorage.setItem).toHaveBeenCalledWith('refresh_token', 'test-refresh-token');
    });

    it('should handle login errors', async () => {
      mockedAxios.create = jest.fn(() => ({
        ...mockedAxios,
        post: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      }) as any);

      await expect(api.login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Token Management', () => {
    it('should store tokens securely after successful signup', async () => {
      const mockResponse = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          user: { id: '2', name: 'New User', email: 'new@example.com' },
        },
      };

      mockedAxios.create = jest.fn(() => ({
        ...mockedAxios,
        post: jest.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      }) as any);

      await api.signup('new@example.com', 'password123', 'New User', 'INVITE123');

      expect(mockedSecureStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(mockedSecureStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    });

    it('should clear tokens on logout', async () => {
      mockedSecureStorage.getItem.mockResolvedValue('test-refresh-token');
      mockedAxios.create = jest.fn(() => ({
        ...mockedAxios,
        post: jest.fn().mockResolvedValue({}),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      }) as any);

      await api.logout();

      expect(mockedSecureStorage.multiRemove).toHaveBeenCalledWith([
        'access_token',
        'refresh_token',
        'auth_token',
      ]);
    });
  });
});
