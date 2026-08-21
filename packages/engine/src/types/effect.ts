import type { PlayerId } from './player';

/**
 * Efeito que nasce agora e só age numa rodada FUTURA.
 *
 * Sem isto, cada mecânica de "na próxima noite..." precisaria de um campo
 * próprio no estado — e o dossiê tem mais de uma dúzia delas, entre eventos,
 * roles e agravamentos. Uma fila tipada mantém tudo num lugar só e faz o
 * laboratório poder listar o que está engatilhado.
 *
 * `naRodada` é sempre a rodada em que o efeito se aplica, não a que o criou.
 */
export type EfeitoAdiado =
  | { readonly kind: 'matilha-mata-n'; readonly naRodada: number; readonly n: number }
  | { readonly kind: 'matilha-nao-mata'; readonly naRodada: number }
  /** Anciã: a vila perde todos os poderes por uma noite. */
  | { readonly kind: 'poderes-suspensos'; readonly naRodada: number }
  /** Velório, Sino da Igreja. */
  | { readonly kind: 'sem-votacao'; readonly naRodada: number }
  /** Caça às Bruxas: a vila pode linchar dois. */
  | { readonly kind: 'lincha-dois'; readonly naRodada: number }
  /** Motim: os aldeões perdem o direito de votar por um dia. */
  | { readonly kind: 'aldeoes-sem-voto'; readonly naRodada: number }
  /** Luto Sagrado: proteção coletiva por uma noite. */
  | { readonly kind: 'protecao-coletiva'; readonly naRodada: number }
  /** Guarda-costas Escudo, Lobo Carniçal: morre com atraso. */
  | { readonly kind: 'expira'; readonly naRodada: number; readonly playerId: PlayerId }
  /** Vidente dos Sonhos: a visão chega uma noite depois. */
  | { readonly kind: 'visao-atrasada'; readonly naRodada: number; readonly paraId: PlayerId; readonly texto: string }
  /** Vila Amaldiçoada: a vila inteira morre se o prazo vencer. */
  | { readonly kind: 'prazo-da-maldicao'; readonly naRodada: number };

export type EfeitoKind = EfeitoAdiado['kind'];

/** Os efeitos válidos para esta rodada. */
export function efeitosDaRodada(
  fila: readonly EfeitoAdiado[],
  rodada: number,
): readonly EfeitoAdiado[] {
  return fila.filter((e) => e.naRodada === rodada);
}

export function temEfeito(
  fila: readonly EfeitoAdiado[],
  rodada: number,
  kind: EfeitoKind,
): boolean {
  return fila.some((e) => e.naRodada === rodada && e.kind === kind);
}

/** Descarta o que já passou, para a fila não crescer sem limite. */
export function limparEfeitosVencidos(
  fila: readonly EfeitoAdiado[],
  rodada: number,
): readonly EfeitoAdiado[] {
  return fila.filter((e) => e.naRodada >= rodada);
}
