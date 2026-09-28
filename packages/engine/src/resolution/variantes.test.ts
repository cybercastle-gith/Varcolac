import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { criarPartida } from '../setup/create-game';
import { MISSOES_POR_ID, prazoEmRodadas } from '../data/missions';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { elegiveisParaVotar, resolverDia } from '../day/voting';
import { roteiroDaNoite } from '../turn/roteiro';
import { verificarVitoria } from '../victory/win-conditions';

/**
 * As mecânicas das variantes, uma por uma.
 *
 * O arquivo é grande de propósito. Em 2026-09-25 o catálogo ganhou 51 variantes
 * de uma vez e nenhuma delas tinha comportamento; o que impediu de perceber foi
 * justamente não haver nenhum teste que perguntasse "e isso acontece?". Cada
 * caso aqui faz essa pergunta para uma variante, com a partida inteira rodando.
 */

const jogadores = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gina'].map((nome) => ({
  nome,
  cor: '#000',
}));

const base: GameConfig = {
  ...DEFAULT_CONFIG,
  semente: 'fixa',
  frequenciaEventos: 'desligado' as const,
};

/** Monta uma partida com roles e variantes escolhidas à mão. */
function mesa(roleIds: string[], variantes: Record<string, string> = {}) {
  const deck: Deck = { id: 'teste', nome: 'teste', roleIds };
  const estado = criarPartida(deck, { ...base, variantes }, jogadores.slice(0, roleIds.length));
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

const vozes = (e: GameState) => e.anuncios.map((a) => a.texto).join(' | ');

// ───────────────────────────────────────────────────────────────────────────

describe('Alfa: a conversão, que não existia', () => {
  it('converter muda o lado do alvo e conta para a paridade', () => {
    const { estado, id } = mesa(['alfa', 'medico', 'aldeao', 'vidente']);
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('alfa'),
          etapa: 'ataque',
          kind: 'atacar',
          escolha: 'converter',
          alvos: [id('medico')],
        }),
      ]),
    );

    expect(r.estado.objetivosSecretos[id('medico')]).toBe('convertido');
    // Ninguém morreu: a conversão SUBSTITUI a caçada da noite.
    expect(r.estado.players.every((p) => p.status === 'vivo')).toBe(true);
    // 2 × 2 não encerra (lobos precisam SUPERAR), mas o convertido já conta.
    expect(r.estado.players.filter((p) => p.status === 'vivo')).toHaveLength(4);
  });

  it('o convertido passa a enxergar a matilha', () => {
    const { estado, id } = mesa(['alfa', 'medico', 'aldeao', 'vidente']);
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('alfa'),
          etapa: 'ataque',
          escolha: 'converter',
          alvos: [id('medico')],
        }),
      ]),
    );
    const depois = prepararNoite(r.estado);
    const passagem = roteiroDaNoite(depois).find((x) => x.player.id === id('medico'))!;
    expect(passagem.companheiros).toContain(id('alfa'));
  });

  it('Treinamento: o convertido não participa do ataque enquanto o Alfa vive', () => {
    const { estado, id, quem } = mesa(['alfa', 'medico', 'aldeao', 'vidente', 'lobo'], {
      alfa: 'treinamento',
    });
    // O id é capturado ANTES: depois da conversão ele não é mais 'medico'.
    const filhoteId = id('medico');
    const n1 = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('alfa'), etapa: 'ataque', escolha: 'converter', alvos: [filhoteId] }),
      ]),
    );
    const filhote = n1.estado.players.find((p) => p.id === filhoteId)!;
    expect(filhote.roleId).toBe('lobo');
    expect(filhote.marcas.tuteladoPor).toBe(id('alfa'));

    // Na noite 2 o voto dele na matilha não conta.
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [acao({ actorId: filhoteId, etapa: 'ataque', kind: 'atacar', alvos: [id('aldeao')] })],
        2,
      ),
    );
    expect(quem(n2.estado, 'aldeao').status).toBe('vivo');
  });

  it('Sangue Marcado: a morte do convertido revela o Alfa', () => {
    const { estado, id } = mesa(['alfa', 'medico', 'aldeao', 'vidente', 'lobo'], {
      alfa: 'sangue-marcado',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('alfa'), etapa: 'ataque', escolha: 'converter', alvos: [id('medico')] }),
      ]),
    );
    const dia = resolverDia(n1.estado, {
      [id('alfa')]: id('medico'),
      [id('aldeao')]: id('medico'),
      [id('vidente')]: id('medico'),
    });
    expect(vozes(dia.estado)).toContain('A marca no corpo');
  });
});

