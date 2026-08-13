/**
 * Sobe o Metro para desenvolvimento no celular por cabo USB.
 *
 * Existe como script em Node, e não como uma linha no package.json, por três
 * motivos concretos que já custaram tempo aqui:
 *
 * 1. `set VAR=1 && cmd` no cmd.exe captura o espaço antes do `&&`, e o valor
 *    vira "1 " — o getenv do Expo recusa com "GetEnv.NoBoolean: 1  is not a
 *    boolean". `VAR=1 cmd` (sintaxe POSIX) não existe no Windows. Não há uma
 *    linha só que funcione nos dois sistemas.
 * 2. `--offline` é mutuamente exclusivo com `--localhost` no CLI, mas a
 *    variável EXPO_OFFLINE faz o mesmo por outro caminho e convive com ele.
 * 3. A porta precisa ser verificada ANTES de subir. Ver `portaLivre` abaixo.
 *
 * EXPO_OFFLINE existe porque o CLI trava com "TypeError: fetch failed" ao
 * buscar a tabela de versões do SDK. Nada aqui precisa da rede: um aparelho,
 * cabo USB, adb reverse, sem backend.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';

const require = createRequire(import.meta.url);
const windows = process.platform === 'win32';
const PORTA_PADRAO = Number(process.env.RCT_METRO_PORT ?? 8081);

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

const porta = await escolherPorta();

// O adb reverse se perde a cada reconexão do aparelho, então é refeito sempre.
const reverse = spawnSync('adb', ['reverse', `tcp:${porta}`, `tcp:${porta}`], {
  stdio: 'inherit',
  shell: windows,
});

if (reverse.error || reverse.status !== 0) {
  console.error(
    '\nFalhou o `adb reverse`. Verifique:\n' +
      '  adb devices          → o aparelho deve aparecer como "device", não "unauthorized"\n' +
      '  cabo em modo Transferência de arquivos (MTP), não "apenas carregamento"\n' +
      '  Depuração USB ligada nas Opções do desenvolvedor\n',
  );
  process.exit(1);
}

// Chamar o cli.js pelo Node evita a diferença entre `expo` e `expo.cmd` no PATH.
const expo = spawn(
  process.execPath,
  [
    require.resolve('expo/bin/cli'),
    'start',
    '--localhost',
    '--android',
    '--port',
    String(porta),
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, EXPO_OFFLINE: 'true', RCT_METRO_PORT: String(porta) },
  },
);

expo.on('exit', (code) => process.exit(code ?? 0));
