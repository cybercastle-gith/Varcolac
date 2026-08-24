import { create } from 'zustand';
import {
  DEFAULT_CONFIG,
  ORDEM_DAS_ETAPAS,
  baralhoDeFabrica,
  calcularEquilibrio,
  criarPartida,
  decidirNoite,
  decidirVotos,
  gerarBaralho,
  fecharNoite,
  iniciarNoite,
  resolverDia,
  resolverEtapa,
  retomarRng,
  rodarLote,
  sementeAleatoria,
  verificarVitoria,
  modo as ganchosDoModo,
  type BalanceResult,
  type BatchStats,
  type Deck,
  type DeckStyle,
  type GameConfig,
  type GameState,
  type LogEntry,
  type NightStepId,
  type NightSubmission,
  type PesosCustomizados,
  type RoleId,
  type StepContext,
} from '@jogo/engine';

/**
 * Store único do laboratório. Sem cerimônia — é ferramenta, não produto.
 *
 * A regra que organiza tudo aqui: o store NÃO tem regra de jogo. Ele guarda o
 * estado devolvido pelo engine e chama as funções do engine na ordem certa. Se
 * uma decisão de jogo aparecesse aqui, o laboratório passaria a testar a si
 * mesmo em vez de testar o engine.
 */
interface LabStore {
  // ── Setup ──
  jogadores: number;
  estilo: DeckStyle;
  config: GameConfig;
  deck: Deck;
  equilibrio: BalanceResult;
  pesos: PesosCustomizados;

  // ── Partida ──
  estado: GameState | null;
  /** Contexto vivo da noite, quando se avança etapa por etapa. */
  ctx: StepContext | null;
  submissao: NightSubmission | null;
  proximaEtapa: NightStepId | null;
  /** Log acumulado da partida inteira, noite e dia juntos. */
  entradas: (LogEntry & { fase: 'noite' | 'dia' })[];

  // ── Simulação ──
  stats: BatchStats | null;
  simulando: boolean;

  // ── Ações ──
  setJogadores: (n: number) => void;
  setEstilo: (e: DeckStyle) => void;
  setConfig: (patch: Partial<GameConfig>) => void;
  setPeso: (id: RoleId, peso: number | null) => void;
  trocarRole: (indice: number, roleId: RoleId) => void;
  baralhoSurpresa: () => void;
  iniciar: (semente?: string) => void;
  passo: () => void;
  noiteInteira: () => void;
  resolverODia: () => void;
  resetar: () => void;
  simular: (partidas: number) => void;
}

function montarDeck(estilo: DeckStyle, jogadores: number): Deck {
  return baralhoDeFabrica(estilo, jogadores);
}

const CONFIG_INICIAL: GameConfig = { ...DEFAULT_CONFIG, semente: 'laboratorio' };

const JOGADORES_INICIAIS = 8;
const DECK_INICIAL = montarDeck('classico', JOGADORES_INICIAIS);

/** Nomes fixos: partida reproduzível não pode depender de nome aleatório. */
export const nomesPara = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ nome: `J${i + 1}`, cor: '#D9CDB4' }));

