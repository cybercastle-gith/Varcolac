/**
 * Contorna o limite de 260 caracteres do Windows nos builds nativos.
 *
 * O ninja que vem no CMake do Android SDK (1.10.2) recusa qualquer caminho de
 * arquivo objeto com mais de 260 caracteres:
 *
 *     ninja: error: Stat(safeareacontext_autolinked_build/CMakeFiles/
 *     react_codegen_safeareacontext.dir/C_/Users/user/Desktop/Programs/Projetos/
 *     Projeto_Werewolf/node_modules/react-native-safe-area-context/android/build/
 *     generated/source/codegen/jni/react/renderer/components/safeareacontext/
 *     safeareacontextJSI-generated.cpp.o): Filename longer than 260 characters
 *
 * Três coisas que custaram tempo descobrir, e que decidem a solução:
 *
 * 1. A chave LongPathsEnabled do registro já está em 1 nesta máquina e não
 *    adianta: o ninja 1.10.2 não declara `longPathAware` no manifesto, então o
 *    Windows não aplica o long path a ele. Não há o que configurar no sistema.
 * 2. O ninja mede o caminho RELATIVO ao diretório de build (ele entra nele com
 *    `-C`). Por isso mudar `buildStagingDirectory` para algo curto não muda
 *    nada — o que está sendo medido começa depois disso.
 * 3. O que pesa é o caminho absoluto da FONTE, que o CMake embute no nome do
 *    objeto trocando o `:` do drive por `_`. Com as fontes em node_modules na
 *    raiz do monorepo, são 56 caracteres gastos antes de `node_modules/`.
 *
 * Daí a saída: um drive virtual (`subst W: <raiz>`). O prefixo cai de 56 para 2
 * caracteres e o pior caso sai de 298 para 244. Não move o repositório, não
 * exige administrador, e some sozinho ao reiniciar.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const windows = process.platform === 'win32';

/** O maior caminho de objeto medido, descontado o que ele gasta com a raiz. */
const PIOR_CASO_SEM_RAIZ = 242;
const LIMITE = 260;

const subst = (...args) => spawnSync('subst', args, { encoding: 'utf8' });

/** Mapeamentos já existentes, como { 'W:': 'C:/caminho/alvo' }. */
function mapeamentos() {
  const saida = subst().stdout ?? '';
  const mapa = {};
  for (const linha of saida.split(/\r?\n/)) {
    // Uma linha do `subst` tem a forma:  W:\: => C:\caminho\alvo
    const m = linha.match(/^([A-Za-z]:)[\\:]*\s*=>\s*(.+?)\s*$/);
    if (m) mapa[m[1].toUpperCase()] = m[2];
  }
  return mapa;
}

/**
 * Devolve uma raiz curta equivalente a `raiz`, ou a própria `raiz` quando ela
 * já cabe (Linux, ou um projeto guardado perto da raiz do disco).
 */
export function raizCurta(raiz) {
  if (!windows) return raiz;
  if (raiz.length + PIOR_CASO_SEM_RAIZ < LIMITE) return raiz;

  const alvo = path.resolve(raiz);
  const existentes = mapeamentos();

  // Reaproveita um mapeamento nosso: assim o .cxx já configurado continua
  // válido e o build seguinte é incremental.
  for (const [letra, destino] of Object.entries(existentes)) {
    if (path.resolve(destino).toLowerCase() === alvo.toLowerCase()) return letra + path.sep;
  }

  for (const letra of ['W', 'X', 'Y', 'V', 'U', 'T']) {
    const drive = `${letra}:`;
    if (existentes[drive] || existsSync(drive + path.sep)) continue;
    const r = subst(drive, alvo);
    if (r.status === 0) {
      console.log(`  ${drive} -> ${alvo}  (contorna o limite de 260 caracteres do Windows)`);
      return drive + path.sep;
    }
  }

  console.error(
    '\n  Não foi possível criar um drive virtual, e o caminho deste projeto é\n' +
      '  longo demais para o compilador nativo do Android no Windows.\n\n' +
      `      ${alvo}\n\n` +
      '  Saídas: liberar uma letra de drive (W, X, Y, V, U ou T) ou mover o\n' +
      '  projeto para um caminho curto, como C:/werewolf.\n',
  );
  process.exit(1);
}

/**
 * Traduz um caminho de dentro de `raiz` para dentro de `curta`.
 * `C:/.../Projeto_Werewolf/apps/mobile` vira `W:/apps/mobile`.
 */
export function reenraizar(caminho, raiz, curta) {
  return path.join(curta, path.relative(raiz, caminho));
}

/**
 * Relança o próprio script a partir da raiz curta, quando isso for preciso.
 *
 * Vale para os dois builds nativos (`apk` e `dev:build`) e é feito por
 * relançamento, e não por `cwd`, porque quem monta os caminhos das fontes é o
 * autolinking do Expo e o plugin Gradle do React Native: ambos partem do
 * caminho do próprio script. Trocar só o diretório de trabalho deixaria as
 * fontes ainda em `C:` e o ninja voltaria a recusar.
 *
 * O Gradle sobe um daemon por drive. Isso é esperado: o primeiro build no drive
 * novo é completo, os seguintes são incrementais como sempre.
 */
export function reexecutarNaRaizCurta(urlDoScript) {
  const arquivo = fileURLToPath(urlDoScript);
  const raiz = path.resolve(path.dirname(arquivo), '../../..');
  const curta = raizCurta(raiz);

  if (path.resolve(curta) === path.resolve(raiz) || process.env.WEREWOLF_RAIZ_CURTA) return;

  const r = spawnSync(process.execPath, [reenraizar(arquivo, raiz, curta), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, WEREWOLF_RAIZ_CURTA: '1' },
  });
  process.exit(r.status ?? 1);
}
