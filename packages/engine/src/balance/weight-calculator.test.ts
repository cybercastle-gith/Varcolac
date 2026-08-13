import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck } from '../types/config';
import {
  calcularEquilibrio,
  lerIndice,
  multiplicador,
  toleranciaDeIE,
  ajusteDeConfiguracao,
} from './weight-calculator';

const deck = (roleIds: string[]): Deck => ({
  id: 'teste',
  nome: 'teste',
  roleIds,
  modificadores: [],
});

/** Setup neutro: nenhum ajuste, para medir só a composição. */
const cru = {
  ...DEFAULT_CONFIG,
  revelarRoleAoMorrer: false,
  contagemDeLobos: 'oculta' as const,
  frequenciaEventos: 'desligado' as const,
};

describe('multiplicador', () => {
  it('endurece nas mesas pequenas e afrouxa nas grandes', () => {
    expect(multiplicador(6)).toBe(1.8);
    expect(multiplicador(8)).toBe(1.6);
    expect(multiplicador(11)).toBe(1.6);
    expect(multiplicador(16)).toBe(1.4);
  });
});

describe('leitura do índice', () => {
  it('segue a tabela do dossiê', () => {
    expect(lerIndice(0)).toBe('equilibrado');
    expect(lerIndice(-2)).toBe('equilibrado');
    expect(lerIndice(3)).toBe('vila-forte');
    expect(lerIndice(6)).toBe('vila-quebrada');
    expect(lerIndice(-4)).toBe('matilha-forte');
    expect(lerIndice(-6)).toBe('massacre');
  });
});

describe('ajustes de setup', () => {
  it('revelação +2, contagem pública +1, fantasmas +1', () => {
    expect(ajusteDeConfiguracao({ ...cru, revelarRoleAoMorrer: true })).toBe(2);
    expect(ajusteDeConfiguracao({ ...cru, contagemDeLobos: 'publica' })).toBe(1);
    expect(ajusteDeConfiguracao({ ...cru, modulosDeFantasma: ['assombrar'] })).toBe(1);
  });

  it('votação secreta não mexe no índice', () => {
    expect(ajusteDeConfiguracao({ ...cru, votacao: 'secreta' })).toBe(0);
  });
});

describe('tolerância', () => {
  it('eventos não mudam o IE — alargam a tolerância', () => {
    expect(toleranciaDeIE({ ...cru, frequenciaEventos: 'desligado' })).toEqual({
      min: -2,
      max: 2,
    });
    expect(toleranciaDeIE({ ...cru, frequenciaEventos: 'caotico' })).toEqual({
      min: -5,
      max: 5,
    });
  });

  it('IE de −4 é aceitável no caótico e inaceitável sem eventos', () => {
    // IE = 6 − 6 × 1,6 = −3,6: fora da tolerância sem eventos, dentro no caótico.
    const d = deck([
      'vidente',
      'medico',
      'aldeao',
      'aldeao',
      'aldeao',
      'aldeao',
      'lobo',
      'lobo',
    ]);
    const semEventos = calcularEquilibrio(d, { ...cru, frequenciaEventos: 'desligado' }, 8);
    const caotico = calcularEquilibrio(d, { ...cru, frequenciaEventos: 'caotico' }, 8);
    expect(semEventos.ie).toBe(caotico.ie);
    expect(semEventos.aceitavel).toBe(false);
    expect(caotico.aceitavel).toBe(true);
  });
});

describe('calcularEquilibrio', () => {
  it('aplica a fórmula IE = vila − matilha × M', () => {
    // Vila 3+3+0+0+0+0 = 6 · Matilha 3+3 = 6 · M(8) = 1,6 → 6 − 9,6 = −3,6
    const d = deck([
      'vidente',
      'medico',
      'aldeao',
      'aldeao',
      'aldeao',
      'aldeao',
      'lobo',
      'lobo',
    ]);
    const r = calcularEquilibrio(d, cru, 8);
    expect(r.forcaVila).toBe(6);
    expect(r.forcaMatilha).toBe(6);
    expect(r.ie).toBeCloseTo(-3.6, 2);
    expect(r.leitura).toBe('matilha-forte');
  });

  it('a variante substitui o peso base, não soma', () => {
    const d = deck(['vidente', 'aldeao', 'aldeao', 'aldeao', 'lobo', 'lobo']);
    const base = calcularEquilibrio(d, cru, 6);
    const ossos = calcularEquilibrio(d, { ...cru, variantes: { vidente: 'ossos' } }, 6);
    expect(base.forcaVila).toBe(3);
    expect(ossos.forcaVila).toBe(1);
  });

  it('acusa lobos fora da proporção de 1 para 3,5', () => {
    const d = deck(['aldeao', 'aldeao', 'aldeao', 'aldeao', 'aldeao', 'lobo', 'lobo', 'lobo']);
    const r = calcularEquilibrio(d, cru, 8);
    expect(r.violacoes.some((v) => v.startsWith('Lobos:'))).toBe(true);
  });

  it('acusa excesso de solitários e de roles caras', () => {
    const d = deck(['bobo', 'coringa', 'bruxa', 'necromante', 'alfa', 'lobo']);
    const r = calcularEquilibrio(d, cru, 6);
    expect(r.violacoes.some((v) => v.startsWith('Solitários:'))).toBe(true);
    expect(r.violacoes.some((v) => v.startsWith('Roles de peso 4+:'))).toBe(true);
  });

  it('sugere correção nomeando uma role concreta', () => {
    const d = deck([
      'necromante',
      'vidente',
      'medico',
      'detetive',
      'xerife',
      'guarda-costas',
      'aldeao',
      'lobo',
    ]);
    const r = calcularEquilibrio(d, cru, 8);
    expect(r.leitura).toBe('vila-quebrada');
    expect(r.sugestoes[0]).toMatch(/Vila muito forte/);
  });
});
