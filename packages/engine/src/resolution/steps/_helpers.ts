import type { NightAction, NightStepId } from '../../types/action';
import type { GameState } from '../../types/game-state';
import { jogador } from '../../types/game-state';
import type { CauseOfDeath, PlayerFlags, PlayerId } from '../../types/player';
import type { InfoEntry } from '../../types/info';
import type { EfeitoAdiado } from '../../types/effect';
import { temEfeito } from '../../types/effect';
import { role } from '../../data/roles/index';
import { EVENTOS_POR_ID } from '../../data/events/index';
import type { StepContext } from '../night-pipeline';

/**
 * Ações válidas de uma etapa. Descarta, nesta ordem:
 * toque falso · ator morto · ator bloqueado · role silenciada pelo evento ·
 * poderes da vila suspensos pela Anciã.
 *
 * Centralizar isto é o que impede que cada etapa reimplemente as mesmas
 * exceções — e que uma delas esqueça alguma.
 */
export function acoesDe(ctx: StepContext, etapa: NightStepId): readonly NightAction[] {
  const ev = ctx.estado.eventoDaNoite ? EVENTOS_POR_ID.get(ctx.estado.eventoDaNoite) : undefined;
  const silenciadas = new Set(
    ev?.efeitos.flatMap((e) => (e.kind === 'silencia-role' ? e.roleIds : [])) ?? [],
  );
  const poderesSuspensos = temEfeito(ctx.estado.efeitos, ctx.estado.rodada, 'poderes-suspensos');

  return ctx.submissao.acoes.filter((a) => {
    if (a.etapa !== etapa || a.falsa) return false;
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    if (!ator || ator.status === 'morto') return false;
    if (ator.flags.bloqueado) return false;
    if (silenciadas.has(ator.roleId)) return false;
    // A Anciã derruba os poderes da VILA, não os da matilha.
    if (poderesSuspensos && role(ator.roleId).faccao === 'vila') return false;
    return true;
  });
}

/** Ações de fantasmas: mesma filtragem, mas exige o ator MORTO. */
export function acoesDeFantasmas(ctx: StepContext, etapa: NightStepId): readonly NightAction[] {
  return ctx.submissao.acoes.filter((a) => {
    if (a.etapa !== etapa || a.falsa) return false;
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    return !!ator && ator.status === 'morto';
  });
}

export function nome(estado: GameState, id: PlayerId): string {
  return jogador(estado, id).nome;
}

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

export function reviver(estado: GameState, id: PlayerId): GameState {
  return {
    ...estado,
    players: estado.players.map((p) => {
      if (p.id !== id) return p;
      const { mortoNaRodada: _m, causaMorte: _c, ...resto } = p;
      return { ...resto, status: 'vivo' as const };
    }),
  };
}

export function gastarUso(estado: GameState, id: PlayerId): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id ? { ...p, usosRestantes: Math.max(0, p.usosRestantes - 1) } : p,
    ),
  };
}

export function temUso(estado: GameState, id: PlayerId): boolean {
  return jogador(estado, id).usosRestantes > 0;
}

export function entregarInfo(estado: GameState, info: InfoEntry): GameState {
  return { ...estado, informacoes: [...estado.informacoes, info] };
}

export function anunciar(
  estado: GameState,
  texto: string,
  origem: 'evento' | 'morte' | 'votacao' | 'role' | 'fantasma' | 'modo',
): GameState {
  return {
    ...estado,
    anuncios: [...estado.anuncios, { rodada: estado.rodada, texto, origem }],
  };
}

export function agendar(estado: GameState, efeito: EfeitoAdiado): GameState {
  return { ...estado, efeitos: [...estado.efeitos, efeito] };
}

/** Etapa que ainda não faz nada: registra o TODO no log em vez de sumir. */
export function pendente(ctx: StepContext, etapa: NightStepId, oQueFalta: string): StepContext {
  ctx.log.ignorar(etapa, `Não implementado: ${oQueFalta}`);
  return ctx;
}
