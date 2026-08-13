/**
 * Localiza o Android SDK e deixa ANDROID_HOME e o PATH configurados de forma
 * permanente, no Windows e no Linux.
 *
 * Derivado de `scripts/setup-android.js`, com duas mudanças: não pergunta nada
 * (é chamado pelo `pnpm run setup`) e devolve um resultado em vez de encerrar o
 * processo, para que o setup continue e mostre um relatório único no fim.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const windows = process.platform === 'win32';

/** Caminhos onde o Android Studio instala o SDK, por sistema. */
function candidatos() {
  const home = os.homedir();
  if (windows) {
    return [
      process.env.ANDROID_HOME,
      process.env.ANDROID_SDK_ROOT,
      path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk'),
    ];
  }
  if (process.platform === 'darwin') {
    return [process.env.ANDROID_HOME, path.join(home, 'Library', 'Android', 'sdk')];
  }
  return [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(home, 'Android', 'Sdk'),
    path.join(home, 'Android', 'sdk'),
  ];
}

export function localizarSdk() {
  const adb = windows ? 'adb.exe' : 'adb';
  for (const sdk of candidatos().filter(Boolean)) {
    if (existsSync(path.join(sdk, 'platform-tools', adb))) return sdk;
  }
  return null;
}

function persistirWindows(sdk) {
  const extras = ['platform-tools', 'emulator', path.join('cmdline-tools', 'latest', 'bin')]
    .map((p) => path.join(sdk, p))
    .filter((p) => existsSync(p));

  // setx grava no ambiente do usuário; só vale para terminais abertos depois.
  execFileSync('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `[Environment]::SetEnvironmentVariable('ANDROID_HOME', '${sdk}', 'User');` +
      `$p = [Environment]::GetEnvironmentVariable('Path', 'User');` +
      extras
        .map((e) => `if ($p -notlike '*${e}*') { $p += ';${e}' };`)
        .join('') +
      `[Environment]::SetEnvironmentVariable('Path', $p, 'User');`,
  ]);
  return extras;
}

function persistirUnix(sdk) {
  const linhas = [
    `export ANDROID_HOME="${sdk}"`,
    `export ANDROID_SDK_ROOT="${sdk}"`,
    'export PATH="$PATH:$ANDROID_HOME/platform-tools"',
    'export PATH="$PATH:$ANDROID_HOME/emulator"',
    'export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"',
  ].join('\n');

  const marca = `export ANDROID_HOME="${sdk}"`;
  for (const arquivo of ['.bashrc', '.zshrc'].map((f) => path.join(os.homedir(), f))) {
    if (!existsSync(arquivo)) continue;
    if (readFileSync(arquivo, 'utf8').includes(marca)) continue;
    appendFileSync(arquivo, `\n# Projeto Werewolf — Android\n${linhas}\n`);
  }
  return [path.join(sdk, 'platform-tools')];
}

/**
 * Configura o ambiente. Devolve `{ ok, sdk, aparelhos, mensagem }`.
 * Nunca lança: o setup precisa seguir e reportar tudo junto no fim.
 */
export function configurarAndroid() {
  const sdk = localizarSdk();

  if (!sdk) {
    return {
      ok: false,
      sdk: null,
      aparelhos: [],
      mensagem:
        'Android SDK não encontrado. Instale o Android Studio (que traz o SDK e o JDK 17) ' +
        'e rode este setup de novo. Sem ele dá para usar `pnpm dev:lab` e `pnpm dev:web`, ' +
        'mas não o celular nem o APK.',
    };
  }

  let extras = [];
  try {
    extras = windows ? persistirWindows(sdk) : persistirUnix(sdk);
  } catch {
    // Persistir é conveniência; o setup segue com o PATH só deste processo.
  }

  // Vale para os comandos que este mesmo setup ainda vai rodar.
  process.env.ANDROID_HOME = sdk;
  process.env.ANDROID_SDK_ROOT = sdk;
  process.env.PATH = [process.env.PATH, ...extras].filter(Boolean).join(path.delimiter);

  const r = spawnSync(path.join(sdk, 'platform-tools', windows ? 'adb.exe' : 'adb'), ['devices'], {
    encoding: 'utf8',
  });

  const aparelhos = (r.stdout ?? '')
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.endsWith('device'))
    .map((l) => l.split(/\s+/)[0]);

  return { ok: true, sdk, aparelhos, mensagem: null };
}
