import type { GameConfig, Deck } from '../types/config';
import type { GameState } from '../types/game-state';
import type { Player, PlayerFlags } from '../types/player';
import { usosIniciais } from '../types/role';
import { role } from '../data/roles/index';
import { criarRng } from '../utils/rng';

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
 * Cria o estado inicial da partida.
 *
 * A atribuição de roles acontece AQUI, não na etapa 1 da noite: quando a
 * primeira passagem do celular começa, vínculos de Amantes e a troca do Ladrão
 * já estão resolvidos. A etapa 1 apenas registra isso no log.
 *
 * Todo sorteio passa pelo RNG semeado — a mesma semente com os mesmos jogadores
 * e o mesmo baralho reproduz a partida inteira.
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

  const players: Player[] = jogadores.map((j, i) => {
    const roleId = roleIds[i]!;
    const r = role(roleId);
    const varianteId = config.variantes[roleId];
    return {
      id: `p${i + 1}`,
      nome: j.nome,
      cor: j.cor,
      roleId,
      ...(varianteId === undefined ? {} : { varianteId }),
      status: 'vivo',
      usosRestantes: usosIniciais(r.usoLimitado),
      flags: FLAGS_LIMPAS,
      semVoto: false,
      silenciado: false,
    };
  });

  // TODO etapa `estado-inicial`: aplicar o modificador Amantes (deck.modificadores),
  // a troca do Ladrão e o alvo do Vingador — todos com o mesmo `rng`.

  return {
    config,
    deck,
    players,
    rodada: 1,
    fase: 'noite',
    eventoDaNoite: null,
    sussurrosPendentes: [],
    historicoVotos: [],
    rng: rng.state(),
    objetivosSecretos: {},
    vencedores: null,
  };
}
