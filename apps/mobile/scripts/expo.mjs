/**
 * Chama o CLI do Expo com EXPO_OFFLINE ligado, em qualquer sistema.
 *
 * Sem isso o CLI trava com "TypeError: fetch failed" ao consultar a tabela de
 * versões do SDK. O projeto é offline por definição; a checagem online só
 * reconfere o que o `expo-doctor` já valida localmente.
 *
 * Uso:  node scripts/expo.mjs start --web
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const expo = spawn(process.execPath, [require.resolve('expo/bin/cli'), ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_OFFLINE: 'true' },
});

expo.on('exit', (code) => process.exit(code ?? 0));
