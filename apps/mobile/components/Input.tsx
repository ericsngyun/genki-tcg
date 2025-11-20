import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme } from '../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  containerStyle,
  ...inputProps
}) => {
  const hasError = !!error;
  const inputId = inputProps.accessibilityLabel || label || 'input';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={styles.label}
          accessibilityRole="text"
          nativeID={`${inputId}-label`}
        >
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          inputProps.style,
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        accessibilityLabel={inputProps.accessibilityLabel || label}
        {...inputProps}
      />

      {error && (
        <Text
          style={styles.errorText}
          nativeID={`${inputId}-error`}
        >
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text
          style={styles.helperText}
          accessibilityRole="text"
          nativeID={`${inputId}-helper`}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.base,
  },

  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },

  required: {
    color: theme.colors.error.main,
  },

  input: {
    width: '100%',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.base,
    minHeight: 44, // Accessibility: Minimum touch target
  },

  inputError: {
    borderColor: theme.colors.error.main,
    borderWidth: 2,
  },

  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error.main,
    marginTop: theme.spacing.xs,
  },

  helperText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
