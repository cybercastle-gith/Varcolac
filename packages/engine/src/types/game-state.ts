import type { GameConfig, Deck } from './config';
import type { Player, PlayerId } from './player';
import type { EventId } from './event';
import type { RngState } from '../utils/rng';

export type Phase = 'setup' | 'noite' | 'amanhecer' | 'dia' | 'votacao' | 'execucao' | 'fim';

/** Bilhete anônimo de 3 palavras, entregue no amanhecer seguinte. */
export interface Whisper {
  readonly deRodada: number;
  readonly paraId: PlayerId;
  readonly texto: string;
}

export interface VoteRecord {
  readonly rodada: number;
  readonly votos: Readonly<Record<PlayerId, PlayerId | null>>;
  readonly linchadoId: PlayerId | null;
  readonly empate: boolean;
}

export interface GameState {
  readonly config: GameConfig;
  readonly deck: Deck;
  readonly players: readonly Player[];
  readonly rodada: number;
  readonly fase: Phase;
  readonly eventoDaNoite: EventId | null;
  readonly sussurrosPendentes: readonly Whisper[];
  readonly historicoVotos: readonly VoteRecord[];
  readonly rng: RngState;
  /** Objetivo sorteado do Coringa, alvo do Vingador, etc. */
  readonly objetivosSecretos: Readonly<Record<PlayerId, string>>;
  readonly vencedores: readonly PlayerId[] | null;
}

/** Busca por id. Lança se não existir — id inválido é bug. */
export function jogador(estado: GameState, id: PlayerId): Player {
  const p = estado.players.find((x) => x.id === id);
  if (!p) throw new Error(`Jogador desconhecido: ${id}`);
  return p;
}

export function vivos(estado: GameState): readonly Player[] {
  return estado.players.filter((p) => p.status === 'vivo');
}

export function mortos(estado: GameState): readonly Player[] {
  return estado.players.filter((p) => p.status === 'morto');
}

/** Substitui um jogador sem mutar o estado. Base de toda etapa da noite. */
export function comJogador(
  estado: GameState,
  id: PlayerId,
  patch: (p: Player) => Player,
): GameState {
  return {
    ...estado,
    players: estado.players.map((p) => (p.id === id ? patch(p) : p)),
  };
}
