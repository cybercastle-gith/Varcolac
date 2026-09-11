// Metro em monorepo: sem isto, o bundler não enxerga packages/engine.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const fs = require('node:fs');

const projeto = __dirname;
const raiz = path.resolve(projeto, '../..');

const config = getDefaultConfig(projeto);

// Mantém as pastas padrão do Expo e adiciona a raiz do monorepo.
config.watchFolders = [...(config.watchFolders || []), raiz];

// Procura módulos tanto no app quanto na raiz do workspace.
config.resolver.nodeModulesPaths = [
  path.resolve(projeto, 'node_modules'),
  path.resolve(raiz, 'node_modules'),
];



/**
 * Os pacotes do monorepo são resolvidos por caminho, e não pelo link do pnpm.
 *
 * O link que o pnpm cria em `apps/mobile/node_modules/@jogo/engine` guarda o
 * caminho absoluto de origem. Isso basta no dia a dia, mas quebra no build
 * nativo do Windows, que roda a partir de um drive virtual (`subst`) para caber
 * no limite de 260 caracteres — ver `scripts/caminho-curto.mjs`. O link leva a
 * resolução de volta para `C:`, fora das raízes do bundler, e o Metro recusa:
 *
 *     Unable to resolve module @jogo/engine from W:/apps/mobile/src/...
 *
 * Apontar direto para a pasta mantém tudo no mesmo drive, seja ele qual for.
 */
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...Object.fromEntries(
    fs
      .readdirSync(path.join(raiz, 'packages'))
      .map((pasta) => path.join(raiz, 'packages', pasta))
      .filter((dir) => fs.existsSync(path.join(dir, 'package.json')))
      .map((dir) => [JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name, dir]),
  ),
};

module.exports = config;
