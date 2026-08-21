import type { CauseOfDeath, PlayerId } from '../../types/player';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import { acoesDe, agendar, marcar, matar, nome } from './_helpers';
import { alvosDaMatilha, ataqueIndividual } from './_ataques';

/**
 * Etapa 8 — cruza ataques com proteções e perfurações e decide quem morre.
 * É a única etapa que mata por ataque; estertores vêm na 9.
 */
export const resolucaoMortes: StepFn = (ctx) => {
  const ataques = acoesDe(ctx, 'ataque');
  const protecoes = acoesDe(ctx, 'protecao');

  // Quem cada guarda-costas está cobrindo, para a troca de vida na hora certa.
  const guardas = protecoes
    .filter((a) => role(ctx.estado.players.find((p) => p.id === a.actorId)!.roleId).id === 'guarda-costas')
    .flatMap((a) => a.alvos.map((alvo) => ({ guardaId: a.actorId, alvo })));

  const alvos: { alvo: PlayerId; atacanteId: PlayerId; causa: CauseOfDeath }[] = [];

  // A matilha mata JUNTA: os votos dos lobos viram um alvo só (ou `cota`).
  for (const { alvo, votos, desempatado } of alvosDaMatilha(ctx.estado, ataques, ctx.rng)) {
    const primeiroLobo = ataques.find((a) => a.alvos.includes(alvo))?.actorId ?? '';
    alvos.push({ alvo, atacanteId: primeiroLobo, causa: 'matilha' });
    if (desempatado) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: 'A matilha se dividiu; o alvo saiu por sorteio entre os empatados.',
        motivo: `${votos} voto(s) para ${nome(ctx.estado, alvo)}.`,
        alvos: [alvo],
      });
    }
  }

  // Lobo Branco e Bruxa atacam por conta própria, fora da cota da matilha.
  for (const a of ataques) {
    const atacante = ctx.estado.players.find((p) => p.id === a.actorId)!;
    if (!ataqueIndividual(atacante.roleId)) continue;
    const causa: CauseOfDeath = atacante.roleId === 'bruxa' ? 'bruxa' : 'lobo-branco';
    for (const alvo of a.alvos) alvos.push({ alvo, atacanteId: a.actorId, causa });
  }

  if (alvos.length === 0) {
    ctx.log.ignorar('resolucao-mortes', 'Nenhum ataque para resolver.');
    return ctx;
  }

  let estado = ctx.estado;
  const jaResolvidos = new Set<PlayerId>();

  for (const { alvo, atacanteId, causa } of alvos) {
    if (jaResolvidos.has(alvo)) continue;
    jaResolvidos.add(alvo);

    const vitima = estado.players.find((p) => p.id === alvo);
    if (!vitima || vitima.status === 'morto') continue;

    const { protegido, preso, perfurado } = vitima.flags;

    // O Guarda-costas entra ANTES da checagem de proteção: ele não impede o
    // ataque, ele recebe o ataque no lugar do protegido.
    const guarda = guardas.find((g) => g.alvo === alvo);
    if (guarda && !perfurado) {
      const g = estado.players.find((p) => p.id === guarda.guardaId)!;
      if (g.varianteId === 'escudo') {
        // Escudo: absorve agora e morre uma noite depois.
        estado = agendar(estado, {
          kind: 'expira',
          naRodada: estado.rodada + 1,
          playerId: g.id,
        });
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${g.nome} absorveu o ataque a ${vitima.nome}.`,
          motivo: 'Variante Escudo: ele morre na noite seguinte, não agora.',
          alvos: [alvo, g.id],
        });
        continue;
      }

      estado = matar(estado, g.id, 'guarda-costas');
      estado = marcar(estado, g.id, { estertorPendente: true });
      let motivo = 'Guarda-costas morre no lugar do protegido.';

      if (g.varianteId === 'sacrificio') {
        const atacante = estado.players.find((p) => p.id === atacanteId);
        if (atacante && atacante.status === 'vivo') {
          estado = matar(estado, atacante.id, 'guarda-costas');
          estado = marcar(estado, atacante.id, { estertorPendente: true });
          motivo += ` Variante Sacrifício: levou ${atacante.nome} junto.`;
        }
      }

      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${g.nome} morreu no lugar de ${vitima.nome}.`,
        motivo,
        alvos: [alvo, g.id],
      });
      continue;
    }

    if ((protegido || preso) && !perfurado) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${vitima.nome} sobreviveu ao ataque.`,
        motivo: preso ? 'Preso pelo Xerife não morre.' : 'Estava protegido.',
        alvos: [alvo],
      });
      continue;
    }

    estado = matar(estado, alvo, causa);
    // O estertor não dispara aqui: a etapa 9 varre quem morreu nesta etapa.
    estado = marcar(estado, alvo, { estertorPendente: true });
    ctx.log.registrar('resolucao-mortes', {
      mensagem: `${vitima.nome} morreu.`,
      motivo: perfurado
        ? 'Proteção removida pela perfuração na etapa 6.'
        : 'Sem proteção alguma.',
      alvos: [alvo],
    });
  }

  return { ...ctx, estado };
};
