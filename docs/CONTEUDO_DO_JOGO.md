# Vârcolac — conteúdo e contexto completos

> **Para que serve este documento.** Ele reúne, num arquivo só, tudo que o jogo é
> hoje: regras, catálogo, arquitetura e as restrições de design. Foi escrito para
> ser entregue inteiro a uma IA junto de um pedido do tipo *"crie 5 roles novas"*,
> *"proponha um modo novo"* ou *"invente uma mecânica para o problema X"*.
>
> **Se você é a IA lendo isto:** as seções 1 a 3 dizem o que o jogo É e o que ele
> RECUSA ser — respeite-as, porque a maior parte das ideias ruins neste gênero
> falha ali, não na execução. As seções 4 a 8 são o inventário do que já existe;
> não proponha o que já está feito. A seção 9 é a mais importante para você: ela
> diz exatamente o que o motor consegue expressar hoje, e o que exigiria código
> novo. Proponha dentro do vocabulário existente sempre que possível, e quando
> sair dele, diga que saiu.

---

## 1. O que é o jogo

Aplicativo de celular que substitui o baralho de cartas e o narrador humano em
partidas presenciais de Lobisomem.

| | |
|---|---|
| **Formato** | Pass-and-play local. Um único aparelho, offline. Sem multiplayer online. |
| **Jogadores** | 5 a 16 |
| **Duração** | Variável, em função do número de jogadores e da composição |
| **Tom** | Folclórico e sombrio. Vila de madeira, névoa, vela, medo real. |
| **Referência cultural** | Leste europeu e Bálcãs — a origem folclórica real do lobisomem |

**A tese do produto.** Todos os concorrentes tratam o celular como um baralho com
cronômetro, e competem entre si pelo número de funções no catálogo. Este projeto
compete por outra coisa: **o celular como mestre de jogo** — que sabe o que
aconteceu, reage a isso e muda a partida.

Consequência prática para quem propõe conteúdo novo: **mais uma role no catálogo
não é, por si, valor**. Uma mecânica que faça o app reagir ao que a mesa fez vale
mais do que dez funções a mais.

---

## 2. Os três pilares (e o que eles vetam)

A função de um pilar é dizer **não**. Com quatro ou mais, eles param de servir
para isso — por isso são três, e por isso não se acrescenta um quarto.

**A — A mesa é o jogo.**
A tela nunca prende a atenção por mais de ~10 segundos por jogador. Tudo que o
app faz existe para criar assunto na conversa presencial.
*Veta:* mecânica que exige leitura longa, minigame, qualquer coisa que faça a
pessoa olhar para o aparelho em vez de para as outras.

**B — Ninguém sai da mesa.**
Morrer muda o seu jogo, não encerra.
*Veta:* qualquer eliminação que deixe alguém encostado no sofá por 20 minutos.

**C — Nenhuma partida se repete.**
Eventos, baralhos gerados, variantes. O grupo nunca sabe exatamente qual jogo vai
jogar hoje.
*Veta:* conteúdo fixo que apareça igual em toda partida.

**Diretriz secundária forte — acessível em 10 minutos.** O app ensina no momento
em que a informação é necessária. Não é pilar, mas pesa em toda decisão.

### O teste que toda mecânica precisa passar

> **Isso aumenta a conversa na mesa, ou rouba tempo dela?**

Os pilares B e C adicionam interação com o celular dentro de um jogo que deve
rolar entre as pessoas. Essa é a tensão central do projeto, e é onde as ideias
morrem.

### Rejeitado explicitamente

- **Economia social como pilar.** Existe apenas como sistemas pontuais (ações de
  role), nunca como princípio geral.
- **Culto / terceira facção coletiva.** Não existe e não deve ser proposto.
  Facções adormecidas — que só surgem se um evento as acordar — ficam como
  estudo futuro, não como v1.
- **Itens e inventário.** As roles se expressam por habilidade, não por objetos.

---

## 3. Orçamento de tempo (com 8 jogadores)

