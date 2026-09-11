# Assets a gerar

Lista de produção das imagens do Projeto Werewolf. Cada bloco vira **uma imagem
só**, contendo vários itens, para depois ser recortada.

> **Leia primeiro a seção "Correção de direção", no fim do arquivo.** Os blocos
> 1 a 3 foram gerados e aprovados como *substrato* (textura por baixo), mas a
> direção da camada figurativa mudou de fotografia para **xilogravura** — e o
> Bloco 4, dos ícones, já nasce nessa direção nova.

Leia a seção "Regras que valem para as três folhas" antes de mandar qualquer
prompt — ela é a parte que impede o resultado de virar fantasia genérica, que é
para onde todo gerador de imagem escorrega sozinho.

---

## Por que exatamente estes três blocos

A identidade visual do projeto ("Luz de Vela", `docs/identidade.htm`) não pede
ilustração: pede **colagem de material real**. A frase-guia é literal — *"nada
aqui foi inventado; cada textura, cor e objeto existiu de verdade"*. E a ordem
de produção do próprio documento começa em:

> 1. Banco de materiais — ~60 fotografias e escaneamentos. **É o alicerce de
>    tudo — nada começa antes disso.**

Então os três blocos são, nesta ordem:

| Bloco | O que é | Serve para |
|---|---|---|
| 1 | Materiais | preenchimentos, fundos de carta, sobreposições |
| 2 | Recortes | as peças que montam as 24 cartas de função |
| 3 | Fundos de momento | as telas de teatro (revelação, passagem, morte, fim) |

### Duas coisas que deliberadamente NÃO estão aqui

**Ícones de função.** *(Revisto — ver o Bloco 4. A decisão abaixo valia enquanto
a direção era fotográfica; com a virada para xilogravura, o desenho da função
base passou a valer a pena. O que se manteve foi a parte que importa: a variante
continua sendo complemento geométrico gerado por código.)*

Cada
função tem um *motivo de bordado* geométrico gerado por código
(`packages/engine/src/data/motivos.ts`), a partir de cinco primitivas — losango,
círculo, barra, triângulo, ponto. A variante **não troca o ícone**: ela
acrescenta um complemento ao motivo da função base. Uma imagem de IA quebraria
essa composição, quebraria a regra de "um único peso de traço" da identidade, e
trocaria um sistema que escala sozinho para 24 funções por 24 arquivos soltos.

**Qualquer luz de vela assada na imagem.** O componente `Ambiente.tsx` já
aplica a luz por código, em três camadas (halo curto, véu de cor, vinheta), e
ela **muda com a fase da partida** — Índigo na noite, Sangue Seco na morte,
Folha de Ouro na vitória. Se a imagem já vier iluminada, passam a existir duas
fontes de luz na mesma tela, que é a regra mais dura do documento: *"Uma fonte
só. Nunca duas."* Por isso toda folha abaixo pede **luz chapada e difusa**, sem
direção, sem sombra projetada, sem brilho. A luz entra depois, no app.

---

## Regras que valem para as três folhas

Cole este bloco junto com o prompt de cada folha.

```
REGRAS OBRIGATÓRIAS (valem para a imagem inteira)

Referência cultural: Leste europeu e Bálcãs, século XIX, cultura material
camponesa real. Romênia, Sérvia, Croácia. É a origem folclórica real do
lobisomem, não uma escolha estética.

Tratamento: fotografia de objeto real ou escaneamento plano, como um catálogo
de museu ou um arquivo têxtil. NÃO é ilustração, NÃO é pintura digital, NÃO é
render 3D, NÃO é concept art.

Luz: chapada, difusa, sem direção identificável, como scanner ou mesa de luz.
Sem sombra projetada, sem sombra de contato, sem brilho especular forte, sem
vinheta, sem desfoque de profundidade. Tudo em foco, do mesmo jeito.

Paleta (as cores dos materiais devem cair dentro desta faixa):
  Fuligem #14100D · Nogueira #3A2A1C · Ferrugem #6B4A32 · Linho Cru #D9CDB4
  Chama #F0C97A · Cera #E0B75C · Folha de Ouro #C9A227
  Garança #A32620 · Sangue Seco #6E1F1F · Índigo #1F3550 · Horezu #2E5545

Estado dos materiais: usados, gastos, remendados, manchados, envelhecidos.
Nada novo, nada limpo, nada de loja.

NUNCA (cada item destes destrói a autenticidade numa tela só):
- tipografia gótica, blackletter ou qualquer letra legível
- rosto, pessoa, personagem, mão, corpo
- lua cheia, lobo uivando, silhueta em morro
- fantasy art, armadura, arma heroica, pose
- glow, halo perfeito, bloom, lens flare
- sombra cinza ou azul
- vermelho neon, roxo, ciano
- pentagrama, runa nórdica, símbolo ocultista genérico
- textura de pergaminho de banco de imagem
- marca d'água, logotipo, assinatura, numeração, legenda
```

