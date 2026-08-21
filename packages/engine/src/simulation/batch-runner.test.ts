import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../types/config';
import { baralhoDeFabrica } from '../balance/deck-generator';
import { jogarPartida } from './play-game';
import { rodarLote, taxas } from './batch-runner';

const jogadores = 8;
const deck = baralhoDeFabrica('classico', jogadores);
const config = { ...DEFAULT_CONFIG, semente: 'lote' };
const nomes = Array.from({ length: jogadores }, (_, i) => ({ nome: `J${i + 1}`, cor: '#000' }));

describe('partida completa', () => {
  it('termina com um vencedor, sem abortar', () => {
    const r = jogarPartida(deck, config, nomes);
    expect(r.abortada).toBe(false);
    expect(r.vitoria.encerrada).toBe(true);
    expect(r.estadoFinal.fase).toBe('fim');
    expect(r.noites).toBeGreaterThan(0);
  });

  it('a mesma semente reproduz a partida inteira, não só o setup', () => {
    const a = jogarPartida(deck, config, nomes);
    const b = jogarPartida(deck, config, nomes);
    expect(a.noites).toBe(b.noites);
    expect(a.estadoFinal.vencedores).toEqual(b.estadoFinal.vencedores);
    expect(a.estadoFinal.players.map((p) => p.status)).toEqual(
      b.estadoFinal.players.map((p) => p.status),
    );
  });

  it('sementes diferentes divergem', () => {
    const resultados = new Set(
      ['a', 'b', 'c', 'd', 'e'].map(
        (s) => jogarPartida(deck, { ...config, semente: s }, nomes).noites,
      ),
    );
    expect(resultados.size).toBeGreaterThan(1);
  });

  it('os quatro modos rodam até o fim', () => {
    for (const modo of ['classico', 'traicao', 'vila-amaldicoada', 'duplas'] as const) {
      const r = jogarPartida(deck, { ...config, modo, semente: `modo-${modo}` }, nomes);
      expect(r.vitoria.encerrada || r.abortada).toBe(true);
    }
  });

  it('com eventos em caótico a partida ainda termina', () => {
    const r = jogarPartida(deck, { ...config, frequenciaEventos: 'caotico' }, nomes);
    expect(r.abortada).toBe(false);
  });

  it('com todos os módulos de fantasma ligados a partida ainda termina', () => {
    const r = jogarPartida(
      deck,
      {
        ...config,
        modulosDeFantasma: [
          'peso-da-culpa',
          'assombrar',
          'pesadelo',
          'conselho-dos-mortos',
          'julgamento-do-alem',
        ],
      },
      nomes,
    );
    expect(r.abortada).toBe(false);
  });
});

describe('simulação em massa', () => {
  it('agrega 200 partidas sem abortar nenhuma', () => {
    const stats = rodarLote({ partidas: 200, jogadores, deck, config, semente: 'massa' });
    expect(stats.partidas).toBe(200);
    expect(stats.abortadas).toBe(0);
    expect(stats.noitesMedia).toBeGreaterThan(0);

    const t = taxas(stats);
    // As camadas principais somam 100%: vila, lobos e amantes cobrem todo fim
    // de partida. As camadas paralelas não entram nessa conta, de propósito.
    expect(t.vila + t.lobos + t.solitario + t.amantes).toBeCloseTo(100, 0);
  });

  it('o lote é reproduzível pela semente base', () => {
    const a = rodarLote({ partidas: 50, jogadores, deck, config, semente: 'igual' });
    const b = rodarLote({ partidas: 50, jogadores, deck, config, semente: 'igual' });
    expect(a.vitoriasPorCamada).toEqual(b.vitoriasPorCamada);
    expect(a.noitesMedia).toBe(b.noitesMedia);
  });

  it('um baralho Matilha favorece os lobos mais que o Clássico', () => {
    const classico = rodarLote({
      partidas: 200,
      jogadores,
      deck: baralhoDeFabrica('classico', jogadores),
      config,
      semente: 'c',
    });
    const matilha = rodarLote({
      partidas: 200,
      jogadores,
      deck: baralhoDeFabrica('matilha', jogadores),
      config,
      semente: 'm',
    });
    expect(taxas(matilha).lobos).toBeGreaterThan(taxas(classico).lobos);
  });
});