| Fase | Tempo |
|---|---|
| Noite (5 roles ativas, passagem completa) | ~90s |
| Amanhecer | ~20s |
| Discussão | ~180s (teto prático de 3 min) |
| Votação (simultânea) | ~30s |
| **Ciclo** | **≈ 5 min** |

Qualquer mecânica nova precisa caber nesse orçamento. Uma role que adiciona 15
segundos por jogador adiciona **dois minutos** ao ciclo numa mesa de 8.

---

## 4. Facções e vitória

| Facção | Vitória |
|---|---|
| **Vila** | Eliminar todas as ameaças |
| **Lobos** | **Igualar** ou superar a vila em número (não precisa superar) |
| **Solitários** | Objetivo pessoal |

Solitários têm alinhamento: **bem** (vence com a vila), **mal** (conta como lobo
para efeito de paridade), **puro** (só a própria condição), **herda** (assume o
alinhamento da role roubada — Ladrão), **definido-em-jogo** (Bruxa, pela poção:
vida = bem, morte = mal).

Vitórias são **em camadas**: a vila pode vencer e o Bobo também. Uma proposta que
exija "só um vencedor" contradiz o desenho.

---

## 5. Catálogo atual — 24 roles + 1 modificador

O peso alimenta a calculadora de balanceamento (seção 7).

### Vila — 11 roles

| Role | Peso | Etapa | Usos | Ação |
|---|---|---|---|---|
| Aldeão | 0 | — | ∞ | Nenhuma habilidade. Só voz e voto. |
| Vidente | 3 | informacao | ∞ | Vê a facção de um jogador por noite. Perde o voto do dia seguinte. |
| Detetive | 3 | informacao | ∞ | Compara dois jogadores: mesma facção ou não. |
| Médico | 3 | protecao | ∞ | Protege um jogador por noite. |
| Guarda-costas | 3 | protecao | ∞ | Morre no lugar do protegido. |
| Xerife | 3 | bloqueio | ∞ | Prende: o alvo não age, não morre e não fala no dia seguinte. |
| Necromante | 4 | ressurreicao | 1× | Ressuscita um morto (só de noites anteriores). |
| Padre | 2 | protecao | 1× | Anula todas as mortes da noite. |
| Caçador | 2 | estertores | 1× | Ao morrer, leva alguém junto. |
| Taverneiro | 1 | bloqueio | ∞ | Embebeda: o poder do alvo falha, e ele não é avisado. |
| Anciã | 2 | estertores | ∞ | Se morrer por qualquer causa, a vila perde todos os poderes por uma noite. |

### Lobos — 7 roles

| Role | Peso | Etapa | Usos | Ação |
|---|---|---|---|---|
| Lobo | 3 | ataque | ∞ | Mata com a matilha. |
| Alfa | 4 | ataque | 1× | Converte em vez de matar. |
| Feiticeiro | 4 | perfuracao | 1× | O ataque da matilha atravessa curas e imunidades. |
| Lobo Carniçal | 4 | estertores | 1× | Ao ser morto, mata alguém e só expira na noite seguinte. |
| Lobo Sombra | 3 | protecao | 1× | Fica imune a investigação; na noite seguinte a matilha não mata. |
| Uivador | 3 | ataque | 1× | Revela publicamente um lobo — ou a si mesmo. Em troca, a matilha mata dois na seguinte. |
| Lobo Branco | 2 | ataque | ∞ | Mata lobos também. Pode vencer sozinho. |

### Solitários — 6 roles

| Role | Peso | Alinhamento | Vitória |
|---|---|---|---|
| Bruxa | 3 | definido pela poção | Vence com quem sobrar |
| Ladrão | 2 | herda | Assume o alinhamento da role roubada |
| Coringa | 2 | puro | Missão sorteada e secreta |
| Sobrevivente | 1 | puro | Estar vivo no fim (não é imune aos lobos) |
| Bobo | 1 | puro | Ser linchado (não pode votar em si mesmo) |
| Vingador | 1 | bem | Vence se o alvo escolhido na noite 1 morrer, por qualquer causa |

