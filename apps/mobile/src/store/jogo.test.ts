import { describe, expect, it, beforeEach } from 'vitest';
import { role, type NightAction } from '@jogo/engine';
import { useJogo } from './jogo';

/**
 * Uma partida inteira conduzida como na mesa: passagem por passagem, escolha por
 * escolha, votação por votação.
 *
 * Este teste é o substituto honesto do playtest para o que dá para automatizar.
 * Ele não desenha nada — exercita exatamente o caminho que as telas percorrem,
 * então uma regressão no fluxo aparece aqui antes de aparecer na mesa.
 */

const zerar = () => {
  useJogo.setState({
    jogadores: ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gil', 'Hilda'].map(
      (nome, i) => ({
        nome,
        cor: `#00000${i}`,
      }),
    ),
    estado: null,
    vitoria: null,
    roteiro: [],
    indice: 0,
    acoes: [],
    votos: {},
  });
  useJogo.getState().setConfig({ semente: 'mesa-de-teste', modo: 'classico' });
};

/** Responde a passagem atual escolhendo sempre o primeiro alvo válido. */
function jogarPassagem(): void {
  const { roteiro, indice, registrarAcao, proximaPassagem } = useJogo.getState();
  const passagem = roteiro[indice];
  if (!passagem) return;

  const { pergunta } = passagem;
  if (!pergunta.falsa && pergunta.tipo !== 'nenhuma') {
    const quantos = pergunta.tipo === 'dois-alvos' ? 2 : pergunta.tipo === 'alvo' ? 1 : 0;
    const alvos = pergunta.alvos.slice(0, quantos);
    if (alvos.length === quantos) {
      const acao: NightAction = {
        actorId: passagem.player.id,
        kind: pergunta.kind,
        etapa: pergunta.etapa!,
        alvos,
        falsa: false,
      };
      registrarAcao(acao);
    }
  }
  proximaPassagem();
}

/** Circula o celular pela mesa inteira. */
function noiteInteira(): void {
  const total = useJogo.getState().roteiro.length;
  for (let i = 0; i < total; i++) jogarPassagem();
}

/** A mesa vota: todos apontam para o primeiro vivo que não é ele mesmo. */
function diaInteiro(): void {
  const { estado, votar, fecharVotacao } = useJogo.getState();
  if (!estado) return;
  const vivos = estado.players.filter((p) => p.status === 'vivo');
  for (const p of vivos) {
    const alvo = vivos.find((x) => x.id !== p.id);
    if (alvo) votar(p.id, alvo.id);
  }
  fecharVotacao();
}