describe('Bruxa: a poção da vida, que matava', () => {
  it('a poção da vida PROTEGE em vez de matar', () => {
    const { estado, id, quem } = mesa(['bruxa', 'medico', 'aldeao', 'lobo']);
    // A poção é sorteada no setup; aqui o teste fixa a da vida à mão para não
    // depender do sorteio — um teste que falha por azar ensina a ignorar o log.
    const comVida: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('bruxa')]: 'pocao-vida' },
    };
    const r = resolverNoite(
      comVida,
      noite([
        acao({ actorId: id('bruxa'), etapa: 'ataque', kind: 'atacar', alvos: [id('aldeao')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', kind: 'atacar', alvos: [id('aldeao')] }),
      ]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('vivo');
  });

  it('Poção Ressonante: a morte anuncia que existe uma Bruxa, sem dizer quem', () => {
    const { estado, id } = mesa(['bruxa', 'medico', 'aldeao', 'lobo'], {
      bruxa: 'pocao-ressonante',
    });
    const comMorte: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('bruxa')]: 'pocao-morte' },
    };
    const r = resolverNoite(
      comMorte,
      noite([acao({ actorId: id('bruxa'), etapa: 'ataque', alvos: [id('aldeao')] })]),
    );
    const dito = vozes(r.estado);
    expect(dito).toContain('Existe uma Bruxa');
    expect(dito).not.toContain('Ana');
  });
});

describe('Guarda-costas Escudo: a morte adiada que nunca chegava', () => {
  it('ele absorve o ataque e morre na noite seguinte', () => {
    const { estado, id, quem } = mesa(['guarda-costas', 'aldeao', 'vidente', 'lobo'], {
      'guarda-costas': 'escudo',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('guarda-costas'), etapa: 'protecao', alvos: [id('aldeao')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] }),
      ]),
    );
    expect(quem(n1.estado, 'aldeao').status).toBe('vivo');
    expect(quem(n1.estado, 'guarda-costas').status).toBe('vivo');

    // `expira` era agendado e nunca consumido: o Escudo era imortal.
    const n2 = prepararNoite(n1.estado);
    expect(quem(n2, 'guarda-costas').status).toBe('morto');
  });

  it('Muralha: cobre dois e cai quando qualquer um dos dois é atacado', () => {
    const { estado, id, quem } = mesa(['guarda-costas', 'aldeao', 'vidente', 'lobo'], {
      'guarda-costas': 'muralha',
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('guarda-costas'),
          etapa: 'protecao',
          alvos: [id('aldeao'), id('vidente')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vidente')] }),
      ]),
    );
    expect(quem(r.estado, 'vidente').status).toBe('vivo');
    expect(quem(r.estado, 'guarda-costas').status).toBe('morto');
  });
});

