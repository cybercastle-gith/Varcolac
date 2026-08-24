import type { PlayerId } from './player';

/**
 * As 11 etapas da resolução noturna, na ordem exata. A ordem nunca muda.
 *
 * O dossiê original tinha uma 12ª — `sussurros`, os bilhetes anônimos de três
 * palavras. A mecânica foi cortada do jogo, então a etapa saiu junto: manter uma
 * etapa que nunca faz nada só ensinaria a ignorar linhas do log.
 */
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
  | 'marcar'
  | 'nenhuma';

/** Escolha declarada por um jogador durante a passagem do celular. */
export interface NightAction {
  readonly actorId: PlayerId;
  readonly kind: ActionKind;
  readonly etapa: NightStepId;
  readonly alvos: readonly PlayerId[];
  /** Texto livre de uma ação que precise dele. */
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