---

## Bloco 1 — Banco de materiais

**Uma imagem: 20 amostras de material, grade 5 × 4.**

O alicerce. Cada carta de função, cada tela de momento e cada moldura do app é
montada a partir destas amostras. Elas nunca aparecem sozinhas: entram como
preenchimento, sobreposição em opacidade baixa, ou base de recorte.

### O que entra, e por quê

| # | Material | Por que este |
|---|---|---|
| 1 | Linho cru, tecelagem aberta, sem tingir | É a cor `Linho Cru #D9CDB4` do texto e o suporte de todo bordado da região |
| 2 | Lã grossa penteada, marrom-acinzentada | Casaco de pele de carneiro e feltro do vestuário camponês |
| 3 | Feltro escuro, comprimido, quase preto | Fundo de carta em tela de momento, onde Fuligem liso seria chapado demais |
| 4 | Bordado ponto-cruz **vermelho** sobre linho, motivo losango | `Garança` é a cor de ação e acusação; o losango é o motivo da facção Vila |
| 5 | Bordado ponto-cruz **preto** sobre linho, motivo dente/zigue-zague | O dente é o motivo dos Lobos |
| 6 | Remendo costurado à mão, tecido sobre tecido, pontos irregulares | Estado "ferido", "marcado", e o vocabulário visual de reparo |
| 7 | Barbante de linho e fios soltos, alguns enrolados | Peças de ligação na colagem: amarram recortes uns aos outros |
| 8 | Papel encardido liso, amarelado, fibra visível | Base de todo texto de regra e da Biblioteca de funções |
| 9 | Papel com borda queimada e carbonizada | Evento, segredo, informação destruída |
| 10 | Papel com mancha de água e vinco de dobra | Documento manuseado; dá idade sem precisar de filtro |
| 11 | Tinta ferrogálica desbotada sobre papel — traços e rabiscos manuscritos **ilegíveis** | Escrita como textura, nunca como conteúdo. Letra legível é ruído e sai errada |
| 12 | Veio de nogueira envelhecida, viga | A madeira da casa e da mesa onde o jogo acontece |
| 13 | Entalhe geométrico em madeira: roseta e roda solar, portão romeno | A roda solar é o motivo do Dia; entalhe real, não ornamento inventado |
| 14 | Ripa de madeira gasta, esfregada, lascada nas bordas | Superfície de operação, discreta |
| 15 | Ferro forjado oxidado, ferrugem viva | `Ferrugem #6B4A32` tem procedência aqui |
| 16 | Prata batida e repuxada, escurecida nos vales | Metal de ícone ortodoxo; o brilho contido de vitória |
| 17 | Cera de abelha derretida e ressolidificada, escorrida | A vela é a fonte de luz do jogo inteiro — `Cera #E0B75C` |
| 18 | Sebo endurecido, gordura opaca, esbranquiçada | Contraponto pobre da cera; é o que a vila realmente queimava |
| 19 | Osso velho e marfim amarelado, poroso | Morte, Vidente dos Ossos, estertor |
| 20 | Terra seca peneirada com folha seca quebrada | Sepultura, chão, fim de partida |

### Especificação de entrega

