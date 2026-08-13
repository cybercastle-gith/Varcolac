import type { StepFn } from '../night-pipeline';
import { pendente } from './_helpers';

/**
 * Etapa 10 — Necromante. APENAS mortes de noites ANTERIORES.
 * Não desfaz estertores já disparados: se o Caçador atirou, o tiro vale.
 */
export const ressurreicao: StepFn = (ctx) => {
  const elegiveis = ctx.estado.players.filter(
    (p) => p.status === 'morto' && (p.mortoNaRodada ?? 0) < ctx.estado.rodada,
  );
  if (elegiveis.length === 0) {
    ctx.log.ignorar('ressurreicao', 'Nenhuma morte de noite anterior para desfazer.');
    return ctx;
  }
  return pendente(ctx, 'ressurreicao', 'Necromante');
};
