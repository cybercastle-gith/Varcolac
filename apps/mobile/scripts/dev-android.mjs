/**
 * Sobe o Metro para desenvolvimento no celular por cabo USB.
 *
 * Existe como script em Node, e não como uma linha no package.json, por quatro
 * motivos concretos que já custaram tempo aqui:
 *
 * 1. `set VAR=1 && cmd` no cmd.exe captura o espaço antes do `&&`, e o valor
 *    vira "1 " — o getenv do Expo recusa com "GetEnv.NoBoolean: 1  is not a
 *    boolean". `VAR=1 cmd` (sintaxe POSIX) não existe no Windows. Não há uma
 *    linha só que funcione nos dois sistemas.
 * 2. `--offline` é mutuamente exclusivo com `--localhost` no CLI, mas a
 *    variável EXPO_OFFLINE faz o mesmo por outro caminho e convive com ele.
 * 3. A porta precisa ser verificada ANTES de subir. Ver `portaLivre`.
 * 4. Se o nosso app já estiver instalado no aparelho, é nele que o Metro deve
 *    conectar — e não no Expo Go. Ver `instalado`.
 *
 * EXPO_OFFLINE existe porque o CLI trava com "TypeError: fetch failed" ao
 * buscar a tabela de versões do SDK. Nada aqui precisa da rede: um aparelho,
 * cabo USB, adb reverse, sem backend.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const require = createRequire(import.meta.url);
const windows = process.platform === 'win32';
const raizDoApp = path.resolve(import.meta.dirname, '..');
const PORTA_PADRAO = Number(process.env.RCT_METRO_PORT ?? 8081);

const appJson = JSON.parse(readFileSync(path.join(raizDoApp, 'app.json'), 'utf8'));
const PACOTE = appJson.expo?.android?.package ?? 'com.projeto.werewolf';
const SDK = JSON.parse(readFileSync(path.join(raizDoApp, 'package.json'), 'utf8'))
  .dependencies.expo.replace(/[^\d.]/g, '')
  .split('.')[0];

/**
 * Testa a porta em 127.0.0.1 — o mesmo caminho IPv4 que o `adb reverse` usa.
 *
 * Isto não é zelo excessivo. Nesta máquina o Apache do EnterpriseDB escuta em
 * 0.0.0.0:8081 (IPv4) enquanto o Metro escutava em :::8081 (IPv6). Os dois
 * sobem sem erro, mas o aparelho, que fala IPv4, recebia o HTML do Apache em
 * vez do manifesto — e o Expo Go morria com "failed to construct manifest from
 * response". Um conflito de porta que não se anuncia como conflito de porta.
 */
function portaLivre(porta) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: porta, host: '127.0.0.1' });
    const encerrar = (livre) => {
      socket.destroy();
      resolve(livre);
    };
    socket.setTimeout(700);
    socket.once('connect', () => encerrar(false));
    socket.once('timeout', () => encerrar(true));
    socket.once('error', () => encerrar(true));
  });
}

async function escolherPorta() {
  for (let porta = PORTA_PADRAO; porta < PORTA_PADRAO + 20; porta++) {
    if (await portaLivre(porta)) {
      if (porta !== PORTA_PADRAO) {
        console.log(
          `\nA porta ${PORTA_PADRAO} já está ocupada por outro programa. Usando ${porta}.\n` +
            `Para ver quem ocupa:  Get-NetTCPConnection -LocalPort ${PORTA_PADRAO} -State Listen\n`,
        );
      }
      return porta;
    }
  }
  console.error(`\nNenhuma porta livre entre ${PORTA_PADRAO} e ${PORTA_PADRAO + 19}.`);
  process.exit(1);
}

const adb = (...args) =>
  spawnSync('adb', args, { encoding: 'utf8', shell: windows });

/** Um pacote está instalado no aparelho? */
function instalado(pacote) {
  const r = adb('shell', 'pm', 'list', 'packages', pacote);
  return (r.stdout ?? '').includes(pacote);
}

const porta = await escolherPorta();
const temApp = instalado(PACOTE);

/**
 * A porta do lado do APARELHO e sempre 8081.
 *
 * Um app de debug do React Native procura o servidor em `localhost:8081` e so
 * ai — o numero esta cravado no framework, e a propria mensagem de erro dele
 * diz isso:
 *
 *     The device must either be USB connected (with bundler set to
 *     "localhost:8081")...
 *
 * Quando a 8081 do PC esta ocupada por outro programa, mudar o Metro de porta
 * nao adianta: o app continua batendo na 8081, recebe a resposta do outro
 * programa e cai para o bundle embutido, que no debug nao existe —
 * `Unable to load script`.
 *
 * O `adb reverse` aceita portas diferentes dos dois lados. Entao o aparelho
 * continua pedindo 8081, e o tunel entrega isso na porta em que o Metro
 * realmente subiu. Ninguem precisa liberar a 8081 do PC, nem ser administrador.
 */
