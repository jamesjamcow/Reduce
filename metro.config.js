const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'sql'];

module.exports = withNativeWind(config, { input: './global.css' });