### Modificador — Amantes (peso 2)

Aplica-se sobre **duas roles existentes**; cada amante mantém a própria role.
Vencem se forem os dois últimos vivos.

### Variantes (selecionáveis e transparentes: a mesa sabe qual está em jogo)

| Role | Variante | Peso | Efeito |
|---|---|---|---|
| Aldeão | Herdeiro | 2 | Herda a role de alguém que morreu (1×). |
| Aldeão | Teimoso | 0 | Não pode mudar o voto depois de declarado. |
| Aldeão | Testemunha | 1 | O app confirma publicamente que ele é aldeão (1×). |
| Vidente | dos Ossos | 1 | Só enxerga mortos. |
| Vidente | do Espelho | 3 | O alvo é avisado de que alguém o observou. |
| Vidente | dos Sonhos | 2 | A visão chega uma noite depois. |
| Vidente | Confusa | 2 | Duas visões, uma falsa. Não sabe qual. |
| Detetive | Obsessivo | 3 | Trava um alvo na noite 1. N1: facção · N2: role · N3: em quem votou. |
| Detetive | Cansado | 2 | Só age em noites ímpares. |
| Detetive | Delegado | 3 | Revista pública: a mesa descobre se tem poder, não a facção. |
| Médico | Curandeiro | 2 | Nunca repete alvo. |
| Médico | de Guerra | 4 | Cura dois, mas amanhece revelado. |
| Médico | de Plantão | 2 | Só cura quem foi atacado na noite anterior. |
| Guarda-costas | Sacrifício | 4 | Morre no lugar e leva o atacante junto. |
| Guarda-costas | Escudo | 3 | Absorve o ataque e morre uma noite depois. |
| Guarda-costas | Muralha | 3 | Protege dois; se qualquer um for atacado, ele morre. |
| Padre | Exorcista | 2 | Anula todas as mortes da noite. |
| Padre | Sino da Igreja | 2 | Cancela a votação do dia seguinte. |
| Padre | Mártir | 3 | Morre no lugar do condenado, sem passagem e sem revelação. |
| Caçador | Armadilha | 2 | Declara o alvo à noite; o tiro só dispara se ele morrer. |
| Caçador | Último Uivo | 2 | Revela a role de alguém em vez de matar. |
| Caçador | Vingativo | 1 | Só atira em quem votou nele. |
| Amantes | Amor Proibido | 2 | Se um morre, o outro morre de tristeza. |
| Amantes | Amor Cego | 2 | Só um dos dois sabe do vínculo. |

### Removidas durante o desenvolvimento (disponíveis para expansão)

Vigia, Rastreador, Sineiro, Cartomante, Prefeito, Empata, Recluso, Coveiro,
Menino Selvagem, Lobo Sonhador, Filhote, Flautista, Encrenqueiro, Insone,
Ferreiro, Bode Expiatório, Advogado, Mudo, Mentiroso, Paranoico, Lobo Órfão,
Lobo Ferido, Imitador, Colecionador, Executor, Duelista, e toda a facção Culto.

> **Conceito removido que limita propostas:** *"visitar"* — o rastro de quem foi
> até quem à noite. Foi cortado por complexidade. Vigia e Rastreador dependiam
> dele. **Se você propuser uma role que precise saber "quem visitou quem", saiba
> que está reabrindo essa decisão** e diga isso explicitamente.

---

## 6. As 11 etapas da resolução noturna

Toda ação da noite entra numa destas etapas. **A ordem nunca muda.**