describe('Xerife', () => {
  it('o preso do Xerife COMUM continua falando e votando', () => {
    const { estado, id, quem } = mesa(['xerife', 'aldeao', 'vidente', 'lobo']);
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('xerife'), etapa: 'bloqueio', alvos: [id('aldeao')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    // Regra do usuário (2026-09-26): o Xerife normal NÃO cala o preso. A carta
    // dizia o contrário e foi corrigida junto.
    expect(quem(n2, 'aldeao').flags.preso).toBe(true);
    expect(quem(n2, 'aldeao').silenciado).toBe(false);
    expect(elegiveisParaVotar(n2).podem).toContain(id('aldeao'));
  });

  it('Boca Calada: aí sim o preso não fala nem vota', () => {
    const { estado, id, quem } = mesa(['xerife', 'aldeao', 'vidente', 'lobo'], {
      xerife: 'boca-calada',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('xerife'), etapa: 'bloqueio', alvos: [id('aldeao')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    expect(quem(n2, 'aldeao').silenciado).toBe(true);
    expect(elegiveisParaVotar(n2).podem).not.toContain(id('aldeao'));
  });

  it('Testemunha da Cela: anuncia a facção do preso no segundo dia', () => {
    const { estado, id } = mesa(['xerife', 'aldeao', 'vidente', 'lobo'], {
      xerife: 'testemunha-da-cela',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('xerife'), etapa: 'bloqueio', alvos: [id('lobo')] })]),
    );
    const n2 = resolverNoite(prepararNoite(n1.estado), noite([], 2));
    const n3 = prepararNoite(n2.estado);
    expect(vozes(n3)).toContain('A cela se abriu');
    // O texto passou a gritar o lado, como a revista do Delegado.
    expect(vozes(n3)).toContain('é LOBO');
  });

  it('Xerife de Si Mesmo pode aparecer na própria lista de alvos', () => {
    const { estado, id } = mesa(['xerife', 'aldeao', 'vidente', 'lobo'], {
      xerife: 'xerife-de-si-mesmo',
    });
    const passagem = roteiroDaNoite(estado).find((p) => p.player.id === id('xerife'))!;
    expect(passagem.pergunta.alvos).toContain(id('xerife'));
  });
});

describe('Taverneiro', () => {
  it('Última Dose: quem já bebeu some da lista de alvos', () => {
    const { estado, id } = mesa(['taverneiro', 'aldeao', 'vidente', 'lobo'], {
      taverneiro: 'ultima-dose',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('taverneiro'), etapa: 'bloqueio', alvos: [id('aldeao')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    const passagem = roteiroDaNoite(n2).find((p) => p.player.id === id('taverneiro'))!;
    expect(passagem.pergunta.alvos).not.toContain(id('aldeao'));
  });

  it('Bebida Forte: o alvo perde o voto do dia seguinte', () => {
    const { estado, id, quem } = mesa(['taverneiro', 'aldeao', 'vidente', 'lobo'], {
      taverneiro: 'bebida-forte',
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('taverneiro'), etapa: 'bloqueio', alvos: [id('vidente')] })]),
    );
    expect(quem(r.estado, 'vidente').semVoto).toBe(true);
  });
});

describe('Anciã', () => {
  it('Luto da Vila derruba TAMBÉM os poderes da matilha', () => {
    const { estado, id, quem } = mesa(['ancia', 'aldeao', 'vidente', 'lobo', 'medico'], {
      ancia: 'luto-da-vila',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('ancia')] })]),
    );
    expect(quem(n1.estado, 'ancia').status).toBe('morto');

    // Na Anciã base a matilha continuaria matando; aqui ela também para.
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] })], 2),
    );
    expect(quem(n2.estado, 'aldeao').status).toBe('vivo');
  });

  it('Testamento: o herdeiro escapa da suspensão de poderes', () => {
    const { estado, id, quem } = mesa(['ancia', 'aldeao', 'vidente', 'lobo', 'medico'], {
      ancia: 'testamento',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('ancia'), etapa: 'estertores', alvos: [id('medico')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('ancia')] }),
      ]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [
          acao({ actorId: id('medico'), etapa: 'protecao', alvos: [id('aldeao')] }),
          acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] }),
        ],
        2,
      ),
    );
    // O Médico era o herdeiro: a cura dele funciona apesar do luto.
    expect(quem(n2.estado, 'aldeao').status).toBe('vivo');
  });
});

