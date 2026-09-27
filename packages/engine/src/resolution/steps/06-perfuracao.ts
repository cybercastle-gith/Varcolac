import type { StepFn } from '../night-pipeline';
import { acoesDe, entregarInfo, gravar, marcar, nome } from './_helpers';

/**
 * Etapa 6 — Feiticeiro. Remove proteções e imunidades do alvo da matilha.
 * Não é bloqueador; é perfurador. Se o Padre já cancelou a noite na etapa 5,
 * a etapa 8 não roda e a perfuração não serve de nada — é o conflito documentado.
 */
export const perfuracao: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'perfuracao');
  if (acoes.length === 0) {
    ctx.log.ignorar('perfuracao', 'Ninguém perfurou esta noite.');
    return ctx;
  }

  let estado = ctx.estado;

  // Quem protegeu quem, para o Olho do Diabo poder devolver o nome.
  const protetores = acoesDe(ctx, 'protecao').flatMap((a) =>
    a.alvos.map((alvo) => ({ quem: a.actorId, alvo })),
  );

  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    const ator = estado.players.find((p) => p.id === acao.actorId);
    if (!alvo || !ator) continue;

    const vitima = estado.players.find((p) => p.id === alvo)!;
    const estavaProtegido = vitima.flags.protegido;

    switch (ator.varianteId) {
      /**
       * Fio de Prata: atravessa a cura, mas não a cela.
       *
       * A distinção que a variante pede é entre proteção (Médico, Guarda-costas,
       * Luto Sagrado) e imunidade (o preso do Xerife, que não morre por
       * definição). O Feiticeiro base leva as duas; este leva só a primeira, e
       * em troca vale menos peso.
       */
      case 'fio-de-prata':
        estado = marcar(estado, alvo, { perfurado: true, protegido: false });
        ctx.log.registrar('perfuracao', {
          mensagem: `${ator.nome} perfurou a proteção de ${vitima.nome}.`,
          motivo: 'Variante Fio de Prata: a cura cai, a imunidade do preso continua de pé.',
          atores: [ator.id],
          alvos: [alvo],
        });
        break;

      /**
       * Marca de Ferro: o alvo fica queimado para sempre.
       *
       * É a única perfuração que sobrevive à noite. A matilha não precisa
       * acertar hoje — basta marcar alguém importante e voltar quando quiser,
       * sabendo que nenhuma cura vai chegar a tempo.
       */
      case 'marca-de-ferro':
        estado = marcar(estado, alvo, { perfurado: true, protegido: false, preso: false });
        estado = gravar(estado, alvo, { naoProtegivel: true });
        ctx.log.registrar('perfuracao', {
          mensagem: `${ator.nome} marcou ${vitima.nome} a ferro.`,
          motivo: 'Variante Marca de Ferro: ele não pode mais receber proteção nesta partida.',
          atores: [ator.id],
          alvos: [alvo],
        });
        break;

      /**
       * Olho do Diabo: a perfuração vira reconhecimento.
       *
       * Saber QUEM curou vale mais para a matilha do que a morte de hoje: o
       * nome do Médico é a informação mais cara da vila, e ela sai daqui sem a
       * vila perceber que saiu.
       */
      case 'olho-do-diabo': {
        estado = marcar(estado, alvo, { perfurado: true, protegido: false, preso: false });
        const quem = protetores.filter((x) => x.alvo === alvo).map((x) => nome(estado, x.quem));
        estado = entregarInfo(estado, {
          rodada: estado.rodada,
          paraId: ator.id,
          origem: 'app',
          texto:
            quem.length > 0
              ? `${vitima.nome} estava protegido por ${quem.join(' e ')}.`
              : `${vitima.nome} não recebeu proteção nenhuma esta noite.`,
          verdadeira: true,
          sobre: [alvo],
        });
        ctx.log.registrar('perfuracao', {
          mensagem: `${ator.nome} perfurou ${vitima.nome} e viu quem o cobria.`,
          motivo:
            quem.length > 0
              ? `Variante Olho do Diabo: protegido por ${quem.join(' e ')}.`
              : 'Variante Olho do Diabo: ninguém o protegia.',
          atores: [ator.id],
          alvos: [alvo],
        });
        break;
      }

      default:
        estado = marcar(estado, alvo, { perfurado: true, protegido: false, preso: false });
        ctx.log.registrar('perfuracao', {
          mensagem: `${ator.nome} perfurou ${vitima.nome}.`,
          motivo: estavaProtegido
            ? 'Proteções e imunidades individuais do alvo foram removidas.'
            : 'O alvo não tinha proteção; a perfuração não encontrou nada para remover.',
          atores: [ator.id],
          alvos: [alvo],
        });
        break;
    }
  }
  return { ...ctx, estado };
};
