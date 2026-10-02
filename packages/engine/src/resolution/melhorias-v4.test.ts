import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { resolverDia } from '../day/voting';
import { roteiroDaNoite } from '../turn/roteiro';
import { verificarVitoria, encerrarSeAcabou } from '../victory/win-conditions';
import { modo, noitesDaMaldicao } from '../data/modes/index';
import { criarRng } from '../utils/rng';

/** MELHORIAS V4 — a quarta leva de defeitos relatados em mesa. */

const jogadores = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gina'].map((nome) => ({
  nome,
  cor: '#000',
}));

const base: GameConfig = {
  ...DEFAULT_CONFIG,
  semente: 'fixa',
  frequenciaEventos: 'desligado' as const,
};

function mesa(roleIds: string[], extra: Partial<GameConfig> = {}) {
  const deck: Deck = { id: 't', nome: 't', roleIds };
  const estado = criarPartida(deck, { ...base, ...extra }, jogadores.slice(0, roleIds.length));
  const id = (roleId: string) => estado.players.find((p) => p.roleId === roleId)!.id;
  const quem = (e: GameState, pid: string) => e.players.find((p) => p.id === pid)!;
  return { estado, id, quem };
}

const acao = (a: Partial<NightAction> & Pick<NightAction, 'actorId' | 'etapa'>): NightAction => ({
  kind: 'nenhuma',
  alvos: [],
  falsa: false,
  ...a,
});

const noite = (acoes: NightAction[], rodada = 1): NightSubmission => ({ rodada, acoes });
const perg = (e: GameState, pid: string) =>
  roteiroDaNoite(e).find((x) => x.player.id === pid)!.pergunta;
const vozes = (e: GameState) => e.anuncios.map((a) => a.texto).join(' | ');

// ───────────────────────────────────────────────────────────────────────────

describe('noite 1 sem sangue vale para a matilha INTEIRA', () => {
  it('o Feiticeiro não mata atravessando na noite 1', () => {
    const { estado, id, quem } = mesa(['feiticeiro', 'medico', 'aldeao', 'vidente', 'xerife'], {
      semMorteNaPrimeiraNoite: true,
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          kind: 'perfurar',
          escolha: 'atravessar',
          alvos: [id('aldeao')],
        }),
      ]),
    );
    expect(quem(r.estado, id('aldeao')).status).toBe('vivo');
  });

  it('o Lobo Branco também não', () => {
    const { estado, id, quem } = mesa(['lobo-branco', 'medico', 'aldeao', 'vidente'], {
      semMorteNaPrimeiraNoite: true,
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo-branco'), etapa: 'ataque', alvos: [id('aldeao')] })]),
    );
    expect(quem(r.estado, id('aldeao')).status).toBe('vivo');
  });
});

describe('Uivador', () => {
  it('escolhe QUEM delatar, entre os lobos', () => {
    const { estado, id } = mesa(['uivador', 'lobo', 'aldeao', 'vidente', 'medico']);
    const p = perg(estado, id('uivador'));
    expect(p.tipo).toBe('opcao-e-alvo');
    const alvosDoUivo = p.alvosPorOpcao?.['uivar'] ?? [];
    expect(alvosDoUivo).toContain(id('lobo'));
    expect(alvosDoUivo).toContain(id('uivador'));
    expect(alvosDoUivo).not.toContain(id('aldeao'));
  });

  it('quem uivou NÃO participa da caçada da mesma noite', () => {
    const { estado, id, quem } = mesa(['uivador', 'lobo', 'aldeao', 'vidente', 'medico']);
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('uivador'),
          etapa: 'ataque',
          kind: 'atacar',
          escolha: 'uivar',
          alvos: [id('lobo')],
        }),
      ]),
    );
    // Ninguém morre: o uivo substituiu a caçada dele, e o outro lobo não agiu.
    expect(r.estado.players.filter((x) => x.status === 'morto')).toHaveLength(0);
    expect(vozes(r.estado)).toContain('Uivador');
  });
});

describe('Vingador', () => {
  it('a partida ACABA quando o alvo jurado morre', () => {
    const { estado, id } = mesa(['vingador', 'aldeao', 'vidente', 'lobo', 'medico']);
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('vingador'),
          etapa: 'estado-inicial',
          kind: 'marcar',
          alvos: [id('aldeao')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] }),
      ]),
    );
    const r = verificarVitoria(n1.estado);
    expect(r.encerrada, 'o alvo morreu e a partida continuou').toBe(true);
    expect(encerrarSeAcabou(n1.estado).vencedores).toContain(id('vingador'));
  });
});

