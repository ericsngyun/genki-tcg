const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Force single version of React and ReactDOM to prevent hook errors
  const reactPath = path.resolve(__dirname, 'node_modules/react');
  const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom');

  config.resolve.alias = {
    ...config.resolve.alias,
    'react': reactPath,
    'react-dom': reactDomPath,
    'react/jsx-runtime': path.join(reactPath, 'jsx-runtime'),
    'react/jsx-dev-runtime': path.join(reactPath, 'jsx-dev-runtime'),
  };

  // Ensure single React instance
  config.resolve.dedupe = ['react', 'react-dom'];

  // Add fallback for Node.js modules that don't exist in browser
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    vm: require.resolve('vm-browserify'),
  };

  // Provide Buffer and process globals for polyfills
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  );

  return config;
};
