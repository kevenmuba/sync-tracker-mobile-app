// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for @supabase/supabase-js: Metro needs to resolve the package exports
// that Supabase uses for its sub-packages (storage-js, realtime-js, etc.)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
