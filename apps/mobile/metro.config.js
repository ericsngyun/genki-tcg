// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Set explicit project root
config.projectRoot = projectRoot;

// Enable CSS support for web
config.resolver.sourceExts.push('css');

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Block watching of non-mobile directories to prevent Metro errors
config.resolver.blockList = [
  // Ignore admin-web build artifacts and node_modules
  /apps\/admin-web\/.next\/.*/,
  /apps\/admin-web\/node_modules\/.*/,
  /apps\/admin-web\/\.turbo\/.*/,

  // Ignore backend directories
  /apps\/backend\/dist\/.*/,
  /apps\/backend\/node_modules\/.*/,
];

// Prioritize mobile's node_modules over monorepo root to avoid React version conflicts
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'), // First priority: local React 19
  path.resolve(monorepoRoot, 'node_modules'), // Fallback: root node_modules
];

// Force React and React-DOM to resolve from mobile's node_modules only
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
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
