import type { GameConfig, Deck } from '../types/config';
import { CONTADORES_ZERADOS, type GameState } from '../types/game-state';
import type { Player, PlayerFlags } from '../types/player';
import { usosIniciais } from '../types/role';
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

  // Ladrão: troca de role com outro jogador, em silêncio.
  const ladrao = lista.find((p) => p.roleId === 'ladrao');
  if (ladrao) {
    const outros = lista.filter((p) => p.id !== ladrao.id);
    if (outros.length > 0) {
      const alvo = rng.pick(outros);
      lista = lista.map((p) => {
        if (p.id === ladrao.id) return { ...p, roleId: alvo.roleId };
        if (p.id === alvo.id) return { ...p, roleId: 'ladrao' };
        return p;
      });
      objetivos[ladrao.id] = `roubou a role de ${alvo.nome}`;
    }
  }

  // Vingador: escolhe um alvo na noite 1 e vence se ele morrer, por qualquer causa.
  const vingador = lista.find((p) => p.roleId === 'vingador');
  if (vingador) {
    const outros = lista.filter((p) => p.id !== vingador.id);
    if (outros.length > 0) objetivos[vingador.id] = rng.pick(outros).id;
  }

  // Coringa: missão sorteada, nunca a mesma role duas vezes.
  const coringa = lista.find((p) => p.roleId === 'coringa');
  if (coringa) objetivos[coringa.id] = rng.pick(MISSOES_DO_CORINGA).id;

  // Bruxa: a poção define secretamente o lado (vida = bem, morte = mal).
  const bruxa = lista.find((p) => p.roleId === 'bruxa');
  if (bruxa) objetivos[bruxa.id] = rng.next() < 0.5 ? 'pocao-vida' : 'pocao-morte';


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
    throw new Error(
      `Baralho com ${deck.roleIds.length} roles para ${jogadores.length} jogadores`,
    );
  }

  const rng = criarRng(config.semente);
  const roleIds = rng.shuffle(deck.roleIds);

  const iniciais: Player[] = jogadores.map((j, i) => {
    const roleId = roleIds[i]!;
    const varianteId = config.variantes[roleId];
    return {
      id: `p${i + 1}`,
      nome: j.nome,
      cor: j.cor,
      roleId,
      ...(varianteId === undefined ? {} : { varianteId }),
      status: 'vivo',
      usosRestantes: usosIniciais(role(roleId).usoLimitado),
      flags: FLAGS_LIMPAS,
      semVoto: false,
      silenciado: false,
    };
  });

  const { players, objetivos } = aplicarVinculos(iniciais, deck, rng);

  return {
    config,
    deck,
    // A troca do Ladrão pode ter mudado a role: os usos precisam acompanhar.
    players: players.map((p) => ({
      ...p,
      usosRestantes: usosIniciais(role(p.roleId).usoLimitado),
    })),
    rodada: 1,
    fase: 'noite',
    eventoDaNoite: null,
    eventosUsados: [],
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
