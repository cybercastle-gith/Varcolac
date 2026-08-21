import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import { criarPartida } from '../setup/create-game';
import type { GameState } from '../types/game-state';
import { apurar, elegiveisParaVotar, resolverDia } from './voting';

const base: GameConfig = { ...DEFAULT_CONFIG, semente: 'dia', frequenciaEventos: 'desligado' };

function montar(roleIds: string[], config = base) {
  const deck: Deck = { id: 't', nome: 't', roleIds, modificadores: [] };
  const jogadores = roleIds.map((_, i) => ({ nome: `J${i + 1}`, cor: '#000' }));
  const estado = criarPartida(deck, config, jogadores);
  return { estado, id: (r: string) => estado.players.find((p) => p.roleId === r)!.id };
}

describe('votação', () => {
  it('condena o mais votado', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo', 'cacador']);
    const alvo = id('lobo');
    const votos = Object.fromEntries(
      estado.players.filter((p) => p.id !== alvo).map((p) => [p.id, alvo]),
    );
    const r = resolverDia(estado, votos);
    expect(r.estado.players.find((p) => p.id === alvo)!.status).toBe('morto');
    expect(r.estado.players.find((p) => p.id === alvo)!.causaMorte).toBe('linchamento');
  });

  it('sem eventos, empate não condena ninguém', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo', 'cacador']);
    const votos = { [id('aldeao')]: id('lobo'), [id('lobo')]: id('aldeao') };
    const r = resolverDia(estado, votos);
    expect(r.estado.players.every((p) => p.status === 'vivo')).toBe(true);
    expect(r.estado.historicoVotos.at(-1)!.empate).toBe(true);
  });

  it('com eventos ligados, A Corda Escolhe desfaz o empate', () => {
    const { estado, id } = montar(
      ['aldeao', 'vidente', 'medico', 'lobo', 'cacador'],
      { ...base, frequenciaEventos: 'raro' },
    );
    const votos = { [id('aldeao')]: id('lobo'), [id('lobo')]: id('aldeao') };
    const r = resolverDia(estado, votos);
    expect(r.estado.players.filter((p) => p.status === 'morto')).toHaveLength(1);
  });

  it('quem perdeu o voto não é contado', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo', 'cacador']);
    const semVoto: GameState = {
      ...estado,
      players: estado.players.map((p) =>
        p.roleId === 'vidente' ? { ...p, semVoto: true } : p,
      ),
    };
    const { podem, impedidos } = elegiveisParaVotar(semVoto);
    expect(podem).not.toContain(id('vidente'));
    expect(impedidos.some((i) => i.id === id('vidente'))).toBe(true);
  });

  it('o Caçador linchado ainda atira — estertor vale para qualquer causa', () => {
    const { estado, id } = montar(['cacador', 'vidente', 'medico', 'lobo', 'aldeao']);
    const alvo = id('cacador');
    const votos = Object.fromEntries(
      estado.players.filter((p) => p.id !== alvo).map((p) => [p.id, alvo]),
    );
    const r = resolverDia(estado, votos);
    // Dois mortos: o Caçador e quem ele levou junto.
    expect(r.estado.players.filter((p) => p.status === 'morto').length).toBe(2);
  });

  it('linchar um inocente alimenta o contador do gatilho', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo', 'cacador']);
    const alvo = id('medico');
    const votos = Object.fromEntries(
      estado.players.filter((p) => p.id !== alvo).map((p) => [p.id, alvo]),
    );
    const r = resolverDia(estado, votos);
    expect(r.estado.contadores.inocentesLinchadosSeguidos).toBe(1);
    expect(r.estado.historicoVotos.at(-1)!.inocente).toBe(true);
  });

  it('o Bobo linchado vence e encerra a partida', () => {
    const { estado, id } = montar(['bobo', 'vidente', 'medico', 'lobo', 'cacador']);
    const alvo = id('bobo');
    const votos = Object.fromEntries(
      estado.players.filter((p) => p.id !== alvo).map((p) => [p.id, alvo]),
    );
    const r = resolverDia(estado, votos);
    expect(r.estado.fase).toBe('fim');
    expect(r.estado.vencedores).toEqual([alvo]);
  });
});

describe('apuração', () => {
  it('descarta voto de quem não é elegível', () => {
    const { contagem } = apurar({ a: 'x', b: 'x', c: 'y' }, ['a', 'c']);
    expect(contagem.get('x')).toBe(1);
    expect(contagem.get('y')).toBe(1);
  });

  it('devolve todos os empatados', () => {
    const { maisVotados } = apurar({ a: 'x', b: 'y' }, ['a', 'b']);
    expect([...maisVotados].sort()).toEqual(['x', 'y']);
  });
});