describe('Uivador', () => {
  it('Uivo de Manada anuncia o número e nenhum nome', () => {
    const { estado, id } = mesa(['uivador', 'lobo', 'aldeao', 'vidente'], {
      uivador: 'uivo-de-manada',
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('uivador'), etapa: 'ataque', escolha: 'uivar' })]),
    );
    const dito = vozes(r.estado);
    expect(dito).toContain('2 lobos ainda respiram');
    expect(dito).not.toContain('Ana');
  });

  it('Uivo de Troca tira o voto do Uivador para sempre', () => {
    const { estado, id, quem } = mesa(['uivador', 'lobo', 'aldeao', 'vidente'], {
      uivador: 'uivo-de-troca',
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('uivador'), etapa: 'ataque', escolha: 'uivar', alvos: [id('lobo')] }),
      ]),
    );
    expect(quem(r.estado, 'uivador').marcas.semVotoSempre).toBe(true);
  });
});

describe('Lobo', () => {
  it('Desgarrado: alvos repetidos fazem a matilha não matar ninguém', () => {
    const { estado, id, quem } = mesa(['lobo', 'alfa', 'aldeao', 'vidente', 'medico'], {
      lobo: 'desgarrado',
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] }),
        acao({ actorId: id('alfa'), etapa: 'ataque', escolha: 'matar', alvos: [id('aldeao')] }),
      ]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('vivo');
  });

  it('Rastro: o alvo é anunciado de manhã e só morre depois da votação', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico'], {
      lobo: 'rastro',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vidente')] })]),
    );
    expect(quem(n1.estado, 'vidente').status).toBe('vivo');
    expect(vozes(n1.estado)).toContain('sangue na porta');

    const dia = resolverDia(n1.estado, {});
    expect(quem(dia.estado, 'vidente').status).toBe('morto');
  });
});

describe('Sobrevivente', () => {
  it('Invisível: enquanto ninguém votar nele, o ataque não o encontra', () => {
    const { estado, id, quem } = mesa(['sobrevivente', 'aldeao', 'vidente', 'lobo'], {
      sobrevivente: 'sobrevivente-invisivel',
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('sobrevivente')] })]),
    );
    expect(quem(r.estado, 'sobrevivente').status).toBe('vivo');
  });

  it('Teimoso: a corda da vila não o mata', () => {
    const { estado, id, quem } = mesa(['sobrevivente', 'aldeao', 'vidente', 'lobo'], {
      sobrevivente: 'sobrevivente-teimoso',
    });
    const dia = resolverDia(estado, {
      [id('aldeao')]: id('sobrevivente'),
      [id('vidente')]: id('sobrevivente'),
      [id('lobo')]: id('sobrevivente'),
    });
    expect(quem(dia.estado, 'sobrevivente').status).toBe('vivo');
  });
});

describe('Bobo', () => {
  it('Acusado: votos mútuos se anulam', () => {
    const { estado, id, quem } = mesa(['bobo', 'aldeao', 'vidente', 'lobo'], {
      bobo: 'bobo-acusado',
    });
    const dia = resolverDia(estado, {
      [id('bobo')]: id('aldeao'),
      [id('aldeao')]: id('bobo'),
      [id('vidente')]: id('lobo'),
    });
    // Os dois votos mútuos caem; sobra o voto da Vidente no Lobo.
    expect(quem(dia.estado, 'lobo').status).toBe('morto');
    expect(quem(dia.estado, 'bobo').status).toBe('vivo');
  });

  it('Bobo da Forca vence sem ser linchado, se receber um voto na noite marcada', () => {
    const { estado, id } = mesa(['bobo', 'aldeao', 'vidente', 'lobo'], {
      bobo: 'bobo-da-forca',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('bobo'), etapa: 'informacao', escolha: 'sim' })]),
    );
    const dia = resolverDia(n1.estado, { [id('aldeao')]: id('bobo') });
    expect(dia.estado.vencedores).toEqual([id('bobo')]);
  });
});

