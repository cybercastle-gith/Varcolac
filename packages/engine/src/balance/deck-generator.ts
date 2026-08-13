import type { Deck, GameConfig } from '../types/config';
import type { Rng } from '../utils/rng';
import { ROLES, ROLES_LOBOS, ROLES_VILA, ROLES_SOLITARIOS } from '../data/roles/index';
import { calcularEquilibrio, type BalanceResult } from './weight-calculator';

/** Sementes de fábrica (seção 12 do dossiê). */
export type DeckStyle =
  | 'classico'
  | 'roleta-russa'
  | 'misterio'
  | 'caos'
  | 'matilha'
  | 'vila-cega'
  | 'todos-poderosos'
  | 'sobrevivencia'
  | 'mesa-pequena'
  | 'noite-longa';

export interface GenerationOptions {
  readonly jogadores: number;
  readonly config: GameConfig;
  readonly estilo?: DeckStyle;
  /** Tentativas antes de aceitar a melhor composição encontrada. */
  readonly maxTentativas?: number;
}

export interface GeneratedDeck {
  readonly deck: Deck;
  readonly equilibrio: BalanceResult;
  readonly tentativas: number;
}

/** Quantos lobos a mesa comporta: jogadores ÷ 3,5, arredondado. */
export function lobosPara(jogadores: number): number {
  return Math.max(1, Math.round(jogadores / 3.5));
}

/**
 * Baralho Surpresa: monta uma composição válida que ninguém na mesa conhece de
 * antemão. Só funciona porque a calculadora de peso existe — ela deixou de ser
 * um extra e virou infraestrutura.
 *
 * Estratégia: sorteia dentro das restrições estruturais, mede, e fica com a
 * primeira composição dentro da tolerância. Se nenhuma entrar, devolve a de
 * menor desvio — o app avisa e o host decide, como manda o dossiê.
 */
export function gerarBaralho(opcoes: GenerationOptions, rng: Rng): GeneratedDeck {
  const { jogadores, config, maxTentativas = 200 } = opcoes;
  if (jogadores < 5) throw new RangeError('A mesa mínima é de 5 jogadores.');

  const nLobos = lobosPara(jogadores);
  const nSolitarios = rng.int(0, Math.floor(jogadores * 0.25));
  const nVila = jogadores - nLobos - nSolitarios;
  const tetoPesados = Math.floor(jogadores / 4);

  let melhor: GeneratedDeck | null = null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const roleIds = [
      ...escolher(ROLES_LOBOS, nLobos, rng),
      ...escolher(ROLES_SOLITARIOS, nSolitarios, rng),
      ...escolherVila(nVila, tetoPesados, rng),
    ];

    const deck: Deck = { id: 'surpresa', nome: 'Baralho Surpresa', roleIds, modificadores: [] };
    const equilibrio = calcularEquilibrio(deck, config, jogadores);
    const candidato = { deck, equilibrio, tentativas: tentativa };

    if (equilibrio.aceitavel && equilibrio.violacoes.length === 0) return candidato;
    if (!melhor || Math.abs(equilibrio.ie) < Math.abs(melhor.equilibrio.ie)) melhor = candidato;
  }

  return melhor!;
}

/** Sorteia `n` roles, permitindo repetição — uma mesa tem vários Lobos. */
function escolher(pool: readonly { id: string }[], n: number, rng: Rng): string[] {
  return Array.from({ length: n }, () => rng.pick(pool).id);
}

/** A vila respeita o teto de roles caras; o resto vira Aldeão. */
function escolherVila(n: number, tetoPesados: number, rng: Rng): string[] {
  const baratas = ROLES_VILA.filter((r) => r.peso < 4);
  const caras = ROLES_VILA.filter((r) => r.peso >= 4);
  const nCaras = Math.min(tetoPesados, rng.int(0, tetoPesados), n);
  return [
    ...Array.from({ length: nCaras }, () => rng.pick(caras).id),
    ...Array.from({ length: n - nCaras }, () => rng.pick(baratas).id),
  ];
}

/**
 * Presets curados de fábrica.
 * TODO: as demais sementes da seção 12 — Roleta Russa, Mistério, Caos, Matilha,
 * Vila Cega, Todos Poderosos, Sobrevivência, Mesa Pequena, Noite Longa.
 */
export function baralhoDeFabrica(estilo: DeckStyle, jogadores: number): Deck {
  if (estilo === 'classico') {
    const nLobos = lobosPara(jogadores);
    const vila = ['vidente', 'medico', 'cacador'].slice(0, Math.max(0, jogadores - nLobos));
    const aldeoes = Array.from(
      { length: jogadores - nLobos - vila.length },
      () => 'aldeao',
    );
    return {
      id: 'classico',
      nome: 'Clássico',
      roleIds: [...Array.from({ length: nLobos }, () => 'lobo'), ...vila, ...aldeoes],
      modificadores: [],
    };
  }

  if (estilo === 'roleta-russa') {
    return {
      id: 'roleta-russa',
      nome: 'Roleta Russa',
      roleIds: ['lobo', ...Array.from({ length: jogadores - 1 }, () => 'bobo')],
      modificadores: [],
    };
  }

  throw new Error(`Preset ainda não montado: ${estilo}`);
}

export { ROLES };
