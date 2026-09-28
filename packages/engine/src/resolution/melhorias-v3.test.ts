import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { resolverDia } from '../day/voting';
import { roteiroDaNoite } from '../turn/roteiro';
import { respostaImediata } from '../turn/leitura';
import { verificarVitoria } from '../victory/win-conditions';

/**
 * MELHORIAS V3 — a terceira leva de defeitos relatados em mesa.
 *
 * Mesma regra dos arquivos V2: cada caso aqui é a prova de um defeito que
 * alguém viu jogando, e não uma regra nova. Se um voltar a falhar, alguém
 * desfez um conserto.
 */

const jogadores = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gina', 'Hugo'].map(
  (nome) => ({ nome, cor: '#000' }),
);

const base: GameConfig = {
  ...DEFAULT_CONFIG,
  semente: 'fixa',
  frequenciaEventos: 'desligado' as const,
};

function mesa(roleIds: string[], extra: Partial<GameConfig> = {}) {
  const deck: Deck = { id: 't', nome: 't', roleIds };
  const estado = criarPartida(deck, { ...base, ...extra }, jogadores.slice(0, roleIds.length));
  const id = (roleId: string) => estado.players.find((p) => p.roleId === roleId)!.id;
  const quem = (e: GameState, roleId: string) => e.players.find((p) => p.roleId === roleId)!;
  return { estado, id, quem };
}

const acao = (a: Partial<NightAction> & Pick<NightAction, 'actorId' | 'etapa'>): NightAction => ({
  kind: 'nenhuma',
  alvos: [],
  falsa: false,
  ...a,
});

const noite = (acoes: NightAction[], rodada = 1): NightSubmission => ({ rodada, acoes });
const perg = (e: GameState, playerId: string) =>
  roteiroDaNoite(e).find((x) => x.player.id === playerId)!.pergunta;

// ───────────────────────────────────────────────────────────────────────────

describe('Feiticeiro: atravessar a cura', () => {
  it('o alvo curado morre quando o Feiticeiro atravessa', () => {
    const { estado, id, quem } = mesa(['feiticeiro', 'medico', 'aldeao', 'vidente', 'xerife']);
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('aldeao')] }),
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          kind: 'perfurar',
          escolha: 'atravessar',
          alvos: [id('aldeao')],
        }),
      ]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('morto');
  });
});

describe('Feiticeiro com a matilha junto', () => {
  it('atravessar mata mesmo quando outro lobo mira outra pessoa', () => {
    const { estado, id, quem } = mesa([
      'feiticeiro',
      'lobo',
      'medico',
      'aldeao',
      'vidente',
      'xerife',
    ]);
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('medico'), etapa: 'protecao', kind: 'proteger', alvos: [id('aldeao')] }),
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          kind: 'perfurar',
          escolha: 'atravessar',
          alvos: [id('aldeao')],
        }),
        // O outro lobo mira outra pessoa: com a cota de 1, o alvo do
        // Feiticeiro ia a sorteio e metade das vezes não morria.
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('morto');
  });
});

describe('Lobo Rastro', () => {
  it('funciona mesmo quando outro lobo declarou o mesmo alvo antes', () => {
    const { estado, id, quem } = mesa(['lobo', 'alfa', 'aldeao', 'vidente', 'medico'], {
      variantes: { lobo: 'rastro' },
    });
    const n1 = resolverNoite(
      estado,
      noite([
        // O Alfa declara primeiro; o `atacanteId` gravado é o dele, e a
        // checagem de Rastro olhava só para esse primeiro nome.
        acao({
          actorId: id('alfa'),
          etapa: 'ataque',
          kind: 'atacar',
          escolha: 'matar',
          alvos: [id('vidente')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(quem(n1.estado, 'vidente').status).toBe('vivo');
    expect(quem(n1.estado, 'vidente').marcas.morreDepoisDaVotacao).toBe(1);
  });

  it('marca o alvo de manhã e o mata depois da votação', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico'], {
      variantes: { lobo: 'rastro' },
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(quem(n1.estado, 'vidente').status).toBe('vivo');
    expect(quem(n1.estado, 'vidente').marcas.morreDepoisDaVotacao).toBe(1);
    const dia = resolverDia(n1.estado, {});
    expect(quem(dia.estado, 'vidente').status).toBe('morto');
  });
});

describe('Vidente Confusa', () => {
  it('a resposta imediata concorda com o que a etapa 11 grava', () => {
    const { estado, id } = mesa(['vidente', 'lobo', 'medico', 'aldeao'], {
      variantes: { vidente: 'confusa' },
    });
    const alvos = [id('lobo'), id('medico')];

    const imediata = respostaImediata(estado, id('vidente'), alvos)!;
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('vidente'), etapa: 'informacao', kind: 'investigar', alvos })]),
    );
    const gravadas = r.estado.informacoes.filter((i) => i.paraId === id('vidente'));

    expect(gravadas).toHaveLength(2);
    expect(gravadas.filter((i) => i.verdadeira)).toHaveLength(1);

    /*
     * O defeito relatado: a tela mostrava as DUAS leituras verdadeiras, e na
     * noite seguinte chegava uma versão diferente com a mentira. As duas
     * precisam sair do mesmo lugar, senão a Confusa entrega por eliminação
     * exatamente o que ela existe para esconder.
     */
    expect([imediata.texto, imediata.segunda]).toEqual(gravadas.map((i) => i.texto));
  });
});

