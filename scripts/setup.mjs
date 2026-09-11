/**
 * Ponto de entrada único do projeto.  →  pnpm run setup
 *
 * Faz tudo o que um recém-chegado precisa e, mais importante, VERIFICA o que
 * costuma quebrar em silêncio neste monorepo. Cada checagem aqui existe porque
 * o problema correspondente já aconteceu de verdade:
 *
 *   - node_modules órfãos com links para um .pnpm que não existe mais
 *   - duas cópias de React no mesmo grafo → "Invalid hook call"
 *   - React na versão errada para o renderer do RN → "Incompatible React versions"
 *   - outro programa ocupando a porta 8081 → tela azul no Expo Go
 *   - versões nativas fora do SDK → expo-doctor
 *
 * Nada aqui é destrutivo sem avisar, e cada falha diz o que fazer a seguir.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, rmSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const require = createRequire(import.meta.url);
const raiz = path.resolve(import.meta.dirname, '..');
const windows = process.platform === 'win32';

const etapas = [];
const registrar = (nome, ok, detalhe) => etapas.push({ nome, ok, detalhe });

const titulo = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const aviso = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const erro = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

function rodar(cmd, args, opcoes = {}) {
  return spawnSync(cmd, args, { cwd: raiz, stdio: 'inherit', shell: windows, ...opcoes });
}

/**
 * Chama o Node sem shell. Com `shell: true` o Windows quebra o caminho em
 * "C:\Program Files\nodejs\node.exe" no espaço e responde
 * "'C:\Program' não é reconhecido como um comando".
 */
