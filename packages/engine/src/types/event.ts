import type { NightStepId } from './action';

export type EventId = string;

/** Família 3 (destravamento) está fora do v1 — registrada, não implementada. */
export type EventFamily = 'sorte' | 'gatilho' | 'destravamento';

export type EventVisibility = 'narrado' | 'silencioso';

export type EventFrequency = 'desligado' | 'raro' | 'frequente' | 'caotico';

/** Condição que dispara um evento da família 2. */
export type EventTrigger =
  | { readonly kind: 'inocentes-linchados-seguidos'; readonly n: number }
  | { readonly kind: 'inocentes-linchados-total'; readonly n: number }
  | { readonly kind: 'role-morreu'; readonly roleIds: readonly string[] }
  | { readonly kind: 'matilha-sem-matar'; readonly noites: number }
  | { readonly kind: 'mortes-na-noite'; readonly n: number }
  | { readonly kind: 'votacao-empatada' }
  | { readonly kind: 'voto-em-si-mesmo' }
  | { readonly kind: 'enesimo-morto'; readonly n: number };

export interface GameEvent {
  readonly id: EventId;
  readonly nome: string;
  readonly familia: EventFamily;
  readonly visibilidade: EventVisibility;
  /** Frase de narração, quando narrado. */
  readonly narracao?: string;
  /** Etapas que o evento cancela por completo nesta noite. */
  readonly cancelaEtapas: readonly NightStepId[];
  readonly trigger?: EventTrigger;
  readonly descricao: string;
}
