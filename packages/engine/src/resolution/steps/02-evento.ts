import type { GameEvent } from '../../types/event';
import { CHANCE_DE_EVENTO, etapasCanceladasPor } from '../../types/event';
import type { GameState } from '../../types/game-state';
import { EVENTOS_POR_ID, EVENTOS_SORTE } from '../../data/events/index';
import type { StepContext, StepFn } from '../night-pipeline';
import { agendar, anunciar } from './_helpers';
import type { Rng } from '../../utils/rng';

/**
 * Quantos eventos uma partida inteira comporta.
 *
 * Dois, por decisão do usuário em 2026-09-25. O número é baixo de propósito: o
 * evento existe para virar a mesa de cabeça para baixo, e o que vira a mesa toda
 * noite não vira nada — vira o clima normal do jogo. Dois por partida deixa cada
 * um pesar.
 */
export const MAXIMO_DE_EVENTOS = 2;

/**
 * Sorteia o evento que será ANUNCIADO agora e valerá na noite seguinte.
 *
 * A família `gatilho` foi removida em 2026-09-25: todos os eventos são
 * sorteados. Nenhum se repete na mesma partida.
 */
function escolherEvento(estado: GameState, rng: Rng): GameEvent | null {
  if (rng.next() >= CHANCE_DE_EVENTO[estado.config.frequenciaEventos]) return null;
  const usados = new Set(estado.eventosUsados);
  const disponiveis = EVENTOS_SORTE.filter((e) => !usados.has(e.id));
  return disponiveis.length > 0 ? rng.pick(disponiveis) : null;
}

/** Efeitos que se resolvem já na etapa 2, na noite em que o evento VIGORA. */
function aplicarEfeitosImediatos(estado: GameState, ev: GameEvent): GameState {
  let e = estado;
  for (const efeito of ev.efeitos) {
    if (efeito.kind !== 'adia') continue;
    const naRodada = estado.rodada + 1;
    e = agendar(
      e,
      efeito.efeito === 'matilha-mata-n'
        ? { kind: 'matilha-mata-n', naRodada, n: efeito.n ?? 2 }
        : { kind: efeito.efeito, naRodada },
    );
  }
  return e;
}

/**
 * Etapa 2 — o evento.
 *
 * Faz DUAS coisas, e a separação é o coração da mecânica:
 *
 * 1. **Põe em vigor** o evento que já estava anunciado (`eventoDaNoite`, posto
 *    por `prepararNoite`). É aqui que ele cancela etapas e agenda o que precisa.
 * 2. **Sorteia e anuncia** o evento da noite SEGUINTE (`eventoAnunciado`).
 *
 * Por que anunciar com uma noite de antecedência (decisão de 2026-09-25): a mesa
 * ouve "Lua Cheia" no amanhecer e joga o dia inteiro sabendo que, à noite, a
 * matilha mata dois. O evento deixa de ser uma surpresa que já aconteceu e vira
 * uma ameaça que dá para discutir — que é o que uma mesa de dedução faz.
 *
 * Consequência: a **noite 1 nunca tem evento em vigor**, porque não houve
 * amanhecer antes dela para anunciar nada.
 */
export const evento: StepFn = (ctx): StepContext => {
  let estado = ctx.estado;
  let etapasCanceladas = ctx.etapasCanceladas;

  // ── 1. O evento que entra em vigor esta noite ────────────────────────────
  const emVigor = estado.eventoDaNoite ? EVENTOS_POR_ID.get(estado.eventoDaNoite) : undefined;
  if (emVigor) {
    estado = aplicarEfeitosImediatos(estado, emVigor);
    const canceladas = etapasCanceladasPor(emVigor);
    etapasCanceladas = [
      ...etapasCanceladas,
      ...canceladas.map((etapa) => ({
        etapa,
        motivo: `Cancelada pelo evento ${emVigor.nome}.`,
      })),
    ];
    ctx.log.registrar('evento', {
      mensagem: `${emVigor.nome} está em vigor — ${emVigor.descricao}`,
      motivo:
        'Anunciado na noite anterior.' +
        (canceladas.length > 0 ? ` Cancela: ${canceladas.join(', ')}.` : ''),
    });
  }

  // ── 2. O anúncio da noite seguinte ───────────────────────────────────────
  if (estado.config.frequenciaEventos === 'desligado') {
    if (!emVigor) ctx.log.ignorar('evento', 'Eventos desligados no setup.');
    return { ...ctx, estado, etapasCanceladas };
  }

  if (estado.eventosUsados.length >= MAXIMO_DE_EVENTOS) {
    if (!emVigor) {
      ctx.log.ignorar('evento', `Teto de ${MAXIMO_DE_EVENTOS} eventos por partida atingido.`);
    }
    return { ...ctx, estado, etapasCanceladas };
  }

  // Um de cada vez: não faz sentido anunciar dois para a mesma noite.
  if (estado.eventoAnunciado) {
    return { ...ctx, estado, etapasCanceladas };
  }

  const proximo = escolherEvento(estado, ctx.rng);
  if (!proximo) {
    if (!emVigor) ctx.log.ignorar('evento', 'Nenhum evento sorteado para a próxima noite.');
    return { ...ctx, estado, etapasCanceladas };
  }

  estado = {
    ...estado,
    eventoAnunciado: proximo.id,
    eventosUsados: [...estado.eventosUsados, proximo.id],
  };

  if (proximo.visibilidade === 'narrado' && proximo.narracao) {
    estado = anunciar(estado, proximo.narracao, 'evento');
  }

  ctx.log.registrar('evento', {
    mensagem: `Anunciado para a próxima noite: ${proximo.nome} — ${proximo.descricao}`,
    motivo:
      proximo.visibilidade === 'narrado'
        ? 'Narrado à mesa no amanhecer. Ela tem o dia para se preparar.'
        : 'Silencioso: a mesa não é avisada, e descobre pelo efeito.',
  });

  return { ...ctx, estado, etapasCanceladas };
};
