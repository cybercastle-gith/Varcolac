import { temEfeito } from '../../types/effect';
import { vivos } from '../../types/game-state';
import { EVENTOS_POR_ID } from '../../data/events/index';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import {
  acoesDe,
  agendar,
  anunciar,
  gastarUso,
  gravar,
  marcar,
  nome,
  roleEfetivaId,
  temUso,
} from './_helpers';
import { protecaoBloqueada } from './_protecao';

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

    /**
     * Lobo Sombra: some da investigação na noite SEGUINTE.
     *
     * Adiado pelo mesmo motivo do bloqueio (ver etapa 3) — e aqui o problema
     * era gritante: se ele fosse o último a receber o aparelho, a Vidente já
     * tinha lido a resposta dele e a imunidade não servia para nada.
     *
     * O uso é gasto AQUI. Antes não era gasto em lugar nenhum, e por isso ele
     * conseguia se esconder toda noite apesar de ser uma vez por partida.
     */
    const comoAge = roleEfetivaId(ator, estado.rodada);

    if (comoAge === 'lobo-sombra') {
      if (!temUso(estado, ator.id)) {
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} já gastou o esconderijo.`,
          motivo: 'Uma vez por partida.',
          atores: [ator.id],
        });
        continue;
      }
      estado = gastarUso(estado, ator.id);
      const amanha = estado.rodada + 1;
      const escolhido = acao.alvos[0];

      /**
       * Sombra de Alguém: em vez de sumir, ele VESTE outra pessoa.
       *
       * Na noite seguinte joga com o papel do escolhido — e a imunidade só vem
       * de brinde se o escolhido não for da matilha, porque vestir um lobo não
       * esconde nada de uma Vidente.
       */
      if (ator.varianteId === 'sombra-de-alguem' && escolhido) {
        const alvoP = estado.players.find((x) => x.id === escolhido)!;
        const ehLobo = role(alvoP.roleId).faccao === 'lobos';
        estado = gravar(estado, ator.id, {
          poderDe: alvoP.roleId,
          poderEmprestadoAte: amanha,
        });
        if (!ehLobo) {
          estado = agendar(estado, {
            kind: 'imune-investigacao',
            naRodada: amanha,
            playerId: ator.id,
          });
        }
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} vestiu o papel de ${alvoP.nome} para a próxima noite.`,
          motivo: ehLobo
            ? 'Variante Sombra de Alguém. Copiou um lobo: sem imunidade de brinde.'
            : 'Variante Sombra de Alguém. Não é lobo, então ele também some da investigação.',
          atores: [ator.id],
          alvos: [escolhido],
        });
        continue;
      }

      /**
       * Máscara de Luto: a imunidade é condicional e ele não controla nada.
       *
       * "Se nenhuma morte acontecer naquela noite" só se sabe depois da etapa
       * 8, então a checagem mora no fim da noite (ver `fecharNoite`). Aqui só
       * se registra a aposta e se gasta o uso.
       */
      if (ator.varianteId === 'mascara-de-luto') {
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} apostou na Máscara de Luto.`,
          motivo:
            'Se ninguém morrer esta noite, ele fica imune à investigação amanhã. ' +
            'Se alguém morrer, o uso foi queimado à toa.',
          atores: [ator.id],
        });
        continue;
      }

      /**
       * Nome Roubado: a investigação devolve o papel de um MORTO.
       *
       * É melhor que sumir, porque "da vila" some no meio das leituras
       * honestas: aqui a Vidente recebe um nome de role concreto e sai com uma
       * certeza falsa, que é muito mais difícil de desfazer na mesa.
       */
      if (ator.varianteId === 'nome-roubado' && escolhido) {
        const mortoP = estado.players.find((x) => x.id === escolhido)!;
        estado = agendar(estado, {
          kind: 'imune-investigacao',
          naRodada: amanha,
          playerId: ator.id,
        });
        estado = gravar(estado, ator.id, { disfarceDe: mortoP.roleId });
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} vestiu o nome de ${mortoP.nome}.`,
          motivo: 'Variante Nome Roubado: quem o investigar lê o papel do morto.',
          atores: [ator.id],
          alvos: [escolhido],
        });
        continue;
      }

      estado = agendar(estado, {
        kind: 'imune-investigacao',
        naRodada: amanha,
        playerId: ator.id,
      });
      ctx.log.registrar('protecao', {
        mensagem: `${ator.nome} vai sumir da investigação na próxima noite.`,
        motivo: 'Uma vez por partida. Quem o investigar amanhã lê "da vila".',
        atores: [ator.id],
      });
      continue;
    }

    if (comoAge === 'padre') {
      if (!temUso(estado, ator.id)) {
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} já usou o poder do Padre.`,
          motivo: 'Uma vez por partida.',
          atores: [ator.id],
        });
        continue;
      }
      estado = gastarUso(estado, ator.id);

      /**
       * Sino da Igreja: o Padre não salva ninguém, ele cala o dia.
       *
       * É a mesma economia do Padre base — um uso por partida, efeito
       * coletivo —, só que gasto no outro lado do relógio: em vez de apagar as
       * mortes da noite, apaga o julgamento do dia seguinte. Serve quando a
       * vila está prestes a linchar alguém que o Padre sabe ser inocente.
       */
      if (ator.varianteId === 'sino') {
        /*
         * `rodada`, não `rodada + 1`.
         *
         * O dia vem DEPOIS da noite dentro da mesma rodada: a votação da rodada
         * 1 acontece na manhã seguinte à noite 1. Agendando para `rodada + 1` o
         * sino tocava na noite 1 e a votação do dia 1 acontecia normalmente —
         * só a do dia 2 caía, uma rodada tarde demais para servir de qualquer
         * coisa a quem tocou o sino.
         */
        estado = agendar(estado, { kind: 'sem-votacao', naRodada: estado.rodada });
        estado = anunciar(estado, 'O Padre tocou o sino: não haverá votação hoje.', 'role');
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} tocou o sino: não haverá votação amanhã.`,
          motivo: 'Variante Sino da Igreja. Uma vez por partida.',
          atores: [ator.id],
        });
        continue;
      }

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
      const impedimento = protecaoBloqueada(estado, alvo);
      if (impedimento) {
        ctx.log.registrar('protecao', {
          mensagem: `${ator.nome} não conseguiu proteger ${nome(estado, alvo)}.`,
          motivo: impedimento,
          atores: [ator.id],
          alvos: [alvo],
        });
        continue;
      }

      estado = marcar(estado, alvo, { protegido: true });
      ctx.log.registrar('protecao', {
        mensagem: `${ator.nome} protegeu ${nome(estado, alvo)}.`,
        motivo:
          comoAge === 'guarda-costas'
            ? ator.varianteId === 'muralha'
              ? 'Variante Muralha: cobre dois, e basta um ser atacado para ele morrer.'
              : 'Guarda-costas: se o alvo for atacado, ele morre no lugar.'
            : 'Marca apenas; a morte é decidida na etapa 8.',
        atores: [ator.id],
        alvos: [alvo],
      });
    }

    /**
     * Médico de Guerra: cura dois e paga com o anonimato.
     *
     * A revelação é o que equilibra a cura dobrada — a partir de amanhã a
     * matilha sabe exatamente quem tirar do caminho primeiro.
     */
    /**
     * Médico de Guerra: a revelação é o preço da cura DOBRADA.
     *
     * Se ele curou uma pessoa só, não usou a variante — usou um Médico comum, e
     * cobrar o anonimato por isso é punir sem entregar nada. Decisão do usuário
     * em 2026-09-26.
     */
    if (comoAge === 'medico' && ator.varianteId === 'de-guerra' && acao.alvos.length >= 2) {
      estado = anunciar(
        estado,
        `${ator.nome} é o Médico: protegeu duas pessoas esta noite.`,
        'role',
        { rotulo: 'Médico revelado' },
      );
      ctx.log.registrar('protecao', {
        mensagem: `${ator.nome} amanheceu revelado.`,
        motivo: 'Variante Médico de Guerra: cura dois, mas a mesa inteira fica sabendo quem é.',
        atores: [ator.id],
      });
    }
  }

  return { ...ctx, estado, etapasCanceladas };
};
