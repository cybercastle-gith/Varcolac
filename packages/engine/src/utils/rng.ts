/**
 * Aleatoriedade com semente. Toda função que sorteia recebe um gerador daqui,
 * para que uma partida possa ser reproduzida exatamente a partir da semente.
 *
 * xmur3 (hash da semente em texto) + mulberry32 (gerador). Ambos são de domínio
 * público, cabem em vinte linhas e passam nos testes de distribuição que
 * importam para um jogo de mesa.
 */

export interface RngState {
  readonly semente: string;
  /** Contador de chamadas — é o que torna a partida reproduzível. */
  readonly passo: number;
}

export interface Rng {
  /** Float em [0, 1). */
  next(): number;
  /** Inteiro em [min, max], inclusivo nas duas pontas. */
  int(min: number, max: number): number;
  /** Um elemento qualquer. Lança se a lista estiver vazia. */
  pick<T>(itens: readonly T[]): T;
  /** Cópia embaralhada — nunca muta o array original. */
  shuffle<T>(itens: readonly T[]): T[];
  /** Sorteia `n` elementos distintos. Lança se `n` for maior que a lista. */
  sample<T>(itens: readonly T[], n: number): T[];
  /** Estado atual, para salvar junto com a partida. */
  state(): RngState;
}

function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function criarRng(semente: string, passo = 0): Rng {
  let a = xmur3(semente);
  let contador = 0;

  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    contador++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Avança até o passo pedido — é assim que um estado salvo é retomado.
  for (let i = 0; i < passo; i++) next();
  contador = passo;

  const rng: Rng = {
    next,
    int(min, max) {
      if (max < min) throw new RangeError(`int(${min}, ${max}): max < min`);
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(itens) {
      if (itens.length === 0) throw new RangeError('pick() em lista vazia');
      return itens[rng.int(0, itens.length - 1)]!;
    },
    shuffle(itens) {
      const copia = [...itens];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [copia[i], copia[j]] = [copia[j]!, copia[i]!];
      }
      return copia;
    },
    sample(itens, n) {
      if (n > itens.length) {
        throw new RangeError(`sample(${n}) em lista de ${itens.length}`);
      }
      return rng.shuffle(itens).slice(0, n);
    },
    state: () => ({ semente, passo: contador }),
  };

  return rng;
}

/** Retoma um gerador exatamente onde ele parou. */
export function retomarRng(state: RngState): Rng {
  return criarRng(state.semente, state.passo);
}

/** Semente legível, para o host ditar em voz alta e repetir a partida. */
export function sementeAleatoria(): string {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(6, '0');
}
