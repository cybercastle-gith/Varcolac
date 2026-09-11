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
pnpm apk           # gerar o APK
```

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
| Trava **depois** de `Bundled` | é JS, não infraestrutura: `adb logcat -s ReactNativeJS:V ReactNative:V` |

Antes de mexer em versões ou no lockfile, rode `pnpm run setup` e leia o relatório. Ele foi feito para responder essas perguntas sem investigação nova.
