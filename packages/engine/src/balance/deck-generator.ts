import type { Deck, GameConfig } from '../types/config';
import type { Role } from '../types/role';
import type { Rng } from '../utils/rng';
import { ROLES_LOBOS, ROLES_VILA, ROLES_SOLITARIOS } from '../data/roles/index';
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

/** Sorteia `n` roles, permitindo repetição — uma mesa tem vários Lobos. */
function escolher(pool: readonly Role[], n: number, rng: Rng): string[] {
  if (pool.length === 0 || n <= 0) return [];
  return Array.from({ length: n }, () => rng.pick(pool).id);
}

/** A vila respeita o teto de roles caras; o resto vira role barata. */
function escolherVila(n: number, tetoPesados: number, rng: Rng): string[] {
  const baratas = ROLES_VILA.filter((r) => r.peso < 4);
  const caras = ROLES_VILA.filter((r) => r.peso >= 4);
  const nCaras = Math.min(tetoPesados, rng.int(0, tetoPesados), n);
  return [...escolher(caras, nCaras, rng), ...escolher(baratas, n - nCaras, rng)];
}

/**
 * Baralho Surpresa: monta uma composição válida que ninguém na mesa conhece de
 * antemão. Só funciona porque a calculadora de peso existe — ela deixou de ser
 * um extra e virou infraestrutura.
 *
 * Sorteia dentro das restrições estruturais, mede, e fica com a primeira
 * composição dentro da tolerância. Se nenhuma entrar, devolve a de menor
 * desvio: o app avisa e o host decide, como manda o dossiê.
 */
export function gerarBaralho(opcoes: GenerationOptions, rng: Rng): GeneratedDeck {
  const { jogadores, config, maxTentativas = 200 } = opcoes;
  if (jogadores < 5) throw new RangeError('A mesa mínima é de 5 jogadores.');

  const nLobos = lobosPara(jogadores);
  const tetoPesados = Math.floor(jogadores / 4);
  let melhor: GeneratedDeck | null = null;

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const nSolitarios = rng.int(0, Math.floor(jogadores * 0.25));
    const roleIds = [
      ...escolher(ROLES_LOBOS, nLobos, rng),
      ...escolher(ROLES_SOLITARIOS, nSolitarios, rng),
      ...escolherVila(jogadores - nLobos - nSolitarios, tetoPesados, rng),
    ];

    const deck: Deck = { id: 'surpresa', nome: 'Baralho Surpresa', roleIds };
    const equilibrio = calcularEquilibrio(deck, config, jogadores);
    const candidato = { deck, equilibrio, tentativas: tentativa };

    if (equilibrio.aceitavel && equilibrio.violacoes.length === 0) return candidato;
    if (!melhor || Math.abs(equilibrio.ie) < Math.abs(melhor.equilibrio.ie)) melhor = candidato;
  }

  return melhor!;
}

/** Completa o baralho com Aldeões até fechar o número de jogadores. */
function completar(roleIds: string[], jogadores: number, enchimento = 'aldeao'): string[] {
  const faltam = Math.max(0, jogadores - roleIds.length);
  return [...roleIds.slice(0, jogadores), ...Array.from({ length: faltam }, () => enchimento)];
}

const repetir = (id: string, n: number) => Array.from({ length: n }, () => id);

/**
 * As dez sementes de fábrica. São curadas de propósito: o Baralho Surpresa já
 * cobre o aleatório, e o valor destas está justamente em serem reconhecíveis —
 * "hoje a gente joga Roleta Russa" é uma frase que a mesa entende.
 */
