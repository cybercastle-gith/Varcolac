# Stack — jogo de lobisomem

## Escolha

**React Native + TypeScript.** Motivo: experiência prévia com RN e React, e o projeto não tem backend nem exigência de motor de jogo — é um app de telas, listas e uma máquina de regras.

Descartados: Flutter (custo de aprender Dart não se paga com RN já conhecido), Unity e Godot (motor de jogo é a ferramenta errada para telas e listas), nativo duplo (dobro do trabalho), webview (não entrega o acabamento pretendido).

---

## Estrutura do repositório

Monorepo com **pnpm workspaces**.

```
/packages
  /engine        TypeScript puro. Zero dependência de React Native.
                 Roles, ações, precedência noturna, condições de vitória,
                 calculadora de peso, geração de baralhos.
/apps
  /lab           Laboratório web. Interface visual para testar o engine.
  /mobile        React Native. O app de verdade.
/assets          Banco de materiais, texturas, fontes, ícones.
```

**Regra principal:** `/engine` não importa nada de React Native nem de DOM. Isso permite que tanto o `/lab` quanto o `/mobile` consumam o mesmo código, e que os testes rodem em Node.

---

## Laboratório web

Interface visual em navegador para desenvolver e testar o engine **sem celular nenhum**. É onde a maior parte do trabalho difícil acontece.

### Stack

| Item | Escolha | Motivo |
|---|---|---|
| Bundler / dev server | **Vite** | Start em ~200ms, HMR instantâneo |
| UI | **React 19 + TypeScript** | Já é o seu terreno |
| Estilo | **Tailwind CSS** | Interface de ferramenta não precisa de design; velocidade importa mais |
| Estado | **Zustand** | Um store só, sem cerimônia |
| Tabelas e listas | **TanStack Table** | Para o relatório de simulação em massa |
| Gráficos | **Recharts** | Distribuição de vitórias, duração, calibragem de peso |
| Testes | **Vitest** | Mesmo bundler, mesma config do Vite |

### O que o laboratório precisa fazer

1. **Montar partida** — número de jogadores, baralho, modo, e todas as configurações de setup (revelação, contagem de lobos, eventos, módulos de fantasma).
2. **Avançar passo a passo** — botão de próxima etapa, percorrendo as 12 fases da precedência noturna uma a uma.
3. **Inspecionar o estado interno** — quem está protegido, bloqueado, perfurado, marcado, com estertor pendente. Tudo visível, o que no app é invisível por design.
4. **Log de resolução** — para cada noite, a lista do que cada etapa fez e por quê. É como você vai depurar "o Feiticeiro perfurou, mas o Padre cancelou".
5. **Forçar cenários** — atribuir roles manualmente para reproduzir um caso específico sem sortear até dar certo.
6. **Simulação em massa** — rodar 10.000 partidas com um baralho e ver taxa de vitória por facção, duração média e número de noites. É assim que a calculadora de peso é calibrada de verdade.
7. **Editor de pesos** — mexer nos pesos das roles e recalcular o índice de equilíbrio na hora.

> O laboratório não precisa ser bonito. Ele precisa mostrar tudo.

---

## App mobile

| Necessidade | Biblioteca |
|---|---|
| Navegação | **React Navigation** (native-stack) |
| Estado de UI | **Zustand** — a máquina de estados real vive no `/engine` |
| Persistência | **AsyncStorage** no protótipo · **expo-sqlite** se os baralhos crescerem |
| Animação | **Reanimated 3** + **Gesture Handler** (segurar-para-revelar) |
| Narração por voz | **expo-speech** (TTS) ou **expo-av** (locução gravada) |
| Vibração | **expo-haptics** |
| Tela sempre acesa | **expo-keep-awake** |
| Brilho no modo noite | **expo-brightness** (exige dev build) |
| Fontes | **expo-font** — PT Serif e PT Sans |

---

## Fluxo de desenvolvimento

A resposta para o problema de conexão do Expo Go é: **na maior parte do tempo, você não precisa do celular.**

### 1. Navegador — onde acontece 80% do trabalho

- **Engine:** desenvolvido e testado no `/lab`, em `localhost`. Zero celular.
- **Telas do app:** `npx expo start --web` roda o app de verdade no navegador via react-native-web. Layout, navegação, fluxo e estado — tudo dá para acertar aqui, com recarga instantânea e nenhuma conexão de rede envolvida.

