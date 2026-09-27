import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { resolverDia } from '../day/voting';
import { roteiroDaNoite } from '../turn/roteiro';
import { verificarVitoria } from '../victory/win-conditions';
import { EVENTOS_POR_ID } from '../data/events/index';

/**
 * As correções pedidas em 2026-09-26 (lista "MELHORIAS V2").
 *
 * Vive em arquivo próprio porque cada caso aqui é a prova de um defeito
 * RELATADO em mesa, e não uma regra nova: agrupados, eles dizem o que quebrou
 * de verdade quando alguém jogou. Se um destes voltar a falhar, alguém desfez
 * um conserto e não uma decisão de projeto.
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

describe('Lua Cheia', () => {
  it('a matilha nomeia DOIS quando a cota é dois', () => {
    const { estado, id } = mesa(['lobo', 'aldeao', 'vidente', 'medico', 'xerife']);
    // O evento vigora quando `eventoDaNoite` está posto; posto à mão para não
    // depender do sorteio — teste que falha por azar ensina a ignorar o log.
    const comLua: GameState = { ...estado, eventoDaNoite: 'lua-cheia' };
    expect(EVENTOS_POR_ID.get('lua-cheia')).toBeDefined();
    expect(perg(comLua, id('lobo')).tipo).toBe('dois-alvos');
  });

  it('e os dois morrem', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico', 'xerife']);
    const comLua: GameState = { ...estado, eventoDaNoite: 'lua-cheia' };
    const r = resolverNoite(
      comLua,
      noite([
        acao({
          actorId: id('lobo'),
          etapa: 'ataque',
          kind: 'atacar',
          alvos: [id('aldeao'), id('vidente')],
        }),
      ]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('morto');
    expect(quem(r.estado, 'vidente').status).toBe('morto');
  });
});

describe('noite 1 sem sangue', () => {
  it('a matilha não mata na noite 1 quando a mesa liga a opção', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico'], {
      semMorteNaPrimeiraNoite: true,
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] })]),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('vivo');
  });

  it('e volta a matar na noite 2', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico'], {
      semMorteNaPrimeiraNoite: true,
    });
    const n1 = resolverNoite(estado, noite([]));
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('aldeao')] })], 2),
    );
    expect(quem(n2.estado, 'aldeao').status).toBe('morto');
  });
});

describe('paridade da vitória', () => {
  it('solitários puros contam contra a matilha', () => {
    const { estado, id } = mesa(['lobo', 'lobo', 'bobo', 'sobrevivente']);
    void id;
    /*
     * 2 lobos × 2 não-lobos. Antes a conta era "lobos > vila", e Bobo e
     * Sobrevivente não eram vila — a matilha vencia 2 × 0 com quatro pessoas
     * vivas na mesa.
     */
    const r = verificarVitoria(estado);
    expect(r.encerrada).toBe(false);
  });

  it('a matilha vence quando supera os não-lobos', () => {
    const { estado } = mesa(['lobo', 'lobo', 'bobo']);
    const r = verificarVitoria(estado);
    expect(r.encerrada).toBe(true);
    expect(r.camadas.some((c) => c.camada === 'lobos')).toBe(true);
  });
});

describe('modo Traição', () => {
  it('não acaba na noite 1 só porque a mesa começou sem lobo', () => {
    const { estado } = mesa(['aldeao', 'vidente', 'medico', 'xerife', 'sobrevivente'], {
      modo: 'traicao',
    });
    const semLobos = estado.players.every((p) => p.roleId !== 'lobo');
    expect(semLobos).toBe(true);
    // O defeito relatado: a partida encerrava com "nenhuma ameaça restante".
    expect(verificarVitoria(estado).encerrada).toBe(false);

    const n1 = resolverNoite(estado, noite([]));
    expect(verificarVitoria(n1.estado).encerrada).toBe(false);
  });
});

