import { getFriendlyError, ErrorMessages } from '../../lib/errors';

describe('Error Handling', () => {
  describe('getFriendlyError', () => {
    it('should handle network errors', () => {
      const error = { message: 'Network request failed' };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Connection Error');
      expect(result.message).toContain('Unable to connect');
      expect(result.action).toBe('Retry');
    });

    it('should handle 401 unauthorized errors', () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Session Expired');
      expect(result.action).toBe('Log In');
    });

    it('should handle 404 not found errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Event not found' },
        },
      };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Not Found');
      expect(result.message).toBe('Event not found');
    });

    it('should handle 500 server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Server Error');
      expect(result.action).toBe('Retry');
    });

    it('should handle validation errors', () => {
      const error = {
        response: {
          data: {
            message: ['Email is required', 'Password is too short'],
          },
        },
      };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Validation Error');
      expect(result.message).toContain('Email is required');
      expect(result.message).toContain('Password is too short');
    });

    it('should handle unknown errors gracefully', () => {
      const error = { message: 'Something weird happened' };
      const result = getFriendlyError(error);

      expect(result.title).toBe('Something Went Wrong');
      expect(result.message).toContain('Something weird happened');
    });
  });

  describe('ErrorMessages', () => {
    it('should have login failed message', () => {
      expect(ErrorMessages.LOGIN_FAILED.title).toBe('Login Failed');
      expect(ErrorMessages.LOGIN_FAILED.message).toContain('Invalid email or password');
    });

    it('should have event not found message', () => {
      expect(ErrorMessages.EVENT_NOT_FOUND.title).toBe('Event Not Found');
    });

    it('should have insufficient credits message', () => {
      expect(ErrorMessages.INSUFFICIENT_CREDITS.title).toBe('Insufficient Credits');
    });
  });
});