const PORTA_APARELHO = 8081;

// O adb reverse se perde a cada reconexao do aparelho, entao e refeito sempre.
const reverse = adb('reverse', `tcp:${PORTA_APARELHO}`, `tcp:${porta}`);
if (reverse.error || reverse.status !== 0) {
  console.error(
    '\nFalhou o `adb reverse`. Verifique:\n' +
      '  adb devices          -> o aparelho deve aparecer como "device", nao "unauthorized"\n' +
      '  cabo em modo Transferencia de arquivos (MTP), nao "apenas carregamento"\n' +
      '  Depuracao USB ligada nas Opcoes do desenvolvedor\n',
  );
  process.exit(1);
}
console.log(
  porta === PORTA_APARELHO
    ? `  adb reverse tcp:${PORTA_APARELHO} ok`
    : `  adb reverse tcp:${PORTA_APARELHO} (aparelho) -> tcp:${porta} (Metro) ok`,
);

if (!temApp) {
  // Sem o nosso app, resta o Expo Go. Se ele tambem nao estiver la, o CLI morre
  // com "Expo Go is not installed on device", que nao diz o que fazer a seguir.
  if (!instalado('host.exp.exponent')) {
    console.error(
      '\n  O aparelho nao tem nem o app nem o Expo Go instalado.\n\n' +
        '  Compile o app uma vez e o problema acaba aqui:\n\n' +
        '      pnpm dev:build\n\n' +
        `  (Alternativa: instalar o Expo Go do SDK ${SDK} —\n` +
        `   https://expo.dev/go?sdkVersion=${SDK}&platform=android&device=true )\n`,
    );
    process.exit(1);
  }

  // O Expo Go le a porta da URL que recebe, entao para ele os dois lados
  // precisam bater.
  adb('reverse', `tcp:${porta}`, `tcp:${porta}`);
  console.log(
    `\n  Usando o Expo Go. Ele precisa ser a versao do SDK ${SDK} — a da loja\n` +
      '  acompanha o SDK mais novo e recusa projetos mais antigos com\n' +
      '  "Project is incompatible with this version of Expo Go".\n\n' +
      `    Expo Go do SDK ${SDK}:  https://expo.dev/go?sdkVersion=${SDK}&platform=android&device=true\n` +
      '    ou, de vez:            pnpm dev:build   (compila o app e dispensa o Expo Go)\n',
  );
}

/**
 * Abrir o app e por nossa conta quando ele esta instalado.
 *
 * O `--android` do Expo abre um deep link `werewolf://expo-development-client`,
 * que so funciona com o pacote `expo-dev-client` — que este projeto nao usa. O
 * app nao entende esse link, nada acontece, e o Metro fica esperando um pedido
 * que nunca chega. Um `am start` comum resolve: o app sobe e busca o bundle na
 * 8081 dele, que o tunel acima ja aponta para o lugar certo.
 */
async function abrirApp() {
  for (let tentativa = 0; tentativa < 60; tentativa++) {
    const pronto = await new Promise((resolve) => {
      const socket = net.connect({ port: porta, host: '127.0.0.1' });
      socket.setTimeout(500);
      socket.once('connect', () => (socket.destroy(), resolve(true)));
      socket.once('timeout', () => (socket.destroy(), resolve(false)));
      socket.once('error', () => (socket.destroy(), resolve(false)));
    });
    if (pronto) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const r = adb('shell', 'monkey', '-p', PACOTE, '-c', 'android.intent.category.LAUNCHER', '1');
  if (r.status === 0) console.log(`\n  Abrindo ${PACOTE} no aparelho.\n`);
}

const expo = spawn(
  process.execPath,
  [
    require.resolve('expo/bin/cli'),
    'start',
    '--localhost',
    '--port',
    String(porta),
    ...(temApp ? [] : ['--android']),
    ...process.argv.slice(2),
  ],
  {
    cwd: raizDoApp,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, EXPO_OFFLINE: 'true', EXPO_NO_METRO_WORKSPACE_ROOT: '1', RCT_METRO_PORT: String(porta) },
  },
);

if (temApp) abrirApp();

expo.on('exit', (code) => process.exit(code ?? 0));