- **Formato:** PNG, sRGB, sem perda.
- **Proporção:** paisagem, na maior resolução disponível (1536 × 1024 ou maior).
- **Grade:** 5 colunas × 4 linhas, células de tamanho **igual**, alinhadas.
- **Espaçamento:** 24 px de calha entre células e 24 px de margem externa, em
  **branco puro `#FFFFFF`**. Materiais claros (linho, papel, cera) nunca chegam
  a branco puro, então a calha some no recorte sem comer as bordas.
- **Enquadramento:** cada amostra **preenche a célula inteira**, de borda a
  borda, vista de cima, a 90°. Sem objeto solto no meio, sem fundo aparecendo,
  sem sombra.
- **Continuidade:** a amostra deve poder ser repetida lado a lado sem emenda
  óbvia. Sem detalhe único e chamativo no centro, que denuncia a repetição.
- **Sem numeração, sem legenda, sem moldura desenhada.**
- **Depois de recortar:** `assets/textures/<nome>.png`, e o que o app usar é
  copiado para `apps/mobile/assets/textures/` — o Expo não serve arquivo de
  fora da pasta do app.

### Prompt para colar

```
Uma única imagem: uma folha de amostras de materiais, organizada em grade de
5 colunas por 4 linhas, células de tamanho igual, com 24px de calha branca
entre elas e 24px de margem externa branca.

Cada célula é uma amostra de material preenchendo a célula inteira, de borda a
borda, fotografada de cima a 90 graus, como um catálogo de arquivo têxtil ou um
escaneamento plano de museu. Sem objeto solto, sem fundo visível, sem sombra.

As 20 amostras, em ordem, da esquerda para a direita e de cima para baixo:
1. linho cru sem tingir, tecelagem aberta, fibra visível
2. lã grossa penteada, marrom-acinzentada
3. feltro escuro comprimido, quase preto
4. bordado ponto-cruz vermelho-garança sobre linho, motivo geométrico de losangos
5. bordado ponto-cruz preto sobre linho, motivo geométrico de zigue-zague
6. remendo de tecido costurado à mão sobre outro tecido, pontos irregulares
7. barbante de linho e fios soltos sobre superfície neutra clara
8. papel encardido liso e amarelado, fibra visível
9. papel com a borda queimada e carbonizada
10. papel com mancha de água e vinco de dobra
11. rabiscos manuscritos ILEGÍVEIS em tinta ferrogálica desbotada sobre papel
12. veio de madeira de nogueira envelhecida
13. entalhe geométrico em madeira: roseta e roda solar de portão camponês romeno
14. ripa de madeira gasta e lascada nas bordas
15. ferro forjado oxidado, ferrugem viva
16. prata batida e repuxada, escurecida nos vales
17. cera de abelha derretida e ressolidificada, escorrida
18. sebo animal endurecido, gordura opaca esbranquiçada
19. osso velho e marfim amarelado, poroso
20. terra seca peneirada com folha seca quebrada

Todas as amostras devem poder se repetir lado a lado sem emenda óbvia: sem
detalhe único e chamativo no centro.

[COLE AQUI O BLOCO "REGRAS OBRIGATÓRIAS"]
```

> **Se sair mole:** peça uma segunda rodada, uma imagem por material, ocupando a
> tela inteira, para os quatro que mais aparecem — **linho cru (1), feltro (3),
> papel encardido (8) e nogueira (12)**. Os outros dezesseis aguentam a
> resolução da folha porque entram pequenos ou em opacidade baixa.

---

## Bloco 2 — Recortes de colagem

**Uma imagem: 20 objetos recortáveis, grade 5 × 4.**

São as peças que montam as cartas. A identidade é explícita: *"cada role é
montada a partir de um banco de materiais fotografados, não desenhada"* — e a
razão é escala. Um banco único gera 24 funções e todas as variantes, e nenhuma
destoa, porque todas compartilham as mesmas peças.

Repare que os objetos abaixo **não são um por função**. São o vocabulário: a
Bruxa e o Curandeiro compartilham o frasco; o Padre e o Exorcista compartilham
a cruz; o Vidente dos Ossos e o estertor compartilham os ossos.

