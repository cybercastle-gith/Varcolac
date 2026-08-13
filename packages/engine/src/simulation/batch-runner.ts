import type { Deck, GameConfig } from '../types/config';
import type { VictoryLayer } from '../victory/win-conditions';

export interface BatchOptions {
  readonly partidas: number;
  readonly jogadores: number;
  readonly deck: Deck;
  readonly config: GameConfig;
  /** Semente base; cada partida deriva a sua, para ser reproduzível sozinha. */
  readonly semente: string;
}

export interface BatchStats {
  readonly partidas: number;
  readonly vitoriasPorCamada: Readonly<Record<VictoryLayer, number>>;
  readonly noitesMedia: number;
  readonly noitesMediana: number;
  readonly duracaoMediaCiclos: number;
  /** Partidas que terminaram por travamento ou erro — deve ser zero. */
  readonly abortadas: number;
  /** Semente de cada partida, para reabrir um caso esquisito no laboratório. */
  readonly sementes: readonly string[];
}

/**
 * Roda N partidas com decisões automáticas e agrega estatísticas.
 * É assim que a calculadora de peso é calibrada de verdade (10.000 partidas).
 * TODO: definir a política de decisão dos bots antes de implementar.
 */
export declare function rodarLote(opcoes: BatchOptions): BatchStats;
