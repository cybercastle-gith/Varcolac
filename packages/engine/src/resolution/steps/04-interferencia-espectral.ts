import { mortos } from '../../types/game-state';
import { moduloAtivo } from '../../data/ghosts';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import { acoesDeFantasmas, entregarInfo, gastarUso, marcar, nome } from './_helpers';

/**
 * Etapa 4 — Assombrar e Pesadelo. Fantasmas agem DEPOIS dos vivos, o que
 * garante que a interferência incida sobre escolhas já feitas.
 *
 * Módulos coletivos (Conselho, Julgamento) não passam por aqui: eles acontecem
 * no dia, junto da votação.
 */
export const interferenciaEspectral: StepFn = (ctx) => {
  const ativos = ctx.estado.config.modulosDeFantasma;
  if (ativos.length === 0) {
    ctx.log.ignorar('interferencia-espectral', 'Nenhum módulo de fantasma ativo.');
    return ctx;
  }

  const acoes = acoesDeFantasmas(ctx, 'interferencia-espectral');
  if (acoes.length === 0) {
    ctx.log.ignorar('interferencia-espectral', 'Nenhum fantasma agiu esta noite.');
    return ctx;
  }

  const quantosMortos = mortos(ctx.estado).length;
  let estado = ctx.estado;

  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    if (!alvo) continue;

    const modulo = acao.kind === 'assombrar' ? 'assombrar' : 'pesadelo';
    if (!moduloAtivo(modulo, ativos, quantosMortos)) {
      ctx.log.registrar('interferencia-espectral', {
        mensagem: `${nome(estado, acao.actorId)} tentou ${modulo}, sem efeito.`,
        motivo: `Módulo ${modulo} não está ativo ou ainda não há mortos suficientes.`,
        atores: [acao.actorId],
      });
      continue;
    }

    if (estado.players.find((p) => p.id === acao.actorId)!.usosRestantes <= 0) {
      ctx.log.registrar('interferencia-espectral', {
        mensagem: `${nome(estado, acao.actorId)} já gastou o seu ${modulo}.`,
        motivo: 'Usos fixos por partida — é o que impede o fantasma de agir toda noite.',
        atores: [acao.actorId],
      });
      continue;
    }

    if (modulo === 'assombrar') {
      // Assombrar bloqueia: a ação do vivo falha, exatamente como na etapa 3.
      estado = marcar(estado, alvo, { assombrado: true, bloqueado: true });
      ctx.log.registrar('interferencia-espectral', {
        mensagem: `${nome(estado, acao.actorId)} assombrou ${nome(estado, alvo)}.`,
        motivo: 'Se o alvo tiver ação noturna, ela falha.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
    } else {
      // O fantasma escolhe se a informação é verdadeira ou falsa.
      const verdadeira = acao.escolha !== 'falsa';
      const sobre = acao.alvos[1] ?? alvo;
      estado = entregarInfo(estado, {
        rodada: estado.rodada,
        paraId: alvo,
        origem: 'fantasma',
        texto:
          acao.texto ??
          `${nome(estado, sobre)} é ${role(estado.players.find((p) => p.id === sobre)!.roleId).faccao}.`,
        verdadeira,
        sobre: [sobre],
      });
      ctx.log.registrar('interferencia-espectral', {
        mensagem: `${nome(estado, acao.actorId)} enviou um pesadelo a ${nome(estado, alvo)}.`,
        motivo: `Informação ${verdadeira ? 'verdadeira' : 'FALSA'}, escolha do fantasma.`,
        atores: [acao.actorId],
        alvos: [alvo],
      });
    }

    estado = gastarUso(estado, acao.actorId);
  }

  return { ...ctx, estado };
};
