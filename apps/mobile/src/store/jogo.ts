import { create } from 'zustand';
import {
  cartasDoModo,
  chaveDaCarta,
  lerChave,
  podarParaModo,
  type CartaSelecionavel,
} from './selecao';
import { lerMesa, salvarMesa } from './persistencia';
import {
  DEFAULT_CONFIG,
  baralhoDeFabrica,
  calcularEquilibrio,
  criarPartida,
  marcarTrocaVista,
  gerarBaralho,
  modo as ganchosDoModo,
  prepararNoite,
  resolverDia,
  role,
  resolverNoite,
  retomarRng,
  roteiroDaNoite,
  sementeAleatoria,
  verificarVitoria,
  type BalanceResult,
  type Deck,
  type DeckStyle,
  type GameConfig,
  type GameState,
  type NightAction,
  type Passagem,
  type PlayerId,
  type RoleId,
  type VictoryResult,
} from '@jogo/engine';

/**
 * A sessão de mesa.
 *
 * O engine sabe as regras; este store sabe ONDE o celular está. Ele guarda o
 * índice da passagem, as ações coletadas até agora e os votos do dia — nada
 * mais. Nenhuma decisão de jogo mora aqui, pelo mesmo motivo do laboratório: se
 * morasse, existiriam duas regras, e elas divergiriam.
 */

export interface JogadorDaMesa {
  readonly nome: string;
  readonly cor: string;
}

/** Cores de identificação: nome + cor, salvos por grupo. */
export const CORES_DE_JOGADOR = [
  '#A32620',
  '#2E5545',
  '#1F3550',
  '#C9A227',
  '#6B4A32',
  '#6E1F1F',
  '#D9CDB4',
  '#E0B75C',
  '#3A2A1C',
  '#8C6A3F',
  '#4A5D3A',
  '#7A3B4A',
  '#2F4858',
  '#B08D57',
  '#5C4033',
  '#93704A',
];

interface JogoStore {
  // ── Setup ──
  jogadores: JogadorDaMesa[];
  estilo: DeckStyle;
  config: GameConfig;
  deck: Deck;
  equilibrio: BalanceResult | null;

  /**
   * As cartas que a mesa marcou com SIM. Chaves de `selecao.ts`.
   *
   * Substituiu, de uma vez, o contador `- 0 +` por função, a lista de
   * "permitidas" e o Baralho Surpresa — os três eram formas diferentes de
   * dizer a mesma coisa e cada um tinha a sua tela. Agora existe uma lista e um
   * interruptor (`config.selecaoAleatoria`) que decide o que fazer com ela.
   */
  selecionadas: string[];
  /** Já terminou de ler o que estava salvo em disco? A Home espera por isto. */
  carregada: boolean;

  // ── Partida ──
  estado: GameState | null;
  vitoria: VictoryResult | null;

  // ── Passagem do celular ──
  roteiro: readonly Passagem[];
  indice: number;
  acoes: NightAction[];

  // ── Dia ──
  votos: Record<PlayerId, PlayerId | null>;
  /**
   * Quantos votos cada um recebeu, na votação SIMULTÂNEA.
   *
   * Vive separado de `votos` porque é outra coisa: `votos` guarda quem apontou
   * para quem (votação secreta, um por vez), e isto guarda só o placar — que é
   * tudo que o host consegue ver quando oito pessoas apontam ao mesmo tempo.
   */
  votosContados: Record<PlayerId, number>;

  // ── Ações de setup ──
  adicionarJogador: (nome: string) => void;
  removerJogador: (indice: number) => void;
  renomearJogador: (indice: number, nome: string) => void;
  reordenarJogadores: (de: number, para: number) => void;
  setEstilo: (e: DeckStyle) => void;
  setConfig: (patch: Partial<GameConfig>) => void;
  alternarCarta: (chave: string) => void;
  limparSelecao: () => void;
  marcarTudo: () => void;
  /** Quantas cartas faltam (ou sobram) para a mesa poder começar. */
  saldoDaSelecao: () => number;
  recalcular: () => void;
  /** Lê o setup salvo em disco. Chamado uma vez, na abertura do app. */
  restaurar: () => Promise<void>;

