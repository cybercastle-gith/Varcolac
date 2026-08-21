import type { StepFn } from '../night-pipeline';
import { acoesDe, anunciar, gastarUso, nome, reviver, temUso } from './_helpers';

/**
 * Etapa 10 — Necromante. APENAS mortes de noites ANTERIORES.
 *
 * Não desfaz estertores já disparados: se o Caçador atirou, o tiro vale. Isso
 * cai de graça da ordem das etapas — a 9 já rodou, e a cadeia não é revisitada.
 */
export const ressurreicao: StepFn = (ctx) => {
  const elegiveis = ctx.estado.players.filter(
    (p) => p.status === 'morto' && (p.mortoNaRodada ?? 0) < ctx.estado.rodada,
  );

  if (elegiveis.length === 0) {
    ctx.log.ignorar('ressurreicao', 'Nenhuma morte de noite anterior para desfazer.');
    return ctx;
  }

  const acoes = acoesDe(ctx, 'ressurreicao');
  if (acoes.length === 0) {
    ctx.log.ignorar('ressurreicao', 'O Necromante não agiu esta noite.');
    return ctx;
  }

  let estado = ctx.estado;

  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    if (!alvo) continue;

    if (!temUso(estado, acao.actorId)) {
      ctx.log.registrar('ressurreicao', {
        mensagem: `${nome(estado, acao.actorId)} já ressuscitou alguém nesta partida.`,
        motivo: 'Uma vez por partida.',
        atores: [acao.actorId],
      });
      continue;
    }

    const morto = estado.players.find((p) => p.id === alvo);
    if (!morto || morto.status === 'vivo') continue;

    if ((morto.mortoNaRodada ?? 0) >= estado.rodada) {
      ctx.log.registrar('ressurreicao', {
        mensagem: `${morto.nome} não pode voltar.`,
        motivo: 'Morreu nesta mesma noite; o Necromante só desfaz noites anteriores.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
      continue;
    }

    estado = reviver(estado, alvo);
    estado = gastarUso(estado, acao.actorId);
    estado = anunciar(estado, `${morto.nome} voltou.`, 'role');
    ctx.log.registrar('ressurreicao', {
      mensagem: `${nome(estado, acao.actorId)} ressuscitou ${morto.nome}.`,
      motivo: 'Morte de noite anterior. Estertores já disparados continuam valendo.',
      atores: [acao.actorId],
      alvos: [alvo],
    });
  }

  return { ...ctx, estado };
};