describe('Vingador', () => {
  it('Vingança da Praça: a morte pela matilha NÃO conta', () => {
    const { estado, id } = mesa(['vingador', 'aldeao', 'vidente', 'lobo'], {
      vingador: 'vinganca-da-praca',
    });
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
    const r = verificarVitoria({ ...n1.estado, players: n1.estado.players });
    const doVingador = r.camadas.filter((c) => c.motivo.includes('Vingador'));
    expect(doVingador.every((c) => c.vencedores.length === 0)).toBe(true);
  });

  it('Laço de Sangue: o alvo morre junto com o Vingador', () => {
    const { estado, id, quem } = mesa(['vingador', 'aldeao', 'vidente', 'lobo', 'medico'], {
      vingador: 'laco-de-sangue',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('vingador'),
          etapa: 'estado-inicial',
          kind: 'marcar',
          alvos: [id('medico')],
        }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vingador')] }),
      ]),
    );
    expect(quem(n1.estado, 'vingador').status).toBe('morto');
    expect(quem(n1.estado, 'medico').status).toBe('morto');
  });
});

describe('Detetive Obsessivo', () => {
  it('trava o alvo na primeira noite e não oferece outro depois', () => {
    const { estado, id, quem } = mesa(['detetive', 'aldeao', 'vidente', 'lobo']);
    const comVariante: GameState = {
      ...estado,
      players: estado.players.map((p) =>
        p.roleId === 'detetive' ? { ...p, varianteId: 'obsessivo' } : p,
      ),
    };
    const n1 = resolverNoite(
      comVariante,
      noite([acao({ actorId: id('detetive'), etapa: 'informacao', alvos: [id('lobo')] })]),
    );
    expect(quem(n1.estado, 'detetive').marcas.alvoTravado).toBe(id('lobo'));

    const n2 = prepararNoite(n1.estado);
    const passagem = roteiroDaNoite(n2).find((p) => p.player.id === id('detetive'))!;
    expect(passagem.pergunta.alvos).toEqual([id('lobo')]);
  });
});

describe('Necromante', () => {
  it('Cova Aberta: quem volta VIRA Aldeão, e a carta antiga acaba ali', () => {
    /*
     * SUPERADO em 2026-09-27: antes isto afirmava `marcas.semPoder` e que a
     * carta continuava a mesma. O jogador voltava "sem poder" mas seguia sendo
     * a Vidente na tela final, no ícone e na revelação ao morrer. Agora a
     * carta vira Aldeão de verdade.
     */
    const { estado, id } = mesa(['necromante', 'medico', 'aldeao', 'lobo', 'vidente'], {
      necromante: 'cova-aberta',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('medico')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: id('necromante'), etapa: 'ressurreicao', alvos: [id('medico')] })], 2),
    );
    const voltou = n2.estado.players.find((p) => p.id === id('medico'))!;
    expect(voltou.status).toBe('vivo');
    expect(voltou.roleId).toBe('aldeao');

    /*
     * A prova de que a cura acabou é o ROTEIRO — é ele que decide o que cada
     * um pode fazer. Forjar uma ação de proteção direto na submissão testaria
     * outra coisa: o engine aceita qualquer ação declarada, porque confia em
     * quem a montou, e é o roteiro que nunca a oferece.
     */
    const n3 = prepararNoite(n2.estado);
    const passagem = roteiroDaNoite(n3).find((p) => p.player.id === id('medico'))!;
    expect(passagem.pergunta.falsa).toBe(true);
    expect(passagem.lembrete).toContain('Aldeão');
  });
});

