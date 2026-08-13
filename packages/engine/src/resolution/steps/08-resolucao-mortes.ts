import type { StepFn } from '../night-pipeline';
import { acoesDe, marcar, matar, nome } from './_helpers';

/**
 * Etapa 8 — cruza ataques com proteções e perfurações e decide quem morre.
 * É a única etapa que mata por ataque; estertores vêm na 9.
 */
export const resolucaoMortes: StepFn = (ctx) => {
  const alvos = acoesDe(ctx, 'ataque').flatMap((a) => a.alvos);
  if (alvos.length === 0) {
    ctx.log.ignorar('resolucao-mortes', 'Nenhum ataque para resolver.');
    return ctx;
  }

  let estado = ctx.estado;
  for (const id of new Set(alvos)) {
    const alvo = estado.players.find((p) => p.id === id);
    if (!alvo || alvo.status === 'morto') continue;

    const { protegido, preso, perfurado } = alvo.flags;
    const sobrevive = (protegido || preso) && !perfurado;

    if (sobrevive) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${nome(estado, id)} sobreviveu ao ataque.`,
        motivo: preso ? 'Preso pelo Xerife não morre.' : 'Estava protegido.',
        alvos: [id],
      });
      continue;
    }

    estado = matar(estado, id, 'matilha');
    // O estertor não dispara aqui: a etapa 9 varre quem morreu nesta etapa.
    estado = marcar(estado, id, { estertorPendente: true });
    ctx.log.registrar('resolucao-mortes', {
      mensagem: `${nome(estado, id)} morreu.`,
      motivo: perfurado
        ? 'Proteção removida pela perfuração na etapa 6.'
        : 'Sem proteção alguma.',
      alvos: [id],
    });
  }
  return { ...ctx, estado };
};
