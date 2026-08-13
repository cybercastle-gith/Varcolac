module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin precisa ser sempre o ÚLTIMO da lista.
    plugins: ['react-native-reanimated/plugin'],
  };
};