describe('Feiticeiro', () => {
  it('Marca de Ferro impede proteção pelo resto da partida', () => {
    const { estado, id, quem } = mesa(['feiticeiro', 'medico', 'aldeao', 'lobo', 'vidente'], {
      feiticeiro: 'marca-de-ferro',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('feiticeiro'),
          etapa: 'perfuracao',
          escolha: 'perfurar',
          alvos: [id('aldeao')],
        }),
      ]),
    );
    expect(quem(n1.estado, 'aldeao').marcas.naoProtegivel).toBe(true);

    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [
          acao({ actorId: id('medico'), etapa: 'protecao', alvos: [id('aldeao')] }),
          acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] }),
        ],
        2,
      ),
    );
    expect(quem(n2.estado, 'aldeao').status).toBe('morto');
  });
});

describe('poder emprestado', () => {
  it('Herdeiro: o Aldeão VIRA a Vidente, carta e tudo', () => {
    /*
     * SUPERADO em 2026-09-27: antes isto afirmava `marcas.poderDe`, ou seja,
     * poder emprestado com a carta antiga na mão. O usuário pediu que ele
     * "vire o personagem" — a carta troca de verdade.
     */
    const { estado, id } = mesa(['aldeao', 'vidente', 'medico', 'lobo', 'xerife'], {
      aldeao: 'herdeiro',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('vidente')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: id('aldeao'), etapa: 'informacao', alvos: [id('vidente')] })], 2),
    );
    const herdeiro = n2.estado.players.find((p) => p.id === id('aldeao'))!;
    expect(herdeiro.roleId).toBe('vidente');

    // Na noite 3 ele recebe a pergunta da Vidente, e não o toque falso.
    const n3 = prepararNoite(n2.estado);
    const passagem = roteiroDaNoite(n3).find((p) => p.player.id === id('aldeao'))!;
    expect(passagem.pergunta.falsa).toBe(false);
    expect(passagem.pergunta.etapa).toBe('informacao');
    expect(passagem.pergunta.titulo).toContain('enxergar');
  });

  it('Sombra de Alguém: o empréstimo tem prazo e vence', () => {
    const { estado, id, quem } = mesa(['lobo-sombra', 'medico', 'aldeao', 'vidente', 'lobo'], {
      'lobo-sombra': 'sombra-de-alguem',
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('lobo-sombra'),
          etapa: 'protecao',
          escolha: 'esconder',
          alvos: [id('medico')],
        }),
      ]),
    );
    expect(quem(n1.estado, 'lobo-sombra').marcas.poderDe).toBe('medico');

    // Noite 2: age como Médico.
    const n2 = prepararNoite(n1.estado);
    const comoMedico = roteiroDaNoite(n2).find((p) => p.player.id === id('lobo-sombra'))!;
    expect(comoMedico.pergunta.etapa).toBe('protecao');

    // Noite 3: o prazo venceu e ele volta a ser o que era.
    const n3 = prepararNoite(resolverNoite(n2, noite([], 2)).estado);
    const voltou = roteiroDaNoite(n3).find((p) => p.player.id === id('lobo-sombra'))!;
    expect(voltou.pergunta.titulo).not.toContain('protege');
  });
});