describe('sessão de mesa', () => {
  beforeEach(zerar);

  it('começar monta a partida e o roteiro da noite 1', () => {
    useJogo.getState().comecar();
    const { estado, roteiro } = useJogo.getState();

    expect(estado).not.toBeNull();
    expect(estado!.rodada).toBe(1);
    // Passagem COMPLETA: todos recebem o aparelho, inclusive quem não age.
    expect(roteiro).toHaveLength(8);
    expect(roteiro.every((p) => p.revelarRole)).toBe(true);
  });

  it('quem não tem ação recebe toque falso, e ele é indistinguível', () => {
    useJogo.getState().comecar();
    const { roteiro } = useJogo.getState();

    const aldeoes = roteiro.filter((p) => p.player.roleId === 'aldeao');
    expect(aldeoes.length).toBeGreaterThan(0);
    for (const a of aldeoes) {
      expect(a.pergunta.falsa).toBe(true);
      expect(a.pergunta.tipo).toBe('nenhuma');
    }
  });

  it('a matilha se conhece, e a vila não conhece ninguém', () => {
    useJogo.getState().comecar();
    const { roteiro } = useJogo.getState();

    const lobo = roteiro.find((p) => p.player.roleId === 'lobo')!;
    const outroLobo = roteiro.filter((p) => p.player.roleId === 'lobo')[1];
    expect(lobo.companheiros).toContain(outroLobo!.player.id);

    const aldeao = roteiro.find((p) => p.player.roleId === 'aldeao')!;
    expect(aldeao.companheiros).toHaveLength(0);
  });

  it('o modo Traição começa SEM nenhum lobo na mesa', () => {
    // Mudou em 2026-09-25: antes o modo herdava o baralho normal, com matilha
    // completa desde a noite 1, e a conversão noturna só somava lobos em cima
    // dos que já existiam — "todos começam na vila" era falso.
    useJogo.getState().setConfig({ modo: 'traicao' });
    useJogo.getState().comecar();
    const { estado } = useJogo.getState();
    const lobos = estado!.players.filter((p) => role(p.roleId).faccao === 'lobos');
    expect(lobos).toHaveLength(0);
  });

  it('no modo Traição ninguém conhece companheiro de matilha', () => {
    useJogo.getState().setConfig({ modo: 'traicao' });
    useJogo.getState().comecar();
    for (const passagem of useJogo.getState().roteiro) {
      expect(passagem.companheiros).toHaveLength(0);
    }
  });

  it('o lobo não pode escolher outro lobo como alvo', () => {
    useJogo.getState().comecar();
    const { roteiro, estado } = useJogo.getState();
    const lobo = roteiro.find((p) => p.player.roleId === 'lobo')!;
    for (const alvo of lobo.pergunta.alvos) {
      const p = estado!.players.find((x) => x.id === alvo)!;
      expect(role(p.roleId).faccao).not.toBe('lobos');
    }
  });

  it('a noite inteira resolve e leva ao amanhecer', () => {
    useJogo.getState().comecar();
    noiteInteira();

    const { estado } = useJogo.getState();
    expect(estado!.fase === 'amanhecer' || estado!.fase === 'fim').toBe(true);
    // A matilha mata JUNTA: no máximo um morto por ataque, mesmo com dois lobos.
    const mortos = estado!.players.filter((p) => p.status === 'morto');
    expect(mortos.length).toBeLessThanOrEqual(2);
  });

  it('uma partida inteira termina com vencedores', () => {
    useJogo.getState().comecar();

    for (let rodada = 0; rodada < 20; rodada++) {
      const antes = useJogo.getState().estado!;
      if (antes.fase === 'fim') break;

      noiteInteira();
      if (useJogo.getState().estado!.fase === 'fim') break;

      diaInteiro();
      if (useJogo.getState().estado!.fase === 'fim') break;

      useJogo.getState().seguirParaNoite();
    }

    const { estado, vitoria } = useJogo.getState();
    expect(estado!.fase).toBe('fim');
    expect(vitoria?.encerrada).toBe(true);
    expect(estado!.vencedores!.length).toBeGreaterThan(0);
  });

  it('a mesma semente reproduz a mesma partida', () => {
    const jogar = () => {
      zerar();
      useJogo.getState().comecar();
      for (let i = 0; i < 20; i++) {
        if (useJogo.getState().estado!.fase === 'fim') break;
        noiteInteira();
        if (useJogo.getState().estado!.fase === 'fim') break;
        diaInteiro();
        if (useJogo.getState().estado!.fase === 'fim') break;
        useJogo.getState().seguirParaNoite();
      }
      const e = useJogo.getState().estado!;
      return { vencedores: e.vencedores, rodada: e.rodada };
    };

    expect(jogar()).toEqual(jogar());
  });

  it('marcar tudo cobre a mesa e o baralho previsto tem o tamanho dela', () => {
    // SUPERADO: o Baralho Surpresa deixou de existir em 2026-09-26. O que
    // ocupou o lugar dele é marcar as cartas e ligar a seleção aleatória.
    useJogo.getState().marcarTudo();
    const { selecionadas, deck, jogadores, equilibrio } = useJogo.getState();
    expect(selecionadas.length).toBeGreaterThan(jogadores.length);
    expect(deck.roleIds).toHaveLength(jogadores.length);
    expect(equilibrio).not.toBeNull();
  });

  it('a variante escolhida acompanha a CARTA, e não a função', () => {
    const s = useJogo.getState();
    s.limparSelecao();
    // Boca Calada SIM, Xerife normal NÃO: a frase que o modelo antigo não dizia.
    s.alternarCarta('xerife:boca-calada');
    const { deck } = useJogo.getState();
    const i = deck.roleIds.indexOf('xerife');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(deck.variantes?.[i]).toBe('boca-calada');
  });

  it('trocar para Traição poda as cartas de lobo da seleção', () => {
    const s = useJogo.getState();
    s.limparSelecao();
    s.alternarCarta('lobo');
    s.alternarCarta('vidente');
    s.setConfig({ modo: 'traicao' });
    expect(useJogo.getState().selecionadas).toEqual(['vidente']);
    s.setConfig({ modo: 'classico' });
  });

  it('trocar o número de jogadores refaz o baralho para caber', () => {
    useJogo.getState().adicionarJogador('Ivo');
    const { deck, jogadores } = useJogo.getState();
    expect(deck.roleIds).toHaveLength(jogadores.length);
  });
});

