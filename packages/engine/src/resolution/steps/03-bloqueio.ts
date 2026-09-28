import type { GameState } from '../../types/game-state';
import type { StepFn } from '../night-pipeline';
import { acoesDe, agendar, gravar, nome, roleEfetivaId } from './_helpers';

/**
 * Etapa 3 — Xerife e Taverneiro. O alvo fica bloqueado na noite SEGUINTE.
 *
 * Mudou em 2026-09-25, e a razão é a ordem real do jogo: o celular passa de um
 * em um, e a leitura da Vidente e do Detetive aparece na própria passagem.
 * Bloquear "nesta noite" só alcançava quem ainda não tinha passado — quem já
 * viu a resposta, já viu, e o poder virava sorteio de ordem de assento.
 *
 * Declarado hoje, valendo amanhã, o bloqueio alcança a mesa inteira. Quem
 * aplica é `prepararNoite`, antes de o aparelho começar a circular.
 *
 * O preso pelo Xerife também fica imune à morte, imunidade que o Feiticeiro
 * perfura na etapa 6 — na noite em que o bloqueio estiver valendo.
 */
export const bloqueio: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'bloqueio');
  if (acoes.length === 0) {
    ctx.log.ignorar('bloqueio', 'Ninguém bloqueou esta noite.');
    return ctx;
  }

  let estado = ctx.estado;
  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    const ator = estado.players.find((p) => p.id === acao.actorId);
    if (!alvo || !ator) continue;
    const prende = roleEfetivaId(ator, estado.rodada) === 'xerife';
    const amanha = estado.rodada + 1;

    const calaAVoz = prende && ator.varianteId === 'boca-calada';

    estado = agendar(estado, {
      kind: 'bloqueado-na-noite',
      naRodada: amanha,
      playerId: alvo,
      preso: prende,
      ...(calaAVoz ? { calaAVoz: true } : {}),
    });

    let extra = '';

    if (prende) {
      switch (ator.varianteId) {
        /**
         * Testemunha da Cela: a prisão vira informação pública em duas etapas.
         *
         * A cela dura DUAS noites e o preço é a transparência — a mesa sabe
         * quem está preso desde o primeiro dia, e no segundo descobre de que
         * lado ele estava. É o Xerife trocando surpresa por prova.
         */
        /**
         * Testemunha da Cela: UMA noite de cela, e a revelação no dia seguinte.
         *
         * Eram duas noites presas com a revelação na terceira rodada — tão
         * longe da prisão que a informação chegava sobre alguém que a mesa já
         * tinha esquecido. Relatado assim: "se prende na noite 1, no dia 2 ele
         * já tem que estar solto e apareceu o que aconteceu".
         *
         * Prende na noite 1 → fica preso na noite 2 → é solto e lido em voz
         * alta no amanhecer do dia 2. O bloqueio comum já foi agendado acima
         * para `amanha`; aqui só entra a revelação, na mesma rodada.
         */
        case 'testemunha-da-cela':
          estado = agendar(estado, { kind: 'revelar-preso', naRodada: amanha, playerId: alvo });
          estado = gravar(estado, alvo, { reveladoNaRodada: amanha });
          extra = ' No amanhecer seguinte ele sai da cela, e a mesa ouve de que lado ele está.';
          break;

        /**
         * Xerife de Si Mesmo: a cela também serve de abrigo.
         *
         * Prender-se dá imunidade a ataque (já vem do `preso`) e some da
         * investigação, ao custo de uma noite sem agir e um dia sem voto. A
         * validação de que ele PODE se escolher está no roteiro; aqui só se
         * acrescenta a parte que o `preso` comum não dá.
         */
        case 'xerife-de-si-mesmo':
          if (alvo === ator.id) {
            estado = agendar(estado, {
              kind: 'imune-investigacao',
              naRodada: amanha,
              playerId: alvo,
            });
            extra = ' Ele se trancou: imune a ataque e a investigação, sem agir nem votar.';
          }
          break;

        /**
         * Boca Calada: a cela cala.
         *
         * É a única diferença, e ela é grande num jogo decidido na conversa: o
         * preso do Xerife comum passa o dia se defendendo, e o deste não diz
         * uma palavra nem vota.
         */
        case 'boca-calada':
          extra = ' E o preso não fala nem vota no dia seguinte.';
          break;

        default:
          break;
      }
    } else {
      switch (ator.varianteId) {
        /** Última Dose: o Taverneiro nunca serve a mesma pessoa duas vezes. */
        case 'ultima-dose':
          estado = gravar(estado, alvo, { jaEmbebedado: true });
          extra = ' Ele não pode ser embebedado de novo nesta partida.';
          break;

        /**
         * Ressaca da Vila: o alvo descobre, mas tarde.
         *
         * O Taverneiro normal nunca avisa. Esta variante avisa uma noite DEPOIS
         * do bloqueio — tempo suficiente para o jogador já ter jogado o dia
         * inteiro achando que o poder dele tinha funcionado.
         */
        case 'ressaca-da-vila':
          estado = agendar(estado, {
            kind: 'visao-atrasada',
            naRodada: amanha + 1,
            paraId: alvo,
            texto: 'Você bebeu demais: sua ação da noite passada não teve efeito.',
          });
          extra = ' Ele só vai descobrir depois de amanhã.';
          break;

        /**
         * Bebida Forte: um dia inteiro fora, e depois dois goles de uma vez.
         *
         * O preço é alto para a vila (um poder a menos e um voto a menos) e o
         * troco é real (duas ações na noite seguinte), o que faz do Taverneiro
         * uma role que a própria vila pode querer usar em si mesma.
         */
        case 'bebida-forte':
          estado = gravar(estado, alvo, { acaoDuplaNaRodada: amanha + 1 });
          estado = marcarSemVoto(estado, alvo);
          extra = ' Não vota amanhã, e depois age duas vezes.';
          break;

        default:
          break;
      }
    }

    ctx.log.registrar('bloqueio', {
      mensagem: `${ator.nome} ${prende ? 'prendeu' : 'embebedou'} ${nome(estado, alvo)}.`,
      motivo:
        (prende
          ? 'Vale na PRÓXIMA noite: preso não age e não morre. Continua falando e votando.'
          : 'Vale na PRÓXIMA noite: o poder falha e o jogador não é avisado.') + extra,
      atores: [acao.actorId],
      alvos: [alvo],
    });
  }
  return { ...ctx, estado };
};

function marcarSemVoto(estado: GameState, id: string): GameState {
  return {
    ...estado,
    players: estado.players.map((p) => (p.id === id ? { ...p, semVoto: true } : p)),
  };
}