### O que entra, e por quê

| # | Objeto | Onde serve |
|---|---|---|
| 1 | Chave grande de ferro, dentes gastos | Taverneiro, Delegado, Xerife — quem controla acesso |
| 2 | Ferradura de ferro com furos de prego | Proteção, sorte; Escudo, Muralha |
| 3 | Prego forjado torto e cravo | Armadilha, Sacrifício |
| 4 | Vela de cera **apagada**, pavio carbonizado, cera escorrida | A vela do jogo. Apagada de propósito: acesa traria luz assada |
| 5 | Colher de pau gasta | Curandeiro, Taverneiro — cozinha e remédio, o mesmo objeto |
| 6 | Frasco de vidro escuro com rolha de cortiça | Bruxa, Médico, Médico de Guerra |
| 7 | Sino de igreja pequeno, bronze escurecido | Sino da Igreja, Uivador, Último Uivo — o que convoca |
| 8 | Cruz ortodoxa de madeira, três travessas | Padre, Exorcista, Mártir |
| 9 | Faca de lâmina gasta e cabo de madeira | Caçador, Lobo Carniçal, Vingador |
| 10 | Corda de cânhamo amarrada em nó | Armadilha, Execução, Teimoso |
| 11 | Espelho de mão com prata manchada | Vidente do Espelho, Vidente Confusa |
| 12 | Punhado de ossinhos de leitura | Vidente dos Ossos, Necromante |
| 13 | Tufo de pele de carneiro sujo | Lobo — o disfarce, não a fera |
| 14 | Dente de lobo real, isolado | Lobos, Alfa. Um dente de verdade, não presa de monstro |
| 15 | Anel de metal simples, gasto, sem pedra | Amantes, Amor Proibido, Amor Cego |
| 16 | Moeda de prata desgastada, relevo ilegível | Ladrão, Coringa |
| 17 | Lamparina de metal amassada, sem chama | Vidente, Detetive, Testemunha — quem procura no escuro |
| 18 | Machadinha de lenhador, lâmina lascada | Lobo Sombra, Guarda-costas |
| 19 | Pena de ave e tinteiro de barro | Delegado, Herdeiro — registro e sucessão |
| 20 | Selo de cera vermelha quebrado ao meio | Segredo revelado, Bobo, informação falsa |

### Especificação de entrega

- **Fundo:** verde-croma chapado e uniforme **`#00B140`**, sem gradiente, sem
  variação. A escolha é técnica: nenhuma das onze cores da paleta chega perto
  desse verde — o mais próximo, Horezu `#2E5545`, é escuro e dessaturado — então
  a chave de cor recorta sem comer a borda do objeto. Fundo branco ou preto
  comeria a cera e o feltro.
- **Sem sombra de contato.** O objeto flutua no verde. Sombra assada impede que
  a peça seja colada sobre qualquer outro material depois.
- **Grade:** 5 colunas × 4 linhas, células iguais, objeto **centralizado** na
  célula com pelo menos 15% de folga em volta, para o recorte não encostar.
- **Escala:** cada objeto ocupa a sua célula na maior dimensão dele. Não é para
  manter escala real entre objetos — o anel e a ferradura ocupam a célula igual.
- **Proporção:** paisagem, maior resolução disponível.
- **Depois de recortar:** PNG com alpha em `assets/icons/recortes/<nome>.png`.

### Prompt para colar

