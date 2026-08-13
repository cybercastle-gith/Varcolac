import type { StepFn } from '../night-pipeline';
import { pendente } from './_helpers';

/**
 * Etapa 4 — Assombrar e Pesadelo. Fantasmas agem DEPOIS dos vivos.
 * Módulos coletivos só entram em operação a partir da segunda morte.
 */
export const interferenciaEspectral: StepFn = (ctx) => {
  if (ctx.estado.config.modulosDeFantasma.length === 0) {
    ctx.log.ignorar('interferencia-espectral', 'Nenhum módulo de fantasma ativo.');
    return ctx;
  }
  return pendente(ctx, 'interferencia-espectral', 'Assombrar e Pesadelo');
};
