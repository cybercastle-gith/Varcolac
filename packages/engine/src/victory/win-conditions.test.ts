import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck } from '../types/config';
import { criarPartida } from '../setup/create-game';
import type { GameState } from '../types/game-state';
import { verificarVitoria } from './win-conditions';

const config = { ...DEFAULT_CONFIG, semente: 'vitoria', frequenciaEventos: 'desligado' as const };

function montar(roleIds: string[]) {
  const deck: Deck = { id: 't', nome: 't', roleIds };
  const jogadores = roleIds.map((_, i) => ({ nome: `J${i + 1}`, cor: '#000' }));
  const estado = criarPartida(deck, config, jogadores);
  return { estado, id: (r: string) => estado.players.find((p) => p.roleId === r)!.id };
}

/** Mata todo mundo cujo id não esteja na lista. */
const deixarVivos = (estado: GameState, ids: string[]): GameState => ({
  ...estado,
  players: estado.players.map((p) =>
    ids.includes(p.id) ? p : { ...p, status: 'morto' as const, mortoNaRodada: 1 },
  ),
});

describe('condições de vitória', () => {
  it('a vila vence quando não sobra ameaça', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo']);
    const r = verificarVitoria(
      deixarVivos(estado, [id('aldeao'), id('vidente'), id('medico')]),
    );
    expect(r.encerrada).toBe(true);
    expect(r.camadas[0]!.camada).toBe('vila');
  });

  it('os lobos vencem ao IGUALAR a vila, não só ao superar', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo']);
    const r = verificarVitoria(deixarVivos(estado, [id('aldeao'), id('lobo')]));
    expect(r.encerrada).toBe(true);
    expect(r.camadas[0]!.camada).toBe('lobos');
  });

  it('a partida continua enquanto a vila supera a matilha', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'medico', 'lobo']);
    const r = verificarVitoria(
      deixarVivos(estado, [id('aldeao'), id('vidente'), id('lobo')]),
    );
    expect(r.encerrada).toBe(false);
  });

  it('o Sobrevivente vence junto com quem vencer, se estiver vivo', () => {
    const { estado, id } = montar(['aldeao', 'sobrevivente', 'medico', 'lobo']);
    const r = verificarVitoria(
      deixarVivos(estado, [id('aldeao'), id('sobrevivente'), id('medico')]),
    );
    expect(r.camadas.some((c) => c.vencedores.includes(id('sobrevivente')))).toBe(true);
  });


  it('o Vingador vence se o alvo dele morreu, por qualquer causa', () => {
    const { estado, id } = montar(['aldeao', 'vingador', 'medico', 'lobo']);
    const alvo = estado.objetivosSecretos[id('vingador')]!;
    const vivosFinais = [id('vingador'), id('aldeao'), id('medico')].filter((x) => x !== alvo);
    const r = verificarVitoria(deixarVivos(estado, vivosFinais));
    expect(r.camadas.some((c) => c.vencedores.includes(id('vingador')))).toBe(true);
  });

  it('o Lobo Branco sozinho vence sem a matilha', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'lobo-branco', 'lobo']);
    const r = verificarVitoria(deixarVivos(estado, [id('aldeao'), id('lobo-branco')]));
    expect(r.camadas[0]!.camada).toBe('lobos');
    expect(r.camadas[0]!.motivo).toMatch(/sozinho/);
  });

  it('a Bruxa com poção da morte conta como lobo na paridade', () => {
    const { estado, id } = montar(['aldeao', 'vidente', 'bruxa', 'lobo']);
    const comPocaoDaMorte: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('bruxa')]: 'pocao-morte' },
    };
    const r = verificarVitoria(deixarVivos(comPocaoDaMorte, [id('aldeao'), id('bruxa')]));
    expect(r.encerrada).toBe(true);
    expect(r.camadas[0]!.camada).toBe('lobos');
  });
});
