// Fix for Expo Router SDK 50 - Set APP_ROOT before config
process.env.EXPO_ROUTER_APP_ROOT = __dirname + '/app';

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