describe('Anciã: poderes suspensos', () => {
  it('quem está sem poder é AVISADO, e não gasta o uso à toa', () => {
    const { estado, id } = mesa(['ancia', 'medico', 'aldeao', 'vidente', 'lobo']);
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('ancia')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('medico'));
    expect(p.aviso, 'o Médico não foi avisado de que perdeu o poder').toBeTruthy();
    expect(p.alvos).toHaveLength(0);
  });
});

describe('Bobo Desesperado', () => {
  it('vira Aldeão depois de duas votações sem voto, e é anunciado', () => {
    const { estado, id, quem } = mesa(['bobo', 'aldeao', 'vidente', 'lobo', 'medico'], {
      variantes: { bobo: 'bobo-desesperado' },
    });
    const boboId = id('bobo');
    const outro = id('aldeao');

    // Duas votações em que ninguém vota no Bobo.
    let atual = resolverDia(estado, { [outro]: id('vidente') }).estado;
    atual = { ...atual, rodada: 2 };
    atual = resolverDia(atual, { [outro]: id('vidente') }).estado;

    expect(quem(atual, boboId).marcas.virouAldeao, 'não virou Aldeão').toBe(true);
    expect(vozes(atual)).toContain('Aldeão');
  });
});

describe('Lobo Carniceiro Morto-Vivo', () => {
  it('a primeira morte não tira ele do jogo', () => {
    const { estado, id, quem } = mesa(['lobo-carnical', 'aldeao', 'vidente', 'medico'], {
      variantes: { 'lobo-carnical': 'morto-vivo' },
    });
    const carniceiro = id('lobo-carnical');
    const dia = resolverDia(estado, {
      [id('aldeao')]: carniceiro,
      [id('vidente')]: carniceiro,
      [id('medico')]: carniceiro,
    });
    // Ele continua contando: a vila NÃO ganhou com a primeira morte dele.
    expect(quem(dia.estado, carniceiro).marcas.mortoVivo).toBe(true);
    expect(verificarVitoria(dia.estado).encerrada, 'a vila ganhou cedo demais').toBe(false);
  });
});

describe('Testemunha da Cela', () => {
  it('prende na noite 1 e revela no dia 2', () => {
    const { estado, id } = mesa(['xerife', 'aldeao', 'vidente', 'lobo', 'medico'], {
      variantes: { xerife: 'testemunha-da-cela' },
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('xerife'), etapa: 'bloqueio', alvos: [id('lobo')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    // O anúncio sai no começo da noite 2, e o Amanhecer do dia 2 o mostra.
    expect(vozes(n2)).toContain('saiu da prisão');
    expect(n2.anuncios.some((a) => a.rodada === 2 && a.destaque)).toBe(true);
  });
});

describe('troca de carta devolve os usos', () => {
  it('Troca Forçada entre dois: quem recebe o Ladrão pode usá-lo', () => {
    const { estado, id, quem } = mesa(['ladrao', 'vidente', 'medico', 'lobo', 'xerife'], {
      variantes: { ladrao: 'troca-forcada' },
    });
    const ladraoId = id('ladrao');
    const a = id('vidente');
    const b = id('medico');
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: ladraoId, etapa: 'estado-inicial', kind: 'marcar', alvos: [a, b] })]),
    );
    // Trocaram entre si, e os usos acompanham a carta nova.
    expect(quem(r.estado, a).roleId).toBe('medico');
    expect(quem(r.estado, b).roleId).toBe('vidente');
    expect(quem(r.estado, a).usosRestantes).toBeGreaterThan(0);
    expect(quem(r.estado, b).usosRestantes).toBeGreaterThan(0);
  });

  it('o Ladrão que rouba vê a tela de carta trocada', () => {
    const { estado, id, quem } = mesa(['ladrao', 'vidente', 'medico', 'lobo']);
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('ladrao'),
          etapa: 'estado-inicial',
          kind: 'marcar',
          alvos: [id('vidente')],
        }),
      ]),
    );
    expect(quem(r.estado, id('ladrao')).marcas.viraCarta?.paraRoleId).toBe('vidente');
  });
});

