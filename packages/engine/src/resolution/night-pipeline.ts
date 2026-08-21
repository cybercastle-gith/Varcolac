import { NIGHT_STEPS, type NightStepId, type NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { limparEfeitosVencidos } from '../types/effect';
import { FLAGS_LIMPAS } from '../setup/create-game';
import { criarColetor, type LogCollector, type ResolutionLog } from './resolution-log';
import { ETAPAS } from './steps/index';
import { retomarRng, type Rng } from '../utils/rng';

/**
 * Contexto que atravessa as 12 etapas. Cada etapa recebe o contexto, devolve um
 * novo, e escreve no log o que fez e por quê. Nenhuma etapa muta nada.
 */
export interface StepContext {
  /** Estado no INÍCIO da noite. A etapa 11 (informação) lê daqui. */
  readonly estadoInicial: GameState;
  readonly estado: GameState;
  readonly submissao: NightSubmission;
  /**
   * Etapas canceladas nesta noite, com o motivo junto — pelo evento (etapa 2)
   * ou pelo Padre (etapa 5). O motivo viaja com o cancelamento porque quem lê
   * o log precisa saber QUEM cancelou, não só que houve cancelamento.
   */
  readonly etapasCanceladas: readonly Cancelamento[];
  /**
   * O mesmo gerador atravessa a noite inteira. Se cada etapa criasse o seu, a
   * partida deixaria de ser reproduzível a partir da semente.
   */
  readonly rng: Rng;
  readonly log: LogCollector;
}

export interface Cancelamento {
  readonly etapa: NightStepId;
  readonly motivo: string;
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
  const emNoite: GameState = { ...estado, fase: 'noite' };
  return {
    estadoInicial: emNoite,
    estado: emNoite,
    submissao,
    etapasCanceladas: [],
    rng: retomarRng(estado.rng),
    log: criarColetor(estado.rodada),
  };
}

/**
 * Roda uma única etapa — é o que dá o botão "próxima etapa" do laboratório.
 * Se a etapa foi cancelada, ela é registrada como ignorada e o estado passa
 * intacto: o cancelamento aparece no log em vez de virar um buraco silencioso.
 */
export function resolverEtapa(ctx: StepContext, etapa: NightStepId): StepContext {
  const cancelada = ctx.etapasCanceladas.find((c) => c.etapa === etapa);
  if (cancelada) {
    ctx.log.ignorar(etapa, cancelada.motivo);
    return ctx;
  }
  return ETAPAS[etapa](ctx);
}

/**
 * Fecha a noite: guarda o estado do RNG, limpa as marcas voláteis, descarta os
 * efeitos vencidos e atualiza os contadores de gatilho.
 *
 * EXPORTADA de propósito. Quem avança etapa por etapa (o laboratório) precisa
 * fechar a noite exatamente como `resolverNoite` fecha — senão existem dois
 * caminhos para a mesma regra, e eles divergem no primeiro detalhe: foi assim
 * que as marcas ficaram presas e os contadores da noite pararam de subir.
 */
export function fecharNoite(ctx: StepContext): GameState {
  const estado = ctx.estado;
  const rodada = estado.rodada;

  const mortesNaNoite = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === rodada,
  ).length;

  return {
    ...estado,
    fase: 'amanhecer',
    rng: ctx.rng.state(),
    // As marcas são voláteis por definição: valem por uma noite. O silêncio do
    // Xerife não está aqui porque ele vale para o DIA que começa agora, e é a
    // votação que o consome.
    players: estado.players.map((p) => ({ ...p, flags: FLAGS_LIMPAS })),
    efeitos: limparEfeitosVencidos(estado.efeitos, rodada),
    contadores: {
      ...estado.contadores,
      mortesNaUltimaNoite: mortesNaNoite,
      mortosNoTotal: estado.players.filter((p) => p.status === 'morto').length,
      noitesSemMatar: mortesNaNoite === 0 ? estado.contadores.noitesSemMatar + 1 : 0,
    },
  };
}

/** Roda a noite inteira, em ordem, e devolve estado novo + log auditável. */
export function resolverNoite(estado: GameState, submissao: NightSubmission): NightResult {
  let ctx = iniciarNoite(estado, submissao);
  for (const etapa of ORDEM_DAS_ETAPAS) ctx = resolverEtapa(ctx, etapa);
  return { estado: fecharNoite(ctx), log: ctx.log.resultado() };
}