| # | Etapa | Quem age | Regra |
|---|---|---|---|
| 1 | `estado-inicial` | Amantes, Coringa, Ladrão | Vínculos e trocas resolvidos na atribuição |
| 2 | `evento` | App | Sorteado ou por gatilho. Pode cancelar etapas inteiras |
| 3 | `bloqueio` | Xerife, Taverneiro | O alvo não age; a escolha dele é descartada |
| 4 | `interferencia-espectral` | Assombrar, Pesadelo | Fantasmas agem depois dos vivos |
| 5 | `protecao` | Médico, Guarda-costas, Padre | Marca quem está protegido |
| 6 | `perfuracao` | Feiticeiro | Remove proteções e imunidades do alvo |
| 7 | `ataque` | Matilha, Lobo Branco, Bruxa | Declaram alvos; ninguém morre aqui |
| 8 | `resolucao-mortes` | App | Cruza ataques com proteções e perfurações |
| 9 | `estertores` | Caçador, Carniçal, Anciã | Dispara para quem morreu — **em cadeia completa** |
| 10 | `ressurreicao` | Necromante | Apenas mortes de noites **anteriores** |
| 11 | `informacao` | Vidente, Detetive | Lê o estado do **início** da noite |

### Regras de conflito (já implementadas e sob teste)

| Conflito | Resolução |
|---|---|
| Padre × Feiticeiro | **O Padre vence.** Ele não protege ninguém — cancela a noite inteira. O Feiticeiro só perfura proteções individuais. |
| Cadeia de estertores | **Cadeia completa.** O Caçador morre e atira no Carniçal, que ao morrer também mata, até esgotar. Cada um dispara no máximo uma vez. |
| Necromante na noite corrente | Não pode. Só desfaz mortes de noites anteriores. |
| Bloqueio mútuo | Se dois se bloqueiam, ambos falham. |
| Bloqueado protege? | Não. Xerife que prende o Médico anula a cura daquela noite. |
| Preso é imune | Quem está preso não morre — mas o Feiticeiro perfura essa imunidade. |
| Informação lê o passado | A Vidente que investigou alguém que morreu naquela noite ainda recebe a leitura. |
| Necromante não desfaz estertores | Se o Caçador já atirou, o tiro vale mesmo que ele volte. |
| Matilha mata junta | Vários lobos declaram; os votos viram **um** alvo (ou `cota`). Empate é sorteado. |

**A matilha mata JUNTA.** Vários lobos declaram alvos na passagem; os votos
viram um alvo só (ou `cota`), e o empate é sorteado.

**Estertor dispara com morte por QUALQUER causa** — inclusive linchamento. O
Caçador linchado atira; a Anciã linchada derruba os poderes da vila.

---

## 7. Calculadora de peso

Um único motor, dois usos: **avisar** quando o host monta um baralho torto, e
**gerar** baralhos válidos para o Baralho Surpresa.

```
IE  =  Força da Vila  −  ( Força da Matilha × M )
```

| Jogadores | M | Razão |
|---|---|---|
| 5–7 | 1,8 | Mesa pequena: lobos proporcionalmente mais fortes |
| 8–11 | 1,6 | Faixa de referência |
| 12+ | 1,4 | Mesa grande: mais ruído, coordenação mais difícil |

| IE | Leitura |
|---|---|
| −2 a +2 | Equilibrado |
| +3 a +5 | Vila forte |
| acima de +5 | Vila quebrada |
| −3 a −5 | Matilha forte |
| abaixo de −5 | Massacre |

**Restrições estruturais:** lobos ≈ jogadores ÷ 3,5 · solitários ≤ 25% da mesa ·
no máximo uma role de peso 4+ a cada 4 jogadores.

**Ajustes de setup:** roles reveladas ao morrer +2 vila · contagem de lobos
pública +1 vila · módulos de fantasma +1 vila · votação secreta 0.

**O ponto mais importante do modelo:** eventos **não** mudam o IE — eles alargam
a tolerância. Com eventos em "caótico", um IE de −4 é aceitável; sem eventos, é
um massacre anunciado.

### Estado da calibragem (medido, não estimado)

O IE é uma previsão; a simulação em massa é a medição. Elas foram confrontadas
sobre milhares de composições, e o resultado mudou o modelo:

- **M passou de 1,4–1,8 para 2,6**, porque a versão estimada superavaliava a
  vila de forma sistemática.
- **A dependência de tamanho de mesa saiu.** Duas amostras independentes deram
  ordenações opostas — a medição não enxerga esse efeito.

