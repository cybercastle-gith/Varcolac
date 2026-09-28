# LEITURA OBRIGATÓRIA PARA IAS

> Este arquivo é o canal de conversa entre as IAs que trabalham no
> **Projeto Werewolf**. Ele não é documentação de produto — é memória operacional.
> Se você é um modelo abrindo este repositório, este é o **primeiro** arquivo a ler
> e o **último** a escrever.

---

## 0. O PROTOCOLO — leia isto antes de qualquer outra coisa

### 0.1 Ao começar qualquer sessão

1. **Leia este arquivo inteiro.** Não pule seções por parecerem irrelevantes: a
   maior parte do tempo perdido neste projeto foi gasta redescobrindo coisas que
   já estavam resolvidas.
2. **Leia o registro de sessões (seção 12)** para saber o que mudou desde a
   última vez. É lá que fica o diff de conhecimento.
3. **Confira antes de confiar.** Este documento descreve o que era verdade na
   data de cada anotação. Se ele cita um arquivo, uma função ou uma flag,
   verifique que ainda existe antes de recomendar. Código muda; texto não sabe
   disso sozinho.

### 0.2 Ao terminar qualquer sessão

**Você é obrigado a escrever aqui.** Toda sessão que descobre, decide ou quebra
alguma coisa acrescenta ao registro. Não existe descoberta pequena demais: a
regra é que se te custou mais de dez minutos, custaria o mesmo à próxima IA.

O que registrar, sempre:

- **Causa-raiz de qualquer erro que você perseguiu** — não só o conserto. O
  conserto sem a causa faz a próxima IA desfazer seu trabalho por achar que era
  gambiarra.
- **Decisões de projeto e o porquê**, incluindo as alternativas descartadas e o
  motivo do descarte. Alternativa descartada sem motivo registrado volta.
- **Coisas que você tentou e não funcionaram.** Isso vale tanto quanto o que
  funcionou, e quase nunca é anotado.
- **Preferências e correções do usuário.** Ele corrige rumo; o rumo corrigido
  precisa sobreviver à troca de contexto.

### 0.3 Como escrever aqui

- **Acrescente, não reescreva.** Se uma informação ficou errada, marque-a como
  superada e escreva a nova embaixo, com a data. Apagar história faz a próxima
  IA repetir o erro que gerou aquela linha.
- **Datas absolutas**, nunca "ontem" ou "na semana passada".
- **Português**, que é a língua do projeto e do usuário.
- **Diga o porquê.** Um fato sem o motivo é uma regra supersticiosa, e alguém
  vai quebrá-la.

### 0.4 A regra que resume tudo

> Toda sessão **lê** este arquivo antes de agir e **escreve** nele antes de
> encerrar. Quem não escreve, faz a próxima sessão pagar de novo a mesma conta.

---

## 1. O que é o projeto

**Projeto Werewolf** (nome de marca em tela: **Vârcolac**) é um jogo de dedução
social presencial, tema lobisomem, para celular Android. **Pass-and-play**: um
único aparelho circula pela mesa e a discussão acontece entre as pessoas, na
vida real. Offline, sem contas, sem backend.

O app é o mestre: distribui, narra, resolve interações, injeta eventos e conta
os votos.

O usuário é o **Cyber Caslte**. Fala português. O git
está em `main`.

### 1.1 Estrutura

```
packages/engine    Regras em TypeScript puro. Zero React Native, zero DOM.
apps/lab           Laboratório web (Vite + React + Tailwind) para depurar o engine.
apps/mobile        App React Native com Expo.
assets/            Banco de materiais: fontes, texturas, ícones, fundos.
docs/              Dossiê, identidade, stack, conteúdo, assets, sistema visual.
scripts/           Utilitários (fatiar assets, gerar gradientes, setup).
```

**Regra principal, não negociável:** `packages/engine` não importa nada de React
Native nem de DOM. É o que permite o laboratório e o app consumirem o mesmo
código e os testes rodarem em Node, em milissegundos.

### 1.2 Os documentos, e para que serve cada um

| Arquivo | O que é |
|---|---|
| `docs/dossie.htm` | design do jogo: pilares, facções, catálogo, precedência, calculadora de peso, modos |
| `docs/identidade.htm` | identidade visual "Luz de Vela" — a direção |
| `docs/SISTEMA_VISUAL.md` | o que da identidade virou código — a implementação |
| `docs/CONTEUDO_DO_JOGO.md` | todo o conteúdo do jogo num arquivo, para entregar a uma IA junto de um pedido de conteúdo novo |
| `docs/ASSETS_A_GERAR.md` | as folhas de imagem a produzir, com prompt pronto e a decisão de cada item |
| `docs/SETUP_PROJETO_WEREWOLF.md` | por que cada etapa do setup existe e o que fazer quando falha |
| `docs/EVENTOS.md` | os 16 eventos listados para peneirar, com gatilho, efeito e narração |
| `docs/VARIANTES_A_CRIAR.md` | prompt pronto para outra IA criar as variantes das 17 funções que não têm |
| `docs/stack.md` | decisões de stack e fluxo de desenvolvimento |
| **este arquivo** | memória operacional entre IAs |

---

## 2. Ambiente e versões — o que quebra se você mexer

### 2.1 A cadeia de versões

| Peça | Versão | Observação |
|---|---|---|
| Expo SDK | 54 | |
| React Native | 0.81.5 | |
| React / React DOM | **19.1.0** | fixado em `pnpm-workspace.yaml` |
| Reanimated | 4.x | usa `react-native-worklets/plugin` |
| pnpm | 10.6.5 | `node-linker=hoisted` |
| Node | ≥ 20.19 | |
| Gradle | 8.14.3 | aceita Java até 24 |
| JDK para build | **17** | Temurin; a do Android Studio costuma ser nova demais |
| CMake/ninja (Android SDK) | ninja 1.10.2 | limite de 260 caracteres, ver 4.8 |

### 2.2 A regra do React que já custou duas sessões

**A versão do React é acoplada ao SDK do Expo.** SDK 53 / RN 0.79 → React 19.0.0.
SDK 54 / RN 0.81 → React **19.1.0**.

O pin vive em `pnpm-workspace.yaml`:

```yaml
overrides:
  react: 19.1.0
  react-dom: 19.1.0
```

**`overrides` no campo `"pnpm"` do `package.json` é ignorado silenciosamente pelo
pnpm 10.** Tem que ser no `pnpm-workspace.yaml`. Sem aviso, sem erro — só não
funciona.

Sintomas de pin errado:

- pin desatualizado → `Incompatible React versions: react: (vazio), react-native-renderer: 19.1.0`
- duas cópias de React → `Invalid hook call`

`pnpm run setup` confere as duas coisas e compara com o `peerDependencies.react`
do `react-native`. **Use `pnpm run setup`, não `pnpm setup`** — `setup` é comando
reservado do pnpm.

---

## 3. Como rodar

| Quero | Comando |
|---|---|
| Laboratório do engine no navegador | `pnpm dev:lab` |
| App no navegador (react-native-web) | `pnpm dev:web` |
| App no celular por cabo USB | `pnpm dev:android` |
| Instalar o app no celular | `pnpm dev:build` |
| Testes | `pnpm test` |
| Tipos | `pnpm typecheck` |
| APK de release | `pnpm apk` |

**80% do trabalho acontece no navegador.** Engine no `dev:lab`, telas no
`dev:web`. O aparelho só entra para o que exige toque, brilho no escuro e mesa
com gente.

Os scripts do mobile passam por **lançadores em Node** (`apps/mobile/scripts/`) e
não por uma linha de shell no `package.json`. Motivos concretos, todos pagos:

1. `set VAR=1 && cmd` no `cmd.exe` captura o espaço antes do `&&`, o valor vira
   `"1 "` e o Expo recusa com `GetEnv.NoBoolean: 1  is not a boolean`. A forma
   POSIX `VAR=1 cmd` não existe no Windows. **Nenhuma linha só funciona nos dois
   sistemas.**
2. `--offline` é mutuamente exclusivo com `--localhost` no CLI, mas a variável
   `EXPO_OFFLINE` faz o mesmo e convive com ele.
3. `spawn` com `shell: true` no Windows parte `C:\Program Files\nodejs\node.exe`
   no espaço do "Program Files".

**Se você acrescentar um script em `apps/mobile/package.json`, acrescente também
o atalho na raiz.** Já aconteceu de existir só no app e o usuário receber
`Command "dev:build" not found`.

---

## 4. O histórico de defeitos — causa-raiz de cada um

Esta é a seção mais valiosa do arquivo. Cada item já consumiu horas.

### 4.1 `react-native@0.79.2` fantasma
Symlinks pendurados em `packages/engine/node_modules` e `apps/lab/node_modules`
apontando para um `.pnpm` removido. Conserto: apagar essas pastas + `pnpm install`.
O passo 1 do `setup.mjs` hoje detecta isso.

### 4.2 Bundle falhando aos 98,5% depois de 186 s
129 imports com extensão `.js` no engine apontando para arquivos `.ts`.
**O TypeScript (`moduleResolution: Bundler`) aceita, o Vite e o Vitest aceitam —
o Metro NÃO reescreve `./x.js` para `x.ts`.** Por isso os testes passavam e o app
travava. Regra: **imports relativos no engine não levam extensão.**

### 4.3 `TypeError: fetch failed`
O CLI do Expo consultando a tabela de versões do SDK. Nada aqui precisa de rede.
Conserto: `EXPO_OFFLINE=true` nos lançadores.

### 4.4 Tela azul, `failed to construct manifest from response`
O Apache do EnterpriseDB escutando em `0.0.0.0:8081` (IPv4) enquanto o Metro
escutava em `:::8081` (IPv6). Os dois sobem sem erro; o aparelho fala IPv4 e
recebia o HTML do Apache. **Um conflito de porta que não se anuncia como conflito
de porta.** Conserto: sondar a porta em `127.0.0.1` antes de subir.

### 4.5 WakeLock estourando no web
A primeira tentativa (trocar a tag do hook) não fez nada. O conserto real foi
`activateKeepAwakeAsync`/`deactivateKeepAwake` imperativos dentro de um
`useEffect` guardado por `Platform.OS === 'web'`.

### 4.6 `Project is incompatible with this version of Expo Go`
O Expo Go da loja carrega **um SDK por vez** e acompanha o mais novo. Não é bug
do projeto. Saída definitiva: `pnpm dev:build` (development build).

### 4.7 `Unable to resolve module ./index.ts` no build Gradle
**Causa:** o Expo aponta o `serverRoot` do Metro para a raiz do monorepo quando
acha um `pnpm-workspace.yaml`. O plugin Gradle do RN passa `--entry-file`
relativo ao `root` dele (`apps/mobile`); o CLI do Expo resolve relativo ao
`serverRoot`. Os dois discordam e o build morre **depois de onze minutos**.

**Tentativa que parecia certa e estava errada:** forçar
`config.server.unstable_serverRoot = projeto` no `metro.config.js`. Isso conserta
o lado do Gradle e **quebra o servidor de desenvolvimento**, porque o CLI do Expo
continua calculando a URL por conta própria e anuncia
`apps/mobile/index.ts.bundle` — o aparelho recebe **404**.

**Conserto certo:** `EXPO_NO_METRO_WORKSPACE_ROOT=1`. É o interruptor oficial,
lido pelo próprio CLI em `getMetroServerRoot`, e alinha **as duas pontas de uma
vez**: servidor, manifesto e `export:embed`. Vive em `apps/mobile/.env` e também
nos três lançadores.

> **Atenção:** `.env` está no `.gitignore` global. Existe uma exceção explícita
> `!apps/mobile/.env` para este arquivo. Sem ela, um `git clone` novo volta a
> receber 404 no aparelho.

### 4.8 `Filename longer than 260 characters` (ninja)
O pior caso medido tinha 298 caracteres. Três medições eliminaram as saídas
óbvias, nesta ordem:

1. **`LongPathsEnabled` do registro já está em 1** nesta máquina e não adianta:
   o ninja 1.10.2 não declara `longPathAware` no manifesto, então o Windows não
   aplica long path a ele. **Não há o que configurar no sistema.**
2. **O ninja mede o caminho RELATIVO** ao diretório de build (entra nele com
   `-C`). Encurtar `buildStagingDirectory` não muda nada.
3. **O que pesa é o caminho absoluto da FONTE**, que o CMake embute no nome do
   objeto trocando o `:` do drive por `_`. Com `node_modules` na raiz do
   monorepo, eram 56 caracteres antes de `node_modules/`.

**Conserto:** `pnpm apk` e `pnpm dev:build` se relançam a partir de um
`subst W: <raiz>` (`apps/mobile/scripts/caminho-curto.mjs`). Prefixo de 56 → 2
caracteres, pior caso 298 → 244. Não move o repositório, não exige
administrador, e o mapeamento some ao reiniciar. É por **relançamento** e não por
`cwd`: quem monta os caminhos é o autolinking do Expo e o plugin Gradle, e ambos
partem do caminho do próprio script.

### 4.9 `Unable to resolve module @jogo/engine` (só no build a partir de `W:`)
O link que o pnpm cria guarda o caminho absoluto de origem, em `C:`. A resolução
saía do drive virtual e o Metro recusava o que estava fora das suas raízes.

**Tentativa insuficiente:** acrescentar a raiz real ao `watchFolders`. Não bastou.
**Conserto:** `metro.config.js` resolve os pacotes do monorepo **por caminho**,
montando `extraNodeModules` a partir de `packages/*/package.json`. Pacote novo
entra sozinho e funciona em qualquer drive.

### 4.10 `Unable to load script` / `loadJSBundleFromAssets` no aparelho
Dois erros meus empilhados:

1. **`--dev-client` num projeto que não tem `expo-dev-client`.** O Expo abria um
   deep link `werewolf://expo-development-client/?url=...` que o app não entende.
   Nada acontecia e o Metro esperava um pedido que nunca chegava.
2. **Desviar o Metro de porta não resolve.** Um app de debug do React Native
   procura o servidor em `localhost:8081` **e só ali** — o número está cravado no
   framework, e a própria mensagem de erro dele diz isso. Com a 8081 do PC
   ocupada, o app batia nela, recebia a resposta do outro programa e caía para o
   bundle embutido, que no debug não existe.

**Conserto:** `adb reverse` aceita portas diferentes dos dois lados.
`adb reverse tcp:8081 tcp:<porta livre>` — o aparelho continua pedindo 8081 e o
túnel entrega onde o Metro subiu. **Ninguém precisa liberar porta nem ser
administrador.** E o app é aberto por `adb shell monkey`, não por deep link.

### 4.11 `dev:build` subindo Metro próprio
`expo run:android` sem `--no-bundler` sobe um Metro na 8081 anunciando o IP da
rede local, ignorando porta e `adb reverse`. Hoje `dev-build.mjs` usa
`--no-bundler`, compila, instala e entrega o servidor ao `dev-android.mjs`.

### 4.12 `"ignoreDeprecations": "6.0"` no `tsconfig.json`
Alguém acrescentou; o TypeScript 5.9 recusa esse valor e **o typecheck inteiro do
app parava**. Removido: não silenciava nada, só quebrava.

### 4.13 Área segura ignorada pelas 14 telas
O `SafeAreaProvider` existia desde o começo **sem nenhum consumidor**. O rodapé
da Home ficava por baixo da barra de navegação do Android. Conserto no
`Ambiente`, uma vez, para todas: o fundo segue sangrando até a borda física, só o
conteúdo recua.

### 4.14-B Ícone da função do PRÓXIMO jogador piscando na passagem
`useEffect` com `[indice]` resetava a etapa DEPOIS da renderização, e o React
pintava um quadro com a passagem nova e a etapa antiga (`agir`) — que mostra o
ícone da função. Quem segurava o celular via a função do próximo por um quadro.
Conserto: ajustar o estado DURANTE a renderização (padrão do React para derivar
estado de props). **Não volte para `useEffect`.**