export function baralhoDeFabrica(estilo: DeckStyle, jogadores: number): Deck {
  const lobos = lobosPara(jogadores);
  const monta = (nome: string, roleIds: string[]): Deck => ({
    id: estilo,
    nome,
    roleIds: completar(roleIds, jogadores),
  });

  switch (estilo) {
    case 'classico':
      return monta('Clássico', [...repetir('lobo', lobos), 'vidente', 'medico', 'cacador']);

    case 'roleta-russa':
      // "Um lobo, todo o resto quer morrer." É o estilo-vitrine.
      return {
        id: estilo,
        nome: 'Roleta Russa',
        roleIds: ['lobo', ...repetir('bobo', jogadores - 1)],
      };

    case 'misterio':
      // Roles ocultas, zero solitários, informação suja.
      return monta('Mistério', [...repetir('lobo', lobos), 'vidente', 'detetive', 'taverneiro']);

    case 'caos':
      return monta('Caos', [
        ...repetir('lobo', lobos - 1),
        'feiticeiro',
        'bruxa',
        'bobo',
        'coringa',
        'vidente',
      ]);

    case 'matilha':
      // Lobos são quase metade da mesa. Vila com poucos poderes.
      return monta('Matilha', [
        ...repetir('lobo', Math.max(2, Math.floor(jogadores / 2) - 1)),
        'alfa',
        'medico',
      ]);

    case 'vila-cega':
      // Nenhuma role de informação. Só leitura social.
      return monta('Vila Cega', [
        ...repetir('lobo', lobos),
        'medico',
        'guarda-costas',
        'cacador',
        'padre',
      ]);

    case 'todos-poderosos': {
      // Nenhum aldeão comum: todo mundo tem habilidade.
      const poderosas = ROLES_VILA.filter((r) => r.categoria !== 'nenhuma').map((r) => r.id);
      const roleIds = [...repetir('lobo', lobos), ...poderosas].slice(0, jogadores);
      return {
        id: estilo,
        nome: 'Todos Poderosos',
        roleIds: completar(roleIds, jogadores, 'taverneiro'),
      };
    }

    case 'sobrevivencia':
      // Muitos solitários, poucos lobos.
      return monta('Sobrevivência', [
        'lobo',
        'sobrevivente',
        'bobo',
        'vingador',
        'ladrao',
        'medico',
      ]);

    case 'mesa-pequena':
      return monta('Mesa Pequena', ['lobo', 'vidente', 'medico']);

    case 'noite-longa':
      // 12+ jogadores, catálogo cheio.
      return monta('Noite Longa', [
        ...repetir('lobo', lobos - 2),
        'alfa',
        'feiticeiro',
        'vidente',
        'detetive',
        'medico',
        'guarda-costas',
        'xerife',
        'padre',
        'cacador',
        'ancia',
        'bruxa',
      ]);
  }
}

/** Nomes e uma linha de cada estilo, para a tela de setup e o laboratório. */
export const ESTILOS: readonly { id: DeckStyle; nome: string; frase: string }[] = [
  { id: 'classico', nome: 'Clássico', frase: 'Aldeão, Lobo, Vidente, Médico, Caçador.' },
  { id: 'roleta-russa', nome: 'Roleta Russa', frase: 'Um lobo, todo o resto quer morrer.' },
  { id: 'misterio', nome: 'Mistério', frase: 'Roles ocultas e informação suja.' },
  { id: 'caos', nome: 'Caos', frase: 'Máximo de solitários e variantes esquisitas.' },
  { id: 'matilha', nome: 'Matilha', frase: 'Lobos são quase metade da mesa.' },
  { id: 'vila-cega', nome: 'Vila Cega', frase: 'Nenhuma role de informação. Só leitura social.' },
  { id: 'todos-poderosos', nome: 'Todos Poderosos', frase: 'Nenhum aldeão comum.' },
  { id: 'sobrevivencia', nome: 'Sobrevivência', frase: 'Muitos solitários, poucos lobos.' },
  { id: 'mesa-pequena', nome: 'Mesa Pequena', frase: '4-6 jogadores, roles adaptadas.' },
  { id: 'noite-longa', nome: 'Noite Longa', frase: '12+ jogadores, catálogo cheio.' },
];
