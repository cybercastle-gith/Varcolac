import type { StepFn } from '../night-pipeline';
import { pendente } from './_helpers';

/**
 * Etapa 11 — Vidente e Detetive.
 *
 * Lê `ctx.estadoInicial`, NUNCA `ctx.estado`: quem investigou alguém que morreu
 * nesta mesma noite ainda recebe a leitura, para que a informação não vaze o
 * resultado da noite.
 */
export const informacao: StepFn = (ctx) => pendente(ctx, 'informacao', 'Vidente e Detetive');