### 4.14 `width: undefined` numa `Image` (só no navegador)
No `react-native-web` a imagem cai no tamanho intrínseco do arquivo. O papel
cobria 241px de uma carta de 307px, e a faixa escura que sobrava **parecia um
elemento de interface**, não um defeito. No aparelho o mesmo código tila certo.
Use `width: '100%'`.

### 4.15 `pointerEvents` é de `ViewStyle`, não de `ImageStyle`
As rampas de luz ficam dentro de uma `View` com `pointerEvents="none"`. Uma
`Image` por cima da tela inteira engole os botões.

---

## 5. Armadilhas das FERRAMENTAS (para a IA, não para o projeto)

Coisas que me atrapalharam e que vão atrapalhar você.

- **Heredoc do Bash colapsa `\\` para `\`.** Escrever JS/TS com `\\n` dentro de
  `cat > arquivo <<'EOF'` produz uma quebra de linha real no meio de uma string e
  um `SyntaxError`. Use a ferramenta `Write`, ou `python` lendo de arquivo.
- **Heredoc do Bash trunca acima de ~200 linhas**, com
  `unexpected EOF while looking for matching`. Conteúdo longo: `Write` num
  arquivo temporário e `cat >>`.
- **Acentos passam bem no heredoc; barras invertidas não.** Caí nisso três
  vezes. Regra sem exceção: **script com barra invertida vai pela ferramenta
  `Write`.** Em Python, monte caminho com `os.path.join(*rel.split('/'))`.
- **Screenshot do painel pode falhar com "the page did not finish rendering
  in time" quando a janela do Claude está atrás de outra.** Não é erro de
  app: tentar de novo resolve. E a primeira compilação web depois de mexer
  no engine estoura o tempo da navegação — um `curl` em
  `/index.ts.bundle?platform=web` esquenta o cache antes.
- **`str.replace` do Python com `\\n` não casa** com template literal de JS que
  tem `\n` de verdade.
- **`tail -40` num log de build longo esconde o erro.** O bloco
  `* What went wrong:` pode estar centenas de linhas acima. Use `grep -A`.
- **Screenshot do aparelho:** `adb exec-out screencap -p > arquivo.png` e depois
  a ferramenta `Read`. É a forma mais rápida de conferir tela de verdade.
- **O `adb reverse` cai quando o aparelho reconecta.** Um erro vermelho de
  "Unable to load script" no meio de uma sessão que funcionava é quase sempre
  isso. `adb reverse --list` mostra vazio; refazer resolve.
- **Painel do navegador OCULTO congela `requestAnimationFrame`.** Toda animação
  para no quadro inicial; como as telas embrulham o conteúdo em `Aparicao`
  (começa em `opacity: 0`), a captura sai **preta** com o DOM inteiro presente.
  `document.visibilityState` mente e responde `"visible"`. Antes de investigar
  tela preta, `tabs_select` para trazer o painel à frente. O erro do
  `javascript_tool` denuncia: *"The Browser pane is currently hidden."*
- **`Pressable` do RN Web não reage a evento sintético.** `pointerdown` e
  `mousedown` despachados por `javascript_tool` no nó do `Pressable` não
  disparam `onPressIn` — o "segure para revelar" não é testável assim.
- **O painel do navegador tem dois sistemas de coordenada.** O quadro do
  screenshot é maior que o viewport emulado, e o que parece "faixa colorida na
  borda esquerda da página" é a área da janela em volta. **Já perdi tempo
  caçando um bug que não existia.** Clique por `ref` (de `find`/`read_page`),
  não por pixel.
- **Estados anteriores ficam no DOM no `react-native-web`.** Um `ref` de tela
  anterior continua existindo e o clique falha com "outside the viewport".
  Refaça o `find` depois de cada navegação.
- **Toque longo no navegador:** não há press-and-hold nas ferramentas. Dá para
  simular despachando `pointerdown`, esperar, `pointerup` via `javascript_tool`.
  Funcionou para o "segure para revelar".
- **`Stop-Service` exige administrador** e a sessão não tem. Entregue o comando
  ao usuário em vez de insistir.

---

## 6. A identidade visual

### 6.1 O documento original ("Luz de Vela")

Referência cultural: **Leste europeu e Bálcãs, século XIX** — a origem folclórica
real do lobisomem, não uma escolha estética. Vocabulário: `vârcolac` (romeno),
`vukodlak` (sérvio/croata), `strigoi`.

**Paleta — onze cores, todas com procedência material:**

```
Fuligem      #14100D   preto de fumo de vela
Nogueira     #3A2A1C   viga envelhecida
Ferrugem     #6B4A32   ferro forjado oxidado
Linho Cru    #D9CDB4   tecido não tingido
Chama        #F0C97A   centro da vela
Cera         #E0B75C   cera de abelha
Folha de Ouro#C9A227   ícone ortodoxo
Garança      #A32620   linha de bordado
Sangue Seco  #6E1F1F   morte, perigo
Índigo       #1F3550   tinta de tingimento
Horezu       #2E5545   esmalte de cerâmica
```

**Uso semântico:** Garança = ação/acusação/votação · Sangue Seco = morte ·
Cera/Chama = informação revelada · Folha de Ouro = vitória · Índigo = noite e
fantasmas · Horezu = proteção · Linho Cru = texto.

**Luz, por física:** uma fonte só, queda ao quadrado da distância, sombra quente
(nunca cinza nem azul), sem contraluz, tremulação de 2–4% só em tela de momento.

**Legibilidade no escuro (condição de uso, não acessibilidade):** sem branco
puro; contraste ≥ 4.5:1 em operação; alvos ≥ 48px; nunca cor sozinha; transição
máxima de 250ms.

**O que nunca fazer:** tipografia gótica (marcador nº 1 de fantasia genérica),
pergaminho de banco de imagem, glow uniforme, lua cheia com lobo uivando, sombra
cinza/azul, fantasy art, vermelho neon e roxo, pentagrama ou runa nórdica,
textura em tela de operação.

### 6.2 A CORREÇÃO DE DIREÇÃO — 2026-09-11

O documento original aposta em **colagem de material real** (fotografia e
escaneamento). As três primeiras folhas foram geradas exatamente assim e o
usuário recusou: **"ficaram muito realistas, não combina com a pegada do jogo"**.

Ele está certo, e há uma razão concreta além do gosto: textura fotográfica a
390pt de largura, no escuro, com o brilho baixo, vira marrom indistinto. E um
jogo de roda precisa ser convidativo antes de ser atmosférico.

**A correção não trocou a âncora cultural, trocou o meio:**

| Camada | Antes | Agora |
|---|---|---|
| Figurativa (ícones) | fotografia recortada | **xilogravura desenhada** |
| Material (fundo, superfície) | fotografia em primeiro plano | fotografia como **substrato**, 10–24% |

Gravura popular do Leste europeu é tinta sobre papel grosso e linho — então o
material fotografado **não foi jogado fora**: ele virou o papel em que a gravura
é impressa.

> **Erro meu, registrado de propósito:** o prompt das três primeiras folhas dizia
> "fotografia de catálogo de museu, NÃO ilustração". O gerador entregou
> exatamente o pedido. A falha foi de direção, não de execução. Quando o
> resultado vier "certo e errado ao mesmo tempo", suspeite do pedido antes do
> modelo.

---

## 7. O sistema visual implementado

Detalhe completo em `docs/SISTEMA_VISUAL.md`. O essencial:

### 7.1 As cinco camadas do `Ambiente`

```
1. Fuligem      preto de base
2. Material     superfície fotografada — só grão, 10% a 24%
3. Véu          a cor da fase
4. Halo         a chama: fonte única, alta, fora do quadro, queda ao quadrado
5. Sombra       topo e rodapé, para o texto ter onde pousar
```

**O halo e as sombras são PNG de rampa** (`scripts/gerar-gradientes.py`), não
Views. A versão anterior desenhava a luz com dois círculos de `borderRadius` e
eles apareciam como anéis na tela — exatamente o "halo perfeito" proibido. As
rampas são branco com alfa; a cor entra por `tintColor`.

**Por que não `expo-linear-gradient`:** é módulo nativo, entraria um
`expo run:android` inteiro no caminho, e ainda assim não faz queda radial física.
O PNG faz as duas coisas de graça.

### 7.2 Momento × operação

```tsx
<Ambiente tipo="momento" />    // revelação, passagem, amanhecer, morte, fim
<Ambiente tipo="operacao" />   // setup, baralho, jogadores, votação, biblioteca
```

Em `operacao`: material desligado, véu a 40%, halo a 30%. A razão é de uso —
textura em tela de operação custa legibilidade justo quando ela vale mais. E há o
segundo efeito: poupar a textura faz ela **pesar** quando aparece.

> **Havia dois sistemas de luz no app.** O `ui.tsx` tinha um `TelaMomento`
> próprio, com os círculos de borda dura, e o `Ambiente` tinha o dele. Telas
> diferentes acendiam de jeitos diferentes — é isso que faz um app parecer
> montado de pedaços. Hoje `TelaOperacao` é invólucro fino sobre `Ambiente`, e
> `TelaMomento` foi removido (não tinha nenhum uso fora do próprio arquivo).

### 7.3 O bordado

`components/Bordado.tsx` desenha ponto-cruz ponto a ponto, a partir de uma trama
declarada como texto (`r` = Garança, `c` = Cera, `n` = Nogueira, `.` = vazio).
Cada ponto preenchido vira uma `View`. A marca tem 13 × 13 células e usa 60
pontos. O motivo é **dado**, não desenho: trocar a arte é editar a string.

- `MARCA` — losango da Vila com a roda solar do Dia no centro. Juntos são a
  aposta da partida: a vila chegar ao amanhecer.
- `faixa(largura)` — a barra repetida da carta.
- `MarcaViva` — a marca com a opacidade oscilando. **Não gira:** bordado não
  gira, está costurado no pano.

### 7.4 A carta de função

**Inverte a regra de cor do resto do app, de propósito.** Em toda outra tela o
texto é claro sobre Fuligem, porque o app é usado no escuro. Na carta o objeto
citado é papel, e papel tem **tinta escura** — é o que a torna reconhecível como
coisa, e não como painel.

Três coisas fazem a carta ler como objeto, nenhuma é enfeite: o corpo mais claro
que a tela; a sombra projetada (único lugar do app com sombra, porque é o único
com objeto solto); a barra bordada na cor da facção, que identifica o lado antes
de qualquer texto e cumpre "nunca cor sozinha".

Papel envelhecido (`#4A3A2C` sob a textura) para não virar clarão: carta branca
acesa no escuro fere o olho e ilumina o rosto de quem age.

### 7.5 Afordância ≠ tamanho

Os `−` e `+` do baralho sempre tiveram alvo de 44 × 48, dentro do mínimo da
identidade. O que faltava era moldura: no escuro, sinais soltos leem como texto e
a pessoa aperta o nome da função.

---

## 8. O banco de assets

### 8.1 O que existe

| Pasta | Conteúdo |
|---|---|
| `assets/images/` | as folhas de contato cruas, como vieram do gerador |
| `assets/textures/` | 20 materiais fatiados |
| `assets/icons/recortes/` | 20 objetos com alfa |
| `assets/fundos/` | 6 fundos de tela |
| `apps/mobile/assets/` | o subconjunto que o app usa |

> **O Expo não serve arquivo de fora da pasta do app.** Apontar para
> `../../assets` dá `Unable to resolve manifest assets` e o app abre sem ícone
> nem fonte. O que o app usa tem que ser **copiado** para
> `apps/mobile/assets/`.

### 8.2 O fatiador

`scripts/fatiar-assets.py`. Detecta as calhas em vez de dividir a largura por 5 —
o gerador não devolve a proporção pedida e as células não ficam iguais.

**Caso especial que vai acontecer de novo:** no bloco de recortes, um objeto alto
(o espelho) desce e encosta na linha de baixo da coluna vizinha; na folha inteira
não sobra nenhuma linha totalmente verde e a grade some. A saída foi procurar as
linhas **dentro de cada coluna**.

**Chave de cor:** fundo verde-croma `#00B140`. A escolha é técnica — nenhuma das
onze cores da paleta chega perto; o mais próximo, Horezu `#2E5545`, é escuro e
dessaturado. Branco comeria o linho e a cera; preto comeria o feltro. O alfa cai
de forma gradual na faixa de transição e o resíduo verde é descontado do próprio
pixel, senão sobra franja.

### 8.3 A folha de ícones — SUPERADO em 2026-09-11: fatiada e aplicada

Ver registro da sessão (12). Fica abaixo o estado como chegou, para contexto de
quem precisar refazer o recorte.

#### 8.3 (original) A folha de ícones (chegou em 2026-09-11, **ainda não fatiada**)

`assets/images/ChatGPT Image 11 de set. de 2026, 13_16_53.png`, 1215 × 1295.
Xilogravura, fundo verde-croma. **Veio em 5 colunas × 5 linhas (a última com 4)**,
e não no 6 × 4 pedido — o fatiador precisa disso.

A ordem bate exatamente com a lista do `ASSETS_A_GERAR.md`. Mapeamento para os
ids do engine, da esquerda para a direita, de cima para baixo:

```
 1 feixe de trigo .............. aldeao
 2 olho no losango ............. vidente
 3 duas pegadas ................ detetive
 4 frasco com cruz ............. medico
 5 escudo de tábuas ............ guarda-costas
 6 chave de ferro .............. xerife
 7 ossos cruzados .............. necromante
 8 cruz ortodoxa ............... padre
 9 machadinha ................... cacador
10 caneca entornando ........... taverneiro
11 roca de fiar ................ ancia
12 dente de lobo ............... lobo
13 pegada com garras ........... alfa
14 pote com fumaça ............. feiticeiro
15 gradil de costelas .......... lobo-carnical
16 pegada dissolvendo .......... lobo-sombra
17 corneta de caça ............. uivador
18 dente partido ............... lobo-branco
19 dois frascos ................ bruxa
20 moeda entre dedos ........... ladrao
21 selo de cera quebrado ....... coringa
22 ferradura ................... sobrevivente
23 laço de corda ............... bobo
24 pena escrevendo ............. vingador
```

Destino: `apps/mobile/assets/roles/<id>.png`, registrado em
`src/theme/materiais.ts` com `require` **estático** (caminho montado em variável
não é empacotado pelo Metro — e o app abre sem a imagem, sem erro nenhum, que é
pior).

**O complemento de variante continua vindo de `motivos.ts`.** O desenho é da
função base; a variante é uma marca geométrica no canto. É o que mantém a conta
em pé: são 24 funções e mais de 40 variantes — função nova custa um desenho,
variante nova custa zero.

### 8.4 A logo — SUPERADO em 2026-09-11: aplicada, com ressalva que continua valendo

`assets/images/Captura de tela 2026-09-11 133058.png` (122×150) nunca foi usada
diretamente — baixa demais. Em vez disso, a pegada foi extraída na resolução da
própria folha do Bloco 4 (o mesmo desenho do ícone do Alfa, ~170×210, chave de
cor limpa) e virou `assets/icons/logo.png` / `apps/mobile/assets/logo.png`,
aplicada na `HomeScreen`.

**A ressalva do parágrafo original continua de pé:** mesmo na resolução da
folha, é baixa demais para um ícone de loja de verdade (que pede algo perto de
1024×1024). Aplicar como marca de tela é uma coisa; virar `icon.png`/
`adaptive-icon.png` do `app.json` é outra, e essa ainda exige gerar a pegada em
alta resolução — não feito.

---

## 9. O engine — o que já está de pé

- **24 funções base** (11 vila, 7 lobos, 6 solitários) + Amantes, com variantes.
- **Resolução noturna em 11 etapas de precedência**, ordem fixa, uma função por
  etapa, cada uma registrando **o que fez e por quê**:
  `estado-inicial · evento · bloqueio · interferencia-espectral · protecao ·
  perfuracao · ataque · resolucao-mortes · estertores · ressurreicao · informacao`
