import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import { criarPartida } from '../setup/create-game';
import { ORDEM_DAS_ETAPAS, resolverNoite } from './night-pipeline';

/** p1 Vidente · p2 Médico · p3 Padre · p4 Xerife · p5 Lobo · p6 Feiticeiro */
const deck: Deck = {
  id: 'teste',
  nome: 'teste',
  roleIds: ['vidente', 'medico', 'padre', 'xerife', 'lobo', 'feiticeiro'],
  modificadores: [],
};

const config = { ...DEFAULT_CONFIG, semente: 'fixa', frequenciaEventos: 'desligado' as const };

const jogadores = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio'].map((nome) => ({
  nome,
  cor: '#000',
}));

/** Monta uma partida em que os ids são previsíveis por role, não por sorteio. */
function partida() {
  const estado = criarPartida(deck, config, jogadores);
  const id = (roleId: string) => estado.players.find((p) => p.roleId === roleId)!.id;
  return { estado, id };
}

const acao = (a: Partial<NightAction> & Pick<NightAction, 'actorId' | 'etapa'>): NightAction => ({
  kind: 'nenhuma',
  alvos: [],
  falsa: false,
  ...a,
});

const noite = (acoes: NightAction[]): NightSubmission => ({ rodada: 1, acoes });

describe('pipeline noturno', () => {
  it('registra as 12 etapas, sempre na mesma ordem', () => {
    const { estado } = partida();
    const { log } = resolverNoite(estado, noite([]));
    const etapas = [...new Set(log.entradas.map((e) => e.etapa))];
    expect(etapas).toEqual([...ORDEM_DAS_ETAPAS]);
    expect(log.entradas.every((e) => e.motivo !== '')).toBe(true);
  });

  it('o ataque sem proteção mata', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] })]),
    );
    expect(r.estado.players.find((p) => p.roleId === 'vidente')!.status).toBe('morto');
  });

  it('a proteção do Médico segura o ataque', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('vidente')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.find((p) => p.roleId === 'vidente')!.status).toBe('vivo');
  });

  it('o Feiticeiro perfura a proteção do Médico', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('vidente')] }),
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          kind: 'perfurar',
          alvos: [id('vidente')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.find((p) => p.roleId === 'vidente')!.status).toBe('morto');
  });

  it('o Padre vence o Feiticeiro: cancela a noite inteira', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('padre'), etapa: 'protecao', kind: 'proteger' }),
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          kind: 'perfurar',
          alvos: [id('vidente')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.every((p) => p.status === 'vivo')).toBe(true);
    const mortes = r.log.entradas.find((e) => e.etapa === 'resolucao-mortes')!;
    expect(mortes.ignorada).toBe(true);
    expect(mortes.motivo).toMatch(/[Cc]ancelada pelo evento|Padre/);
  });

  it('o Xerife que prende o Médico anula a cura daquela noite', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('xerife'), etapa: 'bloqueio', kind: 'bloquear', alvos: [id('medico')] }),
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('vidente')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.find((p) => p.roleId === 'vidente')!.status).toBe('morto');
  });

  it('quem está preso pelo Xerife não morre', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('xerife'), etapa: 'bloqueio', kind: 'bloquear', alvos: [id('vidente')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.find((p) => p.roleId === 'vidente')!.status).toBe('vivo');
  });

  it('as marcas voláteis somem no amanhecer', () => {
    const { estado, id } = partida();
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('vidente')] }),
      ]),
    );
    expect(r.estado.players.every((p) => !p.flags.protegido)).toBe(true);
    expect(r.estado.fase).toBe('amanhecer');
  });

  it('a mesma semente reproduz a mesma atribuição de roles', () => {
    const a = criarPartida(deck, config, jogadores).players.map((p) => p.roleId);
    const b = criarPartida(deck, config, jogadores).players.map((p) => p.roleId);
    const outra = criarPartida(deck, { ...config, semente: 'outra' }, jogadores).players.map(
      (p) => p.roleId,
    );
    expect(a).toEqual(b);
    expect(a).not.toEqual(outra);
  });
});