describe('noite 1 sem sangue', () => {
  it('a matilha nem é perguntada', () => {
    const { estado, id } = mesa(['lobo', 'aldeao', 'vidente', 'medico'], {
      semMorteNaPrimeiraNoite: true,
    });
    const p = perg(estado, id('lobo'));
    // O defeito relatado: ele escolhia alguém para matar e nada acontecia.
    expect(p.falsa === true || p.aviso !== undefined).toBe(true);
    expect(p.etapa === 'ataque' && p.tipo === 'alvo').toBe(false);
  });
});

describe('Bruxa', () => {
  it('a poção é de uso ÚNICO', () => {
    const { estado, id, quem } = mesa(['bruxa', 'aldeao', 'vidente', 'medico', 'lobo']);
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('bruxa'),
          etapa: 'ataque',
          kind: 'atacar',
          escolha: 'pocao-morte',
          alvos: [id('aldeao')],
        }),
      ]),
    );
    expect(quem(n1.estado, 'aldeao').status).toBe('morto');
    expect(quem(n1.estado, 'bruxa').usosRestantes).toBe(0);

    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('bruxa'));
    expect(p.falsa === true || p.aviso !== undefined).toBe(true);
  });

  it('ela pode escolher NÃO usar', () => {
    const { estado, id } = mesa(['bruxa', 'aldeao', 'vidente', 'medico', 'lobo']);
    expect(perg(estado, id('bruxa')).opcional).toBe(true);
  });

  it('só a Bruxa SEM variante e com poção de morte conta como lobo', () => {
    const { estado, id } = mesa(['bruxa', 'aldeao', 'vidente', 'lobo'], {
      variantes: { bruxa: 'pocao-ressonante' },
    });
    const comMorte: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('bruxa')]: 'pocao-morte' },
    };
    /*
     * Com a Bruxa contando como lobo, 2 × 2 já encerraria a partida. Ela tem
     * variante, então não conta — decisão do usuário em 2026-09-27.
     */
    expect(verificarVitoria(comMorte).encerrada).toBe(false);
  });
});

describe('Cova Aberta', () => {
  it('quem volta vira Aldeão de verdade', () => {
    const { estado, id, quem } = mesa(['necromante', 'vidente', 'aldeao', 'lobo', 'medico'], {
      variantes: { necromante: 'cova-aberta' },
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
    const voltou = n2.estado.players.find((p) => p.id === id('vidente'))!;
    expect(voltou.status).toBe('vivo');
    // O defeito relatado: ele voltava e continuava com a carta antiga.
    expect(voltou.roleId).toBe('aldeao');
    expect(voltou.varianteId).toBeUndefined();
  });
});

describe('Delegado', () => {
  it('revela a FACÇÃO, e tem um uso a cada 4 jogadores', () => {
    const { estado, id } = mesa(
      ['detetive', 'aldeao', 'vidente', 'lobo', 'medico', 'xerife', 'padre', 'cacador'],
      { variantes: { detetive: 'delegado' } },
    );
    // 8 jogadores → 2 usos.
    expect(estado.players.find((p) => p.id === id('detetive'))!.usosRestantes).toBe(2);

    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('detetive'),
          etapa: 'informacao',
          kind: 'comparar',
          alvos: [id('lobo')],
        }),
      ]),
    );
    const dito = r.estado.anuncios.map((a) => a.texto).join(' | ');
    // A revista grita o lado em maiúsculas: é o ponto dela.
    expect(dito).toContain('LOBO');
  });
});