- 16 eventos, 5 módulos de fantasma, 4 modos, 10 sementes de fábrica.
- Votação, empate, execução, vitória em camadas, simulação em massa com bots.
- `turn/roteiro.ts` decide **o que perguntar a cada jogador** na passagem,
  incluindo os toques falsos. Isso é regra, não interface — por isso função nova
  não exige tela nova.

**Quatro invariantes que o resto depende:**

1. A **etapa 11 lê o estado do início da noite**, nunca o resultado — senão a
   informação vazaria quem morreu.
2. **Todo sorteio passa pelo RNG semeado** (`utils/rng.ts`, xmur3 + mulberry32).
   A mesma semente reproduz a partida inteira, não só o setup.
3. **Estertor dispara com morte por qualquer causa** — por isso a cadeia mora
   fora do pipeline noturno: o Caçador linchado atira igual.
4. **Efeitos de "na próxima noite" vivem numa fila tipada**, em vez de um campo
   por mecânica.

### 9.1 Balanceamento

`balance/weight-calculator.ts`. Hoje `MULTIPLICADOR_POR_FAIXA` é **2.6 fixo**
(antes era 1.8/1.6/1.4 por faixa). O peso da Anciã é **+2** (definido pelo
usuário).

**Ordem que importou:** primeiro consertei o instrumento de medida (os bots
passaram a convergir num suspeito e a usar a informação verdadeira do Vidente),
só depois recalibrei. **Calibrar com bot burro mede o bot, não o jogo.**

**Limitação conhecida e não resolvida:** o modelo não consegue calibrar os pesos
da vila enquanto os bots não converterem poder em vitória. Está documentado no
próprio arquivo.

---

## 10. Como o usuário trabalha — preferências observadas

Registrado porque muda o modo de responder, e não sobrevive à troca de contexto.

- **Português, sempre.**
- **Quer o porquê, não só o quê.** Decisão sem justificativa é rejeitada.
- **Odeia repetição de tentativa.** A frase literal foi
  **"PARE DE RODAR EM CIRCULOS"**, dita depois de eu contornar um problema de
  porta três vezes em vez de resolver a causa. Quando um conserto não pega duas
  vezes, **pare e ache a causa-raiz** — não tente a quarta variação.
- **Prefere que o problema seja eliminado a contornado.** A pergunta dele —
  *"por que ao invés de contornar você não mata o que tem lá?"* — era a resposta
  certa e eu não tinha considerado.
- **Quer verificação, não instrução.** Entregar "tente rodar aí" quando dá para
  rodar e conferir é falha. Captura de tela do aparelho vale mais que descrição.
- **Prompt inicial do projeto proibia instalar qualquer coisa** sem entregar os
  comandos ao final para ele aprovar. Essa regra valia para o arranque; ele já
  instalou e já roda coisas sozinho, mas **a cautela com instalação continua
  sendo o padrão da casa.** Pergunte antes.
- **Ele documenta e commita por conta.** Não commite sem pedido.

### 10.1 Rumo declarado (2026-09-11)

Palavras dele: *"faremos um redesign total, tiraremos a cara genérica de IA e
ambientaremos o jogo definitivamente, para depois irmos colocando conteúdo nele,
mas a base deve estar muito forte e o design deve ser único e 100% criado e
estilizado por nós"*.

Leia isso como dois compromissos: **base sólida antes de conteúdo** e **nada de
solução visual genérica** — inclusive as minhas.

---

## 11. Pendências abertas

| Item | Estado |
|---|---|
| Fatiar a folha de 24 ícones e aplicar nas telas | SUPERADO 2026-09-11 — feito, ver 12 |
| Logo aplicada na Home | SUPERADO 2026-09-11 — feito; regerar em alta resolução para ícone de loja continua pendente, ver 8.4 |
| Plugins pedidos (`superpowers`, `context7`, `frontend-design`, `figma`) | SUPERADO 2026-09-11 — instalados via `claude plugin install <nome>@claude-plugins-official` no Bash (funciona neste ambiente; a nota anterior de que `/plugin` não existia estava certa só para o slash-command dentro da conversa). **Ficam inativos na sessão que os instalou** — só carregam depois de reiniciar a sessão do Claude Code |
| Redesign total / ambientação definitiva | **em andamento** — 4 direções propostas em canvas, aguardando escolha do usuário. Ver 12 |
| Calibrar pesos da vila | bloqueado até os bots converterem poder em vitória |
| Modo Traição perdeu a ferramenta de coordenação | o sussurro foi removido a pedido; nada o substituiu |
| Conferir no aparelho: contador do baralho e fio de luz dos botões | conferidos só no navegador |
| Keystore própria para publicar na loja | não existe; o release é assinado com a de depuração |

---

## 12. REGISTRO DE SESSÕES

> Acrescente aqui, sempre, ao terminar. Mais recente embaixo.
> Formato: data · o que mudou · o que quebrou · o que ficou para trás.

### 2026-09-11 — infraestrutura Android e primeira repaginação

**O que foi feito**

- Build de APK fechado de ponta a ponta pela primeira vez (75,9 MB,
  `BUILD SUCCESSFUL`), depois de resolver a cadeia `serverRoot` →
  limite de 260 caracteres → resolução de `@jogo/engine` entre drives.
- Jogo rodando no aparelho físico (SM_A346M) via development build, com o
  bundle servido pelo Metro: `Android Bundled 12946ms index.ts (1416 modules)`,
  zero erro de JS no logcat, confirmado por captura de tela.
- `EXPO_NO_METRO_WORKSPACE_ROOT=1` substituiu o `unstable_serverRoot`, que
  consertava o Gradle e quebrava o servidor.
- `adb reverse tcp:8081 tcp:<porta livre>`, `--no-bundler` no `dev:build`,
  abertura do app por `am start`.
- Área segura aplicada no `Ambiente` — consertou as 14 telas de uma vez.
- Documento `ASSETS_A_GERAR.md` com 4 blocos e prompt pronto de cada um.
- Três folhas geradas, fatiadas e aplicadas (20 texturas, 20 recortes, 6 fundos).
- Correção de direção: fotografia vira substrato, figurativo vira xilogravura.
- Sistema de luz unificado; rampas viraram PNG; bordado em ponto-cruz; carta de
  papel com tinta escura; afordância do contador do baralho.
- `docs/SISTEMA_VISUAL.md` criado.

**O que quebrou no caminho, e ficou registrado**

- `unstable_serverRoot` consertando um lado e quebrando o outro (4.7).
- Três tentativas de contornar a porta 8081 antes de olhar a causa (4.10) — foi
  o que gerou o "pare de rodar em círculos".
- `"ignoreDeprecations": "6.0"` derrubando o typecheck (4.12).
- `width: undefined` no `react-native-web` (4.14).
- Um bug que **não existia**: faixa colorida na borda do navegador que era a
  janela, não a página (seção 5).

**O que ficou para trás**

- A folha de 24 ícones chegou no fim da sessão e **não foi fatiada nem
  aplicada**. Mapeamento pronto em 8.3.
- A logo chegou em 122 × 150, resolução insuficiente.
- Os quatro plugins pedidos não puderam ser instalados neste ambiente.

### 2026-09-11 (mesmo dia, sessão seguinte) — ícones, logo, plugins, início do redesign

**O que foi feito**

- **Auditoria completa do projeto**, sem alterar nada, antes de qualquer mudança
  — pedido explícito do usuário. Confirmou a estrutura descrita nas seções 1-9
  deste arquivo continuava batendo com o código.
- **Plugins instalados**: `superpowers`, `context7`, `frontend-design`, `figma`
  — `@claude-plugins-official`, escopo user, via `claude plugin install
  <nome>@claude-plugins-official` no Bash. O `/plugin install` como slash
  command digitado na conversa **não** dispara isso — vira texto puro; o CLI
  precisa ser chamado por fora. **Não confirmado se já carregaram nesta sessão**
  (`ToolSearch` não achou skills novas dos 4 plugins depois de instalar) —
  suspeita forte de que só ativam depois de reiniciar. Confirme numa sessão nova.
- **Folha de ícones (Bloco 4) fatiada e aplicada.** Veio em grade real **5×5**
  (24 preenchidas + 1 vazia), não 6×4. Alguns ícones são DOIS blobs
  desconectados por desenho (as duas pegadas do Detetive, o dente partido do
  Lobo Branco, o selo partido do Coringa, os dois frascos da Bruxa, a pena +
  rabisco do Vingador) — detecção automática de grade (`fatiar-assets.py`)
  não bastou; as 24 caixas foram medidas por componente conexo
  (`scipy.ndimage.label`) e escritas à mão em `scripts/fatiar-icones-roles.py`,
  com merges explícitos onde o ícone é uma peça só conceitualmente. Saída:
  `assets/icons/roles/<id>.png` + `apps/mobile/assets/roles/<id>.png`.
  - Engine ganhou `complementoDe(roleId, varianteId)` (só o complemento da
    variante, sem o motivo base) — `packages/engine/src/data/motivos.ts` e
    exportado em `index.ts`.
  - App ganhou `apps/mobile/src/components/IconeDeRole.tsx`
    (`IconeDeRole`/`IconeDeRoleVivo`): desenha o PNG da função e, se houver
    variante, um selo geométrico no canto (reaproveitando `Peca`, exportado de
    `Motivo.tsx`). O ícone NÃO é tingido por `tintColor` — é arte de tinta fixa;
    a distinção de facção continua vindo da barra bordada e não do ícone.
  - Os 10 pontos de uso do `Motivo`/`MotivoVivo` no app foram trocados por
    `IconeDeRole`/`IconeDeRoleVivo`: `CartaDeRole`, `Biblioteca`, `Baralho`
    (2×), `Passagem`, `Amanhecer`, `Discussão`, `Execução`, `Fim`.
- **Logo aplicada.** A pegada do Bloco 4 (mesma arte do ícone do Alfa, na
  resolução da folha — melhor que o screenshot de 122×150 que só existia antes)
  virou `assets/icons/logo.png` / `apps/mobile/assets/logo.png` e substituiu o
  `MarcaViva` na `HomeScreen`. **`MarcaViva`/`Bordado.tsx` ficaram sem uso** —
  não apagados, podem voltar a servir no redesign.
- **Verificação real, não só typecheck**: `pnpm typecheck` limpo nos 3 pacotes,
  63 testes do engine passando, e um `expo start --web` de verdade (porta 8083,
  não-interativo) bundlou 1063 módulos sem `Unable to resolve`, com os 9
  caminhos de asset novos presentes no bundle — só então o servidor foi
  encerrado.
