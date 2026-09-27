import type { PlayerId } from './player';

/**
 * Efeito que nasce agora e só age numa rodada FUTURA.
 *
 * Sem isto, cada mecânica de "na próxima noite..." precisaria de um campo
 * próprio no estado — e o dossiê tem mais de uma dúzia delas, entre eventos,
 * roles e agravamentos. Uma fila tipada mantém tudo num lugar só e faz o
 * laboratório poder listar o que está engatilhado.
 *
 * `naRodada` é sempre a rodada em que o efeito se aplica, não a que o criou.
 */
export type EfeitoAdiado =
  | { readonly kind: 'matilha-mata-n'; readonly naRodada: number; readonly n: number }
  | { readonly kind: 'matilha-nao-mata'; readonly naRodada: number }
  /**
   * Anciã: a vila perde todos os poderes por uma noite.
   *
   * `todos` é a variante Luto da Vila — a matilha também perde. `exceto` é o
   * Testamento: a Anciã aponta um herdeiro que continua agindo.
   */
  | {
      readonly kind: 'poderes-suspensos';
      readonly naRodada: number;
      readonly todos?: boolean;
      readonly exceto?: PlayerId;
    }
  /** Velório, Sino da Igreja. */
  | { readonly kind: 'sem-votacao'; readonly naRodada: number }
  /** Caça às Bruxas: a vila pode linchar dois. */
  | { readonly kind: 'lincha-dois'; readonly naRodada: number }
  /** Motim: os aldeões perdem o direito de votar por um dia. */
  | { readonly kind: 'aldeoes-sem-voto'; readonly naRodada: number }
  /** Luto Sagrado: proteção coletiva por uma noite. */
  | { readonly kind: 'protecao-coletiva'; readonly naRodada: number }
  /** Guarda-costas Escudo, Lobo Carniçal: morre com atraso. */
  | { readonly kind: 'expira'; readonly naRodada: number; readonly playerId: PlayerId }
  /** Vidente dos Sonhos: a visão chega uma noite depois. */
  | {
      readonly kind: 'visao-atrasada';
      readonly naRodada: number;
      readonly paraId: PlayerId;
      readonly texto: string;
    }
  /** Vila Amaldiçoada: a vila inteira morre se o prazo vencer. */
  | { readonly kind: 'prazo-da-maldicao'; readonly naRodada: number }
  /**
   * Xerife e Taverneiro: o alvo fica bloqueado na noite SEGUINTE.
   *
   * Por que adiado, e não na mesma noite: o celular passa de um em um, e a
   * leitura da Vidente e do Detetive agora aparece na própria passagem. Um
   * bloqueio aplicado "nesta noite" só valeria para quem ainda não tivesse
   * passado — quem já viu a resposta, já viu. Adiar um turno faz o poder valer
   * para a mesa inteira, independente da ordem em que o aparelho circulou.
   */
  | {
      readonly kind: 'bloqueado-na-noite';
      readonly naRodada: number;
      readonly playerId: PlayerId;
      /** Xerife prende (também imuniza contra morte); Taverneiro só embebeda. */
      readonly preso: boolean;
      /**
       * A prisão também tira a voz? Só o Xerife Boca Calada tira.
       *
       * O Xerife comum prende e o preso continua falando e votando — decisão do
       * usuário, contra o que a carta dizia antes.
       */
      readonly calaAVoz?: boolean;
    }
  /** Última Vela: o ressuscitado morre de novo quando este dia acabar. */
  | {
      readonly kind: 'expira-no-fim-do-dia';
      readonly naRodada: number;
      readonly playerId: PlayerId;
    }
  /** Testemunha da Cela: o preso é solto e tem a facção lida em voz alta. */
  | { readonly kind: 'revelar-preso'; readonly naRodada: number; readonly playerId: PlayerId }
  /** Sangue Acumulado: o Lobo Branco leva N em vez de um. */
  | { readonly kind: 'lobo-branco-mata-n'; readonly naRodada: number; readonly n: number }
  /** Jejum Forçado: naquela noite o Lobo Branco só pode matar lobo. */
  | { readonly kind: 'lobo-branco-so-lobo'; readonly naRodada: number; readonly playerId: PlayerId }
  /** Lobo Sombra: fica ilegível para investigação na noite SEGUINTE. */
  | {
      readonly kind: 'imune-investigacao';
      readonly naRodada: number;
      readonly playerId: PlayerId;
    };

export type EfeitoKind = EfeitoAdiado['kind'];

/** Os efeitos válidos para esta rodada. */
export function efeitosDaRodada(
  fila: readonly EfeitoAdiado[],
  rodada: number,
): readonly EfeitoAdiado[] {
  return fila.filter((e) => e.naRodada === rodada);
}

export function temEfeito(
  fila: readonly EfeitoAdiado[],
  rodada: number,
  kind: EfeitoKind,
): boolean {
  return fila.some((e) => e.naRodada === rodada && e.kind === kind);
}

/** Descarta o que já passou, para a fila não crescer sem limite. */
export function limparEfeitosVencidos(
  fila: readonly EfeitoAdiado[],
  rodada: number,
): readonly EfeitoAdiado[] {
  return fila.filter((e) => e.naRodada >= rodada);
}
