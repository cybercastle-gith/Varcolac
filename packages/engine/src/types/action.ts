import type { PlayerId } from './player';

/** As 12 etapas da resolução noturna, na ordem exata. A ordem nunca muda. */
export const NIGHT_STEPS = [
  'estado-inicial',
  'evento',
  'bloqueio',
  'interferencia-espectral',
  'protecao',
  'perfuracao',
  'ataque',
  'resolucao-mortes',
  'estertores',
  'ressurreicao',
  'informacao',
  'sussurros',
] as const;

export type NightStepId = (typeof NIGHT_STEPS)[number];

/** Índice 1-12 da etapa, para exibição no log. TODO */
export declare function ordemDaEtapa(step: NightStepId): number;

export type ActionKind =
  | 'investigar'
  | 'comparar'
  | 'proteger'
  | 'bloquear'
  | 'perfurar'
  | 'atacar'
  | 'converter'
  | 'ressuscitar'
  | 'assombrar'
  | 'pesadelo'
  | 'sussurro'
  | 'marcar'
  | 'nenhuma';

/** Escolha declarada por um jogador durante a passagem do celular. */
export interface NightAction {
  readonly actorId: PlayerId;
  readonly kind: ActionKind;
  readonly etapa: NightStepId;
  readonly alvos: readonly PlayerId[];
  /** Bilhete de sussurro: no máximo 3 palavras, anônimo. */
  readonly texto?: string;
  /** Escolha binária (poção da Bruxa, verdadeiro/falso do Pesadelo). */
  readonly escolha?: string;
  /** True quando o jogador não tem ação e recebeu um toque falso. */
  readonly falsa: boolean;
}

/** Todas as ações declaradas em uma noite, antes de qualquer resolução. */
export interface NightSubmission {
  readonly rodada: number;
  readonly acoes: readonly NightAction[];
}