function rodarNode(args, opcoes = {}) {
  return spawnSync(process.execPath, args, {
    cwd: raiz,
    stdio: 'inherit',
    shell: false,
    ...opcoes,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
titulo('1/6  node_modules órfãos');

/**
 * Um `node_modules` de workspace pode sobreviver a uma troca de node-linker e
 * ficar cheio de symlinks apontando para caminhos do .pnpm que já sumiram. O
 * pnpm não conserta isso sozinho, e o sintoma aparece longe da causa — foi
 * assim que apareceu um react-native 0.79.2 fantasma aqui.
 */
const orfaos = ['packages/engine', 'apps/lab', 'apps/mobile']
  .map((p) => path.join(raiz, p, 'node_modules'))
  .filter((dir) => {
    if (!existsSync(dir)) return false;
    return readdirSync(dir).some((nome) => {
      const alvo = path.join(dir, nome);
      try {
        if (!lstatSync(alvo).isSymbolicLink()) return false;
        realpathSync(alvo);
        return false;
      } catch {
        return true; // link pendurado
      }
    });
  });

for (const dir of orfaos) {
  rmSync(dir, { recursive: true, force: true });
  aviso(`removido (links quebrados): ${path.relative(raiz, dir)}`);
}
ok(orfaos.length === 0 ? 'nenhum encontrado' : `${orfaos.length} pasta(s) recriada(s) na instalação`);
registrar('node_modules órfãos', true);

// ─────────────────────────────────────────────────────────────────────────────
titulo('2/6  Instalando dependências');

const instalacao = rodar('pnpm', ['install']);
if (instalacao.status !== 0) {
  erro('pnpm install falhou.');
  console.log(
    '\n  Se a mensagem for EPERM ou ENOENT no Windows, quase sempre é um Metro\n' +
      '  ainda rodando segurando arquivos. Encerre-o (Ctrl+C) e rode de novo.\n',
  );
  process.exit(1);
}
ok('dependências instaladas');
registrar('pnpm install', true);

// ─────────────────────────────────────────────────────────────────────────────
titulo('3/6  React: cópia única e na versão que o React Native espera');

/**
 * React Native exige uma cópia única de React. Com node-linker=hoisted, um
 * pacote que peça uma versão diferente ganha uma cópia aninhada, e o app morre
 * com "Invalid hook call" — sem apontar o culpado.
 */
function copiasDeReact(dir, profundidade = 0) {
  if (profundidade > 4 || !existsSync(dir)) return [];
  const achados = [];
  for (const nome of readdirSync(dir)) {
    const alvo = path.join(dir, nome);
    // @types/react é só tipagem: não vai para o bundle e não duplica runtime.
    if (nome === '@types') continue;
    if (nome === 'react' && existsSync(path.join(alvo, 'package.json'))) {
      achados.push({
        caminho: path.relative(raiz, alvo),
        versao: JSON.parse(readFileSync(path.join(alvo, 'package.json'), 'utf8')).version,
      });
      continue;
    }
    try {
      if (!lstatSync(alvo).isDirectory()) continue;
    } catch {
      continue;
    }
    if (nome.startsWith('@') || nome === 'node_modules') {
      achados.push(...copiasDeReact(alvo, profundidade + 1));
    } else if (existsSync(path.join(alvo, 'node_modules'))) {
      achados.push(...copiasDeReact(path.join(alvo, 'node_modules'), profundidade + 1));
    }
  }
  return achados;
}

const reacts = copiasDeReact(path.join(raiz, 'node_modules'));
const versoes = [...new Set(reacts.map((r) => r.versao))];

if (versoes.length > 1) {
  erro(`${versoes.length} versões de React no mesmo grafo: ${versoes.join(', ')}`);
  for (const r of reacts) console.log(`      ${r.caminho}  ${r.versao}`);
  console.log(
    '\n  Corrija fixando a versão em "pnpm.overrides" no package.json da raiz,\n' +
      '  igual à que o React Native exige, e rode este setup de novo.\n',
  );
  registrar('React único', false, versoes.join(', '));
} else {
  ok(`React ${versoes[0] ?? '—'}, cópia única`);
  registrar('React único', true, versoes[0]);
}

/**
 * A cópia única precisa ser a versão CERTA.
 *
 * O `overrides` do pnpm-workspace.yaml fixa o React para impedir cópias
 * duplicadas — e por isso ele fica desatualizado quando o SDK do Expo sobe. O
 * sintoma no aparelho é críptico: "Incompatible React versions: react: (vazio),
 * react-native-renderer: 19.1.0", porque o app recebe um React que o renderer
 * não reconhece. Comparar com o peer do react-native transforma isso numa linha.
 */
try {
  const rn = JSON.parse(
    readFileSync(path.join(raiz, 'node_modules/react-native/package.json'), 'utf8'),
  );
  const exigido = (rn.peerDependencies?.react ?? '').replace(/^[\^~]/, '');
  const instalado = versoes[0];

  if (exigido && instalado && exigido.split('.').slice(0, 2).join('.') !==
      instalado.split('.').slice(0, 2).join('.')) {
    erro(`React ${instalado} instalado, mas react-native ${rn.version} espera ${exigido}.`);
    console.log(
      `\n  Atualize 'overrides.react' em pnpm-workspace.yaml para ${exigido}` +
        ' e rode este setup de novo.\n',
    );
    registrar('React compatível com o RN', false, `${instalado} ≠ ${exigido}`);
  } else {
    ok(`compatível com react-native ${rn.version}`);
    registrar('React compatível com o RN', true);
  }
} catch {
  aviso('react-native não encontrado — checagem de compatibilidade pulada.');
}

// ─────────────────────────────────────────────────────────────────────────────
titulo('4/6  Ambiente Android');

const { configurarAndroid } = await import('./android-env.mjs');
const android = configurarAndroid();

if (!android.ok) {
  aviso(android.mensagem);
  registrar('Android SDK', false, 'não encontrado');
} else {
  ok(`SDK: ${android.sdk}`);
  if (android.aparelhos.length > 0) {
    ok(`aparelho conectado: ${android.aparelhos.join(', ')}`);
  } else {
    aviso(
      'nenhum aparelho conectado. Para o celular: cabo em modo Transferência de arquivos ' +
        '(MTP) e Depuração USB ligada.',
    );
  }
  registrar('Android SDK', true, android.sdk);
}

// ─────────────────────────────────────────────────────────────────────────────
titulo('5/6  Porta do Metro');

/**
 * O adb reverse encaminha o aparelho para 127.0.0.1 (IPv4). Se outro programa
 * escuta essa porta em IPv4, o Metro sobe em IPv6, ninguém reclama, e o Expo Go
 * recebe a resposta do programa errado — "failed to construct manifest".
 */
const portaLivre = (porta) =>
  new Promise((resolve) => {
    const s = net.connect({ port: porta, host: '127.0.0.1' });
    const fim = (livre) => {
      s.destroy();
      resolve(livre);
    };
    s.setTimeout(700);
    s.once('connect', () => fim(false));
    s.once('timeout', () => fim(true));
    s.once('error', () => fim(true));
  });

if (await portaLivre(8081)) {
  ok('8081 livre');
} else {
  aviso('8081 ocupada por outro programa — o `pnpm dev:android` escolhe a próxima livre sozinho.');
}
registrar('Porta do Metro', true);

// ─────────────────────────────────────────────────────────────────────────────
titulo('6/6  Validando o projeto');

// `expo doctor` não existe no CLI local; o binário é o do pacote expo-doctor.
// O único argumento posicional é a pasta do projeto; o modo offline vem do env.
const doctor = rodarNode([require.resolve('expo-doctor/bin/expo-doctor.js')], {
  cwd: path.join(raiz, 'apps', 'mobile'),
  env: { ...process.env, EXPO_OFFLINE: 'true' },
});
registrar('expo-doctor', doctor.status === 0);

const testes = rodar('pnpm', ['-r', 'test'], { stdio: 'pipe', encoding: 'utf8' });
if (testes.status === 0) ok('testes do engine passando');
else erro('testes falharam — rode `pnpm test` para ver o detalhe');
registrar('testes', testes.status === 0);

// ─────────────────────────────────────────────────────────────────────────────
const falhas = etapas.filter((e) => !e.ok);

console.log('\n' + '─'.repeat(64));
if (falhas.length === 0) {
  console.log('\x1b[32mAmbiente pronto.\x1b[0m\n');
  console.log('  pnpm dev:lab       laboratório do engine no navegador');
  console.log('  pnpm dev:web       o app no navegador');
  console.log('  pnpm dev:android   o app no celular, por cabo USB');
  console.log('  pnpm apk           gerar o APK\n');
} else {
  console.log('\x1b[33mAmbiente parcialmente pronto.\x1b[0m Pendências:\n');
  for (const f of falhas) console.log(`  · ${f.nome}${f.detalhe ? ` (${f.detalhe})` : ''}`);
  console.log('\n  O laboratório do engine (`pnpm dev:lab`) funciona mesmo assim.\n');
}

process.exit(
  falhas.some(
    (f) =>
      f.nome === 'React único' || f.nome === 'React compatível com o RN' || f.nome === 'testes',
  )
    ? 1
    : 0,
);
