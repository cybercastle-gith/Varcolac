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
    jogadores: ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gil', 'Hilda'].map((nome, i) => ({
      nome,
      cor: `#00000${i}`,
    })),
    estado: null,
    vitoria: null,
    roteiro: [],
    indice: 0,
    acoes: [],
    votos: {},
  });
  useJogo.getState().setConfig({ semente: 'mesa-de-teste' });
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

  it('no modo Traição a matilha é totalmente cega', () => {
    useJogo.getState().setConfig({ modo: 'traicao' });
    useJogo.getState().comecar();
    const lobos = useJogo.getState().roteiro.filter((p) => p.player.roleId === 'lobo');
    expect(lobos.length).toBeGreaterThan(0);
    for (const l of lobos) expect(l.companheiros).toHaveLength(0);
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

  it('o Baralho Surpresa monta uma composição do tamanho da mesa', () => {
    useJogo.getState().baralhoSurpresa();
    const { deck, jogadores, equilibrio } = useJogo.getState();
    expect(deck.roleIds).toHaveLength(jogadores.length);
    expect(equilibrio).not.toBeNull();
  });

  it('trocar o número de jogadores refaz o baralho para caber', () => {
    useJogo.getState().adicionarJogador('Ivo');
    const { deck, jogadores } = useJogo.getState();
    expect(deck.roleIds).toHaveLength(jogadores.length);
  });
});
