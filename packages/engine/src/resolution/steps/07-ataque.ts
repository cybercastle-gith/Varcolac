import type { StepFn } from '../night-pipeline';
import { acoesDe, nome } from './_helpers';

/**
 * Etapa 7 — Matilha, Lobo Branco, Bruxa. Só DECLARAM alvos; ninguém morre aqui.
 * Declarar em separado de matar é o que permite que proteção, perfuração e
 * cancelamento se cruzem numa etapa só, a 8.
 */
export const ataque: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'ataque');
  if (acoes.length === 0) {
    ctx.log.ignorar('ataque', 'Nenhum ataque declarado.');
    return ctx;
  }

  for (const acao of acoes) {
    for (const alvo of acao.alvos) {
      ctx.log.registrar('ataque', {
        mensagem: `${nome(ctx.estado, acao.actorId)} declarou ataque a ${nome(ctx.estado, alvo)}.`,
        motivo: 'Declaração apenas — a morte é resolvida na etapa 8.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
    }
  }
  return ctx;
};