describe('narração', () => {
  it('o anúncio da noite não reaparece na execução do dia', () => {
    const { estado, id } = mesa(['ancia', 'aldeao', 'vidente', 'lobo', 'medico']);
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('ancia')] })]),
    );
    const daNoite = n1.estado.anuncios.filter((a) => a.rodada === 1);
    expect(daNoite.length).toBeGreaterThan(0);
    /*
     * O defeito relatado: "a Anciã morreu na primeira noite e a mensagem dela
     * continua aparecendo". As telas filtravam só por rodada, e a Execução
     * mostrava de novo tudo que o Amanhecer já tinha dito.
     */
    expect(daNoite.every((a) => a.fase === 'noite')).toBe(true);
  });

  it('a Última Vela anuncia a volta E a segunda morte', () => {
    const { estado, id, quem } = mesa(['necromante', 'vidente', 'aldeao', 'lobo', 'medico'], {
      variantes: { necromante: 'ultima-vela' },
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
    expect(quem(n2.estado, 'vidente').status).toBe('vivo');
    expect(n2.estado.anuncios.some((a) => a.rodada === 2 && a.destaque)).toBe(true);

    const dia = resolverDia(n2.estado, {});
    expect(quem(dia.estado, 'vidente').status).toBe('morto');
    // A vela apagando é um acontecimento, e a mesa tem de ouvir.
    expect(dia.estado.anuncios.some((a) => a.rodada === 2 && a.texto.includes('vela'))).toBe(true);
  });

  it('quem muda de papel é anunciado', () => {
    const { estado, id } = mesa(['ancia', 'aldeao', 'vidente', 'lobo', 'medico'], {
      variantes: { ancia: 'heranca-amarga' },
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('ancia'), etapa: 'estertores', alvos: [id('medico')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('ancia')] }),
      ]),
    );
    const dito = r.estado.anuncios.map((a) => a.texto).join(' | ');
    // O defeito relatado: "não avisou quem foi transformado".
    expect(dito).toContain(estado.players.find((p) => p.id === id('medico'))!.nome);
  });
});

describe('Aldeão Herdeiro', () => {
  it('herda UMA vez, vira o personagem, e já age na mesma noite seguinte', () => {
    const { estado, id } = mesa(['aldeao', 'vidente', 'medico', 'lobo', 'xerife'], {
      variantes: { aldeao: 'herdeiro' },
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vidente')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [
          acao({
            actorId: id('aldeao'),
            etapa: 'informacao',
            kind: 'investigar',
            alvos: [id('vidente')],
          }),
        ],
        2,
      ),
    );
    const herdeiro = n2.estado.players.find((p) => p.id === id('aldeao'))!;
    // Virou o personagem: a carta muda, e não só a habilidade emprestada.
    expect(herdeiro.roleId).toBe('vidente');
    expect(herdeiro.usosRestantes).toBeGreaterThan(0);
  });
});

describe('uso único é uso único', () => {
  /*
   * Esta classe de defeito apareceu três vezes: a poção da Bruxa, a perfuração
   * do Feiticeiro e o esconderijo do Lobo Sombra. Todos tinham
   * `usoLimitado: por-partida` no catálogo e nenhuma etapa chamava `gastarUso`
   * — o poder acontecia todas as noites e o catálogo dizia que não.
   *
   * O teste roda a mesma carta DUAS noites e exige que a segunda falhe. É a
   * pergunta que a varredura manual respondia, agora automática.
   */
  const casos: { nome: string; deck: string[]; quem: string; acao: NightAction }[] = [
    {
      nome: 'Feiticeiro atravessando',
      deck: ['feiticeiro', 'medico', 'aldeao', 'vidente', 'xerife'],
      quem: 'feiticeiro',
      acao: acao({
        actorId: '',
        etapa: 'perfuracao',
        kind: 'perfurar',
        escolha: 'atravessar',
        alvos: [],
      }),
    },
    {
      nome: 'Bruxa',
      deck: ['bruxa', 'medico', 'aldeao', 'vidente', 'xerife'],
      quem: 'bruxa',
      acao: acao({
        actorId: '',
        etapa: 'ataque',
        kind: 'atacar',
        escolha: 'pocao-morte',
        alvos: [],
      }),
    },
  ];

  for (const c of casos) {
    it(`${c.nome}: a segunda noite não acontece`, () => {
      const { estado, id } = mesa(c.deck);
      const montar = (rodada: number, alvo: string) =>
        noite([{ ...c.acao, actorId: id(c.quem), alvos: [alvo] }], rodada);

      const n1 = resolverNoite(estado, montar(1, id('aldeao')));
      expect(n1.estado.players.find((p) => p.id === id('aldeao'))!.status).toBe('morto');
      expect(n1.estado.players.find((p) => p.id === id(c.quem))!.usosRestantes).toBe(0);

      const n2 = resolverNoite(prepararNoite(n1.estado), montar(2, id('vidente')));
      // A vítima da segunda noite continua viva: o poder acabou na primeira.
      expect(n2.estado.players.find((p) => p.id === id('vidente'))!.status).toBe('vivo');
    });
  }
});
