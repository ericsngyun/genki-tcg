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
  if (moduleName === 'react') {
    // Main React package
    return context.resolveRequest(context, reactPath, platform);
  }

  if (moduleName.startsWith('react/')) {
    // React subpath imports (jsx-runtime, jsx-dev-runtime, etc.)
    const subpath = moduleName.slice('react/'.length);
    return context.resolveRequest(context, path.join(reactPath, subpath), platform);
  }

  if (moduleName === 'react-dom') {
    // Main ReactDOM package
    return context.resolveRequest(context, reactDomPath, platform);
  }

  if (moduleName.startsWith('react-dom/')) {
    // ReactDOM subpath imports
    const subpath = moduleName.slice('react-dom/'.length);
    return context.resolveRequest(context, path.join(reactDomPath, subpath), platform);
  }

  // Default resolver for everything else
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
