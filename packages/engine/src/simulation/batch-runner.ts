import type { Deck, GameConfig } from '../types/config';
import type { VictoryLayer } from '../victory/win-conditions';
import { jogarPartida } from './play-game';

export interface BatchOptions {
  readonly partidas: number;
  readonly jogadores: number;
  readonly deck: Deck;
  readonly config: GameConfig;
  /** Semente base; cada partida deriva a sua, para ser reproduzível sozinha. */
  readonly semente: string;
  /** Chamado a cada N partidas, para o laboratório mostrar progresso. */
  readonly aoProgredir?: (feitas: number, total: number) => void;
}

export interface BatchStats {
  readonly partidas: number;
  readonly vitoriasPorCamada: Readonly<Record<VictoryLayer, number>>;
  readonly noitesMedia: number;
  readonly noitesMediana: number;
  readonly distribuicaoDeNoites: Readonly<Record<number, number>>;
  /** Partidas que bateram no teto sem terminar — deve ser perto de zero. */
  readonly abortadas: number;
  /** Semente de cada partida, para reabrir um caso esquisito no laboratório. */
  readonly sementes: readonly string[];
  readonly duracaoMs: number;
}

/**
 * Roda N partidas com bots e agrega estatísticas. É assim que a calculadora de
 * peso é calibrada de verdade: o IE é uma previsão, e isto é a medição.
 *
 * Cada partida recebe uma semente derivada e determinística (`base#i`), então
 * qualquer linha do relatório pode ser reaberta no laboratório e reproduzida
 * exatamente — inclusive uma partida abortada.
 */
export function rodarLote(opcoes: BatchOptions): BatchStats {
  const inicio = Date.now();
  const { partidas, jogadores, deck, config, semente, aoProgredir } = opcoes;

  const nomes = Array.from({ length: jogadores }, (_, i) => ({
    nome: `J${i + 1}`,
    cor: '#000000',
  }));

  const vitoriasPorCamada: Record<VictoryLayer, number> = {
    vila: 0,
    lobos: 0,
    solitario: 0,
    amantes: 0,
  };
  const noites: number[] = [];
  const distribuicao: Record<number, number> = {};
  const sementes: string[] = [];
  let abortadas = 0;

  for (let i = 0; i < partidas; i++) {
    const sementeDaPartida = `${semente}#${i}`;
    sementes.push(sementeDaPartida);

    const r = jogarPartida(deck, { ...config, semente: sementeDaPartida }, nomes);

    if (r.abortada) abortadas++;
    // Só a camada principal conta para a taxa de vitória; as paralelas (o
    // Sobrevivente, por exemplo) inflariam o total acima de 100%.
    else if (r.vitoria.camadas[0]) vitoriasPorCamada[r.vitoria.camadas[0].camada]++;

    noites.push(r.noites);
    distribuicao[r.noites] = (distribuicao[r.noites] ?? 0) + 1;

    if (aoProgredir && (i + 1) % 250 === 0) aoProgredir(i + 1, partidas);
  }

  const ordenadas = [...noites].sort((a, b) => a - b);
  const meio = Math.floor(ordenadas.length / 2);

  return {
    partidas,
    vitoriasPorCamada,
    noitesMedia: noites.reduce((s, n) => s + n, 0) / Math.max(1, noites.length),
    noitesMediana: ordenadas.length === 0 ? 0 : (ordenadas[meio] ?? 0),
    distribuicaoDeNoites: distribuicao,
    abortadas,
    sementes,
    duracaoMs: Date.now() - inicio,
  };
}

/** Taxa de vitória por camada, em porcentagem. */
export function taxas(stats: BatchStats): Record<VictoryLayer, number> {
  const total = Math.max(1, stats.partidas - stats.abortadas);
  const pct = (n: number) => Number(((n / total) * 100).toFixed(1));
  return {
    vila: pct(stats.vitoriasPorCamada.vila),
    lobos: pct(stats.vitoriasPorCamada.lobos),
    solitario: pct(stats.vitoriasPorCamada.solitario),
    amantes: pct(stats.vitoriasPorCamada.amantes),
  };
}
