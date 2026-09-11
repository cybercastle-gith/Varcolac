# Setup — Projeto Werewolf

## Um comando

```bash
pnpm run setup
```

É o ponto de entrada oficial. Ele instala, configura o Android, valida e diz o que fazer em seguida. Se terminar com `Ambiente pronto.`, acabou.

> **Use `pnpm run setup`, não `pnpm setup`.** `setup` é um comando reservado do próprio pnpm (ele configura o shell para o pnpm) e não executa o script do projeto.

### Pré-requisitos

| | Para quê |
|---|---|
| **Node 20.19+** | tudo |
| **pnpm 10+** (`npm i -g pnpm`) | tudo |
| **Android Studio** (traz SDK + JDK 17) | só para celular e APK |

Sem o Android Studio o setup continua e avisa: o laboratório do engine e o app no navegador funcionam do mesmo jeito.

### Depois do setup

```bash
pnpm dev:lab       # laboratório do engine no navegador
pnpm dev:web       # o app no navegador
pnpm dev:android   # o app no celular, por cabo USB
pnpm dev:build     # compila o app no aparelho (dispensa o Expo Go)
pnpm apk           # gerar o APK
```

---

## Expo Go × development build

O **Expo Go** da loja carrega **um SDK por vez** e acompanha o mais novo. Quando
ele atualiza antes do projeto, a partida para de abrir:

```text
Project is incompatible with this version of Expo Go
• The installed version of Expo Go is for SDK 57.
• The project you opened uses SDK 54.
```

Não há nada errado no código quando isso acontece — é acoplamento com um app de
terceiros que atualiza sozinho pela Play Store.

**Duas saídas:**

| | Como | Custo | Dura |
|---|---|---|---|
| Expo Go do SDK certo | baixar o APK de `expo.dev/go?sdkVersion=<SDK>&platform=android&device=true` | 2 minutos | até a Play Store atualizar de novo |
| **Development build** | `pnpm dev:build` | uma compilação longa | **para sempre** |

O development build **é o nosso app**: nenhum SDK de terceiro no meio. Depois
dele, `pnpm dev:android` detecta o app instalado e conecta nele com
`--dev-client`, sem passar pelo Expo Go — e o ciclo de recarga continua o mesmo.

### O build nativo precisa de uma JDK compatível

O React Native 0.81 traz o **Gradle 8.14**, que **não roda em Java 25**. É comum
a máquina ter várias JDKs e nenhuma servir — aqui a do sistema e a do Android
Studio eram as duas 25.

`pnpm dev:build` e `pnpm apk` verificam isso **antes** de compilar e respondem:

```text
Nenhuma JDK compatível encontrada.
  O Gradle 8.14 deste projeto aceita Java 17 a 24.
  Instaladas nesta máquina: 25, 25.

  Instale a JDK 17 (LTS) e rode de novo:
    winget install EclipseAdoptium.Temurin.17.JDK
```

Depois de instalada, os scripts acham a JDK sozinhos e apontam `JAVA_HOME` para
ela — não é preciso configurar nada no sistema.

---

## O que o setup faz, e por quê

Cada uma das seis etapas existe porque o problema correspondente já aconteceu neste projeto e custou horas. O script não é cerimônia: é a memória dessas horas.

### 1. `node_modules` órfãos

Procura symlinks pendurados nos `node_modules` dos workspaces e apaga a pasta inteira quando encontra.

**Por quê:** um `node_modules` de workspace sobrevive a uma troca de `node-linker` e fica apontando para caminhos do `.pnpm` que não existem mais. O `pnpm install` não conserta isso sozinho. Foi o que produziu um `react-native@0.79.2` fantasma, com `package.json` e lockfile ambos corretos em `0.79.6`.

### 2. Instalação

`pnpm install`. Se falhar com `EPERM` ou `ENOENT` no Windows, é quase sempre um Metro ainda rodando segurando arquivos — o script diz isso na mensagem de erro.

### 3. React: cópia única e na versão certa

Varre `node_modules` e falha se houver mais de uma versão de React — **ou se a
versão instalada não for a que o `react-native` instalado espera**.

**Por quê, parte 1 — cópia única.** O React Native exige uma cópia só. Com `node-linker=hoisted`, um pacote que peça outra versão ganha uma cópia aninhada, e o app morre com `Invalid hook call` sem apontar o culpado. Aconteceu porque o lab pedia uma versão diferente da do app — o `use-sync-external-store`, que vem com o React Navigation, trouxe a segunda cópia para dentro do bundle.

A trava está em `pnpm-workspace.yaml`:

```yaml
overrides:
  react: 19.1.0
  react-dom: 19.1.0
```

No pnpm 10 é **ali** que ficam os overrides. O campo `"pnpm"` do `package.json` deixou de ser lido, e é ignorado em silêncio.

