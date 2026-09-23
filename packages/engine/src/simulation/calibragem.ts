import type { Deck, GameConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';
import { calcularEquilibrio, type PesosCustomizados } from '../balance/weight-calculator';
import { criarRng } from '../utils/rng';
import { ROLES_LOBOS, ROLES_SOLITARIOS, ROLES_VILA } from '../data/roles/index';
import { rodarLote, taxas } from './batch-runner';

/**
 * Calibragem da calculadora de peso.
 *
 * O IE é uma PREVISÃO; a simulação é a MEDIÇÃO. Este módulo confronta as duas
 * sobre uma amostra grande de composições e devolve o ajuste que faz a previsão
 * bater com o medido.
 *
 * O oponente de referência é o bot deliberadamente burro de `bots.ts`: vota ao
 * acaso, não coordena, não usa informação. Isso é escolha metodológica — a
 * calculadora mede a força ESTRUTURAL de uma composição, e um bot esperto
 * misturaria a qualidade dele na medida. A consequência precisa ficar dita: uma
 * mesa real, que conversa e deduz, joga ACIMA deste piso, e o modelo calibrado
 * aqui é conservador a favor dos lobos.
 */

export interface PontoDeAmostra {
  readonly deck: Deck;
  readonly jogadores: number;
  /** Força bruta da vila e da matilha, antes do multiplicador. */
  readonly forcaVila: number;
  readonly forcaMatilha: number;
  readonly ieAtual: number;
  /** Vitórias da vila, em porcentagem, medidas na simulação. */
  readonly vitoriaDaVila: number;
  readonly noitesMedia: number;
}

/** Gera composições variadas e mede cada uma. */
export function amostrar(
  opcoes: {
    readonly jogadores: readonly number[];
    readonly composicoesPorTamanho: number;
    readonly partidasPorComposicao: number;
    readonly config?: GameConfig;
    readonly pesos?: PesosCustomizados;
    readonly semente?: string;
  },
): readonly PontoDeAmostra[] {
  const config: GameConfig = opcoes.config ?? {
    ...DEFAULT_CONFIG,
    // Setup cru: sem os ajustes que somam a favor da vila, para medir só a
    // composição. Eles voltam depois, como termo aditivo.
    revelarRoleAoMorrer: false,
    contagemDeLobos: 'oculta',
    frequenciaEventos: 'desligado',
    modulosDeFantasma: [],
  };

  const rng = criarRng(opcoes.semente ?? 'calibragem');
  const pontos: PontoDeAmostra[] = [];

  for (const jogadores of opcoes.jogadores) {
    for (let i = 0; i < opcoes.composicoesPorTamanho; i++) {
      // A proporção de lobos fica DENTRO da restrição estrutural (≈ jogadores
      // ÷ 3,5, com uma carta de folga para cada lado).
      //
      // Calibrar sobre baralhos absurdos — metade da mesa de lobos — parecia
      // mais rigoroso e era o contrário: esses baralhos dominavam a amostra,
      // puxavam o M para cima, e o modelo passava a chamar o Clássico de
      // massacre quando ele mede 40% de vitória da vila. A calculadora existe
      // para separar baralhos PLAUSÍVEIS entre si; ranquear massacres não é
      // trabalho dela.
      const ideal = Math.max(1, Math.round(jogadores / 3.5));
      const nLobos = Math.max(1, ideal + rng.int(-1, 1));
      const nSolitarios = rng.int(0, Math.floor(jogadores * 0.25));
      // (o teto de 25% é a própria restrição do dossiê)
      const nVila = Math.max(0, jogadores - nLobos - nSolitarios);

      const roleIds = [
        ...Array.from({ length: nLobos }, () => rng.pick(ROLES_LOBOS).id),
        ...Array.from({ length: nSolitarios }, () => rng.pick(ROLES_SOLITARIOS).id),
        ...Array.from({ length: nVila }, () => rng.pick(ROLES_VILA).id),
      ];

      const deck: Deck = { id: `amostra-${jogadores}-${i}`, nome: 'amostra', roleIds };
      const eq = calcularEquilibrio(deck, config, jogadores, opcoes.pesos ?? {});
      const stats = rodarLote({
        partidas: opcoes.partidasPorComposicao,
        jogadores,
        deck,
        config,
        semente: `${opcoes.semente ?? 'calibragem'}-${jogadores}-${i}`,
      });

      pontos.push({
        deck,
        jogadores,
        forcaVila: eq.forcaVila,
        forcaMatilha: eq.forcaMatilha,
        ieAtual: eq.ie,
        vitoriaDaVila: taxas(stats).vila,
        noitesMedia: stats.noitesMedia,
      });
    }
  }

  return pontos;
}

/**
 * Acha o multiplicador M que coloca o ponto de virada (50% de vitória) no IE 0,
 * para uma faixa de tamanho de mesa.
 *
 * A busca é uma varredura simples em vez de regressão fechada porque a relação
 * entre IE e vitória não é linear nas pontas — e porque o que interessa é UM
 * número, o ponto onde a vila e a matilha se equilibram.
 */
export function acharMultiplicador(
  pontos: readonly PontoDeAmostra[],
  faixa = { min: 0.8, max: 4, passo: 0.05 },
): { m: number; erro: number } {
  let melhor = { m: faixa.min, erro: Number.POSITIVE_INFINITY };

  for (let m = faixa.min; m <= faixa.max; m += faixa.passo) {
    // Erro = quanto o sinal do IE discorda do lado que realmente venceu.
    // Contar discordâncias, e não distância, é o que impede que um massacre
    // isolado domine o ajuste.
    let erro = 0;
    for (const p of pontos) {
      const ie = p.forcaVila - p.forcaMatilha * m;
      const previuVila = ie > 0;
      const venceuVila = p.vitoriaDaVila > 50;
      if (previuVila !== venceuVila) erro += 1;
      // Perto do zero, o desacordo importa menos: ali é 50/50 mesmo.
      else if (Math.abs(ie) < 0.5) erro += 0.25;
    }
    if (erro < melhor.erro) melhor = { m: Number(m.toFixed(2)), erro };
  }

  return melhor;
}

/** Resumo legível de uma amostra, para o relatório. */
export function resumir(pontos: readonly PontoDeAmostra[]): string {
  const faixas = [
    { rotulo: 'IE ≤ −5', teste: (p: PontoDeAmostra) => p.ieAtual <= -5 },
    { rotulo: '−5 a −2', teste: (p: PontoDeAmostra) => p.ieAtual > -5 && p.ieAtual <= -2 },
    { rotulo: '−2 a +2', teste: (p: PontoDeAmostra) => p.ieAtual > -2 && p.ieAtual < 2 },
    { rotulo: '+2 a +5', teste: (p: PontoDeAmostra) => p.ieAtual >= 2 && p.ieAtual < 5 },
    { rotulo: 'IE ≥ +5', teste: (p: PontoDeAmostra) => p.ieAtual >= 5 },
  ];

  const linhas = faixas.map((f) => {
    const grupo = pontos.filter(f.teste);
    if (grupo.length === 0) return `${f.rotulo.padEnd(9)} —`;
    const media = grupo.reduce((s, p) => s + p.vitoriaDaVila, 0) / grupo.length;
    return `${f.rotulo.padEnd(9)} ${grupo.length.toString().padStart(4)} amostras · vila ${media.toFixed(1)}%`;
  });

  return linhas.join('\n');
}