  // ── Fluxo de partida ──
  comecar: () => void;
  registrarAcao: (acao: NightAction | null) => void;
  /** A tela de "sua carta mudou" já foi mostrada a este jogador. */
  verTroca: (id: PlayerId) => void;
  proximaPassagem: () => void;
  fecharNoiteAgora: () => void;
  votar: (de: PlayerId, em: PlayerId | null) => void;
  /** Soma ou tira um voto do placar de alguém, na votação simultânea. */
  ajustarVoto: (em: PlayerId, delta: number) => void;
  fecharVotacao: () => void;
  seguirParaNoite: () => void;
  encerrar: () => void;
}

const NOMES_SUGERIDOS = [
  'Ana',
  'Bruno',
  'Célia',
  'Davi',
  'Elza',
  'Fábio',
  'Gil',
  'Hilda',
  'Ivo',
  'Júlia',
  'Kaio',
  'Lara',
  'Miro',
  'Nina',
  'Otávio',
  'Pilar',
];

/**
 * Transforma a lista de cartas marcadas num baralho de `jogadores` cartas.
 *
 * Três casos, e os três precisam ser previsíveis para o host:
 *
 * - **Sobram cartas** e a seleção é aleatória: o app escolhe, em silêncio.
 * - **Sobram cartas** e a seleção NÃO é aleatória: leva as primeiras, em
 *   ordem. A tela não deixa chegar aqui — ela exige o número exato —, e este
 *   caminho existe só para não haver estado impossível.
 * - **Faltam cartas**: o resto vira Aldeão. É o preenchimento honesto: a mesa
 *   marcou seis cartas para dez pessoas, então quatro pessoas não têm poder.
 *
 * `rng` ausente = pré-visualização (a tela de revisão, a calculadora de peso).
 * Nesse caso nada é sorteado, para o número na tela não dançar a cada toque.
 */
function baralhoDaSelecao(
  chaves: readonly string[],
  config: GameConfig,
  jogadores: number,
  rng?: ReturnType<typeof retomarRng>,
): Deck {
  const cartas: CartaSelecionavel[] = chaves.map(lerChave);

  /*
   * A semente da PRÉVIA sai do conteúdo da seleção, não do relógio.
   *
   * O número na tela de revisão precisa ficar parado enquanto o host não mexe
   * em nada. Marcar mais uma carta muda a semente, e aí mudar a estimativa é o
   * comportamento certo.
   */
  const sorteio =
    rng ??
    retomarRng({ semente: `previa:${chaves.length}:${[...chaves].sort().join()}`, passo: 0 });

  const escolhidas = config.selecaoAleatoria
    ? sortearBalanceado(cartas, config, jogadores, sorteio)
    : sorteio.shuffle(cartas).slice(0, jogadores);

  while (escolhidas.length < jogadores) escolhidas.push({ roleId: 'aldeao' });

  return {
    id: 'selecionado',
    nome: config.selecaoAleatoria ? 'Seleção aleatória' : 'Escolhido pela mesa',
    roleIds: escolhidas.map((c) => c.roleId),
    variantes: escolhidas.map((c) => c.varianteId),
  };
}

/**
 * Sorteia uma composição EQUILIBRADA dentro do que a mesa marcou.
 *
 * Embaralhar a seleção e cortar N era um sorteio honesto e um jogo péssimo: com
 * 97 cartas marcadas para seis cadeiras, a chance de sair uma mesa sem nenhum
 * lobo — ou com quatro — é alta, e quem descobre isso é a mesa, na terceira
 * noite, quando não dá mais para consertar.
 *
 * Quem sabe montar uma composição válida é `gerarBaralho`, que já existia e já
 * aceita uma lista de funções permitidas: ele fixa o número de lobos pelo
 * tamanho da mesa, respeita o teto de solitários e de cartas pesadas, e escolhe
 * a melhor de duzentas tentativas pela calculadora de peso.
 *
 * O que falta a ele é a noção de VARIANTE, que só existe aqui: ele devolve
 * funções, e esta função as traduz de volta para as cartas que a mesa marcou.
 * Quando há Xerife base e Boca Calada marcados e o gerador pede "um xerife", o
 * sorteio decide qual dos dois entra — que é exatamente o que a mesa pediu ao
 * marcar os dois.
 */