**O limite, que importa para quem propõe conteúdo:** mesmo calibrado, o modelo
prevê mal o lado da VILA. "Todos Poderosos" soma 22 de força e mede 39% de
vitória; "Vila Cega" soma 13 e mede 27%. A causa é o oponente de referência —
o bot protege ao acaso, não deduz e não lembra, então poder de vila quase não
converte em vitória para ele.

Na prática: **o peso de uma role de lobo é confiável; o de uma role de vila é um
palpite informado.** Traga um peso sugerido, mas não construa uma ideia em cima
da precisão dele.

---

## 8. Sistemas configuráveis

Sete sistemas independentes, ligáveis no setup. É aqui que mora a diferença
contra o líder de mercado: o host não escolhe um baralho, ele **monta uma
experiência**.

| Sistema | Opções |
|---|---|
| Modo de jogo | Clássico · Traição · Vila Amaldiçoada · Duplas |
| Baralho | Preset de fábrica · Baralho Surpresa · Montado à mão |
| Variantes de role | Qual versão de cada role entra |
| Módulos de fantasma | 5 módulos (abaixo) |
| Revelação de role ao morrer | Sim · Não |
| Contagem de lobos | Pública · Oculta · Faixa |
| Eventos | Desligado · Raro · Frequente · Caótico |
| Votação | Simultânea · Secreta |

### Modos (mudam REGRAS, não composição)

| Modo | Regra |
|---|---|
| **Clássico** | A base. Noite, dia, votação, eliminação. |
| **Traição** | Todos começam na vila. A cada noite o app converte alguém em segredo. A matilha é **totalmente cega**. O convertido **mantém a própria role**. |
| **Vila Amaldiçoada** | Prazo fixo de noites. Se a vila não eliminar os lobos, todos morrem. A cada noite, um **agravamento** sorteado. |
| **Duplas** | Duplas fixas que se conhecem desde o início. As duplas são **mistas**: seu parceiro pode ser lobo. |

> **Buraco aberto:** a matilha cega da Traição parece impossível de coordenar. O
> dossiê resolvia isso com o sussurro noturno, que foi cortado. Hoje o modo está
> sem essa ferramenta — é um dos melhores lugares para propor mecânica nova.

**Em estudo, fora do v1:** Crônica (partida longa com memória entre sessões),
Solo com bots (V2 — único item que exige tecnologia de verdade).

### Módulos de fantasma

| Módulo | Tipo | Usos | Mín. mortos | Efeito |
|---|---|---|---|---|
| Peso da Culpa | passivo | ∞ | 1 | Só ganha voto quem foi linchado **injustamente**. Auto-corretivo. |
| Assombrar | individual | 1 | 1 | Marca um vivo; a ação noturna dele falha. |
| Pesadelo | individual | 1 | 1 | Informação privada — o fantasma escolhe se é verdadeira ou falsa. |
| Conselho dos Mortos | coletivo | 1 | 2 | Os mortos votam qual evento atinge a vila. |
| Julgamento do Além | coletivo | ∞ | 2 | Depois de cada linchamento, os mortos dizem se foi justo — sem placar. |

> **Buraco conhecido e assumido:** nenhum módulo dá ao fantasma algo para fazer
> **toda noite**. Um fantasma que já gastou seu Pesadelo volta a ficar parado. Se
> a morte voltar a parecer entediante em playtest, é aqui. **Boa área para
> propostas novas.**

### Sussurro noturno — REMOVIDO

O dossiê previa bilhetes anônimos de três palavras trocados durante a passagem.
**A mecânica foi cortada do jogo.** Duas consequências que quem propõe conteúdo
novo precisa saber:

- A resolução noturna tem **11 etapas**, não 12 — a etapa `sussurros` saiu junto.
- **A matilha cega do modo Traição ficou sem ferramenta de coordenação.** O
  dossiê apontava o sussurro como a resposta exata para esse problema. Sem ele,
  os lobos da Traição dependem só do que der para dizer em voz alta no dia. É um
  buraco aberto, e um bom lugar para propor mecânica nova.

