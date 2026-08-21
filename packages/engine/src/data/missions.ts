/**
 * Missões do Coringa. Uma é sorteada por partida, secreta, e nunca é a mesma
 * role duas vezes — por isso a missão é sobre COMPORTAMENTO da mesa, não sobre
 * a role sorteada.
 */
export interface Missao {
  readonly id: string;
  readonly texto: string;
  /** Como o engine verifica no fim. `manual` = o host julga na mesa. */
  readonly verificacao: 'sobreviver' | 'morrer-de-noite' | 'nunca-votar' | 'manual';
}

export const MISSOES_DO_CORINGA: readonly Missao[] = [
  { id: 'sobreviver', texto: 'Esteja vivo no fim da partida.', verificacao: 'sobreviver' },
  { id: 'morrer-de-noite', texto: 'Morra durante uma noite.', verificacao: 'morrer-de-noite' },
  { id: 'nunca-votar', texto: 'Nunca vote em ninguém.', verificacao: 'nunca-votar' },
  { id: 'acusar-lobo', texto: 'Acuse um lobo em voz alta antes da noite 3.', verificacao: 'manual' },
  { id: 'ser-acusado', texto: 'Seja acusado publicamente e sobreviva ao dia.', verificacao: 'manual' },
];

export const MISSOES_POR_ID: ReadonlyMap<string, Missao> = new Map(
  MISSOES_DO_CORINGA.map((m) => [m.id, m]),
);
