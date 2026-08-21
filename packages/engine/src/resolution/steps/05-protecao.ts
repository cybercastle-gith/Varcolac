import { temEfeito } from '../../types/effect';
import { vivos } from '../../types/game-state';
import { EVENTOS_POR_ID } from '../../data/events/index';
import type { StepFn } from '../night-pipeline';
import { acoesDe, gastarUso, marcar, nome, temUso } from './_helpers';

/**
 * Etapa 5 — Médico, Guarda-costas, Padre. Só MARCA quem está protegido;
 * nenhuma morte é resolvida aqui.
 *
 * O Padre é diferente: ele não protege ninguém, cancela a noite inteira. Por
 * isso vence o Feiticeiro, que só perfura proteções individuais.
 */
export const protecao: StepFn = (ctx) => {
  let estado = ctx.estado;
  let etapasCanceladas = ctx.etapasCanceladas;

  // Chuva de Sangue: todas as proteções falham. Marcar seria mentira no log.
  const ev = estado.eventoDaNoite ? EVENTOS_POR_ID.get(estado.eventoDaNoite) : undefined;
  if (ev?.efeitos.some((e) => e.kind === 'anula-protecoes')) {
    ctx.log.ignorar('protecao', `${ev.nome}: todas as proteções falham esta noite.`);
    return ctx;
  }

  // Luto Sagrado: a vila inteira amanhece protegida, sem ninguém ter agido.
  if (temEfeito(estado.efeitos, estado.rodada, 'protecao-coletiva')) {
    for (const p of vivos(estado)) estado = marcar(estado, p.id, { protegido: true });
    ctx.log.registrar('protecao', {
      mensagem: 'A vila inteira está protegida esta noite.',
      motivo: 'Luto Sagrado, disparado pela morte do Padre ou do Guarda-costas.',
      alvos: vivos(estado).map((p) => p.id),
    });
  }

  const acoes = acoesDe(ctx, 'protecao');
  if (acoes.length === 0) {
    if (estado === ctx.estado) ctx.log.ignorar('protecao', 'Ninguém protegeu esta noite.');
    return { ...ctx, estado };
  }

  for (const acao of acoes) {
    const ator = estado.players.find((p) => p.id === acao.actorId)!;

    if (ator.roleId === 'padre') {
      if (!temUso(estado, ator.id)) {
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} já usou o poder do Padre.`,
          motivo: 'Uma vez por partida.',
          atores: [ator.id],
        });
        continue;
      }
      estado = gastarUso(estado, ator.id);
      etapasCanceladas = [
        ...etapasCanceladas,
        {
          etapa: 'resolucao-mortes',
          motivo: `${ator.nome} (Padre) anulou todas as mortes desta noite.`,
        },
      ];
      ctx.log.registrar('protecao', {
        mensagem: `${ator.nome} anulou todas as mortes desta noite.`,
        motivo: 'O Padre não protege ninguém: cancela a noite inteira. Vence o Feiticeiro.',
        atores: [ator.id],
      });
      continue;
    }

    for (const alvo of acao.alvos) {
      estado = marcar(estado, alvo, { protegido: true });
      ctx.log.registrar('protecao', {
        mensagem: `${ator.nome} protegeu ${nome(estado, alvo)}.`,
        motivo:
          ator.roleId === 'guarda-costas'
            ? 'Guarda-costas: se o alvo for atacado, ele morre no lugar.'
            : 'Marca apenas; a morte é decidida na etapa 8.',
        atores: [ator.id],
        alvos: [alvo],
      });
    }
  }

  return { ...ctx, estado, etapasCanceladas };
};
