import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { roteiroDaNoite } from '../turn/roteiro';
import { resolverDia } from '../day/voting';
import { modo } from '../data/modes/index';
import { criarRng } from '../utils/rng';
import { nomeDaCarta } from '../types/role';
import { role } from '../data/roles/index';

/** MELHORIAS V5 — depois de uma mesa de verdade. */

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

// ───────────────────────────────────────────────────────────────────────────

describe('modo Traição', () => {
  it('converte alguém a cada amanhecer', () => {
    const { estado } = mesa(['aldeao', 'vidente', 'medico', 'xerife', 'padre', 'cacador'], {
      modo: 'traicao',
    });
    const ganchos = modo('traicao');
    const rng = criarRng('traicao');

    let atual = ganchos.aoCriarPartida ? ganchos.aoCriarPartida(estado, rng) : estado;
    const antes = Object.values(atual.objetivosSecretos).filter((o) => o === 'convertido').length;
    expect(antes).toBe(0);

    atual = ganchos.aoAmanhecer!(atual, rng);
    const depois = Object.values(atual.objetivosSecretos).filter((o) => o === 'convertido').length;
    expect(depois, 'nenhum amanhecer converteu ninguém').toBe(1);

    // E continua convertendo nas manhãs seguintes.
    atual = ganchos.aoAmanhecer!({ ...atual, rodada: 2 }, rng);
    expect(Object.values(atual.objetivosSecretos).filter((o) => o === 'convertido').length).toBe(2);
  });

  it('o convertido VIRA a carta de Lobo e recebe a tela de troca', () => {
    const { estado } = mesa(['aldeao', 'vidente', 'medico', 'xerife', 'padre', 'cacador'], {
      modo: 'traicao',
    });
    const ganchos = modo('traicao');
    const rng = criarRng('traicao');
    const inicio = ganchos.aoCriarPartida ? ganchos.aoCriarPartida(estado, rng) : estado;
    const depois = ganchos.aoAmanhecer!(inicio, rng);

    const [idConvertido] = Object.entries(depois.objetivosSecretos).find(
      ([, o]) => o === 'convertido',
    )!;
    const p = depois.players.find((x) => x.id === idConvertido)!;
    expect(p.roleId).toBe('lobo');
    expect(p.marcas.viraCarta?.paraRoleId).toBe('lobo');
  });
});

describe('Lobo Sombra: Sombra de Alguém', () => {
  it('a tela PEDE o alvo — sem ele a variante nunca acontece', () => {
    const { estado, id } = mesa(['lobo-sombra', 'medico', 'aldeao', 'vidente', 'lobo'], {
      variantes: { 'lobo-sombra': 'sombra-de-alguem' },
    });
    const p = perg(estado, id('lobo-sombra'));
    const esconder = p.opcoes?.find((o) => o.valor === 'esconder');
    expect(esconder, 'a opção sumiu').toBeTruthy();
    expect(esconder!.pedeAlvo, 'a opção não pede alvo, então o alvo chega vazio').toBe(true);
  });

  it('veste o papel escolhido na noite seguinte', () => {
    const { estado, id, quem } = mesa(['lobo-sombra', 'medico', 'aldeao', 'vidente', 'lobo'], {
      variantes: { 'lobo-sombra': 'sombra-de-alguem' },
    });
    const n1 = resolverNoite(
      estado,
      noite([
        acao({
          actorId: id('lobo-sombra'),
          etapa: 'protecao',
          kind: 'proteger',
          escolha: 'esconder',
          alvos: [id('medico')],
        }),
      ]),
    );
    expect(quem(n1.estado, id('lobo-sombra')).marcas.poderDe).toBe('medico');

    const n2 = prepararNoite(n1.estado);
    const p = perg(n2, id('lobo-sombra'));
    expect(p.falsa).toBe(false);
    expect(p.etapa).toBe('protecao');
  });

  it('Nome Roubado também precisa do alvo', () => {
    const { estado, id } = mesa(['lobo-sombra', 'medico', 'aldeao', 'vidente', 'lobo'], {
      variantes: { 'lobo-sombra': 'nome-roubado' },
    });
    const p = perg(estado, id('lobo-sombra'));
    expect(p.opcoes?.find((o) => o.valor === 'esconder')?.pedeAlvo).toBe(true);
  });

  it('o Lobo Sombra BASE continua sem pedir alvo', () => {
    const { estado, id } = mesa(['lobo-sombra', 'medico', 'aldeao', 'vidente', 'lobo']);
    const p = perg(estado, id('lobo-sombra'));
    expect(p.opcoes?.find((o) => o.valor === 'esconder')?.pedeAlvo).toBe(false);
  });
});