### Eventos

**Família 1 — por sorte**

| Evento | Visibilidade | Efeito |
|---|---|---|
| Névoa Cerrada | silencioso | A Vidente não enxerga nada. |
| Lua Cheia | narrado | A matilha mata dois. |
| Noite Sem Lua | narrado | A matilha não mata. |
| Chuva de Sangue | narrado | Todas as proteções falham. |
| Sono Pesado | narrado | Nenhum poder funciona. Só a matilha age. |
| Ossos na Encruzilhada | narrado | Revela a role de um morto sorteado. |
| Fogo-fátuo | silencioso | Um vivo recebe informação falsa como verdadeira. |
| Presságio | narrado | O app diz um nome em voz alta. E não explica. |

> O Presságio não faz nada mecanicamente e provavelmente é o evento mais
> devastador do jogo. **É o modelo do que "o celular como mestre" significa.**

**Família 2 — por gatilho**

| Gatilho | Evento | Efeito |
|---|---|---|
| 2 inocentes linchados seguidos | Caça às Bruxas | A vila pode linchar dois. |
| 3 inocentes linchados | Motim | Aldeões perdem o voto por um dia. |
| Padre ou Guarda-costas morre | Luto Sagrado | Proteção coletiva por uma noite. |
| Matilha 2 noites sem matar | Sede de Sangue | Obrigada a matar dois. |
| 2 mortes na mesma noite | Velório | Não há votação no dia seguinte. |
| Votação empata | A Corda Escolhe | O app sorteia e narra como destino. |
| Alguém vota em si mesmo | Delação | Revela publicamente a facção dessa pessoa. |
| Terceiro morto | Vingança dos Ossos | Os mortos escolhem o próximo evento. |

**Família 3 — destravamento (escrita, FORA do v1).** Resolvia "a mesa está há dez
minutos discutindo sem chegar a lugar nenhum": A Corda Não Espera, Confissão
Forçada, Meia Vila, A Última Vela, Julgamento de Deus.

### Estilos de baralho

Clássico · Roleta Russa (*um lobo, todo o resto quer morrer* — estilo-vitrine) ·
Mistério · Caos · Matilha · Vila Cega · Todos Poderosos · Sobrevivência · Mesa
Pequena · Noite Longa.

### Missões do Coringa

Estar vivo no fim · Morrer durante uma noite · Nunca votar em ninguém · Acusar um
lobo antes da noite 3 (julgada na mesa) · Ser acusado e sobreviver ao dia.

---

## 9. O que o motor consegue expressar hoje

**Esta é a seção que determina se uma proposta é barata ou cara.**

### Toda role tem um motivo (ícone)

Os ícones não são desenhos de objetos: são **motivos de bordado**, geométricos e
planos, compostos de primitivas (`losango`, `circulo`, `barra`, `triangulo`,
`ponto`) em `data/motivos.ts`. Uma role sem motivo é uma role pela metade.

**A variante não tem ícone próprio.** Ela acrescenta um COMPLEMENTO ao motivo da
role base — o mesmo desenho, mais específico. Há um vocabulário de complementos
com significado fixo, e reutilizá-lo é o que mantém o sistema legível:

| Complemento | Quer dizer |
|---|---|
| barra curta embaixo | enfraquecido |
| cruz pequena embaixo | reforçado |
| ponto no canto | acontece depois |
| losango maior por fora | alcança dois |
| círculo por fora | a mesa toda vê |

Uma proposta de role nova deve vir com o motivo descrito nessas primitivas, e
uma variante deve dizer qual complemento usa.

### Uma role é declarada assim