describe('Vila Amaldiçoada', () => {
  it('tem prazo declarado, e o prazo VENCE', () => {
    const { estado, id } = mesa(['lobo', 'aldeao', 'vidente', 'medico', 'xerife', 'padre'], {
      modo: 'vila-amaldicoada',
    });
    void id;
    const ganchos = modo('vila-amaldicoada');
    const rng = criarRng('maldicao');
    let atual = ganchos.aoCriarPartida!(estado, rng);

    // O prazo existe, é dito em voz alta, e escala com a mesa.
    expect(atual.prazoDaMaldicao).toBe(noitesDaMaldicao(6));
    expect(vozes(atual)).toContain('prazo');

    /*
     * O defeito: o prazo morava na fila de `efeitos`, que é varrida quando a
     * rodada passa dele — `derrotaDaVila` nunca via nada e o modo não
     * terminava nunca.
     */
    expect(ganchos.derrotaDaVila!(atual)).toBe(false);
    atual = { ...atual, rodada: atual.prazoDaMaldicao! };
    expect(ganchos.derrotaDaVila!(atual), 'venceu antes da hora').toBe(false);
    atual = { ...atual, rodada: atual.prazoDaMaldicao! + 1 };
    expect(ganchos.derrotaDaVila!(atual), 'o prazo não venceu nunca').toBe(true);
  });

  it('a contagem regressiva é dita toda manhã', () => {
    const { estado } = mesa(['lobo', 'aldeao', 'vidente', 'medico', 'xerife', 'padre'], {
      modo: 'vila-amaldicoada',
    });
    const ganchos = modo('vila-amaldicoada');
    const rng = criarRng('maldicao');
    const comPrazo = ganchos.aoCriarPartida!(estado, rng);
    const manha = ganchos.aoAmanhecer!({ ...comPrazo, rodada: 1 }, rng);
    expect(vozes(manha)).toMatch(/Faltam \d+ noites|Falta 1 noite/);
  });
});

describe('Uivador depois de uivar', () => {
  it('volta a caçar com a matilha nas noites seguintes', () => {
    const { estado, id, quem } = mesa(['uivador', 'lobo', 'aldeao', 'vidente', 'medico']);
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('uivador'),
          etapa: 'ataque',
          kind: 'atacar',
          escolha: 'uivar',
          alvos: [id('lobo')],
        }),
      ]),
    );
    expect(quem(n1.estado, id('uivador')).usosRestantes).toBe(0);

    /*
     * O defeito: sem estar em `escolheEntreDuas`, o uso esgotado devolvia
     * "Já foi" PARA SEMPRE — um lobo que entregou um companheiro e, como
     * castigo, nunca mais mordeu.
     */
    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('uivador'));
    expect(p.falsa, 'recebeu toque falso depois de uivar').toBe(false);
    expect(p.aviso, 'foi barrado por falta de uso').toBeUndefined();
    expect(p.opcoes?.map((o) => o.valor)).toEqual(['matar']);

    const n3 = resolverNoite(
      n2,
      noite(
        [
          acao({
            actorId: id('uivador'),
            etapa: 'ataque',
            kind: 'atacar',
            escolha: 'matar',
            alvos: [id('aldeao')],
          }),
        ],
        2,
      ),
    );
    expect(quem(n3.estado, id('aldeao')).status).toBe('morto');
  });
});

describe('Incorporação', () => {
  it('NÃO ressuscita: só toma o poder', () => {
    const { estado, id, quem } = mesa(['necromante', 'vidente', 'aldeao', 'lobo', 'medico'], {
      variantes: { necromante: 'incorporacao' },
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vidente')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [acao({ actorId: id('necromante'), etapa: 'ressurreicao', alvos: [id('vidente')] })],
        2,
      ),
    );
    // Decisão do usuário em 2026-09-28: incorporar é absorver, não ressuscitar.
    expect(quem(n2.estado, id('vidente')).status).toBe('morto');
    const necro = quem(n2.estado, id('necromante'));
    expect(necro.roleId).toBe('vidente');
    expect(necro.marcas.viraCarta?.paraRoleId).toBe('vidente');

    const n3 = prepararNoite(n2.estado);
    const p = perg(n3, id('necromante'));
    expect(p.falsa).toBe(false);
    expect(p.etapa).toBe('informacao');
  });
});
