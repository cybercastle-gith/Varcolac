import type { PlayerId } from '../../types/player';
import type { StepFn } from '../night-pipeline';
import { acoesDe, gravar, nome } from './_helpers';
import { dispararEstertores } from '../estertor-chain';

/**
 * Etapa 9 — Caçador, Carniçal, Anciã, Amor Proibido.
 *
 * A cadeia em si vive em `estertor-chain.ts`, porque linchamento também mata e
 * também dispara estertor. Esta etapa só recolhe quem morreu na etapa 8, passa
 * os alvos declarados à noite (Caçador Armadilha, Testamento e Herança Amarga
 * da Anciã) e transcreve o resultado.
 */
export const estertores: StepFn = (ctx) => {
  let estado = ctx.estado;

  const declarados = new Map<PlayerId, PlayerId>();
  const apostas: { quem: PlayerId; alvo: PlayerId }[] = [];

  for (const a of acoesDe(ctx, 'estertores')) {
    const ator = estado.players.find((p) => p.id === a.actorId);
    if (!a.alvos[0] || !ator) continue;
    /**
     * Última Carne: a aposta é feita DEPOIS de morrer.
     *
     * É a única ação do jogo declarada por um jogador morto fora dos módulos de
     * fantasma, e por isso `acoesDe` abre exceção para a etapa `estertores`. A
     * marca fica gravada e é cobrada na etapa 8 de qualquer noite seguinte, ou
     * na votação, quando o nome apostado cair.
     */
    if (ator.status === 'morto' && ator.varianteId === 'ultima-carne') {
      apostas.push({ quem: ator.id, alvo: a.alvos[0] });
      continue;
    }
    declarados.set(a.actorId, a.alvos[0]);
  }

  for (const { quem, alvo } of apostas) {
    estado = gravar(estado, quem, { ressuscitaSeMorrer: alvo });
    ctx.log.registrar('estertores', {
      mensagem: `${nome(estado, quem)} apostou em ${nome(estado, alvo)}.`,
      motivo: 'Variante Última Carne: se esse jogador morrer, o Carniçal volta à vida.',
      atores: [quem],
      alvos: [alvo],
    });
  }

  const pendentes = estado.players.filter((p) => p.flags.estertorPendente).map((p) => p.id);

  if (pendentes.length === 0) {
    if (apostas.length === 0) ctx.log.ignorar('estertores', 'Ninguém morreu na etapa 8.');
    return { ...ctx, estado };
  }

  /**
   * Quem matou quem, para o Sangue Derramado do Carniçal.
   *
   * Sai das declarações de ataque desta noite: o primeiro atacante que mirou o
   * morto é o culpado. Não é perfeito quando dois lobos miram o mesmo alvo —
   * mas a matilha decide junta, e escolher o primeiro é tão arbitrário quanto
   * qualquer outro critério e muito mais barato de explicar no log.
   */
  const culpados = new Map<PlayerId, PlayerId>();
  for (const a of acoesDe(ctx, 'ataque')) {
    for (const alvo of a.alvos) {
      if (pendentes.includes(alvo) && !culpados.has(alvo)) culpados.set(alvo, a.actorId);
    }
  }

  const resultado = dispararEstertores(estado, pendentes, declarados, culpados);
  estado = resultado.estado;

  if (resultado.registros.length === 0) {
    ctx.log.ignorar('estertores', 'Ninguém que morreu tinha estertor.');
    return { ...ctx, estado };
  }

  for (const r of resultado.registros) ctx.log.registrar('estertores', r);
  return { ...ctx, estado };
};
