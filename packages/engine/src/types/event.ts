import type { NightStepId } from './action';

export type EventId = string;

/** Família 3 (destravamento) está registrada mas fora do v1. */
export type EventFamily = 'sorte' | 'gatilho' | 'destravamento';

export type EventVisibility = 'narrado' | 'silencioso';

export type EventFrequency = 'desligado' | 'raro' | 'frequente' | 'caotico';

/** Chance de haver evento numa noite, por frequência escolhida no setup. */
export const CHANCE_DE_EVENTO: Readonly<Record<EventFrequency, number>> = {
  desligado: 0,
  raro: 0.2,
  frequente: 0.45,
  caotico: 0.8,
};

/**
 * O que o evento faz, de forma declarativa.
 *
 * Declarativo em vez de uma função por evento porque o efeito precisa ser
 * legível fora da execução: o laboratório mostra o que o evento vai fazer, e a
 * calculadora consegue raciocinar sobre a lista sem rodar a partida.
 */
export type EventEffect =
  /** Cancela etapas inteiras da noite (Sono Pesado, Noite Sem Lua). */
  | { readonly kind: 'cancela-etapas'; readonly etapas: readonly NightStepId[] }
  /** Chuva de Sangue: todas as proteções falham. */
  | { readonly kind: 'anula-protecoes' }
  /** Lua Cheia: a matilha mata N nesta noite. n=0 significa que não mata. */
  | { readonly kind: 'matilha-mata-n'; readonly n: number }
  /** Névoa Cerrada: uma role específica não age. */
  | { readonly kind: 'silencia-role'; readonly roleIds: readonly string[] }
  /** Ossos na Encruzilhada: revela a role de um morto sorteado. */
  | { readonly kind: 'revela-role-de-morto' }
  /** Fogo-fátuo: informação falsa entregue como verdadeira. */
  | { readonly kind: 'informacao-falsa' }
  /** Presságio: diz um nome em voz alta e não explica. */
  | { readonly kind: 'nomeia-alguem' }
  /** Delação: revela publicamente a facção de alguém. */
  | { readonly kind: 'revela-faccao'; readonly de: 'gatilho' }
  /** Efeitos que caem numa rodada futura. */
  | {
      readonly kind: 'adia';
      readonly efeito:
        | 'lincha-dois'
        | 'aldeoes-sem-voto'
        | 'protecao-coletiva'
        | 'sem-votacao'
        | 'matilha-mata-n';
      readonly n?: number;
    }
  /** A Corda Escolhe: o app sorteia entre os empatados. */
  | { readonly kind: 'desempata-por-sorteio' }
  /** Vingança dos Ossos: os mortos escolhem o próximo evento. */
  | { readonly kind: 'mortos-escolhem-evento' };

/** Condição que dispara um evento da família 2. */
export type EventTrigger =
  | { readonly kind: 'inocentes-linchados-seguidos'; readonly n: number }
  | { readonly kind: 'inocentes-linchados-total'; readonly n: number }
  | { readonly kind: 'role-morreu'; readonly roleIds: readonly string[] }
  | { readonly kind: 'matilha-sem-matar'; readonly noites: number }
  | { readonly kind: 'mortes-na-noite'; readonly n: number }
  | { readonly kind: 'votacao-empatada' }
  | { readonly kind: 'voto-em-si-mesmo' }
  | { readonly kind: 'enesimo-morto'; readonly n: number };

export interface GameEvent {
  readonly id: EventId;
  readonly nome: string;
  readonly familia: EventFamily;
  readonly visibilidade: EventVisibility;
  /** Frase dita em voz alta, quando narrado. `{nome}` vira o nome sorteado. */
  readonly narracao?: string;
  readonly efeitos: readonly EventEffect[];
  readonly trigger?: EventTrigger;
  readonly descricao: string;
}

/** Etapas que este evento cancela, somando todos os seus efeitos. */
export function etapasCanceladasPor(evento: GameEvent): readonly NightStepId[] {
  return evento.efeitos.flatMap((e) => (e.kind === 'cancela-etapas' ? e.etapas : []));
}

/** Procura um efeito de um tipo específico. */
export function efeitoDo<K extends EventEffect['kind']>(
  evento: GameEvent,
  kind: K,
): Extract<EventEffect, { kind: K }> | undefined {
  return evento.efeitos.find((e): e is Extract<EventEffect, { kind: K }> => e.kind === kind);
}
