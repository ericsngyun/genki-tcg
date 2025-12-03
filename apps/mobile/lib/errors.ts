/**
 * User-Friendly Error Messages
 *
 * Translates technical errors into human-readable messages
 */

export interface FriendlyError {
  title: string;
  message: string;
  action?: string;
}

/**
 * Convert an error into a user-friendly message
 */
export function getFriendlyError(error: any): FriendlyError {
  // Network errors
  if (error.message?.includes('Network request failed')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      action: 'Retry',
    };
  }

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      action: 'Retry',
    };
  }

  // HTTP status codes
  if (error.response?.status) {
    const status = error.response.status;

    switch (status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: error.response.data?.message || 'The information provided is invalid. Please check and try again.',
        };

      case 401:
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          action: 'Log In',
        };

      case 403:
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
        };

      case 404:
        return {
          title: 'Not Found',
          message: error.response.data?.message || 'The requested resource could not be found.',
        };

      case 409:
        return {
          title: 'Conflict',
          message: error.response.data?.message || 'This action conflicts with existing data.',
        };

      case 429:
        return {
          title: 'Too Many Requests',
          message: 'You\'re making requests too quickly. Please wait a moment and try again.',
          action: 'Wait',
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Our team has been notified. Please try again later.',
          action: 'Retry',
        };

      default:
        return {
          title: 'Error',
          message: error.response.data?.message || 'An unexpected error occurred. Please try again.',
          action: 'Retry',
        };
    }
  }

  // Validation errors (from backend)
  if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
    return {
      title: 'Validation Error',
      message: error.response.data.message.join(', '),
    };
  }

  // Default error
  return {
    title: 'Something Went Wrong',
    message: error.message || 'An unexpected error occurred. Please try again.',
    action: 'Retry',
  };
}

/**
 * Common error messages for specific features
 */
export const ErrorMessages = {
  // Authentication
  LOGIN_FAILED: {
    title: 'Login Failed',
    message: 'Invalid email or password. Please try again.',
  },
  SIGNUP_FAILED: {
    title: 'Signup Failed',
    message: 'Unable to create your account. Please try again.',
  },
  INVALID_INVITE_CODE: {
    title: 'Invalid Invite Code',
    message: 'The invite code you entered is not valid. Please check and try again.',
  },

  // Events
  EVENT_REGISTRATION_FAILED: {
    title: 'Registration Failed',
    message: 'Unable to register for this event. Please try again.',
  },
  EVENT_CHECK_IN_FAILED: {
    title: 'Check-In Failed',
    message: 'Unable to check in. Please contact event staff.',
  },
  EVENT_NOT_FOUND: {
    title: 'Event Not Found',
    message: 'This event could not be found. It may have been cancelled.',
  },

  // Matches
  MATCH_REPORT_FAILED: {
    title: 'Report Failed',
    message: 'Unable to report match result. Please try again or contact tournament staff.',
  },
  INVALID_MATCH_RESULT: {
    title: 'Invalid Result',
    message: 'The match result you entered is invalid. Please check and try again.',
  },

  // Credits
  INSUFFICIENT_CREDITS: {
    title: 'Insufficient Credits',
    message: 'You don\'t have enough credits for this action.',
  },

  // General
  GENERIC_ERROR: {
    title: 'Error',
    message: 'Something went wrong. Please try again.',
    action: 'Retry',
  },
};