- **Início do redesign total**: por pedido do usuário
  (*"comece propondo, mas deixe com várias opções... seja original e
  principalmente seja extremamente bonito e convincente"*), li
  `docs/identidade.htm` inteiro (não só o `SISTEMA_VISUAL.md`, que é o resumo
  de implementação) e montei um canvas de design (skill `design`) com **4
  direções**, cada uma com mockup de Home + Carta de função, em telas de
  celular reais (340×720), usando os assets de verdade (os 24 ícones, a logo,
  as texturas):
  - **A — Xilogravura Popular** (`Main.dc.html`, recomendada): continuação
    refinada do caminho já aprovado no dossiê. PT Serif + PT Sans (a escolha já
    documentada na identidade, com suporte a cirílico).
  - **B — Livro de Caça**: o app como dossiê/registro de vila selado, papel
    dominando a tela em vez de só a carta. Spectral + IBM Plex Sans.
  - **C — Ícone Sacro**: moldura de talha dourada, simetria de ícone ortodoxo,
    vermelho no lugar do âmbar. Cormorant Garamond + PT Sans.
  - **D — Sombra e Entalhe**: a mais radical — quase sem ornamento, uma brasa
    só, tipografia enorme, logo como silhueta de fundo. Literata + IBM Plex
    Sans.
  - Publicado em `https://claude.ai/code/artifact/3cc6fa9c-4461-49b6-8853-86126139eef5`.
  - **Aguardando o usuário escolher** antes de aplicar em todas as telas —
    não fiz a escolha por ele.

**Decisão registrada, para não ser redescoberta**

- O usuário pediu "tirar a cara genérica de IA", mas `docs/identidade.htm`
  (lido inteiro nesta sessão) já é incomumente rigoroso contra isso — a seção
  11 já veta tipografia gótica, glow uniforme, lua-lobo, fantasy art, neon,
  pentagrama genérico. **A leitura correta não é jogar a base fora**: é que a
  EXECUÇÃO até agora (símbolos Unicode geométricos como ícone, telas
  escuras sem personalidade própria) não estava à altura do documento. As 4
  direções propostas são execuções distintas do MESMO anchor cultural, não
  4 temas aleatórios.

**O que ficou para trás**

- Escolha da direção pelo usuário.
- Depois de escolhida: aplicar em todas as telas (não só Home + Carta).
- Confirmar se os 4 plugins já carregaram (provável que precise reiniciar a
  sessão).
- Logo em alta resolução para ícone de loja (`icon.png`/`adaptive-icon.png`)
  continua sem existir — o que foi aplicado hoje é a marca dentro do app, não
  o ícone do sistema Android.

### 2026-09-11 (continuação, mesma sessão) — fontes de verdade + primeira aplicação da mistura A+B

**O que foi feito**

- **PT Serif e PT Sans de verdade, bundladas.** `assets/fonts/` estava vazio
  (ver 8.1 antigo); agora tem as 4 faces de cada família
  (Regular/Bold/Italic/BoldItalic), baixadas do próprio repositório
  `google/fonts` no GitHub (`raw.githubusercontent.com/google/fonts/main/ofl/
  ptsans/` e `.../ptserif/`, arquivos `PT_Sans-Web-*.ttf` e
  `PT_Serif-Web-*.ttf`) — TrueType de verdade, licença OFL incluída
  (`OFL-PTSans.txt`, `OFL-PTSerif.txt`). **Achar o link certo deu trabalho**:
  `fonts.googleapis.com/css2` só devolve `.woff2`; UA de navegador antigo
  (Chrome 17 no Linux) devolve `.woff`; UA de IE6 devolve um link de "EOT"
  disfarçado de `.ttf` — nenhum serve para `expo-font`. O caminho que funciona
  é pegar o arquivo fonte no próprio repositório do Google Fonts no GitHub.
- **Armadilha real corrigida**: o Android **não sintetiza itálico nem negrito**
  de fonte customizada de forma confiável — o texto só fica "normal", sem
  aviso. `typography.ts` foi reescrito para nunca usar `fontStyle`/`fontWeight`
  sobre uma face só: cada estilo aponta direto para o arquivo que já É itálico
  ou já É negrito (`familia.serifItalico`, `familia.sansBold`, etc.). Dois
  lugares que ainda faziam `fontStyle: 'italic'` por cima de `corpoSerif`
  (`ExecucaoScreen.tsx`, `AmanhecerScreen.tsx`) foram corrigidos para
  `familia.serifItalico`.
- **Carregamento**: `App.tsx` usa `useFonts` do `expo-font` com um objeto
  `FONTES_A_CARREGAR` (exportado de `theme/typography.ts`) e segura a tela em
  Fuligem lisa até carregar — sem tela de loading separada, porque o fundo já
  é a mesma cor do `app.json`.
- **Primeira aplicação real da mistura pedida pelo usuário — "A com bem mais
  influência de B"**:
  - `HomeScreen.tsx`: a logo agora é um **selo de cera** (`SeloDaMarca`, local
    ao arquivo — Views em camada, sem lib de gradiente, mesma lógica do
    `Motivo.tsx`) — o toque de Livro de Caça (B) dentro de uma tela que
    continua sendo Xilogravura Popular (A: brasa do `Ambiente`, título em
    `PTSerif-Bold` de verdade, faixa bordada reaproveitando `faixa()` de
    `Bordado.tsx`). Uma linha de pauta fina separa o corpo do rodapé de
    botões — outro toque B, mínimo.
  - `CartaDeRole.tsx`: seis pontinhos vermelhos na margem esquerda, como
    costura de página encadernada — acento B pequeno de propósito; a barra
    bordada continua sendo quem identifica a facção primeiro.
- **Verificação**: `pnpm typecheck` limpo; `expo start --web` de verdade
  (porta 8085) bundlou 1093 módulos sem `Unable to resolve`, com as fontes
  referenciadas no bundle. **Não consegui tirar screenshot de verdade** —
  sem `chromium-cli` instalado e sem aparelho Android conectado
  (`adb devices` veio vazio). Ficou só verificação estrutural (bundle +
  tipos), não visual. Registrado para quem continuar: `adb exec-out
  screencap -p` é o caminho já validado (seção 5) assim que houver aparelho
  plugado.

**O que ficou para trás, explicitamente**

- Verificação visual de verdade (screenshot) — pendente de aparelho conectado
  ou de rodar localmente.
- Os acentos B (selo, pauta, costura) só existem em Home e na Carta. As
  outras telas herdam a fonte e as cores automaticamente (mesmo sistema de
  tema), mas não têm acento bespoke ainda — é a próxima extensão natural se
  a direção for aprovada.
- Logo em alta resolução para `icon.png`/`adaptive-icon.png` continua sem
  existir (ver 8.4) — não há ferramenta de geração de imagem nesta sessão
  para produzir isso do zero; precisa vir do usuário ou de upscale
  algorítmico (qualidade inferior) como placeholder.

### 2026-09-22 — linha branca na carta: calha da folha de contato

**O defeito relatado**

> "arruma essa merda aqui fica com uma linha branca em cima e embaixo"

Carta de função com uma tira clara na borda de cima, de baixo **e nas laterais**.

**Causa-raiz — não estava no componente, estava no ARQUIVO da textura**

O recorte de `papel-encardido.png` carregava uma tira da calha branca da folha
de contato nas quatro bordas. Medido antes:

```
linha  0 : [229.5 205.2 169.7]     col 0  : [238.5 222.9 197.9]
linha  1 : [205.5 163.0 105.0]     col -1 : [240.1 225.2 201.4]
miolo    : [213.5 176.1 120.4]
linha -1 : [245.6 236.8 223.4]   <- quase branca
```

O detector de grade do `fatiar-assets.py` usa `quase_branco = (a > 233).all()`.
Os pixels de transição entre a calha e o material **caem abaixo de 233 primeiro
no canal AZUL** — papel e linho são creme, o azul despenca antes do vermelho —
então a transição passa por conteúdo e entra no recorte.

Isso é invisível enquanto a textura é usada em opacidade baixa, e fica gritante
quando ela vai a `resizeMode="repeat"`: **cada emenda de ladrilho desenha a
tira clara**. Na carta (240×320) cabe pouco mais de um ladrilho da amostra
(235×260), então a tira aparece na borda e na emenda.

**Conserto, em três camadas**

1. `aparar_borda()` novo em `scripts/fatiar-assets.py`: compara cada linha e
   coluna de borda com a mediana do miolo (60% centrais) e remove o que se
   afasta mais que 14, com teto de 8% por lado. Depois: papel com desvio de
   borda ~10 (era ~101).
2. `Material` ganhou `modo: 'ladrilho' | 'cobrir'`. A carta usa `cobrir` —
   uma amostra esticada, **nenhuma emenda por construção**. `ladrilho`
   continua sendo o certo para superfície grande, onde a emenda se perde.
3. `raio={20}` do papel contra `borderRadius: 4` da carta deixava meia-lua do
   corpo escuro em cada canto. Removido: a carta já recorta com
   `overflow: 'hidden'`.

**Regressão encontrada de brinde — seleção de folha por ordem alfabética**

`fatiar-assets.py` pegava `sorted(os.listdir('assets/images'))[0], [1], [2]`.
Funcionou enquanto só havia as três folhas. Quando o usuário largou ali a folha
de ícones e um print da logo, **"Captura de tela ..." virou o primeiro item** e o
script tentou fatiar um print de 122×150 como se fosse a folha de 20 materiais.
Nada foi sobrescrito (a checagem de contagem de células barrou), mas nada foi
corrigido também — e a mensagem de erro não dizia o porquê.

`assets/images/` é a pasta onde o usuário **joga imagem nova**. Tratar a ordem
dela como contrato é errado por construção. Agora existe um dicionário `FOLHAS`
no topo do script, com nome de arquivo explícito e erro que diz o que fazer.

**Armadilhas de ferramenta — duas, e uma delas eu quase persegui como bug**

- **Caí de novo na do heredoc.** Escrevi `\\n` dentro de `python - <<'PY'` e o
  Bash colapsou para `\n` real, gerando `SyntaxError: unterminated f-string`.
  Já estava documentado na seção 5. **Para string com barra invertida, use a
  ferramenta `Write`, não heredoc.**
- **NOVA, importante: com o painel do navegador OCULTO, o
  `requestAnimationFrame` não avança.** Toda animação fica congelada no quadro
  inicial. Como cada tela embrulha o conteúdo em `Aparicao` (que começa em
  `opacity: 0`), **o app inteiro aparece preto nas capturas** — DOM completo,
  texto presente, tudo invisível. Eu cheguei a escrever que era um defeito do
  app antes de achar a causa. O sinal claro veio do erro do `javascript_tool`:
  *"The Browser pane is currently hidden."* **Antes de investigar tela preta,
  `tabs_select` para trazer o painel à frente.**
  `document.visibilityState` responde `"visible"` mesmo assim — não confie nele.

**Verificação feita**

- `pnpm typecheck` limpo.
- Medição das 26 texturas e fundos: papel saiu da lista de borda suspeita. Os
  que sobraram (`papel-queimado`, `bordado-vermelho`, `barbante`, `remendo`,
  `bordado-preto`, `osso`, `dia`, `vitoria`) têm borda legitimamente diferente
  do miolo — é o desenho do material, não calha.
- **Visual de verdade**, no `dev:web` (porta 8090, config `app` do
  `.claude/launch.json`): app percorrido até a Passagem e, para ver a carta
  isolada, ela foi renderizada **temporariamente** na Home, fotografada e a
  alteração **revertida** (backup em `.scratch`, typecheck limpo depois).
  Papel uniforme de borda a borda, sem tira clara e sem meia-lua nos cantos.

**O que ficou para trás**

- **`SegurarParaRevelar` não é acionável por evento sintético no RN Web.**
  `pointerdown`/`mousedown` despachados no `Pressable` (o div com
  `tabindex="0"`, 375×716) não disparam `onPressIn`. O caminho que funcionou
  para ver a carta foi renderizá-la fora do fluxo. Se alguém precisar testar o
  gesto no navegador, isso continua em aberto.
- Aparelho Android não estava conectado (`adb devices` vazio), então **a
  correção não foi conferida no aparelho** — só no navegador. O papel é o mesmo
  arquivo, mas `resizeMode` tem histórico de divergir entre web e nativo (ver
  4.14).
- As outras texturas continuam em `ladrilho` onde são usadas; nenhuma delas
  está numa superfície pequena hoje, mas a emenda existe e vai aparecer se
  alguma for para um painel pequeno. Use `modo="cobrir"` nesses casos.

### 2026-09-22 (continuação) — Amantes removidos, variantes visíveis, prompt de variantes

**Amantes: removidos por inteiro, e com eles o conceito de "modificador"**

Pedido literal do usuário: *"tire os amantes"*. Não foi só apagar a role — os
Amantes eram a **única** razão de existir do conceito de modificador, então
manter `RoleModifier`, `MODIFICADORES` e `Deck.modificadores` vazios deixaria um
vocabulário inteiro sem nenhum membro. Removido tudo:

- `data/roles/solitarios.ts` — o objeto `amantes` e `MODIFICADORES`
- `data/roles/index.ts` — `MODIFICADORES_POR_ID` e os exports
- `types/role.ts` — a interface `RoleModifier`
- `types/config.ts` — o campo `Deck.modificadores`
- `types/player.ts` — a marca `'amante'` e o vínculo `amanteDe`
- `setup/create-game.ts` — o sorteio do par
- `turn/roteiro.ts` — o bloco "Seu amor" (e a variante Amor Cego)
- `resolution/estertor-chain.ts` — o Amor Proibido (morrer de tristeza)
- `victory/win-conditions.ts` — a camada `'amantes'` do `VictoryLayer`
- `balance/weight-calculator.ts` — os dois laços sobre `deck.modificadores`
- `balance/deck-generator.ts`, `simulation/calibragem.ts`,
  `simulation/batch-runner.ts`
- `data/motivos.ts` + `index.ts` — `MOTIVO_AMANTES`
- App: `FimScreen` ("Só o amor sobreviveu"), `BibliotecaScreen` (seção
  Modificadores), `store/jogo.ts`
- Laboratório: `StatePanel` (o ♥) e `SimulationPanel` (a barra rosa)
- Testes: `catalogo.test`, `win-conditions.test`, `estertor-chain.test`,
  `batch-runner.test`, `voting.test`, `night-pipeline.test`,
  `weight-calculator.test`

**Método que valeu a pena:** apagar primeiro a definição e deixar o
`pnpm -r typecheck` apontar os 13 pontos restantes, um por vez. Mais rápido e
mais seguro que caçar por `grep`. Verificado: typecheck limpo nos 3 pacotes,
**61 testes do engine + 10 do app passando**.

> Se alguma coisa voltar a citar Amantes, é resíduo — a decisão foi remover, não
> desativar.

**Biblioteca: as variantes agora se anunciam na lista fechada**

O pedido foi *"faça lá aparecer as variantes"*. Elas **já** eram renderizadas ao
tocar na função — o que faltava era saber que existiam. Agora a linha fechada
mostra `3 VARIANTES ▾` ou `SEM VARIANTES`, e o estado aberto diz explicitamente
"Esta função ainda não tem variantes."

O vazio precisa ser dito: **17 das 24 funções não têm variante nenhuma**.
Silêncio ali lê como "não carregou", não como "não existe".

Verificado na tela (`dev:web`, porta 8090): 7 funções com contagem + 17 com
"sem variantes" = 24; zero ocorrência de "amante" ou "modificador" no texto
renderizado.

**Desequilíbrio de conteúdo, agora explícito**

Todas as 22 variantes existentes estão na **vila** (Aldeão 3, Vidente 4,
Detetive 3, Médico 3, Guarda-costas 3, Padre 3, Caçador 3). **Lobos e
solitários não têm nenhuma.** Quem monta baralho hoje tem profundidade de um
lado só. É o que o próximo documento existe para corrigir.

**`docs/VARIANTES_A_CRIAR.md` — prompt pronto para outra IA**

Contém: o contrato TypeScript de `RoleVariant`, as 11 etapas com a precedência
real que elas implicam, a tabela de calibragem de peso (variante enfraquecida =
base − 1, fortalecida = base + 1, teto 4), **8 alavancas** de variante
(alcance, frequência, atraso, publicidade, ruído, custo, momento, condição),
as regras duras (uma frase; nada de texto livre; nada de comunicação secreta —
o sussurro foi cortado e não volta), o tom de nomes, um exemplo real do Padre
comentado, e as 17 funções com o que cada uma faz hoje.

No fim tem uma checklist para **quem recebe** a resposta: id sem acento, peso é
absoluto (`pesoEfetivo` substitui, não soma), toda variante precisa de
complemento em `motivos.ts` (há 4 prontos: `MENOS`, `DUPLO`, `ATRASO`,
`PUBLICO`), variante que muda `etapa` muda precedência, e recalibrar depois
(`M = 2.6` foi medido com o catálogo atual).

**Armadilha de ferramenta — terceira vez no mesmo buraco**

Escrevi `p = R + '\\' + rel.replace(...)` dentro de `python - <<'PY'` e o Bash
colapsou para `'\'`, gerando `SyntaxError: unexpected character after line
continuation character`. **Já está documentado na seção 5 e eu caí de novo.**
A regra prática, agora sem exceção: **script com barra invertida vai pela
ferramenta `Write`, nunca por heredoc.** Use `os.path.join(*rel.split('/'))`
em vez de montar caminho com `\`.

**Outra, nova:** o screenshot do painel falha com *"the page did not finish
rendering in time"* quando a janela do Claude está atrás de outra. Não é erro
de app nem de bundle — **tentar de novo resolve**. E a primeira compilação web
depois de mexer no engine estoura o tempo da navegação: `curl` no
`/index.ts.bundle?platform=web` esquenta o cache e a próxima carga funciona.

**O que ficou para trás**

- As variantes ainda não existem: o documento é o pedido, não a entrega.
- Recalibragem do balanceamento depois que elas chegarem.
- Nada foi conferido no aparelho (`adb devices` vazio).

### 2026-09-25 — patch de regras: 11 dos 14 itens do pedido

O usuário mandou uma lista de 14 melhorias. Este bloco cobre 11; os 3 que
faltam estão no fim, nomeados.

**Uma regra do dossiê foi MUDADA por decisão do usuário**

`victory/win-conditions.ts`: os lobos agora vencem ao **superar** a vila, não
ao igualar. O dossiê dizia "igualar ou superar". Empate numérico encerrava a
partida cedo demais e tirava da vila o dia de votação que ela ainda tinha.

Não gera partida infinita: no 1 × 1 a noite seguinte resolve. Três testes
afirmavam a regra antiga e foram reescritos para a nova — não silenciados.

**Causas-raiz encontradas, uma por item**

| O que o usuário viu | A causa real |
|---|---|
| Coringa não recebe missão | A missão ERA sorteada em `criarPartida` e **nunca chegava à tela**. `objetivosSecretos` não tinha nenhum consumidor na interface |
| Vingador não escolhe na noite 1 | `perguntarA` devolve toque falso para `etapa === 'estado-inicial'`, e `criarPartida` sorteava o alvo em silêncio. A role existia sem nenhuma decisão |
| Vila Amaldiçoada não funciona | O gancho `derrotaDaVila` só era chamado em `simulation/play-game.ts`. **Nunca no app.** O prazo jamais vencia numa partida de verdade |
| Traição começa com lobos | O modo não tinha `aoCriarPartida`: herdava o baralho normal, com matilha completa. "Todos começam na vila" era falso |
| Detetive pisca uma tela e some | A informação era entregue com `rodada` e lida na passagem da rodada SEGUINTE. Chegava um dia depois de a Vidente ter pago o voto por ela |
| Revisão bugada | A tela calculava `largura` para a barra do índice e **não desenhava a barra** — variável morta. E nome + descrição lado a lado se espremiam em coluna de poucos caracteres |
| Sombra esquisita no baralho | `backgroundColor: dentro ? '' : '#1A1613'` — string vazia não é cor. Sem superfície opaca, o `elevation` do Android desenha a sombra solta e deslocada (ele ignora `shadowOffset`) |
| Baralho Surpresa não mostra roles | A composição trocava em silêncio: só o contador no topo mudava |
| Carta some ao soltar o dedo | `soltar()` fazia `setRevelado(false)` sem condição |

**Bug que ninguém tinha reportado e estava lá**

`eventoDaNoite` **nunca era zerado**. O evento sorteado na noite 1 continuava
valendo em todas as noites seguintes — cinco etapas leem esse campo (cota da
matilha, anula-protecoes, silencia-role, cancela-etapas). Uma matilha que
pegasse "Noite Sem Lua" na noite 1 ficaria sem matar a partida inteira. Agora a
etapa 1 limpa, que é literalmente o trabalho dela.

**A escolha dupla dos lobos (Feiticeiro, Alfa, Lobo Sombra)**

Tipo de pergunta novo: `opcao-e-alvo`. O jogador escolhe COMO agir e, quando a
opção pede, EM QUEM. Cada opção carrega a própria `etapa` — atravessar perfura,
caçar ataca — porque são etapas diferentes do pipeline.

- **Feiticeiro**: atravessar a cura **mata de uma vez**. A perfuração dele
  passou a contar como ataque da matilha em `08-resolucao-mortes.ts`; sem isso
  escolher atravessar removia a proteção e **ninguém morria** — o poder custava
  a noite e não fazia nada.
- **Alfa**: converter ou caçar.
- **Lobo Sombra**: ficar imune a investigação ou caçar.
- Gasto o poder de uma vez por partida, sobra caçar como qualquer lobo — antes
  a role virava toque falso.

**A cota de uma morte por noite JÁ estava certa.** `alvosDaMatilha` agrega os
votos dos lobos, o mais votado morre e o empate vai a sorteio pelo RNG semeado.
Conferi antes de mexer; não precisou de mudança.

**Leitura na mesma noite — e por que não fura a invariante**

Módulo novo `turn/leitura.ts`, com `leituraDeFaccao` e `respostaImediata`. A
etapa 11 passou a importar a mesma `leituraDeFaccao` — **uma implementação
só**, porque duas divergiriam e a divergência seria invisível (o jogador veria
uma coisa, o log registraria outra).

É correto porque a etapa 11 lê o estado do INÍCIO da noite e, no instante da
passagem, nada foi resolvido ainda: o estado atual É o estado inicial. Quem
atrasa de propósito continua atrasando — Vidente dos Sonhos e o Delegado
(revista pública, anunciada no amanhecer).

**Verificado na tela** (`dev:web`, partida real até a noite 1)

- Revisão: `+2.6 EQUILIBRADO` com a barra e o centro marcado; cartas legíveis.
- Baralho: sombra deslocada sumiu; Surpresa lista as cartas.
- Detetive Elza comparou Ana e Davi → **"Ana e Davi não são da mesma facção"**,
  na mesma tela, e correto (Davi é o Lobo Branco).
- `pnpm -r typecheck` limpo; **62 testes do engine + 11 do app** passando.

**Vazamento de estado entre testes, descoberto de brinde**

`zerar()` em `apps/mobile/src/store/jogo.test.ts` não zerava o MODO — e o modo
vive em `config`. O teste da Traição deixava `modo: 'traicao'` ligado para todos
os que vinham depois. Ficou invisível enquanto a Traição tinha lobos; quando ela
passou a começar sem nenhum, o teste seguinte quebrou com
`Cannot read properties of undefined`. Agora `zerar()` força `modo: 'classico'`.

**Não verificado na tela, só por tipos e testes**

O baralho sorteado não tinha Feiticeiro, Alfa, Lobo Sombra, Coringa nem
Vingador, então a escolha dupla, o segredo do Coringa e o juramento do Vingador
**não foram vistos rodando**. Vila Amaldiçoada e Traição também não foram
jogadas. Quem pegar isto: monte o baralho à mão com essas funções.

**Os 3 itens que NÃO foram feitos**

1. **Arrastar jogadores para reordenar.** Precisa de gesto de arrastar em lista
   — `react-native-gesture-handler` já está instalado, mas a lista atual é um
   `ScrollView` simples e virar lista arrastável é refatoração, não ajuste.
2. **Multi-seleção no "Montar o meu"** (marcar funções permitidas sem definir
   número, e o app sortear 6 entre elas). Precisa de um estado novo no store
   (um conjunto de "permitidas") e de um gerador que respeite o conjunto —
   `gerarBaralho` hoje não aceita restrição de catálogo.
3. **Eventos toda manhã, em tela própria antes das mortes.** O sorteio já
   funciona e o `eventoDaNoite` agora é limpo a cada noite, mas a tela separada
   e a garantia de "toda manhã" não foram feitas. Hoje a frequência vem de
   `config.frequenciaEventos` (o padrão é `raro`) e o anúncio se mistura ao
   Amanhecer.

**Tom do `VARIANTES_A_CRIAR.md` mudado a pedido**

De entrega para **colaboração**: a IA propõe 3 variantes por função, espera
aprovação, e o que for reprovado volta com alavanca diferente. Ela não escreve
o catálogo final; pergunta antes de inventar; pode discordar uma vez.

### 2026-09-25 (continuação) — os 3 itens que tinham ficado para trás

Eu havia deixado três itens de fora alegando que eram refatoração. O usuário
mandou fazer. Estão feitos.

**1. Arrastar jogadores para reordenar**

`components/ListaArrastavel.tsx`, novo, genérico, sem dependência nova.

`PanResponder` + `Animated` do próprio React Native, e **não**
`react-native-gesture-handler` — que está instalado, mas exige `GestureDetector`
em árvore própria e não se comporta igual no `react-native-web`. Esta é tela de
setup, e 80% do trabalho aqui acontece no navegador.

A conta toda depende de uma suposição: **todas as linhas têm a mesma altura**.
Com altura fixa, o destino é `round(dy / altura)` e não é preciso medir nada
durante o arrasto — que é o que costuma travar lista arrastável em aparelho
fraco. `ALTURA_DA_LINHA = 56` na tela de jogadores (48 de alvo + 8 de respiro);
**se mudar a altura da linha, mude a constante junto** ou o arrasto passa a
errar o destino.

A **cor acompanha o nome, não a posição** — ela é o que identifica a pessoa na
votação e no amanhecer. Trocar a cor ao reordenar renomearia todo mundo em
silêncio.

O detalhe da linha virou `1º a receber o aparelho` em vez de `Jogador 1`: a
ordem não é enfeite, é a ordem em que o celular circula na mesa.

**Verificado de verdade:** arrastei Ana duas posições para baixo no `dev:web` e
a ordem virou Bruno, Célia, Ana, Davi, Elza, Fábio.

**2. Sortear entre as funções escolhidas**

Três camadas:

- `gerarBaralho` ganhou `permitidas?: readonly string[]`. Cada grupo (lobos,
  solitários, vila) cai para o que o host permitiu; **grupo que ficaria vazio
  volta ao catálogo inteiro daquele grupo**, de propósito: sem nenhum lobo
  permitido não existe partida, e o app prefere desobedecer a restrição a
  entregar mesa impossível. Sem solitário marcado, nenhum é forçado.
- Store: `permitidas`, `alternarPermitida`, `limparPermitidas`,
  `sortearEntrePermitidas`. Semente nova a cada toque — o host toca até gostar,
  e repetir a mesma composição não serviria de nada. A semente da PARTIDA é
  outra e continua vindo do setup.
- Tela: losango marcador em cada linha (alvo de 44px, desenho de 16px) e o
  painel "Sortear entre as escolhidas" acima do Limpar.

**Verificado:** marquei Aldeão, Vidente, Médico, Caçador, Lobo, Alfa e Bruxa;
o sorteio devolveu Lobo ×2, Aldeão, Médico ×2, Vidente — tudo dentro do
conjunto, nada de fora, com a leitura "Matilha forte" no topo.

**3. Evento em tela própria, antes das mortes**

`screens/day/EventoScreen.tsx` + rota `Evento`. A passagem manda para lá quando
a noite teve evento **narrado**; a própria tela segue para o Amanhecer se não
houver.

**Só evento narrado tem tela.** Dos dezesseis, dois são silenciosos de
propósito — a Névoa Cerrada cala a Vidente sem avisar ninguém — e mostrá-los
destruiria a razão de existirem: é a mistura de narrado e silencioso que impede
a mesa de deduzir o evento pelo efeito.

Por que separado do Amanhecer, e não mais uma seção nele: o evento é a **regra
que mudou**, a morte é a **consequência**. Empilhados, a frase do evento virava
rodapé de uma tela que já tinha um nome próprio gritando no meio. Em separado, a
mesa ouve a regra antes de saber o preço.

O Amanhecer passou a filtrar `origem !== 'evento'` dos anúncios: sem isso a
mesma frase apareceria duas vezes seguidas, e a segunda rouba o peso da
primeira.

**`DEFAULT_CONFIG.frequenciaEventos` mudou de `raro` para `frequente`**
(20% → 45%). Com `raro`, quatro em cada cinco manhãs não tinham evento e o
sistema inteiro — dezesseis eventos, efeitos que atravessam cinco etapas —
parecia desligado para quem joga. A calculadora de peso já compensa a
frequência (`ajusteDeConfiguracao`), então isto não desequilibra a mesa.
Continua ajustável no setup.

**Bug de dados encontrado PELO TESTE novo**

`evento.test.ts` exige narração em todo evento marcado como narrado. O evento
**`delacao` era narrado e não tinha narração nenhuma** — não existia frase para
alguém ler em voz alta, e a tela cairia no texto de regra. Corrigido.

O mesmo arquivo cobre o vazamento de `eventoDaNoite` entre noites, que eu havia
consertado na sessão anterior **sem teste**. Agora tem.

> **Teste instável é pior que teste nenhum.** A primeira versão do teste de
> vazamento dependia de o sorteio acertar (0.8 de chance) e falhava uma vez a
> cada cinco execuções. Foi reescrito pondo o evento à mão. Teste que falha por
> azar ensina a ignorar o vermelho.

**Estado final**

`pnpm -r typecheck` limpo · **66 testes do engine + 11 do app**.

**O que continua sem verificação visual:** Feiticeiro, Alfa, Lobo Sombra,
Coringa e Vingador (o baralho sorteado nunca os trouxe juntos), Vila
Amaldiçoada e Traição em partida real, e a `EventoScreen` desenhada — a cadeia
de dados dela está coberta por teste, a tela em si não. Monte o baralho à mão
com essas funções para fechar.

### 2026-09-25 (terceira leva) — vazamento de informação, poderes adiados, composição oculta

**O defeito mais grave que este app já teve, e era meu**

Relato do usuário, jogando de verdade: *"na passagem de celular piscou
rapidamente o símbolo do Uivador, que a Elza era realmente"*.

Causa: em `PassagemScreen`, o reset da etapa era um `useEffect` com `[indice]`.
**Efeito roda depois da renderização.** Quando o índice mudava, o React pintava
um quadro com a passagem NOVA e a etapa ANTIGA (`agir`) — e a tela de agir
mostra o ícone da função de quem está com o aparelho. Quem ainda segurava o
celular via, por um quadro, a função do próximo.

Num jogo de dedução social isso não é glitch visual: é a partida inteira.

Conserto: **ajustar o estado durante a renderização**, o padrão documentado do
React para derivar estado de props que mudaram. O React descarta a saída e
re-renderiza na hora, sem nunca pintar o quadro intermediário.

> **NÃO troque de volta por `useEffect`, por mais que o lint peça.** O comentário
> no arquivo diz isso, e está lá por este motivo.

Verificado: uma leitura do DOM **imediatamente após o clique de confirmar**, sem
espera nenhuma, já devolve "PASSE O APARELHO PARA Bruno" — nunca a tela de ação
dele.

**Poderes de estado passaram a valer na NOITE SEGUINTE**

Xerife, Taverneiro (bloqueio) e Lobo Sombra (imunidade a investigação).

A razão é a ordem real do jogo: **as passagens acontecem antes de
`resolverNoite`**, e a leitura da Vidente e do Detetive agora aparece na própria
passagem. Um poder aplicado "nesta noite" só alcançava quem ainda não tinha
passado — quem já viu a resposta, já viu. O Lobo Sombra sendo o último a receber
o aparelho tinha uma imunidade que não protegia de nada.

Implementação:

- Dois efeitos adiados novos em `types/effect.ts`: `bloqueado-na-noite` e
  `imune-investigacao`.
- **`prepararNoite(estado)`**, novo, em `night-pipeline.ts`: avança a rodada,
  **limpa as marcas da noite anterior** e **aplica o que estava engatilhado** —
  tudo antes de o roteiro ser montado. O store chamava
  `{ ...estado, rodada: rodada + 1 }` na mão, e era por isso que marcas
  sobreviviam de uma noite para a outra.
- As etapas 3 e 5 passaram a `agendar` em vez de `marcar`.

> **Quem for mexer em rodada: use `prepararNoite`.** Incrementar `rodada` na mão
> pula a limpeza das marcas e a aplicação dos efeitos.

**O Lobo Sombra se escondia todas as noites**

`usoLimitado` dele sempre foi `por-partida: 1`, mas **`gastarUso` só era chamado
nas etapas 4, 5 e 10**. Quando eu roteei o `esconder` dele para a etapa
`informacao` (sessão anterior), o uso deixou de ser consumido e o poder virou
ilimitado. Agora o esconderijo resolve na etapa 5 e gasta o uso lá.

> Cuidado ao dar etapa nova a uma role com uso limitado: **confira se a etapa de
> destino chama `gastarUso`.** Hoje só 4, 5 e 10 chamam.

**O Uivador ganhou a segunda opção que a carta sempre prometeu**

A carta dizia "revela publicamente um lobo — ou a si mesmo" e **não havia como
escolher isso**: o app só perguntava em quem a matilha matava. Agora ele escolhe
entre uivar e caçar; o uivo substitui a caçada, anuncia à mesa e agenda
`matilha-mata-n: 2` para a noite seguinte, que é o preço escrito na carta.

Isso exigiu `alvosPorOpcao` na `Pergunta`: o Uivador delata um **lobo**, e a
mesma role, escolhendo caçar, mira **fora** da matilha. Sem isso ele só
conseguiria delatar quem não é lobo.

**Cartas que descreviam outra role**

`lobo-sombra.descricaoLonga` dizia *"Na noite seguinte, a matilha não mata"* —
não tem nada a ver com imunidade a investigação. Era texto de outra role,
copiado. Reescrita, junto com a do Uivador.

**Composição oculta**

`config.composicaoOculta`. Com ela ligada o setup mostra `?` no lugar das
contagens, a revisão não lista as cartas (mas **continua mostrando o índice de
equilíbrio** — ele é sobre balanço, não sobre quem é quem), e cada um descobre
só a própria função na noite 1.

O Baralho Surpresa e o "Sortear entre as escolhidas" **acendem a opção
sozinhos**: é literalmente o que "surpresa" quer dizer. O host pode desligar no
mesmo painel.

Muda o jogo de verdade — sem a composição, a mesa não conta quantos lobos faltam
nem deduz por eliminação. Por isso é escolha, não padrão.

**`docs/EVENTOS.md`**

Os 16 eventos listados para o usuário peneirar, com família, gatilho,
visibilidade, efeito e narração. Inclui uma seção de onde a mecânica briga com o
resto do jogo (duas noites "mortas", dois eventos que punem a vila pelo mesmo
comportamento, um que só dispara se alguém provocar).

**Testes reescritos, não silenciados**

Dois testes do pipeline afirmavam bloqueio na mesma noite. Viraram três: um que
prova que **não** vale na noite da declaração, um que prova que vale na
seguinte, e um novo para `prepararNoite` limpar as marcas.

**Estado final:** `pnpm -r typecheck` limpo · **68 testes do engine + 11 do app**.

**O que continua sem verificação visual:** Feiticeiro, Alfa, Lobo Sombra,
Uivador, Coringa, Vingador, Vila Amaldiçoada, Traição e a `EventoScreen`
desenhada. O baralho sorteado nunca trouxe essas funções juntas — monte à mão
para fechar.

### 2026-09-26 — as 61 variantes que eram só texto, e os cinco poderes-base quebrados que elas revelaram

**O pedido:** "você falou que implementou as variantes mas não funcionam? isso é
inútil, faça todas elas estarem corretas e funcionando perfeitamente."

Estava certo. Na sessão anterior 51 variantes entraram no catálogo como DADO —
nome, descrição, peso, ícone — e nenhuma tinha comportamento. Somadas às 22 que
já existiam, eram **73 variantes e 12 mecânicas**.

#### O que isso escondia: cinco poderes BASE que nunca funcionaram

Implementar as variantes obrigou a ler cada etapa linha a linha, e foi aí que
apareceu o que nenhum teste pegava. Não são regressões desta sessão — são
defeitos antigos que ninguém tinha motivo para procurar:

1. **A conversão do Alfa não existia.** O roteiro oferecia "Converter" e
   NENHUMA etapa lia `escolha === 'converter'`. A carta mais cara da matilha
   (peso 4, uma vez por partida) gastava a noite e não fazia nada. A marca
   `'convertido'` em `objetivosSecretos` era escrita pelo modo Traição e não era
   lida por ninguém para decidir de que lado a pessoa estava.
2. **A poção da VIDA da Bruxa matava.** A etapa 7 tratava a Bruxa como atacante
   sem olhar qual poção ela tinha. Metade da role fazia o oposto da carta.
3. **O efeito `expira` era agendado e nunca consumido.** O Guarda-costas Escudo
   absorvia o ataque e não morria nunca — proteção infinita e de graça. O
   Carniçal, idem: imortal.
4. **`silenciado` nunca era posto em lugar nenhum.** A carta do Xerife diz "não
   age, não morre e **não fala** no dia seguinte" desde sempre; o preso falava e
   votava normalmente. `voting.ts` já sabia rejeitar `silenciado` — ninguém
   marcava.
5. **`resolverDia` saía cedo em três caminhos** (dia sem votação, nenhum voto
   válido, empate não desfeito) e o fim do dia nunca acontecia nesses casos.

> **A lição, e ela vale para o resto do repositório:** quatro desses cinco eram
> "alguém agenda e ninguém consome" ou "alguém oferece e ninguém resolve". O
> `grep` que os encontra é curto — procure o `kind` de cada `EfeitoAdiado` e
> cada `escolha` do roteiro e confirme que existe um leitor. Faça isso antes de
> escrever mecânica nova.

#### As primitivas novas

- **`types/marcas.ts`** — `Player.marcas`, estado PERSISTENTE. É o par oposto de
  `PlayerFlags`, que `fecharNoite` zera toda madrugada. Quando uma variante diz
  "pelo resto da partida", "para sempre" ou "até fulano morrer", é aqui.
  **Cuidado:** `marcar()` mexe nas flags voláteis e `gravar()` nas marcas
  persistentes. Os nomes são parecidos de propósito e usar o errado é o defeito
  mais provável desta área.
- **`turn/faccao.ts` · `faccaoEfetiva()`** — a facção que vale AGORA. Lê a marca
  `'convertido'`. Substituiu `role(p.roleId).faccao` na vitória, na leitura da
  Vidente, na lista de companheiros e na mira da matilha.
- **`steps/_mortes.ts` · `ecosDaMorte()`** — o que dispara quando alguém morre e
  não é estertor da própria role (Sangue Marcado, Última Carne, Sangue
  Acumulado). Chamado da noite E do linchamento, porque nenhuma das três cartas
  diz "à noite".
- **`steps/_protecao.ts` · `protecaoBloqueada()`** — devolve o MOTIVO de a
  proteção falhar, não um booleano: o log tem de dizer à mesa por que a cura não
  pegou, senão o host acha que o app bugou.
- **`_helpers.ts` · `roleEfetivaId()`** — a role que vale para AGIR, que nem
  sempre é `p.roleId` (Incorporação, Sombra de Alguém, Herança Amarga).

#### Etapas erradas no catálogo, que tornavam variantes inalcançáveis

Quatro variantes nunca receberiam pergunta nenhuma por causa do campo `etapa`:

- As três do **Uivador** estavam em `informacao`; o uivo é resolvido em
  `ataque`, junto da escolha entre uivar e caçar. Com `informacao`, a tela de
  duas opções não aparecia.
- Duas do **Vingador** sobrescreviam a etapa para `resolucao-mortes` e
  `protecao`. **A etapa em que o EFEITO aparece não é a etapa em que o jogador
  age** — o juramento continua sendo declarado na etapa 1, na noite 1.
- **Aldeão** Herdeiro e Testemunha agem à noite e o Aldeão base não tem etapa:
  sem uma etapa própria na variante, toque falso para sempre.
- **Anciã** Testamento e Herança Amarga precisavam de `estertores` para poderem
  declarar o alvo EM VIDA. "Ao morrer, escolhe" é impossível num pass-and-play:
  o morto não recebe mais o aparelho.

Também: `podeAgir()` lia só `role.usoLimitado` e ignorava o da variante — por
isso o Detetive Cansado agia todas as noites em vez de só nas ímpares.

#### O registro de honestidade mudou de forma

`data/variantes-implementadas.ts` era uma lista do que FUNCIONA. Virou
`VARIANTES_PENDENTES`, um mapa do que **não** funciona **com o motivo escrito** —
porque sobraram três, e "regra ainda não implementada" genérico não diz ao host
se aquilo vira a função base, uma aproximação ou nada. O app mostra o motivo
inteiro na Biblioteca.

Sobraram três, todas travadas numa pergunta de regra — e o usuário respondeu as
três na mesma sessão. **O mapa está VAZIO: as 73 variantes funcionam.**

#### As quatro decisões do usuário, 2026-09-26

| Pergunta | Decisão |
|---|---|
| Padre **Exorcista** repetia o Padre base | **Regra nova:** benze um jogador numa noite à escolha. Acertou um lobo, o lobo morre; errou, o Padre perde a moral e vira Aldeão comum. Peso 2 → 3. Resolvido na etapa 8, então proteção sobre o lobo ainda o salva — a benza não perfura. |
| Xerife **Boca Calada** repetia o Xerife base | **O Xerife BASE deixou de silenciar.** O preso comum não age e não morre, mas fala e vota; só o preso do Boca Calada perde a voz. A carta do Xerife foi corrigida junto, e o efeito `bloqueado-na-noite` ganhou o campo `calaAVoz`. |
| Ladrão **Troca com Mortos** era impossível na noite 1 | Age em **qualquer noite em que já exista um morto**. Saiu de `estado-inicial` para `informacao`, e o `case` dele em `create-game` agora não faz nada de propósito — ele começa a partida COM a carta de Ladrão. Troca a CARTA inteira, inclusive a facção. |
| **Missão Sem Volta** sem prazo definido | O prazo varia por missão E por tamanho de mesa: `prazoEmRodadas()` em `data/missions.ts`. `curto` = ⌈n/3⌉, `medio` = ⌈n/2⌉, `fim` = sem prazo. A constante fixa `PRAZO_DA_MISSAO = 3` era quase impossível numa mesa de 6 e folgada numa de 12. |

**Aldeão Teimoso**, a última que faltava, saiu por outro caminho: a regra é da
TELA (o engine recebe a votação fechada e não vê ninguém mudar de ideia), então
virou `votoTrava()` em `day/voting.ts` — **regra no engine, aplicação na tela**.
`ItemJogador` ganhou a prop `desabilitado` para isso, distinta de `morto`: uma é
estado da escolha, a outra é estado do jogador.

#### Pesos recalibrados (só os indefensáveis, a pedido)

| Variante | De → Para | Por quê |
|---|---|---|
| Vingança da Praça | 1 → **0** | A única variante estritamente mais DIFÍCIL que a própria base, com o mesmo peso. |
| Laço de Sangue | 1 → **2** | Garante a vitória no pior cenário (morrer) e leva alguém junto. |
| Sobrevivente Teimoso | 1 → **2** | Imunidade ao linchamento sem uso limitado. |
| A Qualquer Custo | 1 → **2** | Um Sobrevivente que ganha ataque deixa de ser passivo. |
| Bobo da Forca | 1 → **2** | Vence com UM voto e sem ser linchado. |
| Sangue Novo | 4 → **3** | O Alfa base mantém a habilidade do convertido para sempre; este, uma noite. |
| Morto-Vivo | 4 → **3** | O Carniçal base leva alguém junto ao morrer; este troca a morte por voz. |
| Exorcista | 2 → **3** | Regra nova, e ela mata. |

As outras 65 continuam como estavam — ver "o que ficou para trás".

#### Adaptações que eu escolhi e podem ser revertidas

Estão marcadas com comentário no código, mas ficam registradas aqui porque são
interpretação minha e não estavam na carta:

- **Alfa base** = convertido mantém a habilidade para sempre; **Sangue Novo** =
  mantém por UMA noite e depois perde. Era a única leitura que separava a
  variante da base.
- **Missão Sem Volta** (Coringa): o "prazo definido pelo app" virou a rodada 3
  (`PRAZO_DA_MISSAO`, em `night-pipeline.ts`).
- **Incorporação** e **Herdeiro** dão o PODER, nunca a facção. Herdar a carta
  inteira transformaria um Aldeão em lobo por acidente.
- **Sangue Derramado** (Carniçal) não dispara no linchamento: "quem causou sua
  morte" foi a mesa, e punir a mesa não significa nada.

#### Testes

- `resolution/variantes.test.ts` (novo, 28 casos) — um por mecânica, partida
  inteira rodando.
- `simulation/variantes-smoke.test.ts` (novo) — joga uma partida completa para
  CADA variante do catálogo e dez com variante em toda a mesa, respondendo o que
  o roteiro disser ser válido. Não verifica regra; pega o que o teste unitário
  nunca pega — efeito agendado sem leitor, alvo que não existe, `!` num morto.
  **Se o bot consegue jogar só lendo o roteiro, o app também consegue.**
- `data/variantes-implementadas.test.ts` — reescrito. Um caso novo trava o
  número de pendências em no máximo 5. Não protege contra nada hoje; protege
  contra o padrão que já aconteceu uma vez.

**Estado final:** `pnpm -r typecheck` limpo · **116 testes do engine + 11 do
app** (eram 74 + 11). **73 de 73 variantes com mecânica** (eram 12).

**Uma varredura que vale repetir:** um script curto comparou cada `id` do
catálogo com o resto do código e listou os que não têm NENHUM leitor. Achou
`jejum-forcado`, cuja marca `soLoboNaRodada` era lida na mira do Lobo Branco e
não era escrita em lugar nenhum — meia variante que parecia inteira. Rode essa
varredura depois de mexer no catálogo; ela custa trinta segundos.

#### O que ficou para trás

- **Verificação visual de tela para tela.** Só a Biblioteca foi conferida no
  navegador (as três pendências aparecem com motivo; as outras 70, sem aviso).
  Nenhuma das mecânicas novas foi vista numa partida de verdade no aparelho.
- **65 pesos ainda não revisados.** Oito foram corrigidos (tabela acima), e o
  resto continua com o peso que tinha quando a variante era só texto. A revisão
  boa é uma sessão de balanceamento com partidas simuladas para MEDIR, e não
  mais chutes — `simulation/batch-runner` já existe para isso.
- **Os três eventos inertes** (A Corda Escolhe, Delação, Vingança dos Ossos)
  continuam como estavam — ver `docs/EVENTOS.md`. Não foram tocados aqui.

### 2026-09-27 — MELHORIAS V2: o setup reescrito, e o que uma mesa de verdade encontrou

Lista de 35 itens vinda de uma partida jogada de ponta a ponta. A maioria não
era regra faltando — era **regra existindo e não chegando à tela**.

#### O setup: três modelos viraram um

Havia três maneiras de montar a mesma coisa, cada uma com a sua tela: contador
`- 0 +` por função, lista de "permitidas" para o sorteio, e o Baralho Surpresa.
Os três foram substituídos por **uma lista de cartas com sim/não** e **um
interruptor** (`config.selecaoAleatoria`).

- **`config.composicaoOculta` morreu.** SUPERADO em 2026-09-27. Ela escondia um
  baralho que a mesa tinha montado carta por carta — uma tela de `?` pedindo
  para ser espiada, e que ainda entregava QUANTAS cartas de cada tipo existiam.
  A seleção aleatória esconde de verdade: a mesa marca mais cartas do que
  cadeiras e nunca sabe quais ficaram de fora.
- **A variante virou CARTA.** `config.variantes` mapeava uma variante por
  função, então escolher a variante apagava a base — "quero o Boca Calada e não
  quero o Xerife normal" era inexprimível. Agora `Deck.variantes` é um vetor
  paralelo a `roleIds`, uma entrada por carta. `config.variantes` continua
  existindo como padrão por função, e os cenários do laboratório seguem válidos
  sem ele. **Ao embaralhar, embaralhe as POSIÇÕES** — embaralhar as roles soltas
  separa a carta da variante dela.
- **Persistência** (`store/persistencia.ts`): jogadores, seleção e config
  sobrevivem a fechar o app. A PARTIDA não, de propósito — restaurar meia noite
  com metade das ações colhidas é pior do que não restaurar. A semente também
  não volta, senão a mesa seguinte sorteia exatamente as mesmas cartas.

#### Os defeitos que a mesa encontrou e a causa de cada um

| Relato | Causa |
|---|---|
| "A Lua Cheia não funcionou" | `cotaDaMatilha` devolvia 2 certinho, mas o roteiro pedia **um** alvo por lobo e `alvosDaMatilha` só mata quem recebeu voto. Com um lobo na mesa existia um nome, e morria um. |
| "Traição acaba depois da primeira noite" | O modo começa sem lobo de propósito, e a vitória via "zero lobos vivos" e declarava a vila vencedora antes de o modo existir. |
| "O Sino cancelou a votação do dia 2, não do dia 1" | Agendava `rodada + 1`. O dia vem DEPOIS da noite **dentro da mesma rodada**. |
| "O Necromante morreu e a ressurreição não aconteceu" | `acoesDe` descartava ator morto. Ele declarou vivo; morrer na etapa 8 é acidente de ordem, não desistência. |
| "O Bobo voltou pela Cova Aberta e ganhou linchado" | A "habilidade" do Bobo É ganhar na corda. `disputaVitoriaPropria()` agora cobre `semPoder` e `virouAldeao`. |
| "Lobos ganharam com gente viva na mesa" | A paridade comparava lobos × **vila**, e Bobo/Sobrevivente/Coringa não eram vila — sumiam do placar. Agora é lobos × **não-lobos**. |
| "O Detetive Obsessivo pede dois alvos" | Obsessivo e Delegado herdavam a pergunta do Detetive base. |
| "O convertido não podia matar" | Ele mantém a carta de vila; sem uma pergunta de ataque, a conversão de um Aldeão não dava nada à matilha. |
| "O Ladrão foi aleatório" / "a Bruxa teve a poção imposta" | Os dois eram sorteados em `criarPartida`, em silêncio. Escolher É a role. Saíram do setup e viraram pergunta da noite 1. |
| "O Caçador não escolhe quem leva junto" | O engine pegava `candidatos[0]` — o primeiro vivo da lista. Ele nunca decidiu nada. O mesmo valia para o Carniçal. |

#### Regras novas dadas pelo usuário

- **Caçador Armadilha não morre**: quem cai é o nome que ele deixou armado.
  Resolvido antes da checagem de proteção — não é cura, e a perfuração do
  Feiticeiro não desarma.
- **Xerife base deixou de silenciar.** O preso comum fala e vota; só o do Boca
  Calada perde a voz. O efeito ganhou o campo `calaAVoz`. A carta do Xerife
  dizia o contrário e foi corrigida junto. (SUPERADO: o registro de 2026-09-26
  dizia que pôr `silenciado` era o conserto. Era metade dele.)
- **Noite 1 sem sangue** (`semMorteNaPrimeiraNoite`): mora em `cotaDaMatilha`,
  não numa checagem dentro da etapa 7 — zerar a cota cala a matilha inteira sem
  que as etapas 7 e 8 precisem saber da opção.

#### Informação que vazava pela FORMA da tela

Dois casos, e os dois são do mesmo tipo — o app não dizia nada, o
comportamento dizia tudo:

1. **A votação secreta pulava quem não pode votar.** A mesa via o celular passar
   por cima da pessoa e sabia na hora que ela é a Vidente, ou que está presa.
   Agora a fila é a ordem da mesa inteira e quem não vota recebe o aparelho,
   vê a mesma tela, e nela só existe "Abster-se" — com o motivo escrito, que só
   ele lê.
2. **Tela muda para quem foi impedido.** Preso, embebedado e Detetive Cansado
   recebiam a mesma tela de "a vila dorme" de um Aldeão qualquer e achavam que
   o app tinha bugado. `Pergunta.aviso` diz o motivo, e só a quem já sabe que
   tem poder.

#### O que a tela passou a mostrar

- **Nome da CARTA em todo lugar** (`nomeDaCarta`): amanhecer, execução,
  discussão, tela final e o topo da passagem. Dizer "Xerife" a quem jogou a
  noite toda de Boca Calada apaga a informação que explica o que aconteceu.
- **`Passagem.lembrete`**: Bobo, Sobrevivente, Coringa e Aldeão viam a função
  uma vez, na noite 1. Agora a carta volta atrás do "segurar para revelar" toda
  noite. Quem TEM poder e já gastou **não** recebe lembrete — dizer "você é o
  Padre" a um Padre sem usos o obrigaria a esconder a tela.
- **Duas caixas na passagem**: "Você soube" (a leitura que você pediu) e
  "Aconteceu com você" (`origem: 'app'` — o rastro do poder de outro).
  Empilhadas, o jogador lia a Vidente do Espelho como se fosse informação dele.
- **`Announcement.destaque`**: revelações que mudam a partida (Médico de Guerra,
  revista do Delegado, uivo) saem num cartão com rótulo, e não em itálico no pé
  da tela junto com "a vila velou o corpo a noite toda".

#### Armadilha nova, e ela é de tela

`recalcular` pré-visualizava o baralho cortando as **primeiras** N cartas da
seleção. A lista nasce em ordem de catálogo, que começa com a vila inteira: a
revisão anunciava "Lobos: 0, esperado ≈ 2" e sugeria "adicionar um lobo" a uma
mesa que ia sortear lobos normalmente. A prévia agora sorteia com semente
derivada do CONTEÚDO da seleção — estável enquanto o host não mexe — e a tela
diz em voz alta que é estimativa.

#### Ícones

`scripts/gerar-icones.py` gera os três a partir de `assets/app-logo.png`, que já
estava no repositório e não era usado — os ícones eram placeholders de 8 KB. As
três regras conflitam (iOS opaco, Android transparente e dentro do círculo de
66%, favicon sem margem), e é por isso que é script e não exportação à mão.

**Estado final:** `pnpm -r typecheck` limpo · **143 testes do engine + 13 do
app**. `resolution/melhorias-v2.test.ts` é novo: cada caso ali é a prova de um
defeito RELATADO em mesa, não uma regra nova. Se um deles voltar a falhar,
alguém desfez um conserto.

#### O que ficou para trás

- **`Passagem.lembrete` não foi visto na tela.** O engine devolve o texto (há
  teste), mas o `SegurarParaRevelar` dentro do `ScrollView` da passagem não foi
  conferido no navegador.
- **O Lobo Carniçal não caça com a matilha.** A `etapa` dele é `estertores`, e
  por isso ele nunca recebe a pergunta de ataque — é um lobo que não morde.
  Anterior a esta sessão e não relatado; mexer nisso é decisão de equilíbrio.
- **Pesos**: 65 variantes seguem com o peso que tinham quando eram só texto.

### 2026-09-27 (II) — MELHORIAS V3: a narração refeita, e uma CLASSE de defeito

Treze itens de outra partida jogada inteira. Desta vez apareceu um padrão que
vale mais que os itens: **três poderes de "uma vez por partida" nunca gastavam
o uso**, e ninguém tinha como perceber lendo o catálogo, porque o catálogo
estava certo.

#### A classe de defeito: uso limitado que ninguém cobra

`usoLimitado: { kind: 'por-partida', total: 1 }` é DADO. Quem cobra é a etapa,
chamando `gastarUso`. Quando a etapa esquece, a carta funciona todas as noites
e nada no repositório reclama.

Encontrados: **poção da Bruxa** (relatado em mesa), **perfuração do
Feiticeiro**, **Testemunha do Aldeão**, **Bobo da Forca**, **Troca com
Mortos**. O Lobo Sombra tinha o mesmo defeito e já havia sido corrigido em
2026-09-26 — ou seja, é a terceira vez que este erro aparece.

> **A varredura que os encontra**, e que vale repetir sempre que uma carta com
> limite entrar: liste os `id` do catálogo cujo bloco contém `'por-partida'` e
> confira, um a um, se existe um `gastarUso` no caminho daquela carta. São
> trinta segundos. O teste `uso único é uso único`, em
> `resolution/melhorias-v3.test.ts`, automatiza a pergunta para os dois casos
> mais caros — estenda a lista dele em vez de confiar na memória.

**Armadilha ao consertar**: a etapa 6 passou a recusar a perfuração sem uso, e a
etapa 8 continuou matando, porque ela lê as ações e não o resultado da etapa 6.
A correção foi ler `ctx.estadoInicial` — "ele tinha uso quando a noite
começou?". Ler `ctx.estado` ali anularia toda perfuração válida, já que a etapa
6 acabou de zerar o contador.

#### Narração: `Announcement.fase`

Relatado assim: *"a Anciã morreu na primeira noite e a mensagem dela continua
aparecendo"*. As telas filtravam anúncios só por `rodada`, e **noite e dia
compartilham o número**: tudo que a noite narrou reaparecia inteiro na tela de
Execução. `Announcement.fase` ('noite' | 'dia') é carimbado dentro de
`anunciar()` a partir de `estado.fase` — não é parâmetro de propósito, porque
são quase trinta pontos de chamada e um deles passaria a fase errada um dia.

Junto vieram os textos que o usuário chamou de "broxa":
- Ressurreição era `"Fulano voltou."` — a coisa mais rara do jogo, no tom de um
  comentário de clima. Agora é destaque com rótulo.
- Última Vela **não anunciava nada** quando a vela apagava e o ressuscitado
  voltava para a cova. O mesmo valia para o Rastro. As duas mortes de fim de dia
  eram silenciosas.
- A Anciã dizia "a vila perdeu suas forças **esta** noite" na noite em que
  morria — o efeito é da noite SEGUINTE. Todos os textos dela foram para o
  futuro.
- **Quem muda de papel é dito com o nome.** Vale para toda variante que troca a
  carta de alguém: a pessoa precisa saber que perdeu o poder, e a mesa precisa
  parar de contar com uma função que não existe mais.

#### Defeitos que só aparecem com MAIS DE UM LOBO

Dois relatos ("atravessar não funciona", "Lobo Rastro não funciona") passavam
nos meus testes isolados e falhavam em mesa. A causa dos dois é a mesma família:

- **Feiticeiro atravessando** entrava na VOTAÇÃO da matilha. Com dois lobos em
  alvos diferentes, o alvo dele ia a sorteio — metade das vezes o poder de uma
  vez por partida não acontecia. Agora ele ataca por conta própria
  (`ataqueIndividual`), fora da cota, porque o botão promete "mata de uma vez".
- **Lobo Rastro** era detectado por `atacanteId`, que guarda só o PRIMEIRO
  atacante daquele alvo. Se o Rastro não fosse o primeiro a passar o celular, a
  variante não acontecia. Agora procura o Rastro entre todos os atacantes.

> **Lição para testes**: um caso com um lobo só não exercita `alvosDaMatilha`,
> que é onde mora metade da complexidade da noite. Ao testar qualquer coisa da
> matilha, ponha DOIS lobos na mesa.

#### Cartas que passaram a trocar de verdade

`marcas.poderDe` dava a habilidade e deixava a carta antiga na mão — na tela o
jogador continuava sendo o que era, no ícone, na revelação ao morrer e na tela
final. Duas viraram troca de carta de verdade:

- **Aldeão Herdeiro** vira o morto, com a facção junto. Herdar um lobo morto faz
  dele um lobo: é o preço de uma carta que pode virar qualquer coisa da mesa.
- **Cova Aberta** devolve a pessoa como Aldeão, e não como "a Vidente sem
  poder". Isso resolveu de graça o Bobo que ressuscitava e continuava ganhando
  na corda — ele nem é mais Bobo.

`marcas.poderDe` continua existindo para o empréstimo TEMPORÁRIO (Sombra de
Alguém) e para a Incorporação, que por carta não troca de papel.

#### Vidente Confusa: duas decisões que não conversavam

A resposta imediata (na passagem) e a etapa 11 decidiam separadamente qual das
visões era a mentira. A tela mostrava as duas VERDADEIRAS e a noite seguinte
entregava a versão com a mentira — dava para achar a falsa por comparação, que é
o oposto do que a variante existe para fazer.

A etapa 11 tem o RNG semeado; a passagem não tem RNG nenhum. A saída foi **não
sortear**: `mentiraDaConfusa()` é uma função pura de semente + rodada + quem
investiga + quem foi investigado. Determinística, idêntica dos dois lados, e sem
consumir o RNG — consumir mudaria o resto da noite dependendo de a tela ter
perguntado ou não.

#### Decisões de regra do usuário

| Carta | Regra nova |
|---|---|
| **Delegado** | A revista revela a FACÇÃO em público (antes: só "tem poder", quase inútil). Em troca, **um uso a cada 4 jogadores** — `usosPorMesa()`, em `types/role.ts`. É a primeira carta cujos usos dependem do tamanho da mesa; `create-game` a consulta em DOIS pontos, e esquecer o segundo zera a regra sem sinal. |
| **Bruxa** | Só a Bruxa **sem variante** com poção de morte conta como lobo na paridade. As três variantes contam como vila mesmo matando — nenhuma delas ESCOLHE matar como a base escolhe. |
| **Noite 1 sem sangue** | A matilha é AVISADA, não perguntada. Antes o lobo escolhia alguém, confirmava, e nada acontecia. |

#### Telas

- **`SegurarParaRevelar` não funciona dentro de `ScrollView`.** O toque longo
  vira rolagem e a barra de progresso trava no meio. Foi o que travou a tela da
  Herança Amarga. O lembrete de função virou TOCAR para ver. Na revelação da
  noite 1 o gesto continua certo — lá a tela é dele sozinho.
- **"Jogar novamente" dava `reset` com uma rota só**, então o "Voltar" da
  Revisão não tinha para onde ir. Agora reconstrói a pilha do setup inteira.
- As duas visões da Confusa saem do mesmo tamanho (`duasVisoes`). A segunda
  linha nasceu como rodapé e continuou pequena quando virou leitura de verdade.

**Estado final:** `pnpm -r typecheck` limpo · **160 testes do engine + 13 do
app**.

#### Testes reescritos, não silenciados

Cinco testes afirmavam a regra ANTIGA e falharam de propósito: Cova Aberta
(`semPoder` → troca de carta), Herdeiro (`poderDe` → troca de carta), Bobo da
Cova Aberta, e dois textos de anúncio. Todos foram reescritos para a regra nova,
com `SUPERADO em 2026-09-27` no comentário.

Um deles merece nota: o teste da Cova Aberta tentava provar que a cura acabou
FORJANDO uma ação de proteção na submissão. O engine aceitou — ele confia em
quem monta a submissão, e é o **roteiro** que nunca ofereceria aquilo. O teste
passou a perguntar ao roteiro. Se você precisa forjar uma ação para provar uma
regra, provavelmente está testando o lugar errado.

#### O que ficou para trás

- **Nada disto foi visto em mesa real**, só em teste e no navegador.
- **O Lobo Carniçal continua sem caçar com a matilha** (`etapa: 'estertores'`).
  Levantado na sessão anterior, ainda sem decisão.
- **Pesos**: 65 variantes seguem com o peso de quando eram só texto.

### 2026-09-28 — a varredura que eu deveria ter feito antes de dizer "revisei"

**Comece por aqui se você vai mexer em qualquer carta.**

Na sessão anterior eu escrevi "revisei todas as variantes e roles". Era falso, e
o usuário me corrigiu depois de dez partidas de mesa: o que eu tinha feito foi
uma varredura de `grep` atrás de UM padrão de defeito (uso limitado que ninguém
cobra). Isso não é revisar. Uma carta pode ter o uso cobrado direitinho e mesmo
assim não fazer nada — porque a etapa que a resolveria nunca é alcançada, ou
porque o roteiro oferece uma pergunta cuja resposta ninguém lê.

#### `simulation/cada-carta-age.test.ts` — a ferramenta

Faz **cada carta do catálogo agir de verdade**, respondendo só o que o roteiro
oferece (como o app faz), e cobra o mínimo indiscutível:

> **Responder uma pergunta verdadeira tem de deixar rastro** — uma linha de log
> não-ignorada que cite o ator.

Uma carta que passa ainda pode ter a regra errada. Uma que **não** passa está
garantidamente sem regra nenhuma. Rodar isto leva segundos e teria pego tudo que
dez partidas de mesa pegaram.

Achou oito, em três causas diferentes:

| Causa | Cartas |
|---|---|
| **Toque falso por falta de alvos** — a lista de "quem não mira ninguém" era `padre` e `lobo-sombra`, escrita quando só esses dois existiam | Aldeão Testemunha, Bobo da Forca |
| **Recusa muda** — sem alvo possível, o jogador recebia toque falso e parecia não ter poder | Médico de Plantão, Curandeiro, Última Dose, Necromante e Vidente dos Ossos sem mortos |
| **Declaração sem log** — quem declara em vida e dispara na morte não registrava NADA; olhando o histórico, era como se não tivesse recebido o aparelho | Caçador (base e 3 variantes), Anciã Testamento, Herança Amarga |

> **Lição de método:** a varredura aceita `pergunta.aviso` como rastro válido. A
> diferença entre "a carta está quebrada" e "a carta está legitimamente
> impedida" é o app DIZER o motivo. Se você adicionar uma recusa nova, dê o
> motivo junto — senão ela vira silêncio e a varredura cobra, com razão.

#### `turn/troca-de-carta.ts` — uma porta só

**Seis** mecânicas trocavam o papel de um jogador: conversão do Alfa, herança do
Aldeão, Cova Aberta, Herança Amarga, Contaminação e Troca com Mortos. Cada uma
fazia o seu `players.map(...)` à mão, e as seis esqueciam coisas diferentes —
uma não zerava a variante antiga, outra não recalculava os usos, **nenhuma
avisava o jogador**.

Agora todas passam por `trocarCarta()`. A marca `marcas.viraCarta` guarda o
papel ANTIGO e alimenta a tela nova de "sua carta mudou", que aparece antes da
ação e é consumida por `marcarTrocaVista` — avisar sem apagar seria um laço.

**Se você criar uma sétima troca de carta, use esta função.** Um `players.map`
novo mexendo em `roleId` é dívida: o jogador vai virar outra coisa em silêncio.

#### Decisões do usuário

- **O convertido do Alfa vira um Lobo comum**, carta e tudo. Antes mantinha a
  própria carta e só mudava de lado — um Médico que curava para a matilha.
  `Sangue Novo` passou a ser a única variante que ainda empresta poder: leva a
  carta antiga por uma noite e depois vira Lobo.
- **Toda troca de papel mostra uma tela**, até quando o destino é Aldeão.

#### `turn/apresentacao.ts` — o app deixou de ser um formulário

Pedido: *"cada role muda bastante a experiência visual do usuário e o fluxo"*.
O app desenhava as 97 cartas com a mesma tela — a Vidente enxergando, o Lobo
mordendo e o Padre cancelando a noite inteira eram o mesmo formulário com o
texto trocado.

Não são 24 telas feitas à mão (seria impossível de manter e garantiria que uma
carta nova nascesse feia). São quatro eixos que mudam o comportamento da mesma
tela:

- **verbo** — o botão diz o que a carta faz: "Morder", "Enxergar", "Trancar".
- **atmosfera** — uma linha de clima antes da regra, no tom da carta.
- **acento** — a cor que domina a tela. Vem daqui, e **não** de `corDaFaccao`:
  duas cartas da mesma facção podem pedir climas opostos (o Lobo Sombra some no
  Índigo enquanto o Lobo morde em Sangue).
- **pesado** — confirmar pede uma segunda batida. Reservado ao que não tem
  volta; pôr em tudo transforma a proteção numa formalidade que todo mundo
  aprende a atravessar sem ler.

**O toque falso não recebe nada disto** — vestir o toque falso com o clima da
função entregaria a função pela cor.

Um teste (`turn/apresentacao.test.ts`) cobra que toda função tenha verbo e
atmosfera próprios e que nenhum verbo atravesse facções: se o Médico e o Lobo
apertam o mesmo botão, a tela voltou a ser genérica.

#### Testes reescritos

Quatro afirmavam a regra antiga e foram reescritos com `SUPERADO em
2026-09-28`. Um perdeu a própria premissa: *"o convertido caça mesmo com carta
de vila"* — não existe mais carta de vila ali.

**Estado final:** `pnpm -r typecheck` limpo · **243 testes do engine + 13 do
app** (eram 160 + 13).

#### O que ficou para trás

- **O Herdeiro que o usuário relatou não reproduziu.** A varredura o exercita
  herdando cinco cartas diferentes e usando cada uma na noite seguinte, e passa.
  A hipótese que sobra é ele ter herdado uma carta que não pode mais agir
  (Vingador e Ladrão só agem na noite 1; Bobo, Coringa e Sobrevivente nunca
  agem) — o que agora pelo menos mostra a tela de troca e o lembrete, em vez de
  um toque falso mudo. **Se acontecer de novo, peça qual carta foi herdada.**
- **O Lobo Carniçal continua sem caçar com a matilha** — terceira sessão
  seguida em que isto é levantado sem decisão.
- **Pesos**: 65 variantes seguem com o peso de quando eram só texto.

### 2026-09-28 (II) — o Carniçal caça, a carta vira consulta, e o app ganha peso

#### O Lobo Carniçal, enfim

Levantado em três sessões seguidas e decidido agora: a `etapa` dele era
`estertores`, então ele **nunca recebia a pergunta de ataque** — um lobo que não
mordia e cujo voto na matilha não existia. Virou `ataque`, com escolha dupla
(caçar / marcar quem leva junto), como as outras cartas da matilha.

**E ele expôs um defeito vizinho, pior:** a declaração de estertor vivia só no
mapa da noite em que foi feita, e `resolverDia` chama `dispararEstertores` **sem
esse mapa**. Resultado: o Caçador escolhia o alvo, era linchado, e o tiro saía
no "primeiro vivo da lista" — a escolha dele ia para o lixo justamente na morte
mais comum do jogo. Agora a declaração vira `marcas.levaJunto` e atravessa as
noites. Há teste (`a marca do Carniçal sobrevive até a um linchamento`).

> Se você criar uma carta que declara em vida e dispara na morte, grave em
> `marcas.levaJunto`. O mapa da noite morre com a noite.

#### O lembrete virou consulta, para TODA carta

Nasceu só para quem nunca age, com o receio de que dizer "você é o Padre" a um
Padre sem usos o obrigasse a esconder a tela. **O receio estava invertido:** um
botão presente só em algumas passagens entrega, pela própria presença, quem tem
poder. Agora o botão "◈ ver minha carta" está em toda passagem — inclusive no
toque falso — e nada abre até alguém tocar. É a uniformidade que protege.

Vive fora do `ScrollView`, numa `Sobreposicao` nova. Os dois erros da versão
anterior eram o mesmo erro: **um atalho de consulta não pode disputar o dedo com
o conteúdo nem mudar de lugar.**

#### Design: as três velocidades

`theme/spacing.ts` ganhou `tempos = { toque: 120, transicao: 250, momento: 420 }`.
Números soltos espalhados pelos componentes são a origem do desconforto que
ninguém consegue nomear: duas coisas que começam juntas terminam em momentos
diferentes e a tela parece frouxa.

- **Botão e linha de jogador ganharam mola.** O afundar de 1px resolvia o
  essencial (no escuro, deslocamento se vê e opacidade não), mas era
  instantâneo nos dois sentidos — e voltar instantâneo parece elástico solto. A
  mola da LISTA é menor que a do botão (0.985 contra 0.97): numa lista, escala
  forte faz as linhas vizinhas parecerem pular junto.
- **`Animated.createAnimatedComponent` fora do componente.** Chamado dentro,
  cria um tipo novo a cada render e o React desmonta a árvore a cada toque — a
  animação nunca chega a rodar.
- **`Aparicao` trocou `Easing.out(Easing.cubic)` por uma bézier.** A diferença é
  toda no fim: a curva nova passa a maior parte do tempo desacelerando, e o
  elemento parece POUSAR. Com cubic, numa lista escalonada, as últimas linhas
  parecem lentas mesmo tendo a mesma duração.
  **`Easing.quart` NÃO existe no React Native** — só `quad`, `cubic` e `poly(n)`.
  Tentei usar e o typecheck pegou.
- **`animation: 'slide_from_right'` declarado explicitamente.** O padrão do
  `native-stack` cai em "sem transição" na web, que é onde este app é testado o
  tempo todo — o comportamento divergia entre o que eu via e o que a mesa via.
- **Gesto de voltar desligado nas telas de partida.** Arrastar a borda no meio
  de uma passagem voltava para a revisão com a partida em curso.

**Estado final:** `pnpm -r typecheck` limpo · **244 testes do engine + 13 do
app**.

#### Testes reescritos

Três afirmavam a regra antiga (`SUPERADO em 2026-09-28`): a etapa do Carniçal, a
pergunta do Carniçal morto e o lembrete só para quem não age.

#### O que ficou para trás

- **Pesos**: 65 variantes seguem com o peso de quando eram só texto. O Carniçal
  acabou de ganhar um ataque e continua valendo 4.
- O **Herdeiro** que o usuário relatou continua sem reproduzir — ver a sessão
  anterior.

### 2026-09-28 (III) — eu deixei TODOS os botões do app invisíveis

Leia isto antes de animar qualquer coisa.

#### A armadilha

```tsx
const AnimatedPressable = Animated.createAnimatedComponent(Pressable); // NÃO
<AnimatedPressable style={({ pressed }) => [...]} />
```

**`Animated.createAnimatedComponent` não invoca `style` em formato de função.**
Ele repassa a função como se fosse um objeto de estilo, o React Native Web a
descarta, e o componente renderiza SEM ESTILO NENHUM — sem fundo, sem borda,
sem altura. Todos os botões do app sumiram, e as linhas de jogador junto.

O padrão correto é o inverso: o `Pressable` fica nu, cuidando só do toque, e
quem carrega aparência e transformação é um `Animated.View` por dentro. Está em
`useMolejo`, em `components/ui.tsx` — use essa função em vez de repetir o erro.

#### Por que a minha verificação não pegou

Eu conferi com `get_page_text`, que mostrou os rótulos dos botões normalmente.
**O texto continuava no DOM; só a aparência tinha sumido.** Texto presente não é
botão visível.

E quando finalmente tirei screenshots, eles me enganaram duas vezes na direção
OPOSTA — "VÂRCOLAC cortado", "rodapé sumido" — porque **o quadro do screenshot
não bate com o viewport**: a janela era 1024×768 e a captura vinha em 800×600,
cortando o pé da tela. Medi no DOM e estava tudo no lugar.

> **O procedimento que funciona nesta pane:**
> 1. `resize_window` para um tamanho de celular de verdade (414×760 serve).
> 2. **Medir no DOM** (`getBoundingClientRect`) para julgar LAYOUT — é a única
>    fonte confiável de posição e tamanho.
> 3. Screenshot só para julgar APARÊNCIA, e conferindo a linha
>    "coordinate frame" da resposta contra `window.innerWidth/innerHeight`
>    antes de concluir qualquer coisa sobre o que "não aparece".

#### O que sobrou de bom

Depois de consertar, o resto das melhorias de movimento ficou:

- `useMolejo` — mola no toque de botão e de linha de jogador.
- `Surge` (em `animacoes.tsx`) — mola para o que aparece por CAUSA de um toque,
  como o losango que confirma o alvo. Diferente de `Aparicao`, que é entrada de
  conteúdo e desacelera até parar.
- `key={etapa}` na rolagem da passagem: a troca de etapa remonta a árvore e as
  `Aparicao` de dentro rodam de novo. Sem isso, sair de "segure para revelar"
  para "sua vez" era um corte seco — a transição mais vista do jogo (uma por
  jogador por noite) e a única sem nenhuma.
- `flexGrow: 1` no `contentContainerStyle` e `flex: 1` no bloco de toque falso:
  a lua ficava pendurada no topo com quinhentos pixels de vazio embaixo.

**Estado final:** `pnpm -r typecheck` limpo · **244 + 13 testes**.

#### O que ficou para trás

O usuário disse que as animações continuam duras. O que foi feito é resposta ao
toque e entrada de conteúdo; **não há transição de SAÍDA em lugar nenhum** — tudo
que sai da tela some de uma vez. É provavelmente aí que mora o resto da queixa.

### 2026-09-28 (IV) — MELHORIAS V4: a carta cortada e o prazo que nunca vencia

#### O prazo da Vila Amaldiçoada morava no lugar errado

O modo não terminava nunca, e a causa é sutil o bastante para valer o registro:
o prazo era um `EfeitoAdiado` do tipo `prazo-da-maldicao`, e a derrota é
checada com `rodada > naRodada`. Só que `limparEfeitosVencidos` **descarta tudo
com `naRodada < rodada`** — quando a rodada finalmente passava do prazo, o
efeito já tinha sido varrido da fila. `derrotaDaVila` nunca via nada.

> **A fila de efeitos é para o que acontece NUMA rodada.** Um prazo é o
> contrário disso: vale desde o começo e precisa continuar valendo depois de
> vencido. Virou `GameState.prazoDaMaldicao`.

Junto veio a outra metade do relato ("não tem noites fixas claramente
declaradas"): o prazo agora é dito na criação, repetido toda manhã como
contagem regressiva, mostrado na Revisão ANTES de a mesa aceitar o modo, e o
cabeçalho do Amanhecer vira "Noite 3 de 5".

#### A carta cortava conteúdo

`CartaDeRole` tem altura fixa (3:4) e `overflow: 'hidden'`: tudo que não coube
sumia em silêncio. "Sobrevivente Invisível", "Bobo Desesperado" e qualquer
variante de nome comprido ou descrição de três frases.

A correção é dar a cada bloco o seu espaço em vez de empilhar e torcer:

- nome com `numberOfLines={2}` e tamanho em **três degraus** por comprimento
  (uma fórmula contínua dá um tamanho diferente por carta e é impossível de
  conferir);
- a função de origem da variante ganhou régua e tamanho proporcional — era
  `fontSize: 9` fixo, e é ela que responde "Boca Calada é um quê?";
- descrição num bloco `flex: 1` que absorve o que sobra, com `numberOfLines`.
  Cortar com reticências é honesto (o texto inteiro está na Biblioteca);
  cortar no meio de uma palavra, sem aviso, não é;
- um fio separando o rodapé da facção, que encostava na descrição — "tudo meio
  junto", nas palavras de quem jogou.

#### Os oito defeitos de regra

| Relato | Causa |
|---|---|
| Feiticeiro matou na "noite 1 sem sangue" | `cotaDaMatilha` só cala a mordida COLETIVA. Três cartas atacam por fora dela (Feiticeiro atravessando, Lobo Branco, Carniceiro). Agora existe `matilhaProibidaDeMatar`, e a Bruxa/Sobrevivente seguem livres por serem solitários. |
| Vingador venceu e o jogo continuou | A vitória dele entrava como *camada*, e camada só é lida quando a partida acaba por outro motivo. Agora **encerra**, como o Bobo. |
| Anciã matou os poderes e a mesa gastou usos à toa | `acoesDe` descartava na resolução e o roteiro perguntava assim mesmo. Agora o roteiro avisa (`suspensaoAlcanca` espelha a checagem — **as duas precisam concordar**). |
| Carniceiro Morto-Vivo foi linchado e a vila ganhou | A primeira morte o tirava do jogo. A carta diz "continua em jogo e pode ser morto novamente": agora volta a `vivo` com `mortoVivo + semPoder`, conta na paridade, fala, não age nem vota. A segunda morte é definitiva. |
| Testemunha da Cela revelava tarde demais | Eram duas noites de cela com a revelação na terceira rodada. Agora: prende na noite 1 → preso na noite 2 → solto e lido no amanhecer do dia 2. |
| Ladrão roubava sem avisar ninguém | Mexia em `roleId` na mão. Agora passa por `trocarCarta` **pelas duas pontas** — quem rouba e quem é roubado. |
| Troca Forçada deixava um Ladrão sem usos | O contador ficava no corpo, não na carta. `usosIniciais` da carta nova, sempre. |
| Bobo Desesperado não virava Aldeão de verdade | `marcas.virouAldeao` sozinho deixava a carta de Bobo na mão dele. Agora troca a carta e anuncia. |

**Dois relatos não reproduziram:** o Uivador **escolhe** quem delatar (há teste
com a lista de alvos) e **não** caça na mesma noite em que uiva. Se acontecer de
novo, é na tela e não na regra.

#### Uma dúvida pendente

**Incorporação.** O relato foi "não trago a pessoa de volta, eu só uso o poder
dela, além disso eu posso usar na mesma noite". O teste mostra que a carta faz o
que promete: **ressuscita E dá o poder**. Não dá para saber se o relato descreve
um defeito que não reproduzi ou um pedido de regra nova (absorver sem
ressuscitar). Ficou como está, e a pergunta foi devolvida ao usuário.

**Estado final:** `pnpm -r typecheck` limpo · **258 testes do engine + 13 do
app**.

### 2026-09-28 (V) — sorteio balanceado, e o Uivador que nunca mais mordia

#### A seleção aleatória agora é BALANCEADA

Embaralhar a seleção e cortar N era um sorteio honesto e um jogo péssimo: com
97 cartas marcadas para seis cadeiras, a chance de sair uma mesa **sem nenhum
lobo** é de uns 13% — e quem descobre isso é a mesa, na terceira noite, quando
não dá mais para consertar.

Quem sabe montar composição válida é `gerarBaralho`, que **já existia** e já
aceita `permitidas`: fixa o número de lobos pelo tamanho da mesa, respeita o
teto de solitários e de cartas pesadas, e escolhe a melhor de 200 tentativas
pela calculadora de peso. O que faltava a ele é a noção de VARIANTE, que só
existe no app — `sortearBalanceado` (em `store/jogo.ts`) traduz as funções que
ele devolve de volta para as cartas que a mesa marcou. Xerife base e Boca
Calada marcados, gerador pede "um xerife": o sorteio escolhe entre os dois.

> Quando o gerador devolve uma função que a mesa NÃO marcou, é porque um grupo
> inteiro ficou de fora e ele prefere desobedecer a entregar mesa impossível.
> Aí entra a carta base.

Dois testes em `store/jogo.test.ts` cobrem: 25 sorteios sem mesa sem lobo nem
mesa maioria-lobo, e a garantia de que função não marcada não entra.

#### O Uivador entregava um companheiro e nunca mais mordia

Ele faltava em `escolheEntreDuas`, e o bloco de escolha dupla lá embaixo já o
incluía — só que nunca era alcançado, porque a checagem de uso vem antes.
Gasto o uivo, `podeAgir` devolvia falso e ele recebia **"Já foi" para sempre**.

> **A regra destas cartas é: o poder especial acaba, a caçada continua.** Quem
> entra no bloco de escolha dupla tem de estar nas DUAS listas —
> `escolheEntreDuas` (que libera a passagem) e o `if` que monta as opções.
> Feiticeiro, Alfa, Lobo Sombra, Uivador e o Carniceiro vivo.

Correção do registro anterior: eu tinha escrito que "o Uivador não reproduziu".
Reproduzia — eu é que testei a coisa errada. O relato era sobre a noite
SEGUINTE ao uivo, e os meus dois testes olhavam a noite do uivo.

#### Incorporação: absorve, não ressuscita

Decisão do usuário. A carta dizia "ressuscita um morto E utiliza sua
habilidade", e as duas juntas faziam dela a ressurreição do Necromante base
MAIS um poder de brinde — a variante mais forte do jogo com o peso das outras.
Agora o corpo fica na cova e só o que ele sabia muda de mão. A descrição da
carta foi reescrita junto.

**Estado final:** `pnpm -r typecheck` limpo · **259 testes do engine + 15 do
app**.

<!--
  PRÓXIMA SESSÃO: acrescente seu bloco aqui embaixo, no mesmo formato.
  Não apague nada acima. Se algo virou mentira, escreva "SUPERADO em <data>:" na
  linha antiga e a verdade nova logo abaixo.
-->
