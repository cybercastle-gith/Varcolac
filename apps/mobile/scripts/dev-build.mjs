/**
 * Compila e instala o app no aparelho — o "development build".
 *
 * É a saída definitiva do Expo Go. O Expo Go da loja carrega UM SDK por vez, e
 * quando ele atualiza antes do projeto a partida para de abrir com
 * "Project is incompatible with this version of Expo Go" — sem nada de errado
 * no código. O development build É o nosso app: nenhum SDK de terceiro no meio.
 *
 * Custa uma compilação longa na primeira vez. Depois disso o ciclo é igual ao do
 * Expo Go: `pnpm dev:android` recarrega o JavaScript em segundos.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ambienteComJdk } from './jdk.mjs';
import { reexecutarNaRaizCurta } from './caminho-curto.mjs';

// Windows: o compilador nativo recusa caminhos longos. Ver caminho-curto.mjs.
reexecutarNaRaizCurta(import.meta.url);

const require = createRequire(import.meta.url);
const raizDoApp = path.resolve(import.meta.dirname, '..');
const android = path.join(raizDoApp, 'android');

console.log('\nCompilando o app para o aparelho. A primeira vez leva vários minutos.\n');

// Falha cedo e com resposta pronta se a JDK não servir ao Gradle do projeto.
const env = ambienteComJdk(android);

/**
 * `--no-bundler` é a parte que faltava.
 *
 * Sem ele o `run:android` sobe um Metro próprio, na 8081 e anunciando o IP da
 * rede local — ignorando as duas coisas que o `dev-android.mjs` já resolve: que
 * a 8081 pode estar ocupada por outro programa desta máquina, e que a conexão
 * aqui é por cabo (`adb reverse`), não por WiFi. O resultado era o aparelho
 * instalar o app e abrir em
 *
 *     Unable to load script. Make sure you're running Metro...
 *
 * Então este script faz só o que só ele sabe fazer — compilar e instalar — e
 * entrega o servidor para quem ja cuida dele.
 */
const r = spawnSync(
  process.execPath,
  [require.resolve('expo/bin/cli'), 'run:android', '--no-bundler', ...process.argv.slice(2)],
  {
    cwd: raizDoApp,
    stdio: 'inherit',
    shell: false,
    env: { ...env, EXPO_OFFLINE: 'true', EXPO_NO_METRO_WORKSPACE_ROOT: '1' },
  },
);

if (r.status !== 0) process.exit(r.status ?? 1);

console.log('\nApp instalado. Subindo o servidor de desenvolvimento.\n');

// Um comando só: compila, instala e já deixa jogável. O dev-android escolhe a
// porta livre, faz o `adb reverse` e detecta que o app está instalado.
const servidor = spawnSync(process.execPath, [path.join(import.meta.dirname, 'dev-android.mjs')], {
  cwd: raizDoApp,
  stdio: 'inherit',
  shell: false,
});

process.exit(servidor.status ?? 0);
