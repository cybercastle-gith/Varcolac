import type { StepFn } from '../night-pipeline';
import { acoesDe, marcar, nome } from './_helpers';

/**
 * Etapa 5 — Médico, Guarda-costas, Padre. Só MARCA quem está protegido;
 * nenhuma morte é resolvida aqui.
 *
 * O Padre é diferente: ele não protege ninguém, cancela a noite inteira. Por
 * isso vence o Feiticeiro, que só perfura proteções individuais.
 */
export const protecao: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'protecao');
  if (acoes.length === 0) {
    ctx.log.ignorar('protecao', 'Ninguém protegeu esta noite.');
    return ctx;
  }

  let estado = ctx.estado;
  let etapasCanceladas = ctx.etapasCanceladas;

  for (const acao of acoes) {
    const roleId = estado.players.find((p) => p.id === acao.actorId)?.roleId;

    if (roleId === 'padre') {
      etapasCanceladas = [...etapasCanceladas, 'resolucao-mortes'];
      ctx.log.registrar('protecao', {
        mensagem: `${nome(estado, acao.actorId)} anulou todas as mortes desta noite.`,
        motivo: 'O Padre não protege ninguém: cancela a noite inteira. Vence o Feiticeiro.',
        atores: [acao.actorId],
      });
      continue;
    }

    for (const alvo of acao.alvos) {
      estado = marcar(estado, alvo, { protegido: true });
      ctx.log.registrar('protecao', {
        mensagem: `${nome(estado, acao.actorId)} protegeu ${nome(estado, alvo)}.`,
        motivo: 'Marca apenas; a morte é decidida na etapa 8.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
    }
  }

  return { ...ctx, estado, etapasCanceladas };
};
