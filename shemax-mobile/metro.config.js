// Always use default Expo config in development to avoid Sentry constructor errors
// Only use Sentry metro config in production builds
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

let config = getDefaultConfig(__dirname);

// Only add Sentry config in production builds
if (process.env.NODE_ENV === 'production' && !__DEV__) {
  try {
    const { getSentryExpoConfig } = require("@sentry/react-native/metro");
    config = getSentryExpoConfig(__dirname);
    console.log('Using Sentry metro config for production build');
  } catch (error) {
    console.warn('Sentry metro config not available, using default Expo config');
  }
} else {
  console.log('Using default Expo metro config (development mode)');
}

// Fix for monorepo: ensure React and other critical packages resolve from mobile/node_modules
// This prevents the "Invalid hook call" error caused by multiple React copies
const mobileNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '..', 'node_modules');

// Ensure mobile's node_modules takes priority for critical packages
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  rootNodeModules,
];

// Block the root's React/React Native from being used to prevent duplicate copies
config.resolver.blockList = [
  new RegExp(`^${rootNodeModules.replace(/\\/g, '\\\\')}[\\\\/]react[\\\\/].*`),
  new RegExp(`^${rootNodeModules.replace(/\\/g, '\\\\')}[\\\\/]react-native[\\\\/].*`),
  new RegExp(`^${rootNodeModules.replace(/\\/g, '\\\\')}[\\\\/]react-dom[\\\\/].*`),
];

// Extra node modules to resolve from mobile directory
config.resolver.extraNodeModules = {
  'react': path.resolve(mobileNodeModules, 'react'),
  'react-native': path.resolve(mobileNodeModules, 'react-native'),
  'react-dom': path.resolve(mobileNodeModules, 'react-dom'),
};

module.exports = config;