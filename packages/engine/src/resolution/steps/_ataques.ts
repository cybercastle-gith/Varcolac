import { temEfeito, efeitosDaRodada } from '../../types/effect';
import { efeitoDo } from '../../types/event';
import type { GameState } from '../../types/game-state';
import type { NightAction } from '../../types/action';
import type { PlayerId } from '../../types/player';
import { EVENTOS_POR_ID } from '../../data/events/index';
import { role } from '../../data/roles/index';
import type { Rng } from '../../utils/rng';

/**
 * Quantos alvos a matilha pode levar nesta noite.
 *
 * Compartilhado entre as etapas 7 e 8 porque as duas precisam da MESMA
 * resposta: a 7 corta a declaração na cota, a 8 não pode matar além dela.
 * Normalmente 1; Lua Cheia e Sede de Sangue sobem para 2; Noite Sem Lua zera.
 */
export function cotaDaMatilha(estado: GameState): number {
  const ev = estado.eventoDaNoite ? EVENTOS_POR_ID.get(estado.eventoDaNoite) : undefined;
  const doEvento = ev ? efeitoDo(ev, 'matilha-mata-n') : undefined;
  if (doEvento) return doEvento.n;

  if (temEfeito(estado.efeitos, estado.rodada, 'matilha-nao-mata')) return 0;

  const adiado = efeitosDaRodada(estado.efeitos, estado.rodada).find(
    (e) => e.kind === 'matilha-mata-n',
  );
  return adiado && adiado.kind === 'matilha-mata-n' ? adiado.n : 1;
}

/** O Lobo Branco mata lobos também: ele ataca por conta própria, não com a matilha. */
export function ataqueIndividual(roleId: string): boolean {
  return roleId === 'lobo-branco' || roleId === 'bruxa';
}

export interface AlvoDaMatilha {
  readonly alvo: PlayerId;
  readonly votos: number;
  readonly desempatado: boolean;
}

/**
 * A matilha mata JUNTA, uma vez (ou `cota` vezes) por noite.
 *
 * Isto existe porque o pass-and-play passa o celular de um em um: cada lobo
 * declara o seu alvo em separado, e sem agregação três lobos matariam três
 * pessoas. A matilha vota, o mais votado morre, e o empate é sorteado — o mesmo
 * critério que a mesa usaria se estivesse conversando.
 */
export function alvosDaMatilha(
  estado: GameState,
  ataques: readonly NightAction[],
  rng: Rng,
): readonly AlvoDaMatilha[] {
  const cota = cotaDaMatilha(estado);
  if (cota === 0) return [];

  const votos = new Map<PlayerId, number>();
  for (const a of ataques) {
    const ator = estado.players.find((p) => p.id === a.actorId);
    if (!ator || role(ator.roleId).faccao !== 'lobos' || ataqueIndividual(ator.roleId)) continue;
    for (const alvo of a.alvos) votos.set(alvo, (votos.get(alvo) ?? 0) + 1);
  }
  if (votos.size === 0) return [];

  const escolhidos: AlvoDaMatilha[] = [];
  const restantes = new Map(votos);

  while (escolhidos.length < cota && restantes.size > 0) {
    let max = 0;
    for (const n of restantes.values()) max = Math.max(max, n);
    const empatados = [...restantes].filter(([, n]) => n === max).map(([id]) => id);
    const alvo = empatados.length === 1 ? empatados[0]! : rng.pick(empatados);
    escolhidos.push({ alvo, votos: max, desempatado: empatados.length > 1 });
    restantes.delete(alvo);
  }

  return escolhidos;
}