```ts
{
  id: 'vidente',
  nome: 'Vidente',
  faccao: 'vila' | 'lobos' | 'solitario',
  alinhamento?: 'bem' | 'mal' | 'puro' | 'herda' | 'definido-em-jogo',
  categoria: 'informacao' | 'protecao' | 'ataque' | 'suporte' | 'bloqueio' | 'passivo' | 'nenhuma',
  peso: 3,
  etapa?: <uma das 12 etapas>,
  usoLimitado: { kind: 'ilimitado' }
             | { kind: 'por-partida', total: n }
             | { kind: 'noites-alternadas', paridade: 'impar' | 'par' },
  variantes: [{ id, nome, descricao, peso, etapa?, usoLimitado? }],
  vitoriaPropria: boolean,
  descricaoCurta, descricaoLonga,
}
```

**Uma role que só combine esses campos custa um arquivo de dados e zero código.**
A tela de ação, a pergunta na passagem, a biblioteca e a calculadora se ajustam
sozinhas.

### O que já existe como vocabulário reutilizável

**Efeitos adiados** (`types/effect.ts`) — qualquer mecânica de "na próxima noite"
entra numa fila tipada:

`matilha-mata-n` · `matilha-nao-mata` · `poderes-suspensos` · `sem-votacao` ·
`lincha-dois` · `aldeoes-sem-voto` · `protecao-coletiva` · `expira` (morte
adiada) · `visao-atrasada` · `prazo-da-maldicao`

**Efeitos de evento** (declarativos, sem código): `cancela-etapas` ·
`anula-protecoes` · `matilha-mata-n` · `silencia-role` · `revela-role-de-morto` ·
`informacao-falsa` · `nomeia-alguem` · `revela-faccao` · `adia` ·
`desempata-por-sorteio` · `mortos-escolhem-evento`

**Gatilhos de evento:** `inocentes-linchados-seguidos` ·
`inocentes-linchados-total` · `role-morreu` · `matilha-sem-matar` ·
`mortes-na-noite` · `votacao-empatada` · `voto-em-si-mesmo` · `enesimo-morto`

**Marcas voláteis por jogador** (limpas a cada amanhecer): `protegido` ·
`bloqueado` · `perfurado` · `preso` · `imuneInvestigacao` · `assombrado` ·
`embriagado` · `estertorPendente`

**Estado persistente por jogador:** status · rodada e causa da morte · amanteDe ·
usosRestantes · semVoto · silenciado

**Modos são ganchos:** `aoCriarPartida` · `aoAmanhecer` · `derrotaDaVila`.
Um modo novo que caiba nesses três ganchos custa um arquivo.

### O que NÃO existe e exigiria código novo

- **"Visitar"** — o rastro de quem foi até quem. Removido por complexidade.
- **Troca de role em jogo** — o Ladrão troca só na criação; o Aldeão Herdeiro
  ainda não está implementado.
- **Conversão em jogo** — a Traição marca o convertido em `objetivosSecretos`,
  mas a facção efetiva dele ainda não muda na checagem de vitória.
- **Informação com atraso arbitrário** — só existe `visao-atrasada` de uma noite.
- **Ações do dia** (fora votar) — nenhuma role age durante a discussão.
- **Sussurro / bilhete anônimo** — existiu e foi removido; reintroduzir exige
  etapa nova na resolução e tela nova na passagem.
- **Memória entre partidas** — não existe persistência. Modo Crônica depende
  disso.
- **Votação em mais de um turno / segundo turno** — a votação é uma rodada só.
- **Habilidades que dependem de contagem de votos individuais** — o histórico
  guarda os votos, mas só o Caçador Vingativo os consulta.

### Invariantes que não podem ser quebradas

1. **A etapa 11 lê o estado do INÍCIO da noite.** Informação nunca vaza o
   resultado da noite corrente.
2. **Todo sorteio passa pelo RNG semeado.** A mesma semente reproduz a partida
   inteira. Qualquer mecânica que use `Math.random()` quebra a reprodutibilidade
   e a simulação em massa junto.
3. **A ordem das 12 etapas nunca muda.**
4. **Estertor dispara com morte por qualquer causa.**
5. **Nenhuma etapa muta estado** — todas devolvem um estado novo.
6. **Toda etapa registra no log o que fez E por quê.**

---

## 10. Interface e identidade (restrições para propostas)

