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

<!--
  PRÓXIMA SESSÃO: acrescente seu bloco aqui embaixo, no mesmo formato.
  Não apague nada acima. Se algo virou mentira, escreva "SUPERADO em <data>:" na
  linha antiga e a verdade nova logo abaixo.
-->
