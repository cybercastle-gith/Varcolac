import type { PlayerId } from '../../types/player';
import type { StepFn } from '../night-pipeline';
import { acoesDe } from './_helpers';
import { dispararEstertores } from '../estertor-chain';

/**
 * Etapa 9 — Caçador, Carniçal, Anciã, Amor Proibido.
 *
 * A cadeia em si vive em `estertor-chain.ts`, porque linchamento também mata e
 * também dispara estertor. Esta etapa só recolhe quem morreu na etapa 8, passa
 * os alvos declarados à noite (Caçador Armadilha) e transcreve o resultado.
 */
export const estertores: StepFn = (ctx) => {
  const pendentes = ctx.estado.players
    .filter((p) => p.flags.estertorPendente)
    .map((p) => p.id);

  if (pendentes.length === 0) {
    ctx.log.ignorar('estertores', 'Ninguém morreu na etapa 8.');
    return ctx;
  }

  const declarados = new Map<PlayerId, PlayerId>();
  for (const a of acoesDe(ctx, 'estertores')) {
    if (a.alvos[0]) declarados.set(a.actorId, a.alvos[0]);
  }

  const { estado, registros } = dispararEstertores(ctx.estado, pendentes, declarados);

  if (registros.length === 0) {
    ctx.log.ignorar('estertores', 'Ninguém que morreu tinha estertor.');
    return { ...ctx, estado };
  }

  for (const r of registros) ctx.log.registrar('estertores', r);
  return { ...ctx, estado };
};