describe('nome da carta', () => {
  it('é sempre FUNÇÃO + VARIANTE', () => {
    /*
     * Relatado em mesa: ninguém sabe o que é "Boca Calada". A variante é um
     * ajuste sobre uma função, e o nome dela sozinho esconde a única coisa que
     * explica como ela funciona.
     */
    expect(nomeDaCarta(role('xerife'), 'boca-calada')).toBe('Xerife Boca Calada');
    expect(nomeDaCarta(role('bobo'), 'bobo-desesperado')).toBe('Bobo Desesperado');
    expect(nomeDaCarta(role('vidente'), 'ossos')).toBe('Vidente dos Ossos');
    // Sem variante, só a função.
    expect(nomeDaCarta(role('xerife'))).toBe('Xerife');
  });

  it('não repete a função quando o nome da variante já a contém', () => {
    // "Vidente dos Ossos" já diz Vidente; "Vidente Vidente dos Ossos" é ruído.
    expect(nomeDaCarta(role('sobrevivente'), 'sobrevivente-invisivel')).toBe(
      'Sobrevivente Invisível',
    );
    expect(nomeDaCarta(role('medico'), 'de-guerra')).toBe('Médico de Guerra');
  });
});

describe('eventos', () => {
  it('vêm DESLIGADOS por padrão', () => {
    // Decisão do usuário em 2026-10-02: ficam fora até serem revistos.
    expect(DEFAULT_CONFIG.frequenciaEventos).toBe('desligado');
  });
});

describe('o convertido do modo Traição', () => {
  it('um ALDEÃO convertido consegue caçar', () => {
    /*
     * O defeito real por trás de "a Traição não converte ninguém": a conversão
     * acontecia, mas o convertido nunca agia. `perguntarA` devolve toque falso
     * logo no começo para quem não tem etapa noturna — e Aldeão não tem. Como
     * a Traição converte sobretudo Aldeões, a matilha secreta existia no papel
     * e nunca mordia: ninguém morria, e a mesa concluía que nada acontecia.
     */
    const { estado, id } = mesa(['aldeao', 'vidente', 'medico', 'xerife', 'padre', 'cacador'], {
      modo: 'traicao',
    });
    const convertido: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('aldeao')]: 'convertido' },
    };
    const p = perg(convertido, id('aldeao'));
    expect(p.falsa, 'o Aldeão convertido recebeu toque falso').toBe(false);
    expect(p.etapa).toBe('ataque');
    expect(p.alvos.length).toBeGreaterThan(0);
  });

  it('e a mordida dele mata de verdade', () => {
    const { estado, id, quem } = mesa(['aldeao', 'vidente', 'medico', 'xerife'], {
      modo: 'traicao',
    });
    const convertido: GameState = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [id('aldeao')]: 'convertido' },
    };
    const r = resolverNoite(
      convertido,
      noite([
        acao({ actorId: id('aldeao'), etapa: 'ataque', kind: 'atacar', alvos: [id('vidente')] }),
      ]),
    );
    expect(quem(r.estado, id('vidente')).status).toBe('morto');
  });
});

describe('votação simultânea contada', () => {
  it('o mais votado é executado, pela contagem', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico']);
    const r = resolverDia(estado, {
      tipo: 'contagem',
      contagem: { [id('lobo')]: 3, [id('aldeao')]: 1 },
    });
    expect(quem(r.estado, id('lobo')).status).toBe('morto');
  });

  it('empate na contagem cai nas mesmas regras do empate nominal', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico']);
    const r = resolverDia(estado, {
      tipo: 'contagem',
      contagem: { [id('lobo')]: 2, [id('aldeao')]: 2 },
    });
    // Sem eventos, o empate não é desfeito e ninguém morre.
    expect(quem(r.estado, id('lobo')).status).toBe('vivo');
    expect(quem(r.estado, id('aldeao')).status).toBe('vivo');
  });

  it('avisa no log o que a contagem não consegue aplicar', () => {
    const { estado, id } = mesa(['lobo', 'aldeao', 'vidente', 'medico']);
    const r = resolverDia(estado, { tipo: 'contagem', contagem: { [id('aldeao')]: 2 } });
    /*
     * Sem saber quem apontou para quem, o voto duplo do Uivo Comprado e a
     * anulação mútua do Bobo Acusado não têm como ser aplicados. Dizer isso é
     * obrigatório: fingir que foram aplicados seria mentir para o host.
     */
    expect(r.log.some((l) => /Uivo Comprado|anulação mútua/.test(l.motivo))).toBe(true);
  });

  it('a lista nominal continua funcionando como sempre', () => {
    const { estado, id, quem } = mesa(['lobo', 'aldeao', 'vidente', 'medico']);
    const r = resolverDia(estado, {
      [id('aldeao')]: id('lobo'),
      [id('vidente')]: id('lobo'),
      [id('medico')]: id('lobo'),
    });
    expect(quem(r.estado, id('lobo')).status).toBe('morto');
  });
});