function sortearBalanceado(
  cartas: readonly CartaSelecionavel[],
  config: GameConfig,
  jogadores: number,
  rng: ReturnType<typeof retomarRng>,
): CartaSelecionavel[] {
  if (cartas.length === 0) return [];

  const permitidas = [...new Set(cartas.map((c) => c.roleId))];
  const { deck } = gerarBaralho({ jogadores, config, permitidas }, rng);

  /** As cartas marcadas para cada função, para o sorteio escolher entre elas. */
  const porRole = new Map<RoleId, CartaSelecionavel[]>();
  for (const c of cartas) {
    const lista = porRole.get(c.roleId) ?? [];
    lista.push(c);
    porRole.set(c.roleId, lista);
  }

  return deck.roleIds.map((roleId) => {
    const opcoes = porRole.get(roleId);
    /*
     * `gerarBaralho` pode devolver uma função que a mesa NÃO marcou: quando um
     * grupo inteiro fica de fora (nenhum lobo marcado, por exemplo), ele volta
     * ao catálogo daquele grupo em vez de entregar uma mesa impossível. Aí
     * entra a carta base, que é o comportamento menos surpreendente.
     */
    if (!opcoes || opcoes.length === 0) return { roleId };
    return opcoes.length === 1 ? opcoes[0]! : rng.pick(opcoes);
  });
}