```
Uma única imagem: 20 objetos isolados sobre fundo verde-croma chapado e
uniforme #00B140, organizados em grade de 5 colunas por 4 linhas.

Cada objeto é fotografado de cima, a 90 graus, centralizado na sua célula, com
folga em volta, SEM sombra de contato e SEM sombra projetada — como se
estivesse flutuando. Luz chapada e difusa, sem direção. Todos em foco.

Os 20 objetos, da esquerda para a direita e de cima para baixo:
1. chave grande de ferro antiga, dentes gastos
2. ferradura de ferro com furos de prego
3. prego forjado torto, ao lado de um cravo
4. vela de cera de abelha APAGADA, pavio carbonizado, cera escorrida pela lateral
5. colher de pau gasta pelo uso
6. frasco de vidro escuro pequeno com rolha de cortiça
7. sino de igreja pequeno em bronze escurecido
8. cruz ortodoxa de madeira com três travessas
9. faca de lâmina gasta com cabo de madeira
10. corda de cânhamo amarrada em um nó
11. espelho de mão com a prata manchada e descascando
12. punhado de ossinhos pequenos de leitura de sorte
13. tufo de pele de carneiro suja
14. um dente de lobo real, isolado
15. anel de metal simples e gasto, sem pedra
16. moeda de prata desgastada, relevo ilegível
17. lamparina de metal amassada, sem chama
18. machadinha de lenhador com a lâmina lascada
19. pena de ave ao lado de um tinteiro de barro
20. selo de cera vermelha quebrado ao meio

Todos os objetos são camponeses, do Leste europeu do século XIX, usados e
gastos. Nenhum é heroico, ornamentado ou mágico.

[COLE AQUI O BLOCO "REGRAS OBRIGATÓRIAS"]
```

---

## Bloco 3 — Fundos de tela de momento

**Uma imagem: 6 painéis verticais, grade 3 × 2.**

Só as **telas de momento** levam fundo. A identidade separa isso com rigidez:
*"textura em telas de momento, limpeza em telas de operação"* — e a razão é de
uso, não de gosto: durante a partida as pessoas estão no escuro, com pressa,
passando o aparelho, e textura numa tela de operação custa legibilidade na hora
em que ela vale mais que beleza.

Então **Setup, Baralho, Votação, Biblioteca e Ajustes não recebem fundo nenhum**
— eles ficam em Fuligem liso. Os seis painéis abaixo cobrem exatamente os cinco
climas do `Ambiente.tsx` mais a Passagem.

### O que entra, e por quê

| # | Painel | Clima | Onde aparece |
|---|---|---|---|
| 1 | Tampo de mesa de nogueira quase preto, marcas de faca, círculo de copo | `noite` | Passagem da noite, ações noturnas |
| 2 | Parede caiada gasta, cal descascando sobre reboco de barro | `dia` | Amanhecer, Discussão |
| 3 | Pano de linho grosso dobrado, uma mancha escura de sangue seco | `morte` | Morte, Execução |
| 4 | Painel de ícone ortodoxo: folha de ouro craquelada sobre madeira, **sem figura** | `vitoria` | Fim de partida |
| 5 | Feltro escuro liso, fibra comprimida, sem marca | `neutro` | Entrega do aparelho, transição |
| 6 | Terra batida de chão de casa com palha seca pisada | `morte` / fim | Sepultura, derrota |

O painel 4 pede atenção: **folha de ouro sem figura**. Ícone ortodoxo com santo
pintado traria rosto e conteúdo religioso específico para uma tela de vitória de
jogo. O que serve é o material — ouro craquelado sobre madeira — e não a imagem.

### Especificação de entrega

- **Orientação:** cada painel é **vertical**, proporção 9:19.5, igual à tela do
  celular. Numa grade 3 × 2 de painéis verticais, a imagem final é paisagem.
- **Escuridão:** todos escuros, entre `#14100D` (Fuligem) e `#3A2A1C`
  (Nogueira), exceto o painel 2 (parede caiada, que é o único claro) e o 4
  (ouro). O app **escurece mais** por cima; um fundo já claro vira leitoso.
- **Contraste interno baixo.** O fundo é fundo: nada de foco, nada de assunto,
  nada que dispute com o texto que vai por cima. Se um detalhe chama o olho,
  está errado.
- **Centro limpo.** Os 40% centrais recebem título e botão. Toda variação
  interessante mora nas bordas.
- **Luz chapada**, pelo motivo já dito — o halo, o véu e a vinheta entram por
  código, por fase.
- **Depois de recortar:** `apps/mobile/assets/fundos/<clima>.png`.

