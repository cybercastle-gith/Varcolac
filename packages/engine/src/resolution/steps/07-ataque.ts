import { efeitoDo } from '../../types/event';
import { EVENTOS_POR_ID } from '../../data/events/index';
import { role } from '../../data/roles/index';
import { faccaoEfetiva } from '../../turn/faccao';
import type { StepFn } from '../night-pipeline';
import { acoesDe, agendar, anunciar, gastarUso, gravar, nome, temUso } from './_helpers';
import { trocarCarta } from '../../turn/troca-de-carta';
import { ataqueIndividual, cotaDaMatilha, quantosLobosVivos } from './_ataques';

/**
 * Etapa 7 — Matilha, Lobo Branco, Bruxa. Só DECLARAM alvos; ninguém morre aqui.
 * Declarar em separado de matar é o que permite que proteção, perfuração e
 * cancelamento se cruzem numa etapa só, a 8.
 *
 * As exceções são as habilidades que NÃO são ataque e acontecem nesta etapa
 * porque substituem a caçada da noite: o uivo do Uivador e a conversão do Alfa.
 * Essas se resolvem aqui mesmo, porque não há morte para cruzar com nada.
 */
export const ataque: StepFn = (ctx) => {
  const todas = acoesDe(ctx, 'ataque');
  let estado = ctx.estado;

  // ── O uivo: delatar em vez de caçar ──────────────────────────────────────
  for (const acao of todas.filter((a) => a.escolha === 'uivar')) {
    const ator = estado.players.find((p) => p.id === acao.actorId)!;
    if (!temUso(estado, ator.id)) continue;
    estado = gastarUso(estado, ator.id);

    /**
     * Uivo de Manada: um número, sem nome nenhum.
     *
     * É o único uivo que não entrega ninguém — e por isso é o único que a
     * matilha pode querer. Dizer "somos três" num 9 × 3 pode assustar a vila
     * tanto quanto a informação a ajuda.
     */
    if (ator.varianteId === 'uivo-de-manada') {
      const n = quantosLobosVivos(estado);
      estado = anunciar(
        estado,
        `O Uivador anunciou: ${n === 1 ? 'resta 1 lobo vivo' : `restam ${n} lobos vivos`}.`,
        'role',
      );
      ctx.log.registrar('ataque', {
        mensagem: `${ator.nome} uivou: ${n} lobos vivos.`,
        motivo: 'Variante Uivo de Manada: revela a contagem, nunca os nomes.',
        atores: [ator.id],
      });
      continue;
    }

    const delatado = acao.alvos[0] ? estado.players.find((p) => p.id === acao.alvos[0]) : ator;
    if (!delatado) continue;
    estado = anunciar(estado, `O Uivador revelou: ${delatado.nome} é lobo.`, 'role', {
      rotulo: 'Lobo revelado',
    });

    switch (ator.varianteId) {
      /**
       * Uivo Comprado: a delação vira poder de voto para o delatado.
       *
       * Parece contraditório entregar um lobo e premiá-lo, e é justamente o
       * ponto: o lobo queimado passa o dia sendo o centro das atenções e, com
       * dois votos, ainda decide quem morre nesse mesmo dia.
       */
      case 'uivo-comprado':
        estado = gravar(estado, delatado.id, { votoDuploNaRodada: estado.rodada });
        estado = anunciar(estado, `${delatado.nome} vota duas vezes hoje.`, 'role');
        ctx.log.registrar('ataque', {
          mensagem: `${ator.nome} delatou ${delatado.nome}, que hoje vota duas vezes.`,
          motivo: 'Variante Uivo Comprado. A matilha não mata dois amanhã: o preço é outro.',
          atores: [ator.id],
          alvos: [delatado.id],
        });
        break;

      /**
       * Uivo de Troca: ele delata e se cala para sempre.
       *
       * Perder o voto pelo resto da partida é caro num jogo decidido no voto —
       * mas um lobo revelado de propósito é uma âncora de suspeita que a vila
       * leva rodadas para largar.
       */
      case 'uivo-de-troca':
        estado = gravar(estado, ator.id, { semVotoSempre: true });
        ctx.log.registrar('ataque', {
          mensagem: `${ator.nome} delatou ${delatado.nome} e perdeu o voto para sempre.`,
          motivo: 'Variante Uivo de Troca.',
          atores: [ator.id],
          alvos: [delatado.id],
        });
        break;

      default:
        estado = agendar(estado, { kind: 'matilha-mata-n', naRodada: estado.rodada + 1, n: 2 });
        ctx.log.registrar('ataque', {
          mensagem: `${ator.nome} uivou e delatou ${delatado.nome}.`,
          motivo: 'Revelação pública. Em troca, a matilha mata dois na próxima noite.',
          atores: [ator.id],
          alvos: [delatado.id],
        });
        break;
    }
  }

  // ── A conversão do Alfa ──────────────────────────────────────────────────
  /**
   * Isto não existia.
   *
   * O roteiro oferecia "Converter" desde que as roles de duas opções foram
   * criadas, e nenhuma etapa lia `escolha === 'converter'`: o Alfa gastava a
   * noite, não matava ninguém e não convertia ninguém. A carta mais cara da
   * matilha (peso 4, uma vez por partida) não fazia absolutamente nada.
   *
   * A conversão muda o LADO e só o lado — a marca `'convertido'` é a mesma que
   * o modo Traição já usava, e agora `faccaoEfetiva` a lê. A habilidade
   * original continua: um Médico convertido continua curando, para a matilha.
   */
  for (const acao of todas.filter((a) => a.escolha === 'converter')) {
    const ator = estado.players.find((p) => p.id === acao.actorId)!;
    const alvo = acao.alvos[0] ? estado.players.find((p) => p.id === acao.alvos[0]) : undefined;
    if (!alvo || !temUso(estado, ator.id)) continue;

    estado = gastarUso(estado, ator.id);

    /**
     * O convertido vira um LOBO comum — carta e tudo.
     *
     * Antes ele mantinha a própria carta e só mudava de lado, o que criava um
     * Médico que curava para a matilha. Decisão do usuário em 2026-09-28: "o
     * alvo transformado pelo alfa deve virar um lobo normal".
     *
     * A marca `'convertido'` continua em `objetivosSecretos` porque é dela que
     * o modo Traição e a tela de segredo vivem — e porque distinguir "nasceu
     * lobo" de "virou lobo" ainda importa para o Sangue Marcado e para o
     * Treinamento.
     */
    estado = trocarCarta(estado, alvo.id, {
      roleId: 'lobo',
      usos: Infinity,
      motivo: `Você foi mordido esta noite. Agora caça com a matilha.`,
    });
    estado = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [alvo.id]: 'convertido' },
    };

    let detalhe = 'Vira um Lobo comum e passa a caçar com a matilha.';

    switch (ator.varianteId) {
      /**
       * Sangue Novo: a habilidade antiga dura uma noite só.
       *
       * A diferença para o Alfa base é o prazo: lá o convertido fica sendo o
       * que era, para sempre; aqui ele tem uma única noite para usar o poder da
       * vila a favor dos lobos e depois vira um lobo comum.
       */
      /**
       * Sangue Novo: ele leva a carta ANTIGA por uma noite.
       *
       * Com a conversão base trocando a carta na hora, esta variante é a única
       * que ainda empresta poder: o convertido continua sendo o que era por uma
       * noite — e é aí que mora o valor dela para a matilha — e só depois vira
       * Lobo comum.
       */
      case 'sangue-novo':
        estado = trocarCarta(estado, alvo.id, {
          roleId: alvo.roleId,
          ...(alvo.varianteId ? { varianteId: alvo.varianteId } : {}),
          usos: alvo.usosRestantes,
          motivo: 'Você foi mordido, mas o que era seu ainda serve — por uma noite.',
        });
        estado = gravar(estado, alvo.id, { conservaPoderAte: estado.rodada + 1 });
        detalhe =
          'Variante Sangue Novo: guarda a carta antiga por uma noite e só depois vira Lobo.';
        break;

      /**
       * Sangue Marcado: a conversão deixa rastro.
       *
       * O Alfa aposta que o convertido sobrevive. Se não sobreviver, o corpo
       * entrega quem o mordeu — e o Alfa é a peça que a matilha menos pode
       * perder.
       */
      case 'sangue-marcado':
        estado = gravar(estado, alvo.id, { delataSeMorrer: ator.id });
        detalhe = 'Variante Sangue Marcado: se o convertido morrer, o Alfa é revelado.';
        break;

      /**
       * Treinamento: o filhote fica de fora da caçada.
       *
       * Enquanto o Alfa viver, o convertido sabe de tudo e não decide nada — o
       * voto dele na matilha simplesmente não conta (ver `alvosDaMatilha`).
       */
      case 'treinamento':
        estado = gravar(estado, alvo.id, { tuteladoPor: ator.id });
        detalhe = 'Variante Treinamento: só participa dos ataques depois que o Alfa morrer.';
        break;

      default:
        break;
    }

    ctx.log.registrar('ataque', {
      mensagem: `${ator.nome} converteu ${alvo.nome}.`,
      motivo: detalhe,
      atores: [ator.id],
      alvos: [alvo.id],
    });
  }

  // ── As declarações de ataque propriamente ditas ──────────────────────────
  const acoes = todas.filter((a) => a.escolha !== 'uivar' && a.escolha !== 'converter');
  const cota = cotaDaMatilha(estado);

  for (const acao of acoes) {
    const ator = estado.players.find((p) => p.id === acao.actorId)!;
    const daMatilha = faccaoEfetiva(estado, ator) === 'lobos' && !ataqueIndividual(ator);

    /**
     * Lobo Branco, Sangue Acumulado: marcar um lobo em vez de matar.
     *
     * Ele guarda a fome. Quando o lobo marcado cair — por voto, por Caçador,
     * por qualquer coisa —, a noite seguinte dele leva dois. É a única role
     * que lucra com a vila acertando um lobo.
     */
    if (ator.roleId === 'lobo-branco' && ator.varianteId === 'sangue-acumulado') {
      const marcado = acao.alvos[0]
        ? estado.players.find((p) => p.id === acao.alvos[0])
        : undefined;
      if (marcado && role(marcado.roleId).faccao === 'lobos') {
        estado = gravar(estado, ator.id, { loboMarcado: marcado.id });
        ctx.log.registrar('ataque', {
          mensagem: `${ator.nome} marcou ${marcado.nome} em vez de matar.`,
          motivo:
            'Variante Sangue Acumulado: se esse lobo morrer, ele leva dois na noite seguinte.',
          atores: [ator.id],
          alvos: [marcado.id],
        });
        continue;
      }
    }

    for (const alvo of daMatilha ? acao.alvos.slice(0, cota) : acao.alvos) {
      ctx.log.registrar('ataque', {
        mensagem: `${ator.nome} declarou ataque a ${nome(estado, alvo)}.`,
        motivo:
          daMatilha && cota > 1
            ? `Declaração apenas. A matilha mata ${cota} esta noite.`
            : 'Declaração apenas — a morte é resolvida na etapa 8.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
    }

    /**
     * Voto de Sangue: quem caçou à noite não julga de dia.
     *
     * Um lobo mudo na votação é um lobo que não consegue guiar a vila para o
     * alvo errado — o que faz da variante um desconto real de peso, e não um
     * enfeite.
     */
    if (daMatilha && ator.varianteId === 'voto-de-sangue' && acao.alvos.length > 0) {
      estado = {
        ...estado,
        players: estado.players.map((p) => (p.id === ator.id ? { ...p, semVoto: true } : p)),
      };
      ctx.log.registrar('ataque', {
        mensagem: `${ator.nome} não vota amanhã.`,
        motivo: 'Variante Voto de Sangue: participou do ataque, perde o voto do dia seguinte.',
        atores: [ator.id],
      });
    }
  }

  if (cota === 0) {
    const ev = estado.eventoDaNoite ? EVENTOS_POR_ID.get(estado.eventoDaNoite) : undefined;
    ctx.log.ignorar(
      'ataque',
      ev && efeitoDo(ev, 'matilha-mata-n')?.n === 0
        ? `${ev.nome}: a matilha não mata esta noite.`
        : 'A matilha não tem ataque disponível esta noite.',
    );
  } else if (acoes.length === 0 && todas.length === 0) {
    ctx.log.ignorar('ataque', 'Nenhum ataque declarado.');
  }

  return { ...ctx, estado };
};
