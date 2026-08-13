import type { StepFn } from '../night-pipeline';
import { pendente } from './_helpers';

/**
 * Etapa 9 — Caçador, Carniçal, Anciã, Amor Proibido.
 *
 * Cadeia COMPLETA: quem morre pelo estertor de outro também dispara o seu, até
 * a cadeia se esgotar. Cada jogador dispara no máximo uma vez — é o que impede
 * ciclo infinito quando dois estertores se apontam.
 */
export const estertores: StepFn = (ctx) => {
  const pendentes = ctx.estado.players.filter((p) => p.flags.estertorPendente);
  if (pendentes.length === 0) {
    ctx.log.ignorar('estertores', 'Ninguém morreu na etapa 8.');
    return ctx;
  }
  return pendente(ctx, 'estertores', 'cadeia de estertores (Caçador, Carniçal, Anciã)');
};
