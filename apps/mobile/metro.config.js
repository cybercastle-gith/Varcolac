const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projeto = __dirname;
const raiz = path.resolve(projeto, '../..');

const config = getDefaultConfig(projeto);

// Mantém as pastas padrão do Expo e adiciona a raiz do monorepo.
config.watchFolders = [
  ...(config.watchFolders || []),
  raiz,
];

// Procura módulos tanto no app quanto na raiz do workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projeto, 'node_modules'),
  path.resolve(raiz, 'node_modules'),
];

module.exports = config;