### Prompt para colar

```
Uma única imagem: 6 painéis VERTICAIS de proporção 9:19.5 (formato de tela de
celular), organizados em grade de 3 colunas por 2 linhas, com 24px de calha
branca entre eles.

Cada painel é uma superfície plana fotografada de frente, a 90 graus, ocupando
o painel inteiro de borda a borda. São fundos: contraste interno BAIXO, sem
assunto, sem foco, sem nada que chame o olho no centro. Toda a variação de
textura fica nas bordas; os 40% centrais são calmos e uniformes.

Os 6 painéis, da esquerda para a direita e de cima para baixo:
1. tampo de mesa de madeira de nogueira quase preto, com marcas de faca e a
   marca circular de um copo
2. parede caiada gasta, com a cal descascando e mostrando o reboco de barro
3. pano de linho grosso dobrado, com uma mancha escura de sangue seco
4. painel de folha de ouro craquelada sobre madeira, SEM nenhuma figura,
   SEM santo, SEM rosto, SEM pintura — apenas o material dourado rachado
5. feltro escuro liso, fibra comprimida, sem nenhuma marca
6. chão de terra batida de casa camponesa, com palha seca pisada

Cinco dos seis são ESCUROS, entre #14100D e #3A2A1C. A única exceção clara é o
painel 2 (parede caiada). O painel 4 é dourado escurecido, não brilhante.

Luz chapada e difusa, sem direção, sem vinheta, sem brilho. A iluminação é
aplicada depois, por software.

[COLE AQUI O BLOCO "REGRAS OBRIGATÓRIAS"]
```

---

## Depois que as imagens chegarem

1. Recortar as folhas nas células e salvar com os nomes acima.
2. As do bloco 2 passam por chave de cor (remover o `#00B140`) e viram PNG com
   alpha.
3. Copiar para `apps/mobile/assets/` o que o app for usar — o Expo não serve
   arquivo de fora da pasta do app, e apontar para `../../assets` dá
   `Unable to resolve manifest assets`.
4. Conferir no escuro, com o brilho baixo, que é a condição real de uso.

O passo seguinte da ordem de produção é a **carta de função de referência**: uma
função montada até o fim com esses materiais, aprovada, virando o gabarito das
outras 23. Depois dela, as demais viram trabalho de montagem, não de criação.

---

# Correção de direção — de fotografia para gravura

As três folhas acima foram geradas e ficaram **fotográficas demais** para um jogo
de mesa. O erro foi do pedido, não do gerador: o prompt dizia "fotografia de
catálogo de museu, não ilustração", e foi exatamente isso que veio.

O diagnóstico é correto e tem uma razão concreta além do gosto: textura
fotográfica a 390pt de largura, no escuro, com o brilho baixo, vira marrom
indistinto. E um jogo de roda precisa ser convidativo antes de ser atmosférico.

### O que muda, e o que não muda

**Não muda:** a âncora cultural (Leste europeu, séc. XIX), a paleta de onze cores,
a regra de luz única aplicada por código, a separação entre tela de momento e
tela de operação.

**Muda o meio:** de *fotografia de material* para **xilogravura popular** —
gravura em madeira, tinta sobre papel, que é como a cultura visual dessa região
realmente se reproduzia em folheto e almanaque. É desenhado, é chapado, lê a
48px, e continua verdadeiro.

**As três folhas já geradas continuam valendo, com outro papel:** elas deixam de
ser o assunto e viram o **substrato**. Gravura popular é tinta sobre papel grosso
e linho — então as texturas entram por baixo, em opacidade baixa, dando grão.
É o que separa uma interface tátil de uma chapada, e é o uso em que o realismo
ajuda em vez de atrapalhar.

---

## Bloco 4 — Ícones das 24 funções

**Uma imagem: 24 ícones, grade 6 × 4.**

### A decisão sobre variantes

São 24 funções **base** e mais de 40 variantes. Pedir uma imagem por variante
seria 64 arquivos, e cada função nova no futuro custaria uma rodada de geração.

