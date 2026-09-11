# Sistema visual — o que está implementado

Este documento é o par prático do `identidade.htm`: lá está a direção, aqui está
o que virou código e onde mexer. Escrito depois da repaginação que aplicou o
banco de materiais.

---

## A correção de direção

A identidade original aposta em **colagem de material real** — fotografia e
escaneamento. As três primeiras folhas foram geradas exatamente assim e ficaram
fotográficas demais para um jogo de mesa: a 390pt de largura, no escuro, com o
brilho baixo, textura fotográfica vira marrom indistinto.

A correção **não trocou a âncora cultural**, trocou o meio:

| Camada | Antes | Agora |
|---|---|---|
| Figurativa (ícones, funções) | fotografia recortada | **xilogravura desenhada** |
| Material (fundo, superfície) | fotografia em primeiro plano | fotografia como **substrato**, 10–24% |

Gravura popular do Leste europeu é tinta sobre papel grosso e linho — então o
material fotografado não foi jogado fora: ele virou o papel em que a gravura é
impressa. É o uso em que o realismo ajuda em vez de atrapalhar.

---

## As cinco camadas do `Ambiente`

`components/Ambiente.tsx` é a única implementação de luz do app. A ordem importa:

```
1. Fuligem      preto de base, para nada ficar transparente
2. Material     a superfície fotografada — só grão, 10% a 24%
3. Véu          a cor da fase, por cima do material e por baixo da luz
4. Halo         a chama: fonte única, alta, fora do quadro, queda ao quadrado
5. Sombra       topo e rodapé, para o texto ter onde pousar
```

**O halo e as sombras são arquivos PNG de rampa**, gerados por
`scripts/gerar-gradientes.py`, e não Views empilhadas. A versão anterior
desenhava a luz com dois círculos de `borderRadius`, e eles apareciam na tela
como anéis — exatamente o "halo perfeito" que a identidade proíbe. As rampas são
branco com canal alfa; a cor entra por `tintColor`, então o mesmo arquivo serve
à chama âmbar da noite e ao Sangue Seco da morte.

### Os cinco climas

| Clima | Material | Onde |
|---|---|---|
| `noite` | tampo de nogueira | passagem, ações noturnas |
| `dia` | parede caiada | amanhecer, discussão |
| `morte` | linho com mancha | morte, execução |
| `vitoria` | folha de ouro craquelada | fim de partida |
| `neutro` | feltro escuro | transição |

O `dia` usa opacidade 0.10 contra 0.22 dos outros: é o único material claro do
conjunto e apagaria o texto em qualquer valor que sirva aos demais.

---

## Momento e operação

A regra que a identidade não admite quebrar, agora aplicada por um prop:

```tsx
<Ambiente tipo="momento" />    // revelação, passagem, amanhecer, morte, fim
<Ambiente tipo="operacao" />   // setup, baralho, jogadores, votação, biblioteca
```

Em `operacao` o material fotográfico é desligado, o véu cai a 40% e o halo a
30%. A razão é de uso, não de gosto: durante a partida as pessoas estão no
escuro, com pressa, passando o aparelho — textura em tela de operação custa
legibilidade justo quando ela vale mais. E há o segundo efeito, que é o que faz
valer a pena: poupar a textura faz ela **pesar** quando finalmente aparece.

`TelaOperacao`, em `ui.tsx`, é um invólucro fino sobre `Ambiente`. Antes havia
dois sistemas de luz no app — `ui.tsx` tinha um `TelaMomento` próprio, com os
círculos de borda dura — e telas diferentes acendiam de jeitos diferentes. É
isso que faz um app parecer montado de pedaços.

---

## A área segura

Aplicada no `Ambiente`, uma vez, e não em cada tela. O `SafeAreaProvider`
existia desde o começo sem nenhum consumidor: o rodapé da Home ficava por baixo
da barra de navegação do Android, e o mesmo valia para as outras treze telas.

O fundo continua sangrando até a borda física; só o conteúdo recua.

---

## O bordado

`components/Bordado.tsx` desenha motivos de ponto-cruz ponto a ponto, a partir
de uma trama declarada como texto:

```
'......r......'     r = Garança   c = Cera   n = Nogueira   . = vazio
'.....r.r.....'
```

Cada ponto preenchido vira uma `View` quadrada. Parece caro e não é: a marca tem
13 × 13 células e usa 60 pontos. Em troca, o motivo é **dado** e não desenho —
trocar a arte é editar a string.

- `MARCA` — a marca do jogo: losango da Vila com a roda solar do Dia no centro.
  Juntos são a aposta da partida inteira: a vila chegar ao amanhecer.
- `faixa(largura)` — a barra repetida, para a carta de função.
- `MarcaViva` — a marca com a opacidade oscilando no mesmo ritmo da chama.
  Não gira: bordado não gira, está costurado no pano.

---

## A carta de função

`components/CartaDeRole.tsx` **inverte a regra de cor do resto do app**, e de
propósito. Em toda outra tela o texto é claro sobre Fuligem, porque o app é
usado no escuro. Na carta o objeto citado é papel, e papel tem **tinta escura**:
é o que a torna reconhecível como coisa, e não como painel.

Três coisas fazem a carta ler como objeto, e nenhuma é enfeite:

1. o corpo é mais claro que a tela — papel velho sobre madeira escura;
2. a sombra projetada a levanta do fundo. É o único lugar do app com sombra,
   porque é o único lugar com um objeto solto;
3. a barra bordada na cor da facção identifica o lado **antes de qualquer
   texto** — e cumpre "nunca cor sozinha", porque a barra tem desenho e não só
   tom.

O papel é envelhecido (`#4A3A2C` sob a textura) para não virar clarão na mesa:
uma carta branca acesa no escuro fere o olho e ilumina o rosto de quem age.

---

## Quando a folha de ícones chegar

O Bloco 4 de `ASSETS_A_GERAR.md` produz 24 ícones em xilogravura. O caminho:

1. `python scripts/fatiar-assets.py` (acrescentar a folha à lista do script);
2. arquivos em `apps/mobile/assets/roles/<id>.png`, com os ids do engine;
3. registrar em `src/theme/materiais.ts`, como os outros `require` estáticos;
4. trocar o `<Motivo>` de `CartaDeRole.tsx` e da Biblioteca pelo ícone.

**O complemento de variante continua vindo de `motivos.ts`.** O desenho é da
função base; a variante é uma marca geométrica no canto. É o que mantém a conta
em pé: função nova custa um desenho, variante nova custa zero.

---

## Armadilhas já pagas

- **`width: undefined` numa `Image`**: no `react-native-web` ela cai no tamanho
  intrínseco do arquivo. O papel cobria 241px de uma carta de 307px, e a faixa
  escura que sobrava parecia um elemento de interface. No aparelho o mesmo
  código tila certo — o defeito só aparecia no navegador, que é onde a maior
  parte deste projeto é feita. Use `width: '100%'`.
- **`pointerEvents` é de `ViewStyle`, não de `ImageStyle`.** As rampas de luz
  vão dentro de uma `View` com `pointerEvents="none"`, senão uma imagem por cima
  da tela inteira engole os botões.
- **Afordância não é tamanho.** Os `−` e `+` do baralho sempre tiveram alvo de
  44 × 48, dentro do mínimo da identidade. Faltava moldura: no escuro, sinais
  soltos leem como texto, e a pessoa aperta o nome da função.