describe('seleção aleatória é balanceada', () => {
  /*
   * Embaralhar a seleção e cortar N era honesto e péssimo: com 97 cartas
   * marcadas para seis cadeiras, sai mesa sem nenhum lobo com frequência —
   * e quem descobre é a mesa, na terceira noite.
   */
  it('nunca sorteia uma mesa sem lobo, nem uma mesa só de lobos', () => {
    const s = useJogo.getState();
    s.limparSelecao();
    s.marcarTudo();
    s.setConfig({ selecaoAleatoria: true });

    for (let i = 0; i < 25; i += 1) {
      // Semente nova a cada volta: é o sorteio da PARTIDA que precisa valer.
      useJogo.getState().setConfig({ semente: `sorteio-${i}` });
      useJogo.getState().comecar();
      const estado = useJogo.getState().estado!;
      const lobos = estado.players.filter((p) => role(p.roleId).faccao === 'lobos').length;
      const total = estado.players.length;

      expect(lobos, `mesa ${i} saiu sem lobo`).toBeGreaterThan(0);
      expect(lobos, `mesa ${i} saiu com lobos demais`).toBeLessThan(total / 2);
    }
  });

  it('respeita o que a mesa marcou: função não marcada não entra', () => {
    const s = useJogo.getState();
    s.limparSelecao();
    // Um leque pequeno e explícito, maior que a mesa.
    for (const k of ['lobo', 'alfa', 'aldeao', 'vidente', 'medico', 'xerife', 'padre', 'cacador']) {
      s.alternarCarta(k);
    }
    s.setConfig({ selecaoAleatoria: true, semente: 'restrito' });
    useJogo.getState().comecar();

    const permitidas = new Set([
      'lobo',
      'alfa',
      'aldeao',
      'vidente',
      'medico',
      'xerife',
      'padre',
      'cacador',
    ]);
    for (const p of useJogo.getState().estado!.players) {
      expect(permitidas.has(p.roleId), `${p.roleId} entrou sem ter sido marcado`).toBe(true);
    }
  });
});

describe('modo Traição no caminho do app', () => {
  it('converte alguém a cada noite resolvida', () => {
    const s = useJogo.getState();
    s.limparSelecao();
    // Traição esconde os lobos do baralho: a mesa é só vila e solitários.
    for (const k of ['aldeao', 'vidente', 'medico', 'xerife', 'padre', 'cacador']) {
      s.alternarCarta(k);
    }
    s.setConfig({ modo: 'traicao', selecaoAleatoria: false, semente: 'traicao-app' });
    useJogo.getState().comecar();

    const comecou = useJogo.getState().estado!;
    expect(comecou.players.every((p) => role(p.roleId).faccao !== 'lobos')).toBe(true);

    // Fecha a noite 1 sem nenhuma ação: o amanhecer é que converte.
    useJogo.getState().fecharNoiteAgora();
    const depois = useJogo.getState().estado!;
    const convertidos = Object.values(depois.objetivosSecretos).filter((o) => o === 'convertido');
    expect(convertidos.length, 'o amanhecer não converteu ninguém').toBe(1);
  });
});