Então a divisão é: **o desenho é da função base; a variante continua sendo um
complemento geométrico gerado por código** (`motivos.ts`), aplicado como uma
pequena marca no canto do ícone. O Vidente dos Ossos é o ícone do Vidente com a
marca de osso; o Médico de Guerra é o ícone do Médico com a marca de duplo.

Isso preserva a propriedade que faz o sistema escalar: função nova custa um
desenho, variante nova custa zero.

### O objeto de cada função, e por quê

Sempre que possível o ícone desenha um objeto que **já existe no Bloco 2**. Isso
não é economia: é o que faz a carta e o ícone parecerem do mesmo mundo.

**Vila — 11 funções**

| # | Função | Desenho | Por quê |
|---|---|---|---|
| 1 | Aldeão | Feixe de trigo amarrado | Não tem poder: tem trabalho. O mais humilde do baralho |
| 2 | Vidente | Olho aberto dentro de losango | Vê a facção de um por noite; o losango é o enquadramento de bordado |
| 3 | Detetive | Duas pegadas lado a lado | Compara **dois** jogadores — o poder é a comparação, não a visão |
| 4 | Médico | Frasco com rolha e uma cruz | Protege; o frasco é o mesmo do Bloco 2 |
| 5 | Guarda-costas | Escudo de tábua com travessa | Morre no lugar do protegido |
| 6 | Xerife | Chave grande de ferro | **Prende**: o alvo não age, não morre e não fala |
| 7 | Necromante | Punhado de ossos | Ressuscita um morto |
| 8 | Padre | Cruz ortodoxa de três travessas | Anula todas as mortes da noite |
| 9 | Caçador | Machadinha | Ao morrer, leva alguém junto |
| 10 | Taverneiro | Caneca de barro entornando | Embebeda: o poder do alvo falha e ele não é avisado |
| 11 | Anciã | Roca de fiar com fuso | Se morre, a vila perde os poderes por uma noite. Fiar é o ofício da mais velha |

**Lobos — 7 funções**

| # | Função | Desenho | Por quê |
|---|---|---|---|
| 12 | Lobo | Um dente de lobo | O dente é o motivo da facção. Nunca a fera inteira |
| 13 | Alfa | Pegada de lobo grande, com garras | Converte em vez de matar: manda na matilha |
| 14 | Feiticeiro | Pote de barro com fumaça saindo | O ataque atravessa cura e imunidade |
| 15 | Lobo Carniçal | Gradil de costelas de carcaça | Não morre na hora: mata e expira na noite seguinte |
| 16 | Lobo Sombra | Pegada de lobo pela metade, dissolvendo | Fica imune a investigação por uma noite |
| 17 | Uivador | Corneta de caça | Revela publicamente um lobo — ou a si mesmo |
| 18 | Lobo Branco | Dente partido ao meio | Mata lobos também; pode vencer sozinho |

**Solitários — 6 funções**

| # | Função | Desenho | Por quê |
|---|---|---|---|
| 19 | Bruxa | Dois frascos, um de cabeça para baixo | Escolhe **entre** poção da vida e da morte. Um uso só |
| 20 | Ladrão | Moeda de prata entre dois dedos | Na noite 1 troca de função com outro |
| 21 | Coringa | Selo de cera quebrado ao meio | Missão sorteada e secreta a cada partida |
| 22 | Sobrevivente | Ferradura | Só precisa estar vivo no fim. Vence com qualquer vencedor |
| 23 | Bobo | Laço de corda com nó corrediço | Quer ser **linchado**. O objetivo dele é a forca |
| 24 | Vingador | Pena escrevendo um nome ilegível | Marca um alvo na noite 1 e vence se ele morrer |

### Especificação de entrega

- **Técnica:** xilogravura / linogravura popular. Traço de goiva, grosso e
  confiante, com a irregularidade de quem entalhou — não vetor perfeito, não
  caligrafia fina, não desenho a lápis.
- **Cores:** no máximo três, **chapadas**, sem degradê e sem sombreamento:
  tinta `#14100D`, vermelho `#A32620` como acento, creme `#D9CDB4` como
  preenchimento. Muitos ícones usarão só duas.
