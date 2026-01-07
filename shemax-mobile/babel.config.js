module.exports = function(api) {
  api.cache(true);
  
  const plugins = [
    'react-native-reanimated/plugin',
  ];
  
  // Add react-refresh for web platform in development
  // Using process.env instead of api.env to avoid cache evaluation issues
  if (process.env.NODE_ENV !== 'production') {
    plugins.push('react-refresh/babel');
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};

