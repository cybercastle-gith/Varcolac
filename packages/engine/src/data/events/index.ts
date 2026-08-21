import type { EventId, GameEvent } from '../../types/event';
import { EVENTOS_SORTE } from './sorte';
import { EVENTOS_GATILHO } from './gatilho';

export { EVENTOS_SORTE, EVENTOS_GATILHO };

/**
 * Os 16 eventos do v1. A família 3 (destravamento) está escrita no dossiê mas
 * não entra no lançamento — ver seção 8.
 */
export const EVENTOS: readonly GameEvent[] = [...EVENTOS_SORTE, ...EVENTOS_GATILHO];

export const EVENTOS_POR_ID: ReadonlyMap<EventId, GameEvent> = new Map(
  EVENTOS.map((e) => [e.id, e]),
);

export function evento(id: EventId): GameEvent {
  const e = EVENTOS_POR_ID.get(id);
  if (!e) throw new Error(`Evento desconhecido: ${id}`);
  return e;
}
