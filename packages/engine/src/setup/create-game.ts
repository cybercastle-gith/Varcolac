import type { GameConfig, Deck } from '../types/config';
import { CONTADORES_ZERADOS, type GameState } from '../types/game-state';
import type { Player, PlayerFlags } from '../types/player';
import { usosIniciais, usosPorMesa } from '../types/role';
import { role } from '../data/roles/index';
import { MISSOES_DO_CORINGA } from '../data/missions';
import { criarRng, type Rng } from '../utils/rng';

export interface JogadorInicial {
  readonly nome: string;
  readonly cor: string;
}

export const FLAGS_LIMPAS: PlayerFlags = {
  protegido: false,
  bloqueado: false,
  perfurado: false,
  preso: false,
  imuneInvestigacao: false,
  assombrado: false,
  embriagado: false,
  estertorPendente: false,
};

/**
 * Vínculos e trocas que o dossiê manda resolver ANTES da primeira passagem do
 * celular (etapa 1: "roles são atribuídas na inicialização").
 *
 * Fica aqui, e não numa etapa da noite, porque quando o aparelho começa a
 * circular tudo isto já precisa estar decidido — o Ladrão que trocou já mostra
 * a role nova, e nenhum dos dois é avisado.
 */
function aplicarVinculos(
  players: Player[],
  deck: Deck,
  rng: Rng,
): { players: Player[]; objetivos: Record<string, string> } {
  const objetivos: Record<string, string> = {};
  let lista = [...players];

  /*
   * O Ladrão NÃO troca nada aqui.
   *
   * A troca era sorteada em silêncio e o jogador só descobria depois qual carta
   * tinha caído na mão dele — escolher de quem roubar É a role. Decisão do
   * usuário em 2026-09-26: ele aponta o alvo na passagem da noite 1, e a etapa 1
   * resolve. O mesmo vale para as variantes Troca Forçada e Contaminação, que
   * também sorteavam.
   */

  // O Vingador NÃO é sorteado aqui.
  //
  // Ele escolhe o alvo na noite 1, e a escolha chega pela passagem do celular
  // (ver `roteiro.ts`). Antes isto sorteava o alvo em silêncio e o jogador nunca
  // era perguntado — a role existia sem nenhuma decisão, que é o oposto do que
  // a carta promete.

  // Coringa: missão sorteada, nunca a mesma role duas vezes.
  const coringa = lista.find((p) => p.roleId === 'coringa');
  if (coringa) {
    const sorteadas = rng.shuffle([...MISSOES_DO_CORINGA]);
    objetivos[coringa.id] = sorteadas[0]!.id;

    /**
     * Missão Partida: a segunda missão vai para alguém que não pediu.
     *
     * O segundo Coringa não sabe que virou Coringa até ler o próprio segredo na
     * passagem — e a partir daí tem uma condição de vitória própria que não
     * combina com a facção da carta dele. É a variante que mais bagunça a mesa,
     * porque cria um solitário onde a contagem de baralho não previa nenhum.
     */
    if (coringa.varianteId === 'missao-partida' && sorteadas[1]) {
      const outros = lista.filter((p) => p.id !== coringa.id);
      if (outros.length > 0) objetivos[rng.pick(outros).id] = sorteadas[1].id;
    }
  }

  /*
   * A Bruxa também NÃO tem a poção sorteada.
   *
   * A carta diz "escolhe no início entre poção da vida ou da morte", e o sorteio
   * transformava a escolha em destino: ela abria a carta e descobria de que lado
   * estava. Ela escolhe na passagem, e a escolha é gravada na etapa 8.
   *
   * A exceção é a variante Poção Misteriosa, cujo ponto é exatamente ela não
   * saber — essa continua sorteando, na hora da resolução.
   */

  return { players: lista, objetivos };
}

/**
 * Cria o estado inicial da partida.
 *
 * Todo sorteio passa pelo RNG semeado — a mesma semente com os mesmos jogadores
 * e o mesmo baralho reproduz a partida inteira, inclusive os vínculos.
 */
export function criarPartida(
  deck: Deck,
  config: GameConfig,
  jogadores: readonly JogadorInicial[],
): GameState {
  if (deck.roleIds.length !== jogadores.length) {
    throw new Error(`Baralho com ${deck.roleIds.length} roles para ${jogadores.length} jogadores`);
  }

  const rng = criarRng(config.semente);

  /**
   * Embaralha as POSIÇÕES, não as roles.
   *
   * A variante de cada carta vive num vetor paralelo a `roleIds`, então
   * embaralhar as roles soltas separaria a carta da sua variante — um Xerife
   * Boca Calada sortearia como Xerife comum e a variante iria para outra pessoa.
   */
  const posicoes = rng.shuffle(deck.roleIds.map((_, i) => i));
  const roleIds = posicoes.map((i) => deck.roleIds[i]!);
  const variantesDaCarta = posicoes.map((i) => deck.variantes?.[i]);

  const iniciais: Player[] = jogadores.map((j, i) => {
    const roleId = roleIds[i]!;
    // A variante da CARTA vem primeiro; `config.variantes` é o padrão por role.
    const varianteId = variantesDaCarta[i] ?? config.variantes[roleId];
    return {
      id: `p${i + 1}`,
      nome: j.nome,
      cor: j.cor,
      roleId,
      ...(varianteId === undefined ? {} : { varianteId }),
      status: 'vivo',
      usosRestantes:
        usosPorMesa(roleId, varianteId, jogadores.length) ?? usosIniciais(role(roleId).usoLimitado),
      flags: FLAGS_LIMPAS,
      marcas: {},
      semVoto: false,
      silenciado: false,
    };
  });

  const { players, objetivos } = aplicarVinculos(iniciais, deck, rng);

  return {
    config,
    deck,
    /*
     * Os vínculos podem ter mudado a role (Contaminação), então os usos são
     * recalculados — e `usosPorMesa` vem primeiro aqui pelo mesmo motivo de lá
     * em cima: esquecer este segundo ponto zerava a regra do Delegado sem
     * nenhum sinal.
     */
    players: players.map((p) => ({
      ...p,
      usosRestantes:
        usosPorMesa(p.roleId, p.varianteId, jogadores.length) ??
        usosIniciais(role(p.roleId).usoLimitado),
    })),
    rodada: 1,
    fase: 'noite',
    eventoDaNoite: null,
    eventoAnunciado: null,
    eventosUsados: [],
    // Só a Vila Amaldiçoada põe prazo, no `aoCriarPartida` dela.
    prazoDaMaldicao: null,
    historicoVotos: [],
    informacoes: [],
    anuncios: [],
    efeitos: [],
    contadores: CONTADORES_ZERADOS,
    rng: rng.state(),
    objetivosSecretos: objetivos,
    vencedores: null,
  };
}
