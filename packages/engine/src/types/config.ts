import type { EventFrequency } from './event';
import type { RoleId, VariantId } from './role';

export type GameMode = 'classico' | 'traicao' | 'vila-amaldicoada' | 'duplas';

export type WolfCountVisibility = 'publica' | 'oculta' | 'faixa';

export type VoteMode = 'simultanea' | 'secreta';

export type GhostModuleId =
  | 'peso-da-culpa'
  | 'assombrar'
  | 'pesadelo'
  | 'conselho-dos-mortos'
  | 'julgamento-do-alem';

/** Os sete sistemas ligáveis no setup. É o coração do produto. */
export interface GameConfig {
  readonly modo: GameMode;
  readonly revelarRoleAoMorrer: boolean;
  readonly contagemDeLobos: WolfCountVisibility;
  readonly frequenciaEventos: EventFrequency;
  readonly modulosDeFantasma: readonly GhostModuleId[];
  readonly votacao: VoteMode;
  /** Variante escolhida para cada role presente no baralho. */
  readonly variantes: Readonly<Record<RoleId, VariantId>>;
  /** Semente do RNG — permite reproduzir a partida inteira. */
  readonly semente: string;
  readonly tempoDiscussaoSegundos: number;
}

/** Baralho: as roles que entram na mesa, com repetição. */
export interface Deck {
  readonly id: string;
  readonly nome: string;
  readonly roleIds: readonly RoleId[];
  /** Pares de amantes a aplicar sobre roles existentes. */
  readonly modificadores: readonly string[];
}

/** Modo Clássico, tudo transparente: o setup mais gentil para quem nunca jogou. */
export const DEFAULT_CONFIG: GameConfig = {
  modo: 'classico',
  revelarRoleAoMorrer: true,
  contagemDeLobos: 'publica',
  frequenciaEventos: 'raro',
  modulosDeFantasma: [],
  votacao: 'simultanea',
  variantes: {},
  semente: 'padrao',
  // Teto prático de 3 minutos, conforme o orçamento de tempo do dossiê.
  tempoDiscussaoSegundos: 180,
};
