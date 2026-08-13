import type { NightAction, NightStepId } from '../../types/action';
import type { GameState } from '../../types/game-state';
import { jogador } from '../../types/game-state';
import type { CauseOfDeath, PlayerFlags, PlayerId } from '../../types/player';
import type { StepContext } from '../night-pipeline';

/**
 * Ações válidas de uma etapa: descarta toques falsos, mortos, e — o ponto
 * importante — quem foi bloqueado. Bloqueado não age, e a escolha dele some.
 */
export function acoesDe(ctx: StepContext, etapa: NightStepId): readonly NightAction[] {
  return ctx.submissao.acoes.filter((a) => {
    if (a.etapa !== etapa || a.falsa) return false;
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    if (!ator || ator.status === 'morto') return false;
    return !ator.flags.bloqueado;
  });
}

export function nome(estado: GameState, id: PlayerId): string {
  return jogador(estado, id).nome;
}

/** Aplica flags a um jogador sem mutar o estado. */
export function marcar(
  estado: GameState,
  id: PlayerId,
  flags: Partial<PlayerFlags>,
): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id ? { ...p, flags: { ...p.flags, ...flags } } : p,
    ),
  };
}

export function matar(estado: GameState, id: PlayerId, causa: CauseOfDeath): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id
        ? { ...p, status: 'morto' as const, mortoNaRodada: estado.rodada, causaMorte: causa }
        : p,
    ),
  };
}

/** Etapa que ainda não faz nada: registra o TODO no log em vez de sumir. */
export function pendente(ctx: StepContext, etapa: NightStepId, oQueFalta: string): StepContext {
  ctx.log.ignorar(etapa, `Não implementado: ${oQueFalta}`);
  return ctx;
}