describe('alvos que a tela pedia errado', () => {
  it('Detetive Obsessivo pede UM alvo', () => {
    const { estado, id } = mesa(['detetive', 'aldeao', 'vidente', 'lobo'], {
      variantes: { detetive: 'obsessivo' },
    });
    expect(perg(estado, id('detetive')).tipo).toBe('alvo');
  });

  it('Delegado pede UM alvo', () => {
    const { estado, id } = mesa(['detetive', 'aldeao', 'vidente', 'lobo'], {
      variantes: { detetive: 'delegado' },
    });
    expect(perg(estado, id('detetive')).tipo).toBe('alvo');
  });

  it('Vidente Confusa pede DOIS alvos e entrega as duas leituras', () => {
    const { estado, id } = mesa(['vidente', 'aldeao', 'medico', 'lobo'], {
      variantes: { vidente: 'confusa' },
    });
    expect(perg(estado, id('vidente')).tipo).toBe('dois-alvos');

    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('vidente'),
          etapa: 'informacao',
          kind: 'investigar',
          alvos: [id('lobo'), id('medico')],
        }),
      ]),
    );
    const dela = r.estado.informacoes.filter((i) => i.paraId === id('vidente'));
    expect(dela).toHaveLength(2);
    // Uma verdadeira e uma falsa, sempre: é a carta.
    expect(dela.filter((i) => i.verdadeira)).toHaveLength(1);
  });

  it('Médico de Guerra que cura UM não é revelado', () => {
    const { estado, id } = mesa(['medico', 'aldeao', 'vidente', 'lobo'], {
      variantes: { medico: 'de-guerra' },
    });
    const r = resolverNoite(
      estado,
      noite([acao({ actorId: id('medico'), etapa: 'protecao', alvos: [id('aldeao')] })]),
    );
    expect(r.estado.anuncios.some((a) => a.texto.includes('é o Médico'))).toBe(false);
  });

  it('Médico de Guerra que cura DOIS é revelado', () => {
    const { estado, id } = mesa(['medico', 'aldeao', 'vidente', 'lobo'], {
      variantes: { medico: 'de-guerra' },
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('medico'),
          etapa: 'protecao',
          alvos: [id('aldeao'), id('vidente')],
        }),
      ]),
    );
    expect(r.estado.anuncios.some((a) => a.texto.includes('é o Médico'))).toBe(true);
  });
});

describe('quem escolhia nada e agora escolhe', () => {
  it('o Ladrão aponta de quem rouba, e o segredo diz QUAL carta', () => {
    const { estado, id } = mesa(['ladrao', 'vidente', 'medico', 'lobo']);
    // Sem sorteio no setup: ele continua Ladrão até escolher.
    expect(estado.players.find((p) => p.id === id('ladrao'))!.roleId).toBe('ladrao');

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
    const ladrao = r.estado.players.find((p) => p.id === id('ladrao'))!;
    expect(ladrao.roleId).toBe('vidente');
    expect(r.estado.objetivosSecretos[ladrao.id]).toContain('Vidente');
  });

  it('Contaminação deixa escolher o alvo', () => {
    const { estado, id } = mesa(['ladrao', 'vidente', 'medico', 'lobo'], {
      variantes: { ladrao: 'contaminacao' },
    });
    const p = perg(estado, id('ladrao'));
    expect(p.falsa).toBe(false);
    expect(p.alvos.length).toBeGreaterThan(0);

    const r = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('ladrao'),
          etapa: 'estado-inicial',
          kind: 'marcar',
          alvos: [id('medico')],
        }),
      ]),
    );
    expect(r.estado.players.filter((x) => x.roleId === 'ladrao')).toHaveLength(2);
  });

  it('a Bruxa escolhe a poção, e ela não é mais sorteada no setup', () => {
    const { estado, id, quem } = mesa(['bruxa', 'aldeao', 'vidente', 'lobo']);
    expect(estado.objetivosSecretos[id('bruxa')]).toBeUndefined();

    const p = perg(estado, id('bruxa'));
    expect(p.tipo).toBe('opcao-e-alvo');
    expect(p.opcoes?.map((o) => o.valor)).toEqual(['pocao-vida', 'pocao-morte']);

    const r = resolverNoite(
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
    expect(quem(r.estado, 'aldeao').status).toBe('morto');
    expect(r.estado.objetivosSecretos[id('bruxa')]).toBe('pocao-morte');
  });

  it('o Caçador base declara o tiro em vida', () => {
    const { estado, id } = mesa(['cacador', 'aldeao', 'vidente', 'lobo']);
    const p = perg(estado, id('cacador'));
    expect(p.falsa).toBe(false);
    expect(p.etapa).toBe('estertores');
  });

  it('Caçador Armadilha não morre: quem cai é o nome armado', () => {
    const { estado, id, quem } = mesa(['cacador', 'aldeao', 'vidente', 'lobo', 'medico'], {
      variantes: { cacador: 'armadilha' },
    });
    const r = resolverNoite(
      estado,
      noite([
        acao({ actorId: id('cacador'), etapa: 'estertores', alvos: [id('medico')] }),
        acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('cacador')] }),
      ]),
    );
    expect(quem(r.estado, 'cacador').status).toBe('vivo');
    expect(quem(r.estado, 'medico').status).toBe('morto');
  });
});

describe('o Necromante que morreu na mesma noite', () => {
  it('ainda ressuscita quem ele escolheu', () => {
    const { estado, id, quem } = mesa(['necromante', 'medico', 'aldeao', 'lobo', 'vidente']);
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('medico')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite(
        [
          acao({ actorId: id('necromante'), etapa: 'ressurreicao', alvos: [id('medico')] }),
          acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('necromante')] }),
        ],
        2,
      ),
    );
    expect(quem(n2.estado, 'necromante').status).toBe('morto');
    // O defeito relatado: a morte dele na etapa 8 cancelava a etapa 10.
    expect(quem(n2.estado, 'medico').status).toBe('vivo');
  });
});

