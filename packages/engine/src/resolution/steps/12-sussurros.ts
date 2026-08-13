import type { StepFn } from '../night-pipeline';
import { acoesDe } from './_helpers';

/**
 * Etapa 12 — bilhetes anônimos de 3 palavras, entregues no amanhecer seguinte.
 * Se o destinatário morrer antes, o bilhete se perde.
 */
export const sussurros: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'sussurros');
  if (acoes.length === 0) {
    ctx.log.ignorar('sussurros', 'Nenhum bilhete deixado.');
    return ctx;
  }

  const novos = acoes.flatMap((a) =>
    a.alvos.map((paraId) => ({
      deRodada: ctx.estado.rodada,
      paraId,
      texto: (a.texto ?? '').split(/\s+/).slice(0, 3).join(' '),
    })),
  );

  ctx.log.registrar('sussurros', {
    mensagem: `${novos.length} bilhete(s) a entregar no amanhecer.`,
    motivo: 'Anônimos, três palavras, custo de tempo zero — a passagem já acontece.',
    alvos: novos.map((s) => s.paraId),
  });

  return {
    ...ctx,
    estado: {
      ...ctx.estado,
      sussurrosPendentes: [...ctx.estado.sussurrosPendentes, ...novos],
    },
  };
};
