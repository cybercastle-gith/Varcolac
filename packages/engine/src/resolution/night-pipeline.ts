import { NIGHT_STEPS, type NightStepId, type NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { FLAGS_LIMPAS } from '../setup/create-game';
import {
  criarColetor,
  type LogCollector,
  type ResolutionLog,
} from './resolution-log';
import { ETAPAS } from './steps/index';

/**
 * Contexto que atravessa as 12 etapas. Cada etapa recebe o contexto, devolve um
 * novo, e escreve no log o que fez e por quê. Nenhuma etapa muta nada.
 */
export interface StepContext {
  /** Estado no INÍCIO da noite. A etapa 11 (informação) lê daqui. */
  readonly estadoInicial: GameState;
  readonly estado: GameState;
  readonly submissao: NightSubmission;
  /** Etapas canceladas pelo evento desta noite (preenchido na etapa 2). */
  readonly etapasCanceladas: readonly NightStepId[];
  readonly log: LogCollector;
}

export type StepFn = (ctx: StepContext) => StepContext;

export interface NightResult {
  readonly estado: GameState;
  readonly log: ResolutionLog;
}

/** A ordem nunca muda. O laboratório desenha a lista a partir daqui. */
export const ORDEM_DAS_ETAPAS: readonly NightStepId[] = NIGHT_STEPS;

/** Monta o contexto de uma noite, pronto para a primeira etapa. */
export function iniciarNoite(estado: GameState, submissao: NightSubmission): StepContext {
  return {
    estadoInicial: estado,
    estado,
    submissao,
    etapasCanceladas: [],
    log: criarColetor(estado.rodada),
  };
}

/**
 * Roda uma única etapa — é o que dá o botão "próxima etapa" do laboratório.
 * Se o evento da noite cancelou a etapa, ela é registrada como ignorada e o
 * estado passa intacto.
 */
export function resolverEtapa(ctx: StepContext, etapa: NightStepId): StepContext {
  if (ctx.etapasCanceladas.includes(etapa)) {
    ctx.log.ignorar(etapa, `Cancelada pelo evento da noite (${ctx.estado.eventoDaNoite}).`);
    return ctx;
  }
  return ETAPAS[etapa](ctx);
}

/** Limpa as marcas voláteis e avança a rodada. Chamado no fim da noite. */
function amanhecer(estado: GameState): GameState {
  return {
    ...estado,
    fase: 'amanhecer',
    players: estado.players.map((p) => ({ ...p, flags: FLAGS_LIMPAS })),
  };
}

/** Roda a noite inteira, em ordem, e devolve estado novo + log auditável. */
export function resolverNoite(estado: GameState, submissao: NightSubmission): NightResult {
  let ctx = iniciarNoite(estado, submissao);
  for (const etapa of ORDEM_DAS_ETAPAS) {
    ctx = resolverEtapa(ctx, etapa);
  }
  return { estado: amanhecer(ctx.estado), log: ctx.log.resultado() };
}
