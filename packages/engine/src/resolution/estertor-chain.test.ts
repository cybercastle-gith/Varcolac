import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck } from '../types/config';
import { criarPartida } from '../setup/create-game';
import type { GameState } from '../types/game-state';
import { dispararEstertores } from './estertor-chain';

const config = { ...DEFAULT_CONFIG, semente: 'estertor', frequenciaEventos: 'desligado' as const };

function montar(roleIds: string[]): { estado: GameState; id: (r: string) => string } {
  const deck: Deck = { id: 't', nome: 't', roleIds };
  const jogadores = roleIds.map((_, i) => ({ nome: `J${i + 1}`, cor: '#000' }));
  const estado = criarPartida(deck, config, jogadores);
  return { estado, id: (r) => estado.players.find((p) => p.roleId === r)!.id };
}

/** Mata sem passar pela noite, para isolar a cadeia. */
const abater = (estado: GameState, alvo: string): GameState => ({
  ...estado,
  players: estado.players.map((p) =>
    p.id === alvo ? { ...p, status: 'morto' as const, mortoNaRodada: estado.rodada } : p,
  ),
});

describe('cadeia de estertores', () => {
  it('o Caçador leva alguém junto', () => {
    const { estado, id } = montar(['cacador', 'aldeao', 'lobo', 'medico', 'vidente']);
    const morto = abater(estado, id('cacador'));
    const r = dispararEstertores(morto, [id('cacador')], new Map([[id('cacador'), id('lobo')]]));
    expect(r.estado.players.find((p) => p.roleId === 'lobo')!.status).toBe('morto');
  });

  it('a cadeia é COMPLETA: o alvo do Caçador dispara o próprio estertor', () => {
    const { estado, id } = montar(['cacador', 'lobo-carnical', 'aldeao', 'lobo', 'medico']);
    const morto = abater(estado, id('cacador'));
    const declarados = new Map([
      [id('cacador'), id('lobo-carnical')],
      [id('lobo-carnical'), id('medico')],
    ]);
    const r = dispararEstertores(morto, [id('cacador')], declarados);

    // Caçador → Carniçal → Médico, tudo numa passada só.
    expect(r.estado.players.find((p) => p.roleId === 'lobo-carnical')!.status).toBe('morto');
    expect(r.estado.players.find((p) => p.roleId === 'medico')!.status).toBe('morto');
  });

  it('ninguém dispara o estertor duas vezes, mesmo se os alvos se apontarem', () => {
    const { estado, id } = montar(['cacador', 'lobo-carnical', 'aldeao', 'lobo', 'medico']);
    const morto = abater(estado, id('cacador'));
    // O Carniçal aponta de volta para o Caçador, que já morreu e já atirou.
    const declarados = new Map([
      [id('cacador'), id('lobo-carnical')],
      [id('lobo-carnical'), id('cacador')],
    ]);
    const r = dispararEstertores(morto, [id('cacador')], declarados);
    expect(r.registros.length).toBeLessThan(10); // terminou, não entrou em laço
  });

  it('a Anciã derruba os poderes da vila na noite seguinte', () => {
    const { estado, id } = montar(['ancia', 'aldeao', 'lobo', 'medico', 'vidente']);
    const morto = abater(estado, id('ancia'));
    const r = dispararEstertores(morto, [id('ancia')]);
    expect(
      r.estado.efeitos.some(
        (e) => e.kind === 'poderes-suspensos' && e.naRodada === estado.rodada + 1,
      ),
    ).toBe(true);
  });

});
