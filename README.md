# Projeto Werewolf

Jogo de dedução social presencial, tema lobisomem, para celular. **Pass-and-play**: um único aparelho circula pela mesa e a discussão acontece entre as pessoas, na vida real. Offline, sem contas, sem backend.

O app é o mestre: distribui, narra, resolve interações, injeta eventos e conta os votos.

---

## Instalação — um comando só

Pré-requisitos: **Node 20.19+** e **pnpm** (`npm i -g pnpm`). Para rodar no celular ou gerar APK, também **Android Studio**, que traz o SDK e o JDK 17.

Na raiz do projeto:

```bash
pnpm run setup
```

Um comando, seis etapas: limpa `node_modules` órfãos, instala, confere que existe uma única cópia de React, configura `ANDROID_HOME` e o `PATH`, testa a porta do Metro e valida com `expo-doctor` e os testes. Termina dizendo `Ambiente pronto.` ou listando exatamente o que falta.

Sem Android Studio ele segue e avisa — o laboratório do engine e o app no navegador funcionam do mesmo jeito.

> Use `pnpm run setup`, não `pnpm setup`: `setup` é um comando reservado do próprio pnpm.

Por que cada etapa existe, e o que fazer quando algo falha: [docs/SETUP_PROJETO_WEREWOLF.md](docs/SETUP_PROJETO_WEREWOLF.md).

---

## Rodar

| Quero | Comando |
|---|---|
| Laboratório do engine no navegador | `pnpm dev:lab` |
| App no navegador (react-native-web) | `pnpm dev:web` |
| App no celular por cabo USB | `pnpm dev:android` |
| Testes do engine | `pnpm test` |
| Checagem de tipos | `pnpm typecheck` |
| Gerar o APK | `pnpm apk` |

Os scripts do mobile passam por lançadores em Node (`apps/mobile/scripts/`) em vez de uma linha de shell no `package.json`. São os mesmos comandos no Windows e no Linux, e é lá que fica ligado o `EXPO_OFFLINE` — sem ele o CLI cai com `TypeError: fetch failed` ao consultar a tabela de versões do SDK, que este projeto não precisa consultar.

**80% do trabalho acontece no navegador.** O engine se desenvolve no `dev:lab`, em `localhost`, sem celular nenhum. As telas se acertam no `dev:web`. O aparelho só entra para o que exige toque, brilho no escuro e teste em mesa com gente.

### Primeiro APK

```bash
pnpm apk
```

Roda `expo prebuild` (gera a pasta `android/`, que é descartável e fica fora do git) e depois `gradlew assembleRelease`. O arquivo sai em:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

A primeira execução baixa o Gradle e leva vários minutos; as seguintes são rápidas. Exige **JDK 17** e o **Android SDK** instalados — o caminho mais curto é instalar o Android Studio uma vez.

O build de release é assinado com a keystore de depuração, o que serve para instalar no seu aparelho e passar em mesa. Para publicar na loja é preciso uma keystore própria — não está feito.

### Rodar no celular por cabo (`adb reverse`)

Elimina WiFi, QR code e o "Something went wrong" do Expo Go. No celular: Opções do desenvolvedor → Depuração USB. No PC, com o cabo ligado em modo Transferência de arquivos:

```bash
pnpm dev:android
```

O script já roda o `adb reverse tcp:8081 tcp:8081` antes de subir o Metro — e ele precisa ser refeito a cada reconexão do aparelho. Detalhes e diagnóstico em [docs/stack.md](docs/stack.md).

---

## Estrutura

```
packages/engine    Regras em TypeScript puro. Zero React Native, zero DOM.
apps/lab           Laboratório web (Vite + React + Tailwind) para depurar o engine.
apps/mobile        App React Native com Expo.
assets/            Fontes, texturas, ícones.
docs/              Dossiê de design, identidade visual, stack.
scripts/           Utilitários (geração dos ícones de placeholder).
```

**Regra principal:** `packages/engine` não importa nada de React Native nem de DOM. É o que permite que o laboratório e o app consumam o mesmo código e que os testes rodem em Node, em milissegundos.

---

## O engine

O coração é a **resolução noturna em 12 etapas de precedência**, em ordem fixa (`packages/engine/src/resolution/`). Uma função por etapa, cada uma registrando no log **o que fez e por quê** — é assim que se depura "o Feiticeiro perfurou, mas o Padre cancelou".

```
 1 estado-inicial            7 ataque
 2 evento                    8 resolucao-mortes
 3 bloqueio                  9 estertores
 4 interferencia-espectral  10 ressurreicao
 5 protecao                 11 informacao
 6 perfuracao               12 sussurros
```

