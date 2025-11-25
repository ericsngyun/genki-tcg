// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.resolver.sourceExts.push('css');

// CRITICAL: Force single React instance by resolving to exact paths
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const reactPath = path.resolve(__dirname, 'node_modules/react');
  const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');

  // Force all React imports to use the same instance
  if (moduleName === 'react') {
    return context.resolveRequest(context, reactPath, platform);
  }

  if (moduleName.startsWith('react/')) {
    const subpath = moduleName.slice('react/'.length);
    return context.resolveRequest(context, path.join(reactPath, subpath), platform);
  }

  if (moduleName === 'react-dom') {
    return context.resolveRequest(context, reactDomPath, platform);
  }

  if (moduleName.startsWith('react-dom/')) {
    const subpath = moduleName.slice('react-dom/'.length);
    return context.resolveRequest(context, path.join(reactDomPath, subpath), platform);
  }

  // Default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

// SVG transformer support
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Add SVG to source extensions
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
