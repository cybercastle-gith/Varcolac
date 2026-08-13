import type { Faction, SoloAlignment } from './faction';
import type { NightStepId } from './action';

export type RoleId = string;
export type VariantId = string;

/** Categoria funcional, no espírito de Town of Salem: ajuda a montar baralho. */
export type RoleCategory =
  | 'informacao'
  | 'protecao'
  | 'ataque'
  | 'suporte'
  | 'bloqueio'
  | 'passivo'
  | 'nenhuma';

/** Quantas vezes a habilidade pode ser usada. */
export type UsageLimit =
  | { readonly kind: 'ilimitado' }
  | { readonly kind: 'por-partida'; readonly total: number }
  | { readonly kind: 'noites-alternadas'; readonly paridade: 'impar' | 'par' };

/** Variante selecionável no setup. Recalcula o peso da role base. */
export interface RoleVariant {
  readonly id: VariantId;
  readonly nome: string;
  readonly descricao: string;
  /** Peso absoluto desta variante — substitui o peso base, não soma. */
  readonly peso: number;
  /** Sobrescreve a etapa da noite, quando a variante muda o momento da ação. */
  readonly etapa?: NightStepId;
  readonly usoLimitado?: UsageLimit;
}

export interface Role {
  readonly id: RoleId;
  readonly nome: string;
  readonly faccao: Faction;
  /** Obrigatório apenas quando `faccao === 'solitario'`. */
  readonly alinhamento?: SoloAlignment;
  readonly categoria: RoleCategory;
  /** Peso para a calculadora de balanceamento. Pode ser negativo (ver Anciã). */
  readonly peso: number;
  /** Em qual das 12 etapas da noite a role age. `undefined` = não age à noite. */
  readonly etapa?: NightStepId;
  readonly usoLimitado: UsageLimit;
  readonly variantes: readonly RoleVariant[];
  /** True quando a role tem condição de vitória própria (Bobo, Vingador...). */
  readonly vitoriaPropria: boolean;
  readonly descricaoCurta: string;
  readonly descricaoLonga: string;
}

/** Modificador aplicado sobre roles existentes (Amantes). Não é uma role. */
export interface RoleModifier {
  readonly id: string;
  readonly nome: string;
  readonly peso: number;
  readonly alvos: number;
  readonly variantes: readonly RoleVariant[];
  readonly descricao: string;
}

/**
 * Peso efetivo considerando a variante escolhida.
 * A variante SUBSTITUI o peso base — nunca soma.
 */
export function pesoEfetivo(role: Role, variante?: VariantId): number {
  if (!variante) return role.peso;
  const v = role.variantes.find((x) => x.id === variante);
  if (!v) throw new Error(`Variante desconhecida em ${role.id}: ${variante}`);
  return v.peso;
}

/** Etapa efetiva: a variante pode mudar o momento da ação. */
export function etapaEfetiva(role: Role, variante?: VariantId): Role['etapa'] {
  if (!variante) return role.etapa;
  const v = role.variantes.find((x) => x.id === variante);
  return v?.etapa ?? role.etapa;
}

/** Quantos usos a role começa a partida tendo. `Infinity` quando ilimitado. */
export function usosIniciais(limite: UsageLimit): number {
  return limite.kind === 'por-partida' ? limite.total : Infinity;
}