export const useJogo = create<JogoStore>((set, get) => ({
  jogadores: NOMES_SUGERIDOS.slice(0, 6).map((nome, i) => ({
    nome,
    cor: CORES_DE_JOGADOR[i]!,
  })),
  estilo: 'classico',
  selecionadas: [],
  carregada: false,
  config: { ...DEFAULT_CONFIG, semente: sementeAleatoria() },
  deck: baralhoDeFabrica('classico', 6),
  equilibrio: null,

  estado: null,
  vitoria: null,
  roteiro: [],
  indice: 0,
  acoes: [],
  votos: {},
  votosContados: {},

  adicionarJogador: (nome) => {
    const { jogadores, deck, estilo } = get();
    if (jogadores.length >= 16) return;
    const sugerido = NOMES_SUGERIDOS[jogadores.length] ?? `Jogador ${jogadores.length + 1}`;
    const n = jogadores.length + 1;
    set({
      jogadores: [
        ...jogadores,
        { nome: nome || sugerido, cor: CORES_DE_JOGADOR[jogadores.length % 16]! },
      ],
      ...(deck.id === 'manual' ? {} : { deck: baralhoDeFabrica(estilo, n) }),
    });
    get().recalcular();
  },

  removerJogador: (indice) => {
    const { jogadores, deck, estilo } = get();
    if (jogadores.length <= 5) return;
    const n = jogadores.length - 1;
    set({
      jogadores: jogadores.filter((_, i) => i !== indice),
      ...(deck.id === 'manual'
        ? { deck: { ...deck, roleIds: deck.roleIds.slice(0, n) } }
        : { deck: baralhoDeFabrica(estilo, n) }),
    });
    get().recalcular();
  },

  renomearJogador: (indice, nome) =>
    set({
      jogadores: get().jogadores.map((j, i) => (i === indice ? { ...j, nome } : j)),
    }),

  /**
   * Move um jogador de posição.
   *
   * A ordem importa de verdade: é a ordem em que o celular circula na mesa. Se
   * ela não bate com a ordem em que as pessoas estão sentadas, o aparelho
   * atravessa a roda a cada passagem e a partida arrasta.
   *
   * A COR acompanha o nome, e não a posição — ela é o que identifica a pessoa
   * na votação e no amanhecer. Trocar a cor ao reordenar renomearia todo mundo
   * em silêncio.
   */
  reordenarJogadores: (de, para) => {
    const atual = [...get().jogadores];
    const [movido] = atual.splice(de, 1);
    if (!movido) return;
    atual.splice(para, 0, movido);
    set({ jogadores: atual });
  },

  setEstilo: (estilo) => {
    set({ estilo, deck: baralhoDeFabrica(estilo, get().jogadores.length) });
    get().recalcular();
  },

  setConfig: (patch) => {
    const config = { ...get().config, ...patch };
    /*
     * Trocar de modo poda a seleção.
     *
     * O Traição não aceita carta de lobo. Sem a poda, a mesa marcava a matilha
     * inteira no Clássico, trocava para Traição e começava a partida com um
     * baralho que o próprio modo desmontava em silêncio no `aoCriarPartida`.
     */
    set({
      config,
      ...(patch.modo ? { selecionadas: podarParaModo(get().selecionadas, patch.modo) } : {}),
    });
    get().recalcular();
  },

  alternarCarta: (chave) => {
    const atual = get().selecionadas;
    set({
      selecionadas: atual.includes(chave) ? atual.filter((x) => x !== chave) : [...atual, chave],
    });
    get().recalcular();
  },

  limparSelecao: () => {
    set({ selecionadas: [] });
    get().recalcular();
  },

  /** Marca tudo que o modo atual permite — o atalho para "me surpreenda". */
  marcarTudo: () => {
    set({
      selecionadas: cartasDoModo(get().config.modo).map((c) =>
        chaveDaCarta(c.roleId, c.varianteId),
      ),
    });
    get().recalcular();
  },

  /**
   * Positivo = sobram cartas; negativo = faltam; zero = fecha exato.
   *
   * A tela precisa da MESMA conta que `comecar` usa, senão o botão habilita e
   * a partida começa com um baralho diferente do que a mesa viu.
   */
  saldoDaSelecao: () => get().selecionadas.length - get().jogadores.length,

  recalcular: () => {
    const { selecionadas, config, jogadores } = get();
    /*
     * O equilíbrio é calculado sobre a SELEÇÃO, não sobre um baralho já
     * montado — porque no modo aleatório o baralho só existe quando a partida
     * começa. A conta continua sendo útil: ela diz o peso médio do que a mesa
     * topou ver, que é a informação que o host quer antes de decidir.
     */
    const previsto = baralhoDaSelecao(selecionadas, config, jogadores.length);
    set({
      deck: previsto,
      equilibrio:
        previsto.roleIds.length > 0 ? calcularEquilibrio(previsto, config, jogadores.length) : null,
    });
    void salvarMesa({ jogadores: get().jogadores, selecionadas, config });
  },

  restaurar: async () => {
    const salva = await lerMesa();
    if (!salva) {
      set({ carregada: true });
      return;
    }
    /*
     * A semente NÃO é restaurada.
     *
     * Ela é o que torna uma partida reproduzível, e reaproveitá-la faria a
     * mesa seguinte sortear exatamente as mesmas cartas para as mesmas
     * pessoas. O resto do setup é trabalho de digitação e merece voltar.
     */
    const config = { ...salva.config, semente: sementeAleatoria() };
    set({
      carregada: true,
      jogadores: [...salva.jogadores],
      selecionadas: podarParaModo(salva.selecionadas, config.modo),
      config,
    });
    get().recalcular();
  },

  comecar: () => {
    const { selecionadas, config, jogadores, estilo } = get();

    /*
     * O baralho da PARTIDA é sorteado agora, com a semente da partida.
     *
     * No modo aleatório é aqui que a mesa deixa de saber a composição: ela
     * marcou quinze cartas para dez lugares e nunca vai ver quais cinco
     * ficaram de fora. Fora dele, a seleção já fecha exato e o sorteio só
     * embaralha a ordem.
     */
    const rng = retomarRng({ semente: config.semente, passo: 0 });
    const certo =
      selecionadas.length > 0
        ? baralhoDaSelecao(selecionadas, config, jogadores.length, rng)
        : baralhoDeFabrica(estilo, jogadores.length);

    let estado = criarPartida(certo, config, jogadores);

    const ganchos = ganchosDoModo(config.modo);
    if (ganchos.aoCriarPartida) {
      const rng = retomarRng(estado.rng);
      estado = { ...ganchos.aoCriarPartida(estado, rng), rng: rng.state() };
    }

    set({
      deck: certo,
      estado,
      vitoria: null,
      roteiro: roteiroDaNoite(estado),
      indice: 0,
      acoes: [],
      votos: {},
    });
  },

  registrarAcao: (acao) => {
    if (acao) set({ acoes: [...get().acoes, acao] });
  },

  /**
   * Consome a marca de troca de carta.
   *
   * Sem isto a tela reapareceria em TODAS as passagens seguintes daquele
   * jogador — a marca é o que diz "ele ainda não foi avisado", e avisar sem
   * apagar é um laço.
   *
   * O roteiro NÃO é recalculado aqui: ele foi montado no início da noite e é o
   * contrato desta passagem. Recalcular no meio da circulação do aparelho
   * mudaria perguntas de quem ainda não jogou.
   */
  verTroca: (id) => {
    const estado = get().estado;
    if (!estado) return;
    set({ estado: marcarTrocaVista(estado, id) });
  },

  proximaPassagem: () => {
    const { indice, roteiro } = get();
    if (indice + 1 < roteiro.length) set({ indice: indice + 1 });
    else get().fecharNoiteAgora();
  },

  /** Fim da passagem: o engine resolve as 12 etapas de uma vez. */
  fecharNoiteAgora: () => {
    const { estado, acoes } = get();
    if (!estado) return;

    const { estado: depois } = resolverNoite(estado, { rodada: estado.rodada, acoes });
    const ganchos = ganchosDoModo(depois.config.modo);

    /**
     * A derrota por regra do MODO é avaliada aqui.
     *
     * O gancho `derrotaDaVila` existia desde sempre e só era chamado na
     * simulação (`play-game.ts`) — nunca numa partida de verdade. Resultado: a
     * Vila Amaldiçoada sorteava agravamentos bonitos e o prazo nunca vencia.
     * O modo inteiro não fazia nada além de narrar.
     */
    const prazoVenceu = ganchos.derrotaDaVila?.(depois) ?? false;
    const vitoria = prazoVenceu
      ? {
          encerrada: true,
          camadas: [
            {
              camada: 'lobos' as const,
              vencedores: depois.players
                .filter((p) => role(p.roleId).faccao === 'lobos')
                .map((p) => p.id),
              motivo: 'A maldição venceu o prazo: a vila inteira se perdeu.',
            },
          ],
        }
      : verificarVitoria(depois);

    let comModo = depois;
    if (ganchos.aoAmanhecer && !vitoria.encerrada) {
      const rng = retomarRng(depois.rng);
      comModo = { ...ganchos.aoAmanhecer(depois, rng), rng: rng.state() };
    }

    set({
      estado: vitoria.encerrada
        ? {
            ...comModo,
            fase: 'fim',
            vencedores: [...new Set(vitoria.camadas.flatMap((c) => c.vencedores))],
          }
        : comModo,
      vitoria: vitoria.encerrada ? vitoria : null,
      acoes: [],
      indice: 0,
      votos: {},
    });
  },

  ajustarVoto: (em, delta) => {
    const atual = get().votosContados;
    const novo = Math.max(0, (atual[em] ?? 0) + delta);
    set({ votosContados: { ...atual, [em]: novo } });
  },

  votar: (de, em) => set({ votos: { ...get().votos, [de]: em } }),

  fecharVotacao: () => {
    const { estado, votos, votosContados, config } = get();
    if (!estado) return;

    const { estado: depois } = resolverDia(
      estado,
      /*
       * Simultânea manda a CONTAGEM; secreta manda a lista nominal. São dois
       * formatos porque são duas situações: numa o host conta dedos levantados,
       * na outra o aparelho passa de mão em mão e sabe quem apontou o quê.
       */
      /*
       * A contagem só manda quando ELA foi preenchida.
       *
       * O modo simultâneo passou a registrar placar em vez de lista nominal,
       * mas `votar()` continua existindo — o laboratório e os testes de
       * partida inteira usam. Mandar uma contagem vazia por causa do modo
       * jogaria fora votos que alguém registrou de verdade, e a partida nunca
       * lincharia ninguém.
       */
      config.votacao === 'simultanea' && Object.values(votosContados).some((n) => n > 0)
        ? { tipo: 'contagem' as const, contagem: votosContados }
        : { tipo: 'nominal' as const, votos },
    );
    const vitoria = verificarVitoria(depois);

    set({
      estado: vitoria.encerrada
        ? {
            ...depois,
            fase: 'fim',
            vencedores: [...new Set(vitoria.camadas.flatMap((c) => c.vencedores))],
          }
        : depois,
      vitoria: vitoria.encerrada ? vitoria : null,
      votos: {},
    });
  },

  seguirParaNoite: () => {
    const { estado } = get();
    if (!estado || estado.fase === 'fim') return;
    /**
     * `prepararNoite` e não `{ ...estado, rodada: rodada + 1 }`.
     *
     * Ele limpa as marcas da noite anterior e APLICA o que estava engatilhado —
     * bloqueio do Xerife e do Taverneiro, esconderijo do Lobo Sombra — antes de
     * o roteiro ser montado. Tem que ser antes: a leitura da Vidente aparece na
     * própria passagem, então a imunidade precisa já estar valendo quando o
     * aparelho começa a circular.
     */
    const proxima = prepararNoite(estado);
    set({ estado: proxima, roteiro: roteiroDaNoite(proxima), indice: 0, acoes: [] });
  },

  encerrar: () =>
    set({
      estado: null,
      vitoria: null,
      roteiro: [],
      indice: 0,
      acoes: [],
      votos: {},
      config: { ...get().config, semente: sementeAleatoria() },
    }),
}));
