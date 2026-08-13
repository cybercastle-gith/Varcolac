import type { StepFn } from '../night-pipeline';
import { acoesDe, marcar, nome } from './_helpers';

/**
 * Etapa 6 — Feiticeiro. Remove proteções e imunidades do alvo da matilha.
 * Não é bloqueador; é perfurador. Se o Padre já cancelou a noite na etapa 5,
 * a etapa 8 não roda e a perfuração não serve de nada — é o conflito documentado.
 */
export const perfuracao: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'perfuracao');
  if (acoes.length === 0) {
    ctx.log.ignorar('perfuracao', 'Ninguém perfurou esta noite.');
    return ctx;
  }

  let estado = ctx.estado;
  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    if (!alvo) continue;
    estado = marcar(estado, alvo, { perfurado: true, protegido: false, preso: false });
    ctx.log.registrar('perfuracao', {
      mensagem: `${nome(estado, acao.actorId)} perfurou ${nome(estado, alvo)}.`,
      motivo: 'Proteções e imunidades individuais do alvo foram removidas.',
      atores: [acao.actorId],
      alvos: [alvo],
    });
  }
  return { ...ctx, estado };
};
