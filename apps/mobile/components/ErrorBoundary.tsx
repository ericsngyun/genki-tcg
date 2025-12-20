import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { shadows } from '../lib/shadows';
import { Sentry } from '../lib/sentry';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to Sentry (wrapped in try-catch in case Sentry isn't initialized yet)
    try {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    } catch (sentryError) {
      logger.warn('Could not send error to Sentry:', sentryError);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="bug-outline" size={64} color={theme.colors.error.main} />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>

            <Text style={styles.message}>
              We're sorry for the inconvenience. The error has been reported to our team.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                <Text style={styles.errorText}>{this.state.error.stack}</Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 24,
    ...shadows.sm,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.error.main,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  button: {
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    ...shadows.md,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.foreground,
  },
});