O que está implementado, com testes:

| Sistema | Onde |
|---|---|
| 24 roles + Amantes, com variantes | `data/roles/` |
| 16 eventos (sorte e gatilho), com efeitos declarativos | `data/events/` |
| 5 módulos de fantasma | `data/ghosts.ts` |
| 4 modos de jogo | `data/modes/` |
| 10 sementes de fábrica + Baralho Surpresa | `balance/deck-generator.ts` |
| Calculadora de peso e índice de equilíbrio | `balance/weight-calculator.ts` |
| As 12 etapas da noite | `resolution/steps/` |
| Cadeia de estertores (noite e linchamento) | `resolution/estertor-chain.ts` |
| Votação, empate, execução, gatilhos | `day/voting.ts` |
| Vitória em camadas | `victory/win-conditions.ts` |
| Partida completa e simulação em massa | `simulation/` |

Quatro invariantes que o resto depende:

- **A etapa 11 lê o estado do início da noite**, nunca o resultado — senão a informação vazaria quem morreu.
- **Todo sorteio passa pelo RNG semeado** (`utils/rng.ts`). A mesma semente reproduz a partida inteira, não só o setup.
- **Estertor dispara com morte por qualquer causa**, e por isso a cadeia mora fora do pipeline noturno: o Caçador linchado atira igual.
- **Efeitos de "na próxima noite" vivem numa fila tipada** (`types/effect.ts`), em vez de um campo por mecânica.

```bash
pnpm test
```

---

## O laboratório

`pnpm dev:lab`, seis painéis, um store de zustand que **não tem regra de jogo** — só chama o engine na ordem certa.

| Painel | O que faz |
|---|---|
| **Setup** | mesa, baralho, os sete sistemas do setup, índice de equilíbrio ao vivo |
| **Estado** | tudo que no app é invisível: marcas, usos, efeitos engatilhados, informação privada (com a marca de falsa), contadores de gatilho, anúncios |
| **Resolução** | avança etapa por etapa pelas 12 fases; cada linha traz mensagem **e** motivo |
| **Cenário** | os conflitos do dossiê viram baralhos de um clique (Padre × Feiticeiro, cadeia de estertores, preso perfurável…) |
| **Simulação** | N partidas, previsto × medido lado a lado, distribuição de duração |
| **Pesos** | mexe no peso e o índice recalcula na hora; a alteração fica só na memória |

---

## O aplicativo

18 telas, o loop completo de mesa: Home → jogadores → modo e baralho → sistemas →
revisão com índice → **passagem do celular** (entregar · segurar para revelar ·
agir ou toque falso · sussurro) → amanhecer → discussão com cronômetro → votação
→ execução → fim em camadas. Mais biblioteca de funções e como jogar.

O design segue a identidade "Luz de Vela", com a separação rígida do documento:
**textura em telas de momento, limpeza em telas de operação**. A regra que mais
aparece na prática: alvos de 48px, nada de branco puro, transições de 250ms.

O que cada jogador é perguntado na passagem **não está nas telas** — sai de
`packages/engine/src/turn/roteiro.ts`. Isso é regra, não interface, e é por isso
que uma role nova não exige tela nova.

```bash
pnpm dev:web       # jogar no navegador, sem celular
pnpm dev:android   # jogar no aparelho, por cabo
```

## Documentos

- [docs/dossie.htm](docs/) — dossiê de design: pilares, facções, catálogo, precedência, calculadora de peso, modos.
- [docs/identidade.htm](docs/) — identidade visual "Luz de Vela": paleta com procedência, luz de vela, colagem de material real.
- [docs/stack.md](docs/stack.md) — decisões de stack e fluxo de desenvolvimento.
- [docs/CONTEUDO_DO_JOGO.md](docs/CONTEUDO_DO_JOGO.md) — **todo o conteúdo e contexto do jogo num arquivo só**, escrito para ser entregue a uma IA junto de um pedido de conteúdo novo (roles, modos, eventos, mecânicas).

---

## Ordem de trabalho

1. Engine + laboratório — roles, precedência, vitória. Tudo no navegador.
2. Simulação em massa para calibrar a calculadora de peso.
3. Telas feias e funcionais, testadas no `dev:web`.
4. Primeiro teste em mesa real, no celular por USB.
5. Ajustar regras conforme o que a mesa derrubar.
6. Só então aplicar a identidade visual.
7. iOS por último — o jogo roda em um aparelho só.
