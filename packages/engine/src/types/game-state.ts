import type { GameConfig, Deck } from './config';
import type { Player, PlayerId } from './player';
import type { EventId } from './event';
import type { EfeitoAdiado } from './effect';
import type { InfoEntry, Announcement } from './info';
import type { RngState } from '../utils/rng';

export type Phase = 'setup' | 'noite' | 'amanhecer' | 'dia' | 'votacao' | 'execucao' | 'fim';

export interface VoteRecord {
  readonly rodada: number;
  readonly votos: Readonly<Record<PlayerId, PlayerId | null>>;
  readonly linchadoId: PlayerId | null;
  readonly empate: boolean;
  /** True quando o linchado era da vila — alimenta os gatilhos e o Peso da Culpa. */
  readonly inocente: boolean;
}

/**
 * Contadores dos gatilhos da família 2. Poderiam ser derivados do histórico a
 * cada checagem, mas os gatilhos são consultados toda rodada e alguns dependem
 * de sequência ("dois seguidos"), que é justamente o que o histórico não diz
 * sem uma varredura. Guardar é mais barato e mais legível.
 */
export interface Contadores {
  readonly inocentesLinchadosSeguidos: number;
  readonly inocentesLinchadosTotal: number;
  readonly noitesSemMatar: number;
  readonly mortosNoTotal: number;
  readonly mortesNaUltimaNoite: number;
}

export const CONTADORES_ZERADOS: Contadores = {
  inocentesLinchadosSeguidos: 0,
  inocentesLinchadosTotal: 0,
  noitesSemMatar: 0,
  mortosNoTotal: 0,
  mortesNaUltimaNoite: 0,
};

export interface GameState {
  readonly config: GameConfig;
  readonly deck: Deck;
  readonly players: readonly Player[];
  readonly rodada: number;
  readonly fase: Phase;
  readonly eventoDaNoite: EventId | null;
  /** Eventos já usados — nenhum se repete na mesma partida. */
  readonly eventosUsados: readonly EventId[];
  readonly historicoVotos: readonly VoteRecord[];
  /** Tudo que foi entregue em privado; o laboratório mostra, a mesa não. */
  readonly informacoes: readonly InfoEntry[];
  /** Tudo que o app disse em voz alta. */
  readonly anuncios: readonly Announcement[];
  /** Efeitos engatilhados para rodadas futuras. */
  readonly efeitos: readonly EfeitoAdiado[];
  readonly contadores: Contadores;
  readonly rng: RngState;
  /** Objetivo do Coringa, alvo do Vingador, poção da Bruxa. */
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

export function nomeDe(estado: GameState, id: PlayerId): string {
  return jogador(estado, id).nome;
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