**Separação rígida:** textura em telas de **momento** (revelação, passagem,
amanhecer, morte, evento narrado, fim); limpeza em telas de **operação** (setup,
baralho, lista, votação, biblioteca).

**Decisões fechadas:**
- **Segurar para revelar** — a role só aparece com o dedo na tela; o gesto já
  cobre o aparelho com a mão.
- **Distribuição embutida na noite 1** — corta uma volta de mesa inteira.
- **Passagem completa com toques falsos** — todos recebem o aparelho, senão quem
  tem poder se revela pela chamada.
- **Votação simultânea por padrão** — todos apontam na contagem de três.
- Alvos ≥ 48px · sem branco puro (o mais claro é Linho Cru `#D9CDB4`) ·
  transição máxima de 250ms · nunca cor sozinha para indicar estado.

**Paleta** (todas com procedência material): Fuligem `#14100D` · Nogueira
`#3A2A1C` · Ferrugem `#6B4A32` · Linho Cru `#D9CDB4` · Chama `#F0C97A` · Cera
`#E0B75C` · Folha de Ouro `#C9A227` · Garança `#A32620` · Sangue Seco `#6E1F1F` ·
Índigo `#1F3550` · Horezu `#2E5545`.

**Uso semântico:** Garança = ação/acusação · Sangue Seco = morte · Cera/Chama =
informação revelada · Folha de Ouro = vitória · Índigo = noite e fantasmas ·
Horezu = proteção.

**Proibido:** tipografia gótica ou blackletter (marcador nº1 de fantasia
genérica) · lua cheia enorme atrás de um lobo uivando · sombra cinza ou azul ·
fantasy art · vermelho neon e roxo · pentagrama e runa nórdica aleatória.

---

## 11. Pendências e buracos conhecidos

**Bons lugares para propor coisas novas:**

1. **O fantasma sem nada para fazer toda noite** (seção 8). O buraco mais
   provável de aparecer em playtest.
1b. **A matilha cega da Traição sem ferramenta de coordenação**, depois que o
   sussurro saiu (seção 8).
2. **Os pesos das roles de VILA** (seção 7). O M foi calibrado por medição, mas
   os pesos da vila não puderam ser — e só serão depois que o bot souber
   converter poder em vitória.
3. **Família 3 de eventos** — cinco eventos de destravamento escritos e prontos,
   fora do v1. A família que resolve "a mesa travou".
4. **Modificadores de role** — a arquitetura foi reaberta pelos Amantes. Cartas
   aplicáveis sobre qualquer role são um espaço quase vazio.
5. **Facções adormecidas** — uma facção que só existe se um evento a acordar.
6. **Contagem do catálogo** — 24 roles + 1 modificador. A meta era 25 roles.

**Decisões ainda em aberto:** nome do jogo (usando *Vârcolac* como provisório) ·
direção de arte concreta · monetização · se a noite 1 deve ter morte.

---

## 12. Como pedir conteúdo novo a uma IA com este documento

Modelo de pedido que funciona:

> Leia o documento inteiro. Proponha **N** [roles / variantes / eventos / modos]
> novos que:
> - passem no teste da seção 2 (aumenta a conversa na mesa?);
> - caibam no orçamento de tempo da seção 3;
> - usem **apenas** o vocabulário da seção 9 — ou, se saírem dele, digam
>   exatamente o que precisaria ser construído;
> - não repitam nada da seção 5 nem das removidas;
> - venham com: id, nome, facção, categoria, peso sugerido, etapa, usos,
>   descrição curta e longa, e **uma linha dizendo qual pilar a ideia serve**;
> - incluam pelo menos uma que ataque um dos buracos da seção 11.
>
> Para cada proposta, diga em uma frase **o que ela cria de conversa na mesa** —
> se você não conseguir responder isso, a ideia não serve.

---

*Documento gerado a partir do código-fonte em `packages/engine/src/data/`. Se o
catálogo mudar, ele desatualiza — regere consultando os arquivos de dados.*