**Por quê, parte 2 — a versão certa.** Esse override é o que trava o React, e por isso ele fica para trás quando o SDK do Expo sobe. Foi o que aconteceu na subida para o **SDK 54**: o manifesto passou a pedir React 19.1.0, o override continuava em 19.0.0, e o app quebrou no aparelho com

```text
Incompatible React versions:
- react:
- react-native-renderer: 19.1.0
```

O `react` vazio na mensagem é o sintoma exato: o renderer do RN 0.81 não reconhece o React que recebeu. O setup agora compara a versão instalada com o `peerDependencies.react` do `react-native` e diz qual valor usar.

| SDK do Expo | React Native | React |
|---|---|---|
| 53 | 0.79.x | 19.0.0 |
| 54 | 0.81.x | 19.1.0 |

**Ao subir de SDK, atualize o override na mesma tacada.**

### 4. Ambiente Android

Localiza o SDK, grava `ANDROID_HOME` e o `PATH` de forma permanente (registro do usuário no Windows, `.bashrc`/`.zshrc` no Linux) e lista os aparelhos conectados.

### 5. Porta do Metro

Testa a 8081 **em 127.0.0.1**, que é IPv4.

**Por quê:** o `adb reverse` encaminha o aparelho para 127.0.0.1. Se outro programa já ocupa essa porta em IPv4, o Metro sobe em `:::8081` (IPv6), ninguém reclama, e o Expo Go recebe a resposta do programa errado — `java.io.IOException: failed to construct manifest from response`, tela azul. Nesta máquina o culpado era o Apache do EnterpriseDB. O `pnpm dev:android` escolhe a próxima porta livre sozinho e usa a mesma no `adb reverse` e no Metro.

### 6. Validação

`expo-doctor` (esperado: `18/18 checks passed`) e os testes do engine.

---

## Decisões que não se mexem sem motivo

**`.npmrc` com `node-linker=hoisted`.** O Metro e o autolinking do Expo não lidam bem com `node_modules` simbólico.

**Nunca edite o `pnpm-lock.yaml` à mão.** Quando a instalação física diverge do lockfile, a correção é apagar `node_modules` e reinstalar — o que a etapa 1 do setup já faz.

**Não procure `react-native` em `apps/mobile/node_modules`.** Com `hoisted` ele fica na raiz. A verificação correta é:

```bash
pnpm --filter mobile exec node -p "require('react-native/package.json').version"
```

**Os scripts do mobile passam por lançadores em Node** (`apps/mobile/scripts/`), não por linhas de shell. Três razões, todas descobertas na marra:

- `set VAR=1 && cmd` no `cmd.exe` captura o espaço antes do `&&`, o valor vira `"1 "` e o Expo recusa com `GetEnv.NoBoolean`. A forma POSIX `VAR=1 cmd` não existe no Windows. Nenhuma linha só funciona nos dois sistemas.
- `--offline` é mutuamente exclusivo com `--localhost` no CLI, mas a variável `EXPO_OFFLINE` faz o mesmo e convive com ele. Ela é necessária porque o CLI cai com `TypeError: fetch failed` ao consultar a tabela de versões do SDK — consulta que este projeto não precisa fazer.
- `spawn` com `shell: true` no Windows parte `C:\Program Files\nodejs\node.exe` no espaço.

**A raiz do servidor do Metro é o app, e quem decide isso é `EXPO_NO_METRO_WORKSPACE_ROOT=1`** (em `apps/mobile/.env`). Ao encontrar um `pnpm-workspace.yaml`, o Expo aponta o `serverRoot` para a raiz do monorepo, e as duas formas de empacotar passam a discordar entre si:

- no build do Gradle, o plugin do React Native passa `--entry-file` relativo a `apps/mobile`, e o bundle morre com `Unable to resolve module ./index.ts` — depois de onze minutos compilando;
- no servidor de desenvolvimento, o manifesto anuncia `apps/mobile/index.ts.bundle` e o aparelho recebe **404**.

Forçar `unstable_serverRoot` no `metro.config.js` conserta só a primeira e quebra a segunda, porque o CLI do Expo continua calculando a URL pela sua própria conta. A variável resolve as duas de uma vez, já que quem a lê é o próprio CLI (`getMetroServerRoot`): servidor, manifesto e `export:embed` passam a usar a mesma raiz. Fica num `.env` para valer também quando alguém chamar o `expo` direto.

**O build nativo no Windows roda a partir de um drive virtual** (`apps/mobile/scripts/caminho-curto.mjs`). O ninja 1.10.2, que vem no CMake do Android SDK, recusa caminho de arquivo objeto com mais de 260 caracteres, e o pior caso aqui dava 298:

```
ninja: error: Stat(safeareacontext_autolinked_build/CMakeFiles/
react_codegen_safeareacontext.dir/C_/Users/user/Desktop/Programs/Projetos/
Projeto_Werewolf/node_modules/react-native-safe-area-context/.../
safeareacontextJSI-generated.cpp.o): Filename longer than 260 characters
```

Três coisas decidem a saída, e as duas primeiras eliminam as tentativas óbvias:

- A chave `LongPathsEnabled` do registro **já está em 1** nesta máquina e não muda nada: o ninja 1.10.2 não declara `longPathAware` no manifesto, então o Windows não aplica o long path a ele. Não há o que configurar no sistema.
- O ninja mede o caminho **relativo** ao diretório de build (ele entra nele com `-C`). Por isso `buildStagingDirectory` curto não ajuda: o que está sendo medido começa depois disso.
- O que pesa é o caminho absoluto da **fonte**, que o CMake embute no nome do objeto trocando o `:` do drive por `_`. Com `node_modules` na raiz do monorepo, são 56 caracteres gastos antes de `node_modules/`.

Por isso `pnpm apk` e `pnpm dev:build` se relançam a partir de um `subst W: <raiz>`: o prefixo cai de 56 para 2 caracteres e o pior caso vai a 244. Não move o repositório, não exige administrador, e o mapeamento some sozinho ao reiniciar. O Gradle sobe um daemon por drive, então o primeiro build no drive novo é completo; os seguintes são incrementais como sempre.

Como consequência, **os pacotes do monorepo são resolvidos por caminho, e não pelo link do pnpm** (`metro.config.js`). O link de `@jogo/engine` guarda o caminho absoluto de origem e levaria a resolução de volta para `C:`, fora das raízes do bundler: `Unable to resolve module @jogo/engine`. O mapa é montado lendo `packages/*/package.json`, então um pacote novo entra sozinho.

**Imports relativos no engine não levam extensão.** O TypeScript aceita `./types/role.js` apontando para um `.ts`, e o Vitest também (o Vite faz esse mapeamento). **O Metro não faz.** O bundle falhava aos 98%, depois de três minutos — do lado do celular, indistinguível de travamento.

**Os assets do app ficam em `apps/mobile/assets/`.** O Expo Go não serve arquivos de fora da pasta do projeto: apontar para `../../assets` dá `Unable to resolve manifest assets`, e o app abre sem ícone nem fonte. O banco de materiais continua em `assets/` na raiz; `python scripts/gerar-icones.py` gera lá e copia para o app.

---

## Diagnóstico rápido

| Sintoma | Onde olhar |
|---|---|
| `Invalid hook call` | duas cópias de React — rode `pnpm run setup` |
| `Incompatible React versions` | o override do React ficou para trás do SDK — `pnpm run setup` diz qual versão usar |
| Tela azul, `failed to construct manifest` | outro programa na porta; `Get-NetTCPConnection -LocalPort 8081 -State Listen` |
| `Unable to resolve module ./x.js` | import com extensão `.js` em código TypeScript |
| `TypeError: fetch failed` | falta `EXPO_OFFLINE` — use os scripts do projeto, não `expo` direto |
| `EPERM`/`ENOENT` no install | Metro rodando; encerre com `Ctrl+C` |
| `Project is incompatible with this version of Expo Go` | o Expo Go atualizou na frente do projeto — `pnpm dev:build`, ou o APK do SDK certo |
| `Expo Go is not installed on device` | o aparelho ficou sem Expo Go e sem o app — `pnpm dev:build` resolve os dois |
| `Unsupported class file major version` | JDK nova demais para o Gradle — `pnpm dev:build` diz qual instalar |
| `Unable to resolve module ./index.ts` no build Gradle | falta `EXPO_NO_METRO_WORKSPACE_ROOT=1` — ver `apps/mobile/.env` |
| `Unable to load script` / `loadJSBundleFromAssets` | o app de debug só procura a **8081 do aparelho**; o `dev:android` faz o túnel `adb reverse tcp:8081 tcp:<porta do Metro>` |
| 404 em `/apps/mobile/index.ts.bundle` | falta `EXPO_NO_METRO_WORKSPACE_ROOT=1` — ver `apps/mobile/.env` |
| `Unable to resolve module @jogo/engine` | o link do pnpm cruzando drives no build nativo — `metro.config.js` mapeia por caminho |
| `Filename longer than 260 characters` | limite de caminho do Windows — os scripts ja contornam com `subst`; ver `caminho-curto.mjs` |
| Trava **depois** de `Bundled` | é JS, não infraestrutura: `adb logcat -s ReactNativeJS:V ReactNative:V` |

Antes de mexer em versões ou no lockfile, rode `pnpm run setup` e leia o relatório. Ele foi feito para responder essas perguntas sem investigação nova.
