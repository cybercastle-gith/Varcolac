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
    const { jogadores } = get();
    if (jogadores.length >= 16) return;
    const sugerido = NOMES_SUGERIDOS[jogadores.length] ?? `Jogador ${jogadores.length + 1}`;
    set({
      jogadores: [
        ...jogadores,
        { nome: nome || sugerido, cor: CORES_DE_JOGADOR[jogadores.length % 16]! },
      ],
    });
    get().recalcular();
  },

  removerJogador: (indice) => {
    const { jogadores } = get();
    if (jogadores.length <= 5) return;
    set({ jogadores: jogadores.filter((_, i) => i !== indice) });
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

  recalcular: () => {
    const { deck, config, jogadores, estilo } = get();
    const certo =
      deck.roleIds.length === jogadores.length ? deck : baralhoDeFabrica(estilo, jogadores.length);
    set({
      deck: certo,
      equilibrio: calcularEquilibrio(certo, config, jogadores.length),
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
