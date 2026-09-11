/**
 * Gera o APK de release: `expo prebuild` e depois o Gradle.
 *
 * Em Node em vez de uma linha no package.json porque o wrapper do Gradle tem
 * nome diferente por sistema (`gradlew.bat` no Windows, `./gradlew` no resto) e
 * porque `cd android && ...` depende do shell.
 *
 * Requisitos: JDK 17 e Android SDK. A primeira execução baixa o Gradle e leva
 * vários minutos.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ambienteComJdk } from './jdk.mjs';
import { reexecutarNaRaizCurta } from './caminho-curto.mjs';

// Windows: o compilador nativo recusa caminhos longos. Ver caminho-curto.mjs.
reexecutarNaRaizCurta(import.meta.url);

const require = createRequire(import.meta.url);
const raizDoApp = path.resolve(import.meta.dirname, '..');
const windows = process.platform === 'win32';

/**
 * `shell` só para o gradlew: com shell no Windows o caminho do Node
 * ("C:\Program Files\nodejs\node.exe") é partido no espaço e vira
 * "'C:\Program' não é reconhecido como um comando".
 */
function rodar(comando, args, cwd, { shell = false, env } = {}) {
  const r = spawnSync(comando, args, { cwd, stdio: 'inherit', shell, ...(env ? { env } : {}) });
  if (r.error || r.status !== 0) process.exit(r.status ?? 1);
}

// 1. Gera a pasta android/ a partir do app.json. Descartável, fora do git.
rodar(
  process.execPath,
  [require.resolve('expo/bin/cli'), 'prebuild', '--platform', 'android'],
  raizDoApp,
);

const android = path.join(raizDoApp, 'android');
const gradlew = path.join(android, windows ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradlew)) {
  console.error(`\nO prebuild não gerou ${gradlew}.`);
  process.exit(1);
}

// 2. Compila. Assinado com a keystore de depuração — serve para mesa, não loja.
//    A JDK é verificada antes: o Gradle 8.x não roda em Java 25, e o erro dele
//    não diz qual versão instalar.
// EXPO_NO_METRO_WORKSPACE_ROOT acompanha o Gradle ate o `export:embed`, que ele
// roda como subprocesso. Sem isso o bundle de release procura o entry pela raiz
// do monorepo e falha com `Unable to resolve module ./index.ts`.
rodar(gradlew, ['assembleRelease'], android, {
  shell: windows,
  env: { ...ambienteComJdk(android), EXPO_NO_METRO_WORKSPACE_ROOT: '1' },
});

console.log(
  '\nAPK em: apps/mobile/android/app/build/outputs/apk/release/app-release.apk\n' +
    'Instalar no aparelho conectado:  adb install -r <caminho do apk>\n',
);
