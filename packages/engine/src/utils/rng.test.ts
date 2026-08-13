import { describe, expect, it } from 'vitest';
import { criarRng, retomarRng } from './rng';

describe('rng', () => {
  it('a mesma semente produz a mesma sequência', () => {
    const a = criarRng('vila').shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const b = criarRng('vila').shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).toEqual(b);
  });

  it('sementes diferentes divergem', () => {
    const a = criarRng('vila').shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    const b = criarRng('lobos').shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).not.toEqual(b);
  });

  it('retomar do estado salvo continua a mesma sequência', () => {
    const original = criarRng('noite-1');
    const antes = [original.next(), original.next(), original.next()];
    const estado = original.state();
    const depoisOriginal = [original.next(), original.next()];

    const retomado = retomarRng(estado);
    expect(estado.passo).toBe(antes.length);
    expect([retomado.next(), retomado.next()]).toEqual(depoisOriginal);
  });

  it('int respeita os limites, inclusive nas pontas', () => {
    const rng = criarRng('limites');
    const vistos = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(1, 5);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
      vistos.add(v);
    }
    expect(vistos.size).toBe(5);
  });

  it('shuffle não muta a lista original e preserva os elementos', () => {
    const original = [1, 2, 3, 4, 5];
    const copia = [...original];
    const embaralhado = criarRng('x').shuffle(original);
    expect(original).toEqual(copia);
    expect([...embaralhado].sort()).toEqual(copia);
  });

  it('sample devolve elementos distintos e recusa n maior que a lista', () => {
    const rng = criarRng('amostra');
    const s = rng.sample(['a', 'b', 'c', 'd'], 3);
    expect(new Set(s).size).toBe(3);
    expect(() => rng.sample(['a'], 2)).toThrow(RangeError);
  });
});
