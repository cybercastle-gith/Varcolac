import type { Faction, SoloAlignment } from './faction';
import type { NightStepId } from './action';

export type RoleId = string;
export type VariantId = string;

/** Categoria funcional, no espírito de Town of Salem: ajuda a montar baralho. */
export type RoleCategory =
  'informacao' | 'protecao' | 'ataque' | 'suporte' | 'bloqueio' | 'passivo' | 'nenhuma';

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

/**
 * Usos iniciais que dependem do TAMANHO DA MESA.
 *
 * Uma exceção, hoje: a revista do Delegado revela a facção em público, o que é
 * a informação mais cara do jogo. Numa mesa de seis ela resolveria a partida
 * sozinha; numa de doze, um uso só seria irrelevante. Um a cada quatro
 * jogadores escala junto com o problema — decisão do usuário em 2026-09-27.
 *
 * Devolve `null` quando a carta não tem regra própria e vale o `usoLimitado`.
 */
export function usosPorMesa(
  roleId: RoleId,
  variante: VariantId | undefined,
  totalDeJogadores: number,
): number | null {
  if (roleId === 'detetive' && variante === 'delegado') {
    return Math.max(1, Math.floor(totalDeJogadores / 4));
  }
  return null;
}

/** Quantos usos a role começa a partida tendo. `Infinity` quando ilimitado. */
export function usosIniciais(limite: UsageLimit): number {
  return limite.kind === 'por-partida' ? limite.total : Infinity;
}

/**
 * O nome que a mesa deve OUVIR: o da variante, quando existe.
 *
 * "Ana era Xerife" e "Ana era Boca Calada" contam histórias diferentes, e a
 * segunda é a verdadeira — foi a carta da variante que esteve em jogo a noite
 * toda. Até 2026-09-26 o app dizia o nome da função base em todo lugar: no
 * amanhecer, na execução, na tela final. Quem escolheu a variante no setup
 * nunca a via de novo.
 *
 * Recebe a role já resolvida para poder ser chamada de dentro do engine sem
 * consultar o catálogo de novo.
 */
export function nomeDaCarta(role: Role, variante?: VariantId): string {
  if (!variante) return role.nome;
  const v = role.variantes.find((x) => x.id === variante);
  if (!v) return role.nome;

  /**
   * O nome é sempre FUNÇÃO + VARIANTE.
   *
   * Relatado depois de uma mesa de verdade: ninguém sabe o que é "Boca
   * Calada". A variante é um ajuste sobre uma função, e o nome dela sozinho
   * esconde justamente a informação que explica como ela funciona — quem lê
   * "Xerife Boca Calada" já sabe que prende alguém.
   *
   * Quando o nome da variante JÁ começa com o da função ("Vidente dos Ossos",
   * "Médico de Guerra"), repetir viraria "Vidente Vidente dos Ossos".
   */
  return v.nome.toLowerCase().startsWith(role.nome.toLowerCase())
    ? v.nome
    : `${role.nome} ${v.nome}`;
}

/** A descrição curta da carta em jogo — da variante quando houver. */
export function descricaoDaCarta(role: Role, variante?: VariantId): string {
  if (!variante) return role.descricaoCurta;
  return role.variantes.find((v) => v.id === variante)?.descricao ?? role.descricaoCurta;
}
