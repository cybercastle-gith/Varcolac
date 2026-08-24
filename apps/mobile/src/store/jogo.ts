import { create } from 'zustand';
import {
  DEFAULT_CONFIG,
  baralhoDeFabrica,
  calcularEquilibrio,
  criarPartida,
  gerarBaralho,
  modo as ganchosDoModo,
  resolverDia,
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

  // ── Partida ──
  estado: GameState | null;
  vitoria: VictoryResult | null;

  // ── Passagem do celular ──
  roteiro: readonly Passagem[];
  indice: number;
  acoes: NightAction[];

  // ── Dia ──
  votos: Record<PlayerId, PlayerId | null>;

  // ── Ações de setup ──
  adicionarJogador: (nome: string) => void;
  removerJogador: (indice: number) => void;
  renomearJogador: (indice: number, nome: string) => void;
  setEstilo: (e: DeckStyle) => void;
  setConfig: (patch: Partial<GameConfig>) => void;
  baralhoSurpresa: () => void;
  /** Construtor manual: quantas cartas de cada role o host escolheu. */
  contarRole: (roleId: RoleId) => number;
  ajustarRole: (roleId: RoleId, delta: number) => void;
  escolherVariante: (roleId: RoleId, varianteId: string | null) => void;
  limparBaralho: () => void;
  completarComAldeoes: () => void;
  recalcular: () => void;

  // ── Fluxo de partida ──
  comecar: () => void;
  registrarAcao: (acao: NightAction | null) => void;
  proximaPassagem: () => void;
  fecharNoiteAgora: () => void;
  votar: (de: PlayerId, em: PlayerId | null) => void;
  fecharVotacao: () => void;
  seguirParaNoite: () => void;
  encerrar: () => void;
}

const NOMES_SUGERIDOS = [
  'Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gil', 'Hilda',
  'Ivo', 'Júlia', 'Kaio', 'Lara', 'Miro', 'Nina', 'Otávio', 'Pilar',
];

export const useJogo = create<JogoStore>((set, get) => ({
  jogadores: NOMES_SUGERIDOS.slice(0, 6).map((nome, i) => ({
    nome,
    cor: CORES_DE_JOGADOR[i]!,
  })),
  estilo: 'classico',
  config: { ...DEFAULT_CONFIG, semente: sementeAleatoria() },
  deck: baralhoDeFabrica('classico', 6),
  equilibrio: null,

  estado: null,
  vitoria: null,
  roteiro: [],
  indice: 0,
  acoes: [],
  votos: {},

  adicionarJogador: (nome) => {
    const { jogadores, deck, estilo } = get();
    if (jogadores.length >= 16) return;
    const sugerido = NOMES_SUGERIDOS[jogadores.length] ?? `Jogador ${jogadores.length + 1}`;
    const n = jogadores.length + 1;
    set({
      jogadores: [...jogadores, { nome: nome || sugerido, cor: CORES_DE_JOGADOR[jogadores.length % 16]! }],
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

  setEstilo: (estilo) => {
    set({ estilo, deck: baralhoDeFabrica(estilo, get().jogadores.length) });
    get().recalcular();
  },

  setConfig: (patch) => {
    set({ config: { ...get().config, ...patch } });
    get().recalcular();
  },

  baralhoSurpresa: () => {
    const { config, jogadores } = get();
    const rng = retomarRng({ semente: sementeAleatoria(), passo: 0 });
    // O Baralho Surpresa só é possível porque a calculadora de peso existe: ela
    // deixou de ser um extra e virou infraestrutura.
    const { deck } = gerarBaralho({ jogadores: jogadores.length, config }, rng);
    set({ deck });
    get().recalcular();
  },

  contarRole: (roleId) => get().deck.roleIds.filter((x) => x === roleId).length,

  /**
   * Acrescenta ou tira uma carta do baralho montado à mão.
   *
   * O baralho é uma LISTA, não um mapa de contagens, porque a ordem importa na
   * hora de sortear — e porque duas cartas da mesma role são duas cartas, não
   * "role ×2" com um número pendurado.
   */
  ajustarRole: (roleId, delta) => {
    const atual = [...get().deck.roleIds];
    if (delta > 0) {
      if (atual.length >= get().jogadores.length) return;
      atual.push(roleId);
    } else {
      const i = atual.lastIndexOf(roleId);
      if (i < 0) return;
      atual.splice(i, 1);
    }
    set({ deck: { id: 'manual', nome: 'Montado à mão', roleIds: atual, modificadores: get().deck.modificadores } });
    get().recalcular();
  },

  escolherVariante: (roleId, varianteId) => {
    const variantes = { ...get().config.variantes };
    if (varianteId === null) delete variantes[roleId];
    else variantes[roleId] = varianteId;
    set({ config: { ...get().config, variantes } });
    get().recalcular();
  },

  limparBaralho: () => {
    set({ deck: { id: 'manual', nome: 'Montado à mão', roleIds: [], modificadores: [] } });
    get().recalcular();
  },

  /** Fecha o baralho com Aldeões: o preenchimento honesto de uma mesa. */
  completarComAldeoes: () => {
    const faltam = get().jogadores.length - get().deck.roleIds.length;
    if (faltam <= 0) return;
    set({
      deck: {
        ...get().deck,
        id: 'manual',
        nome: 'Montado à mão',
        roleIds: [...get().deck.roleIds, ...Array.from({ length: faltam }, () => 'aldeao')],
      },
    });
    get().recalcular();
  },

  recalcular: () => {
    const { deck, config, jogadores } = get();
    // O baralho manual pode estar incompleto no meio da montagem — e deve
    // continuar assim. Trocá-lo por um preset aqui apagaria o trabalho do host
    // no exato instante em que ele tirou uma carta para pensar.
    set({
      equilibrio:
        deck.roleIds.length > 0
          ? calcularEquilibrio(deck, config, jogadores.length)
          : null,
    });
  },

  comecar: () => {
    const { deck, config, jogadores, estilo } = get();
    const certo =
      deck.roleIds.length === jogadores.length ? deck : baralhoDeFabrica(estilo, jogadores.length);

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
    const vitoria = verificarVitoria(depois);

    const ganchos = ganchosDoModo(depois.config.modo);
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

  votar: (de, em) => set({ votos: { ...get().votos, [de]: em } }),

  fecharVotacao: () => {
    const { estado, votos } = get();
    if (!estado) return;

    const { estado: depois } = resolverDia(estado, votos);
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
    const proxima: GameState = { ...estado, rodada: estado.rodada + 1, fase: 'noite' };
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
