// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.resolver.sourceExts.push('css');

// CRITICAL: Force single React instance by resolving to exact paths
// This prevents "Invalid hook call" errors from duplicate React
const reactPath = path.resolve(__dirname, 'node_modules/react');
const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force all React imports to use the same instance
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    return {
      filePath: path.join(reactPath, moduleName.replace('react/', '')),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'react-dom' || moduleName.startsWith('react-dom/')) {
    return {
      filePath: path.join(reactDomPath, moduleName.replace('react-dom/', '')),
      type: 'sourceFile',
    };
  }

  // Default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure require.context is enabled for expo-router
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