### 2. Emulador — quando precisar de comportamento nativo

Android Studio, emulador Pixel. Conecta sozinho, sem WiFi, sem QR code. Bom para testar gesto, vibração e permissões.

### 3. Celular real — só para o que exige

Sensação de toque, brilho no escuro, e teste em mesa com gente. Aí sim, e por **cabo USB com `adb reverse`** — que elimina de vez o problema de conexão. Ver apêndice.

### Build

| Fase | Comando |
|---|---|
| Protótipo | `npx expo start --web` ou Expo Go via USB |
| Dev build local | `npx expo prebuild` → `npx expo run:android` |
| Produção | Build local em Android Studio · iOS só no fim, exige Mac |

Sem build na nuvem, sem fila. O build lento acontece uma vez; depois é só recarregar JavaScript.

---

## Testes

| Camada | Ferramenta | Onde roda |
|---|---|---|
| Engine (precedência, vitória, peso) | **Vitest** | Node. Milissegundos, sem celular |
| Simulação em massa | Script Node consumindo o `/engine` | Node |
| Componentes | **React Native Testing Library** | Node |
| Fluxo completo | **Maestro** | Aparelho. YAML, sem tocar no código |

Detox está descartado: exige configuração de build e runner, e é a principal razão pela qual testar RN tem fama de difícil.

---

## Ordem de trabalho

1. `/engine` + `/lab` — roles, precedência, vitória. Tudo no navegador.
2. Simulação em massa para calibrar a calculadora de peso.
3. Telas feias e funcionais, testadas em `expo start --web`.
4. Primeiro teste em mesa real, no celular por USB.
5. Ajustar regras conforme o que a mesa derrubar.
6. Só então aplicar a identidade visual.
7. iOS por último — o jogo roda em um aparelho só, então Android basta por meses.

---

## Notas

- **Android primeiro.** Pass-and-play usa um aparelho. Não precisa de TestFlight, conta Apple nem Mac para testar em mesa real.
- **iOS exige Mac** para build. Adiável até o app estar pronto.
- Nada de backend no v1. Servidor só entra no modo Solo com bots (V2).

---

# Apêndice — Rodar no celular por cabo (adb reverse)

Elimina WiFi, QR code e "Something went wrong" do Expo Go. O celular passa a falar com o PC pelo cabo.

### Uma vez só — preparar o celular

1. **Ajustes → Sobre o telefone → Informações do software**
2. Toque **7 vezes** em **Número da versão**. Aparece "Você agora é um desenvolvedor".
3. Volte para **Ajustes → Opções do desenvolvedor**
4. Ligue **Depuração USB**

### Uma vez só — preparar o PC

Instale o **Android SDK Platform Tools** (vem junto com o Android Studio, ou baixe avulso). Confirme:

```bash
adb version
```

### Toda vez que for rodar

1. Conecte o cabo USB.
2. Na notificação do carregamento, escolha **Transferência de arquivos (MTP)** — não deixe em "Apenas carregamento".
3. No celular, vai aparecer **"Permitir depuração USB?"** → marque *Sempre permitir deste computador* → **Permitir**.
4. No PC, confirme que o aparelho apareceu:

```bash
adb devices
```
Deve listar algo como `R58X1234ABC   device`. Se aparecer `unauthorized`, o passo 3 não foi aceito.

5. Redirecione a porta do Metro:

```bash
adb reverse tcp:8081 tcp:8081
```

6. Inicie o projeto:

```bash
npx expo start --localhost
```

7. Pressione **`a`** no terminal. O app abre sozinho no celular.

### Se der problema

| Sintoma | Causa provável |
|---|---|
| `adb devices` não lista nada | Cabo só de carga (troque o cabo) ou depuração USB desligada |
| Aparece `unauthorized` | O popup de autorização no celular não foi aceito |
| Conecta e depois cai | Rode `adb reverse tcp:8081 tcp:8081` de novo — ele se perde a cada reconexão |
| Porta ocupada | `npx expo start --localhost --port 8082` e ajuste o `adb reverse` para a mesma porta |

> **Atalho:** o `adb reverse` precisa ser refeito sempre que o celular reconectar. Vale colocar num script `npm run dev:android` que roda os dois comandos em sequência.
