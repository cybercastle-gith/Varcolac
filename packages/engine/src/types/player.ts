import type { RoleId, VariantId } from './role';

export type PlayerId = string;

export type PlayerStatus = 'vivo' | 'morto';

export type CauseOfDeath =
  | 'matilha'
  | 'linchamento'
  | 'estertor'
  | 'evento'
  | 'bruxa'
  | 'lobo-branco'
  | 'guarda-costas';

/** Marcas voláteis, limpas ao fim de cada noite. O laboratório exibe todas. */
export interface PlayerFlags {
  readonly protegido: boolean;
  readonly bloqueado: boolean;
  readonly perfurado: boolean;
  readonly preso: boolean;
  readonly imuneInvestigacao: boolean;
  readonly assombrado: boolean;
  readonly embriagado: boolean;
  /** Estertor pendente, a disparar na etapa 9 (ex.: Carniçal). */
  readonly estertorPendente: boolean;
}

export interface Player {
  readonly id: PlayerId;
  readonly nome: string;
  /** Cor ou ícone escolhido no setup, salvo por grupo. */
  readonly cor: string;
  readonly roleId: RoleId;
  readonly varianteId?: VariantId;
  readonly status: PlayerStatus;
  readonly mortoNaRodada?: number;
  readonly causaMorte?: CauseOfDeath;
  /** Usos restantes da habilidade. */
  readonly usosRestantes: number;
  readonly flags: PlayerFlags;
  /** Perde o voto do dia seguinte (custo da Vidente, Motim...). */
  readonly semVoto: boolean;
  /** Não pode falar no dia seguinte (preso pelo Xerife). */
  readonly silenciado: boolean;
}
