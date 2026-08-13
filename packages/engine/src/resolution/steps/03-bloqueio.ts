import type { StepFn } from '../night-pipeline';
import { acoesDe, marcar, nome } from './_helpers';

/**
 * Etapa 3 — Xerife e Taverneiro. O alvo não age; a escolha dele é descartada.
 *
 * O bloqueio é lido a partir da submissão original, não do estado já alterado:
 * se dois se bloqueiam, ambos falham — nenhum "chega primeiro".
 * O preso pelo Xerife também fica imune à morte, imunidade que o Feiticeiro
 * perfura na etapa 6.
 */
export const bloqueio: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'bloqueio');
  if (acoes.length === 0) {
    ctx.log.ignorar('bloqueio', 'Ninguém bloqueou esta noite.');
    return ctx;
  }

  let estado = ctx.estado;
  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    if (!alvo) continue;
    const prende = estado.players.find((p) => p.id === acao.actorId)?.roleId === 'xerife';
    estado = marcar(estado, alvo, { bloqueado: true, preso: prende });
    ctx.log.registrar('bloqueio', {
      mensagem: `${nome(estado, acao.actorId)} ${prende ? 'prendeu' : 'embebedou'} ${nome(estado, alvo)}.`,
      motivo: prende
        ? 'Preso não age, não morre e não fala no dia seguinte.'
        : 'O poder falha e o jogador não é avisado.',
      atores: [acao.actorId],
      alvos: [alvo],
    });
  }
  return { ...ctx, estado };
};