describe('Sino da Igreja', () => {
  it('cancela a votação do MESMO dia', () => {
    const { estado, id, quem } = mesa(['padre', 'aldeao', 'vidente', 'lobo'], {
      variantes: { padre: 'sino' },
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('padre'), etapa: 'protecao', kind: 'proteger' })]),
    );
    const dia = resolverDia(n1.estado, {
      [id('aldeao')]: id('lobo'),
      [id('vidente')]: id('lobo'),
      [id('padre')]: id('lobo'),
    });
    expect(quem(dia.estado, 'lobo').status).toBe('vivo');
    expect(dia.log.some((l) => l.mensagem.includes('Não há votação hoje'))).toBe(true);
  });
});

describe('avisos verdadeiros em vez de tela muda', () => {
  it('o embebedado sabe por que não age', () => {
    const { estado, id } = mesa(['taverneiro', 'vidente', 'aldeao', 'lobo']);
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('taverneiro'), etapa: 'bloqueio', alvos: [id('vidente')] })]),
    );
    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('vidente'));
    expect(p.aviso).toContain('embebedou');
    // E na noite 3 ele volta ao normal.
    const n3 = prepararNoite(resolverNoite(n2, noite([], 2)).estado);
    expect(perg(n3, id('vidente')).aviso).toBeUndefined();
  });

  it('o Detetive Cansado é avisado de que hoje não é a noite dele', () => {
    const { estado, id } = mesa(['detetive', 'vidente', 'aldeao', 'lobo'], {
      variantes: { detetive: 'cansado' },
    });
    const n2 = prepararNoite(resolverNoite(estado, noite([])).estado);
    const p = perg(n2, id('detetive'));
    expect(p.aviso).toContain('ímpares');
  });

  it('quem nunca age à noite recebe a carta de lembrete', () => {
    const { estado, id } = mesa(['bobo', 'vidente', 'aldeao', 'lobo']);
    const passagem = roteiroDaNoite(estado).find((x) => x.player.id === id('bobo'))!;
    expect(passagem.lembrete).toContain('Bobo');
    // Quem age não recebe: dizer a função a quem tem poder é vazamento.
    const daVidente = roteiroDaNoite(estado).find((x) => x.player.id === id('vidente'))!;
    expect(daVidente.lembrete).toBeNull();
  });
});

describe('o convertido do Alfa', () => {
  it('pode caçar com a matilha, mesmo com carta de vila', () => {
    const { estado, id, quem } = mesa(['alfa', 'medico', 'aldeao', 'vidente', 'xerife']);
    const n1 = resolverNoite(
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
    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('medico'));
    expect(p.opcoes?.some((o) => o.valor === 'matar')).toBe(true);

    const r = resolverNoite(
      n2,
      noite(
        [
          acao({
            actorId: id('medico'),
            etapa: 'ataque',
            kind: 'atacar',
            escolha: 'matar',
            alvos: [id('aldeao')],
          }),
        ],
        2,
      ),
    );
    expect(quem(r.estado, 'aldeao').status).toBe('morto');
  });
});

describe('Bobo ressuscitado pela Cova Aberta', () => {
  it('não ganha mais na corda', () => {
    const { estado, id, quem } = mesa(['necromante', 'bobo', 'aldeao', 'lobo', 'vidente'], {
      variantes: { necromante: 'cova-aberta' },
    });
    const n1 = resolverNoite(
      estado,
      noite([acao({ actorId: id('lobo'), etapa: 'ataque', alvos: [id('bobo')] })]),
    );
    const n2 = resolverNoite(
      prepararNoite(n1.estado),
      noite([acao({ actorId: id('necromante'), etapa: 'ressurreicao', alvos: [id('bobo')] })], 2),
    );
    expect(quem(n2.estado, 'bobo').status).toBe('vivo');
    expect(quem(n2.estado, 'bobo').marcas.semPoder).toBe(true);

    const dia = resolverDia(n2.estado, {
      [id('aldeao')]: id('bobo'),
      [id('vidente')]: id('bobo'),
      [id('lobo')]: id('bobo'),
      [id('necromante')]: id('bobo'),
    });
    // O defeito relatado: ele voltava sem poder e ganhava linchado do mesmo jeito.
    expect(dia.estado.vencedores).toBeNull();
  });

  it('e o Bobo normal, ao ganhar, é anunciado', () => {
    const { estado, id } = mesa(['bobo', 'aldeao', 'vidente', 'lobo']);
    const dia = resolverDia(estado, {
      [id('aldeao')]: id('bobo'),
      [id('vidente')]: id('bobo'),
      [id('lobo')]: id('bobo'),
    });
    expect(dia.estado.anuncios.some((a) => a.texto === 'O Bobo enganou a todos.')).toBe(true);
  });
});