- **Composição:** frontal, simétrica quando o objeto permitir, **sem
  perspectiva**, sem chão, sem cenário. O objeto ocupa cerca de 70% da célula.
- **Silhueta:** tem que ser reconhecível **preenchida de preto sólido a 48px**.
  Esse é o teste que reprova ícone bonito e ilegível.
- **Fundo:** verde-croma chapado `#00B140`, pelo mesmo motivo do Bloco 2.
- **Sem moldura, sem círculo de fundo, sem texto, sem numeração.**
- **Depois de recortar:** `apps/mobile/assets/roles/<id>.png`, usando os ids do
  engine: `aldeao`, `vidente`, `detetive`, `medico`, `guarda-costas`, `xerife`,
  `necromante`, `padre`, `cacador`, `taverneiro`, `ancia`, `lobo`, `alfa`,
  `feiticeiro`, `lobo-carnical`, `lobo-sombra`, `uivador`, `lobo-branco`,
  `bruxa`, `ladrao`, `coringa`, `sobrevivente`, `bobo`, `vingador`.

### Prompt para colar

```
Uma única imagem: 24 ícones organizados em grade de 6 colunas por 4 linhas,
sobre fundo verde-croma chapado e uniforme #00B140.

ESTILO — o mais importante: xilogravura popular do Leste europeu, século XIX.
Gravura em madeira impressa em folheto de vila. Traço de goiva grosso, firme e
levemente irregular, como entalhe em madeira. NÃO é fotografia, NÃO é render 3D,
NÃO é vetor liso e perfeito, NÃO é desenho a lápis, NÃO é aquarela.

Cores: no máximo três, sempre CHAPADAS, sem nenhum degradê e sem sombreamento —
tinta quase preta #14100D, vermelho #A32620 como acento, creme #D9CDB4 como
preenchimento. A maioria dos ícones usa só duas.

Composição de cada ícone: objeto único, visto de frente, sem perspectiva, sem
chão, sem cenário, sem moldura, sem círculo de fundo. Centralizado, ocupando
cerca de 70% da célula, com folga em volta. A silhueta precisa ser reconhecível
mesmo preenchida de preto sólido num tamanho muito pequeno.

Os 24 ícones, da esquerda para a direita e de cima para baixo:
1. um feixe de trigo amarrado
2. um olho aberto dentro de um losango
3. duas pegadas de pé descalço lado a lado
4. um frasco com rolha, com uma cruz gravada
5. um escudo de tábuas de madeira com uma travessa
6. uma chave grande de ferro antiga
7. um punhado de ossos pequenos cruzados
8. uma cruz ortodoxa de três travessas
9. uma machadinha de lenhador
10. uma caneca de barro entornando líquido
11. uma roca de fiar com fuso e fio
12. um dente de lobo, sozinho
13. uma pegada de lobo grande, com marcas de garra
14. um pote de barro com fumaça saindo da boca
15. um gradil de costelas de uma carcaça
16. uma pegada de lobo pela metade, a outra metade se dissolvendo
17. uma corneta de caça curva
18. um dente partido ao meio
19. dois frascos lado a lado, um deles de cabeça para baixo
20. uma moeda de prata segurada entre dois dedos
21. um selo de cera quebrado ao meio
22. uma ferradura
23. um laço de corda com nó corrediço
24. uma pena de escrever riscando um nome ILEGÍVEL

Todos os objetos são camponeses e gastos, do mesmo mundo: nada heroico, nada
ornamentado, nada mágico, nenhuma arma de fantasia.

REGRAS: sem rosto, sem pessoa, sem corpo, sem lua, sem lobo inteiro uivando,
sem texto legível, sem letra gótica, sem pentagrama ou runa, sem marca d'água,
sem numeração, sem legenda, sem moldura.
```

> **Teste de aceite:** abra a folha, reduza para 15% e olhe de longe. Se você não
> distinguir a chave do machado, ou o dente do dente partido, o problema é de
> silhueta e nenhuma cor conserta — é regerar.