export const useLabStore = create<LabStore>((set, get) => ({
  jogadores: JOGADORES_INICIAIS,
  estilo: 'classico',
  config: CONFIG_INICIAL,
  deck: DECK_INICIAL,
  equilibrio: calcularEquilibrio(DECK_INICIAL, CONFIG_INICIAL, JOGADORES_INICIAIS),
  pesos: {},

  estado: null,
  ctx: null,
  submissao: null,
  proximaEtapa: null,
  entradas: [],
  stats: null,
  simulando: false,

  setJogadores: (n) => {
    const jogadores = Math.max(5, Math.min(16, n));
    const deck = montarDeck(get().estilo, jogadores);
    set({
      jogadores,
      deck,
      equilibrio: calcularEquilibrio(deck, get().config, jogadores, get().pesos),
    });
  },

  setEstilo: (estilo) => {
    const deck = montarDeck(estilo, get().jogadores);
    set({
      estilo,
      deck,
      equilibrio: calcularEquilibrio(deck, get().config, get().jogadores, get().pesos),
    });
  },

  setConfig: (patch) => {
    const config = { ...get().config, ...patch };
    set({
      config,
      equilibrio: calcularEquilibrio(get().deck, config, get().jogadores, get().pesos),
    });
  },

  setPeso: (id, peso) => {
    const pesos = { ...get().pesos };
    if (peso === null) delete pesos[id];
    else pesos[id] = peso;
    set({
      pesos,
      equilibrio: calcularEquilibrio(get().deck, get().config, get().jogadores, pesos),
    });
  },

  trocarRole: (indice, roleId) => {
    const roleIds = [...get().deck.roleIds];
    roleIds[indice] = roleId;
    const deck = { ...get().deck, id: 'manual', nome: 'Montado à mão', roleIds };
    set({
      deck,
      equilibrio: calcularEquilibrio(deck, get().config, get().jogadores, get().pesos),
    });
  },

  baralhoSurpresa: () => {
    const { config, jogadores, pesos } = get();
    const rng = retomarRng({ semente: sementeAleatoria(), passo: 0 });
    const { deck } = gerarBaralho({ jogadores, config }, rng);
    set({
      deck,
      estilo: 'classico',
      equilibrio: calcularEquilibrio(deck, config, jogadores, pesos),
    });
  },

  iniciar: (semente) => {
    const { deck, jogadores } = get();
    const config = { ...get().config, semente: semente ?? get().config.semente };
    let estado = criarPartida(deck, config, nomesPara(jogadores));

    // Ganchos do modo (prazo da maldição, duplas) valem desde a criação.
    const ganchos = ganchosDoModo(config.modo);
    if (ganchos.aoCriarPartida) {
      const rng = retomarRng(estado.rng);
      estado = { ...ganchos.aoCriarPartida(estado, rng), rng: rng.state() };
    }

    set({ config, estado, ctx: null, submissao: null, proximaEtapa: null, entradas: [] });
  },

  /** Avança UMA etapa da noite. É o botão que o dossiê pede para depurar. */
  passo: () => {
    const { estado, ctx } = get();
    if (!estado || estado.fase === 'fim') return;

    // Primeira etapa da noite: monta o contexto e as ações dos bots.
    if (!ctx) {
      // A trava mora aqui, e não só no botão: sem ela, chamadas em sequência
      // (script, teste, clique duplo) começam uma segunda noite por cima do
      // amanhecer, e o dia nunca acontece.
      if (estado.fase !== 'noite') return;
      const rng = retomarRng(estado.rng);
      const submissao = decidirNoite(estado, rng);
      const comRng = { ...estado, rng: rng.state() };
      const novo = resolverEtapa(iniciarNoite(comRng, submissao), ORDEM_DAS_ETAPAS[0]!);
      set({
        ctx: novo,
        submissao,
        proximaEtapa: ORDEM_DAS_ETAPAS[1] ?? null,
        entradas: [
          ...get().entradas,
          ...novo.log.resultado().entradas.map((e) => ({ ...e, fase: 'noite' as const })),
        ],
      });
      return;
    }

    const proxima = get().proximaEtapa;
    if (!proxima) return;

    const jaVistas = ctx.log.resultado().entradas.length;
    const novo = resolverEtapa(ctx, proxima);
    const novas = novo.log.resultado().entradas.slice(jaVistas);
    const indice = ORDEM_DAS_ETAPAS.indexOf(proxima);
    const seguinte = ORDEM_DAS_ETAPAS[indice + 1] ?? null;

    set({
      ctx: novo,
      proximaEtapa: seguinte,
      entradas: [...get().entradas, ...novas.map((e) => ({ ...e, fase: 'noite' as const }))],
      // Terminou a noite: fecha pelo MESMO caminho que `resolverNoite` usa.
      // Reproduzir o fechamento à mão aqui foi exatamente o que deixou as
      // marcas presas e os contadores da noite parados.
      ...(seguinte === null ? { estado: fecharNoite(novo), ctx: null } : {}),
    });
  },

  noiteInteira: () => {
    const { proximaEtapa, ctx } = get();
    let restantes = ctx
      ? ORDEM_DAS_ETAPAS.length - ORDEM_DAS_ETAPAS.indexOf(proximaEtapa ?? 'informacao')
      : ORDEM_DAS_ETAPAS.length;
    while (restantes-- > 0 && get().estado) {
      get().passo();
      if (!get().ctx && !get().proximaEtapa) break;
    }
  },

  resolverODia: () => {
    const estado = get().estado;
    if (!estado || estado.fase === 'fim') return;

    const rng = retomarRng(estado.rng);
    const votos = decidirVotos(estado, rng);
    const comRng = { ...estado, rng: rng.state() };
    const { estado: depois, log } = resolverDia(comRng, votos);

    const vitoria = verificarVitoria(depois);
    const final = vitoria.encerrada
      ? {
          ...depois,
          fase: 'fim' as const,
          vencedores: [...new Set(vitoria.camadas.flatMap((c) => c.vencedores))],
        }
      : { ...depois, rodada: depois.rodada + 1, fase: 'noite' as const };

    set({
      estado: final,
      ctx: null,
      proximaEtapa: null,
      entradas: [
        ...get().entradas,
        ...log.map((e) => ({
          ...e,
          etapa: 'votacao' as unknown as NightStepId,
          ordem: 0,
          fase: 'dia' as const,
        })),
      ],
    });
  },

  resetar: () =>
    set({ estado: null, ctx: null, submissao: null, proximaEtapa: null, entradas: [] }),

  simular: (partidas) => {
    const { deck, config, jogadores } = get();
    set({ simulando: true });
    // Síncrono de propósito: 10.000 partidas levam segundos, e um spinner
    // honesto vale mais do que um worker que esconde o custo real.
    const stats = rodarLote({ partidas, jogadores, deck, config, semente: config.semente });
    set({ stats, simulando: false });
  },
}));
