import type { GameEvent } from '../../types/event';
import { CHANCE_DE_EVENTO, etapasCanceladasPor } from '../../types/event';
import type { GameState } from '../../types/game-state';
import { mortos, vivos } from '../../types/game-state';
import { EVENTOS_GATILHO, EVENTOS_SORTE } from '../../data/events/index';
import { role } from '../../data/roles/index';
import type { StepContext, StepFn } from '../night-pipeline';
import { agendar, anunciar, entregarInfo } from './_helpers';
import type { Rng } from '../../utils/rng';

/** O gatilho da família 2 está satisfeito pelo estado atual? */
function gatilhoAtivo(ev: GameEvent, estado: GameState): boolean {
  const t = ev.trigger;
  if (!t) return false;
  const c = estado.contadores;

  switch (t.kind) {
    case 'inocentes-linchados-seguidos':
      return c.inocentesLinchadosSeguidos >= t.n;
    case 'inocentes-linchados-total':
      return c.inocentesLinchadosTotal >= t.n;
    case 'role-morreu':
      return estado.players.some(
        (p) => p.status === 'morto' && t.roleIds.includes(p.roleId),
      );
    case 'matilha-sem-matar':
      return c.noitesSemMatar >= t.noites;
    case 'mortes-na-noite':
      return c.mortesNaUltimaNoite >= t.n;
    case 'enesimo-morto':
      return c.mortosNoTotal >= t.n;
    // Estes dois nascem DENTRO da votação e são resolvidos lá, não aqui.
    case 'votacao-empatada':
    case 'voto-em-si-mesmo':
      return false;
  }
}

/**
 * Escolhe o evento da noite. Gatilho tem prioridade sobre sorte: quando a
 * partida chegou a um estado que o dossiê considera digno de reação, o app
 * reage, em vez de jogar dado.
 */
function escolherEvento(estado: GameState, rng: Rng): GameEvent | null {
  const usados = new Set(estado.eventosUsados);
  const inedito = (e: GameEvent) => !usados.has(e.id);

  const porGatilho = EVENTOS_GATILHO.filter(
    (e) => inedito(e) && gatilhoAtivo(e, estado),
  );
  if (porGatilho.length > 0) return rng.pick(porGatilho);

  if (rng.next() >= CHANCE_DE_EVENTO[estado.config.frequenciaEventos]) return null;

  const porSorte = EVENTOS_SORTE.filter(inedito);
  return porSorte.length > 0 ? rng.pick(porSorte) : null;
}

/** Efeitos que se resolvem já na etapa 2. Os demais são lidos por outras etapas. */
function aplicarEfeitosImediatos(estado: GameState, ev: GameEvent, rng: Rng): GameState {
  let e = estado;

  for (const efeito of ev.efeitos) {
    switch (efeito.kind) {
      case 'adia': {
        const naRodada = estado.rodada + 1;
        e = agendar(
          e,
          efeito.efeito === 'matilha-mata-n'
            ? { kind: 'matilha-mata-n', naRodada, n: efeito.n ?? 2 }
            : { kind: efeito.efeito, naRodada },
        );
        break;
      }
      case 'revela-role-de-morto': {
        const lista = mortos(e);
        if (lista.length > 0) {
          const alvo = rng.pick(lista);
          e = anunciar(e, `${alvo.nome} era ${role(alvo.roleId).nome}.`, 'evento');
        }
        break;
      }
      case 'nomeia-alguem': {
        const lista = vivos(e);
        if (lista.length > 0) {
          const alvo = rng.pick(lista);
          // O Presságio não faz nada mecanicamente. É o ponto.
          e = anunciar(e, (ev.narracao ?? '{nome}').replace('{nome}', alvo.nome), 'evento');
        }
        break;
      }
      case 'informacao-falsa': {
        const lista = vivos(e);
        if (lista.length >= 2) {
          const [para, sobre] = rng.sample(lista, 2);
          if (para && sobre) {
            e = entregarInfo(e, {
              rodada: e.rodada,
              paraId: para.id,
              origem: 'evento',
              texto: `${sobre.nome} é ${role(sobre.roleId).faccao === 'lobos' ? 'da vila' : 'lobo'}.`,
              verdadeira: false,
              sobre: [sobre.id],
            });
          }
        }
        break;
      }
      // Lidos por outras etapas, no momento certo:
      case 'cancela-etapas': // aqui embaixo, via etapasCanceladasPor
      case 'anula-protecoes': // etapa 5
      case 'matilha-mata-n': // etapas 7 e 8
      case 'silencia-role': // filtro de acoesDe
      case 'revela-faccao': // votação
      case 'desempata-por-sorteio': // votação
      case 'mortos-escolhem-evento': // próxima noite
        break;
    }
  }

  return e;
}

/**
 * Etapa 2 — evento da noite, por gatilho ou por sorte.
 * É a única etapa que pode cancelar etapas inteiras.
 */
export const evento: StepFn = (ctx): StepContext => {
  if (ctx.estado.config.frequenciaEventos === 'desligado') {
    ctx.log.ignorar('evento', 'Eventos desligados no setup.');
    return ctx;
  }

  const ev = escolherEvento(ctx.estado, ctx.rng);
  if (!ev) {
    ctx.log.ignorar('evento', 'Nenhum evento sorteado nem disparado por gatilho.');
    return ctx;
  }

  let estado: GameState = {
    ...ctx.estado,
    eventoDaNoite: ev.id,
    eventosUsados: [...ctx.estado.eventosUsados, ev.id],
  };

  if (ev.visibilidade === 'narrado' && ev.narracao && !ev.narracao.includes('{nome}')) {
    estado = anunciar(estado, ev.narracao, 'evento');
  }
  estado = aplicarEfeitosImediatos(estado, ev, ctx.rng);

  const canceladas = etapasCanceladasPor(ev);
  ctx.log.registrar('evento', {
    mensagem: `${ev.nome} — ${ev.descricao}`,
    motivo:
      (ev.familia === 'gatilho' ? 'Disparado por gatilho. ' : 'Sorteado. ') +
      (ev.visibilidade === 'narrado' ? 'Narrado à mesa.' : 'Silencioso: a mesa não é avisada.') +
      (canceladas.length > 0 ? ` Cancela: ${canceladas.join(', ')}.` : ''),
  });

  return {
    ...ctx,
    estado,
    etapasCanceladas: [
      ...ctx.etapasCanceladas,
      ...canceladas.map((etapa) => ({
        etapa,
        motivo: `Cancelada pelo evento ${ev.nome}.`,
      })),
    ],
  };
};
