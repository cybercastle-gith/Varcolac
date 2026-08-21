import { efeitoDo } from '../../types/event';
import { EVENTOS_POR_ID } from '../../data/events/index';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import { acoesDe, nome } from './_helpers';
import { cotaDaMatilha } from './_ataques';

/**
 * Etapa 7 — Matilha, Lobo Branco, Bruxa. Só DECLARAM alvos; ninguém morre aqui.
 * Declarar em separado de matar é o que permite que proteção, perfuração e
 * cancelamento se cruzem numa etapa só, a 8.
 */
export const ataque: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'ataque');
  const cota = cotaDaMatilha(ctx.estado);

  if (cota === 0) {
    const ev = ctx.estado.eventoDaNoite ? EVENTOS_POR_ID.get(ctx.estado.eventoDaNoite) : undefined;
    ctx.log.ignorar(
      'ataque',
      ev && efeitoDo(ev, 'matilha-mata-n')?.n === 0
        ? `${ev.nome}: a matilha não mata esta noite.`
        : 'A matilha não tem ataque disponível esta noite.',
    );
    return ctx;
  }

  if (acoes.length === 0) {
    ctx.log.ignorar('ataque', 'Nenhum ataque declarado.');
    return ctx;
  }

  for (const acao of acoes) {
    const ator = ctx.estado.players.find((p) => p.id === acao.actorId)!;
    const daMatilha = role(ator.roleId).faccao === 'lobos';
    // A cota vale para a matilha; Bruxa e Lobo Branco atacam por conta própria.
    const alvos = daMatilha ? acao.alvos.slice(0, cota) : acao.alvos;

    for (const alvo of alvos) {
      ctx.log.registrar('ataque', {
        mensagem: `${ator.nome} declarou ataque a ${nome(ctx.estado, alvo)}.`,
        motivo:
          daMatilha && cota > 1
            ? `Declaração apenas. A matilha mata ${cota} esta noite.`
            : 'Declaração apenas — a morte é resolvida na etapa 8.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
    }
  }

  return ctx;
};