describe('as regras que o usuário definiu em 2026-09-26', () => {
  it('Padre Exorcista: acertar o lobo mata o lobo', () => {
    const { estado, id, quem } = mesa(['padre', 'aldeao', 'vidente', 'lobo', 'medico'], {
      padre: 'exorcista',
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('padre'), etapa: 'ataque', alvos: [id('lobo')] })]),
    );
    expect(quem(r.estado, 'lobo').status).toBe('morto');
    expect(quem(r.estado, 'lobo').causaMorte).toBe('exorcismo');
    expect(quem(r.estado, 'padre').marcas.virouAldeao).toBeUndefined();
  });

  it('Padre Exorcista: errar o transforma em Aldeão comum, sem poder', () => {
    const { estado, id, quem } = mesa(['padre', 'aldeao', 'vidente', 'lobo', 'medico'], {
      padre: 'exorcista',
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('padre'), etapa: 'ataque', alvos: [id('aldeao')] })]),
    );
    expect(quem(n1.estado, 'aldeao').status).toBe('vivo');
    expect(quem(n1.estado, 'padre').marcas.virouAldeao).toBe(true);

    // Virou Aldeão de verdade: na noite seguinte a passagem dele é toque falso.
    const n2 = prepararNoite(n1.estado);
    const passagem = roteiroDaNoite(n2).find((p) => p.player.id === id('padre'))!;
    expect(passagem.pergunta.falsa).toBe(true);
  });

  it('Ladrão Troca com Mortos: sem morto na mesa ele recebe o MOTIVO', () => {
    /*
     * SUPERADO em 2026-09-28: antes isto exigia toque falso. Toque falso é
     * mentira por necessidade, e aqui não há necessidade nenhuma — quem tem a
     * carta sabe que tem, e ficar sem tela nenhuma parecia defeito do app. A
     * varredura `cada-carta-age` foi quem cobrou isso.
     */
    const { estado, id } = mesa(['ladrao', 'aldeao', 'vidente', 'lobo', 'medico'], {
      ladrao: 'troca-com-mortos',
    });
    const passagem = roteiroDaNoite(estado).find((p) => p.player.id === id('ladrao'));
    if (passagem && passagem.player.roleId === 'ladrao') {
      expect(passagem.pergunta.aviso).toContain('alguém já caiu');
      expect(passagem.pergunta.alvos).toHaveLength(0);
    }
  });

  it('Ladrão Troca com Mortos: com um morto, ele veste a CARTA inteira', () => {
    const { estado, id, quem } = mesa(['ladrao', 'aldeao', 'vidente', 'lobo', 'medico'], {
      ladrao: 'troca-com-mortos',
    });
    // A atribuição pode ter movido a carta de Ladrão; localiza quem está com ela.
    const ladrao = estado.players.find((p) => p.roleId === 'ladrao');
    if (!ladrao) return;

    const vitima = estado.players.find(
      (p) => p.id !== ladrao.id && p.roleId !== 'lobo' && p.roleId !== 'ladrao',
    )!;
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [vitima.id] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: ladrao.id, etapa: 'informacao', alvos: [vitima.id] })], 2),
    );
    const depois = n2.estado.players.find((p) => p.id === ladrao.id)!;
    expect(depois.roleId).toBe(vitima.roleId);
    void quem;
  });

  it('o prazo da Missão Sem Volta varia com a missão e com o tamanho da mesa', () => {
    const curta = MISSOES_POR_ID.get('acusar-lobo')!;
    const media = MISSOES_POR_ID.get('ser-acusado')!;
    const sem = MISSOES_POR_ID.get('sobreviver')!;

    // Mesa maior, prazo maior: era uma constante 3 para tudo.
    expect(prazoEmRodadas(curta, 6)).toBeLessThan(prazoEmRodadas(curta, 12));
    // Missão mais difícil, prazo maior, na mesma mesa.
    expect(prazoEmRodadas(curta, 10)).toBeLessThan(prazoEmRodadas(media, 10));
    // "Esteja vivo no fim" não tem prazo a vencer.
    expect(prazoEmRodadas(sem, 10)).toBe(Infinity);
  });

  it('Missão Sem Volta: vencido o prazo, o Coringa vira Aldeão e não disputa', () => {
    const { estado, id, quem } = mesa(['coringa', 'aldeao', 'vidente', 'lobo', 'medico'], {
      coringa: 'missao-sem-volta',
    });
    // Missão curta e mesa pequena: o prazo é o mais apertado que existe.
    let atual: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('coringa')]: 'acusar-lobo' },
    };
    for (let i = 0; i < 4; i += 1) atual = prepararNoite(atual);
    expect(quem(atual, 'coringa').marcas.virouAldeao).toBe(true);

    const r = verificarVitoria({ ...atual, players: atual.players.map((p) => p) });
    const doCoringa = r.camadas.filter((c) => c.motivo.includes('virou Aldeão'));
    expect(doCoringa.every((c) => c.vencedores.length === 0)).toBe(true);
  });
});
