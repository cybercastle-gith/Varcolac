/**
 * Missões do Coringa. Uma é sorteada por partida, secreta, e nunca é a mesma
 * role duas vezes — por isso a missão é sobre COMPORTAMENTO da mesa, não sobre
 * a role sorteada.
 */

/**
 * Quanto tempo a missão dá.
 *
 * Só a variante Missão Sem Volta usa isto: ela diz "antes do prazo definido
 * pelo app", e por um tempo o prazo era uma constante chutada igual para todas
 * as missões. Estava errado por dois motivos — as missões não têm a mesma
 * dificuldade, e uma mesa de 6 acaba muito antes de uma de 10, então rodada 3
 * era quase impossível numa e folgado na outra.
 *
 * - `curto` — pede ação cedo, enquanto quase todos estão vivos.
 * - `medio` — cabe no miolo da partida.
 * - `fim`   — só se julga no fim; não existe prazo a vencer.
 */
export type PrazoDeMissao = 'curto' | 'medio' | 'fim';

export interface Missao {
  readonly id: string;
  readonly texto: string;
  /** Como o engine verifica no fim. `manual` = o host julga na mesa. */
  readonly verificacao: 'sobreviver' | 'morrer-de-noite' | 'nunca-votar' | 'manual';
  readonly prazo: PrazoDeMissao;
}

export const MISSOES_DO_CORINGA: readonly Missao[] = [
  // "Esteja vivo no FIM" não tem prazo a vencer: o prazo é o fim.
  {
    id: 'sobreviver',
    texto: 'Esteja vivo no fim da partida.',
    verificacao: 'sobreviver',
    prazo: 'fim',
  },
  // Morrer depende dos outros, e quanto mais tarde menos gente sobra para matar.
  {
    id: 'morrer-de-noite',
    texto: 'Morra durante uma noite.',
    verificacao: 'morrer-de-noite',
    prazo: 'medio',
  },
  // Não votar é passivo: só o fim da partida diz se ele conseguiu.
  {
    id: 'nunca-votar',
    texto: 'Nunca vote em ninguém.',
    verificacao: 'nunca-votar',
    prazo: 'fim',
  },
  // A própria missão já diz "antes da noite 3": é a definição de curto.
  {
    id: 'acusar-lobo',
    texto: 'Acuse um lobo em voz alta antes da noite 3.',
    verificacao: 'manual',
    prazo: 'curto',
  },
  {
    id: 'ser-acusado',
    texto: 'Seja acusado publicamente e sobreviva ao dia.',
    verificacao: 'manual',
    prazo: 'medio',
  },
];

export const MISSOES_POR_ID: ReadonlyMap<string, Missao> = new Map(
  MISSOES_DO_CORINGA.map((m) => [m.id, m]),
);

/**
 * Em que rodada o prazo desta missão vence, nesta mesa.
 *
 * Escala com o número de jogadores porque é ele que decide quantas rodadas a
 * partida tem: uma mesa de 6 costuma acabar na quarta noite, uma de 12 chega à
 * sétima. Um prazo fixo em rodadas seria duas regras diferentes usando o mesmo
 * número.
 *
 * `Infinity` para `fim`: não há prazo a vencer, e devolver um número grande
 * qualquer faria a checagem parecer arbitrária.
 */
export function prazoEmRodadas(missao: Missao, totalDeJogadores: number): number {
  switch (missao.prazo) {
    case 'curto':
      return Math.max(2, Math.ceil(totalDeJogadores / 3));
    case 'medio':
      return Math.max(3, Math.ceil(totalDeJogadores / 2));
    case 'fim':
      return Infinity;
  }
}
