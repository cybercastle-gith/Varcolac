import type { PlayerId } from './player';

/**
 * Informação privada entregue a um jogador. É o produto da etapa 11 e o que a
 * tela de ação mostra na passagem seguinte.
 *
 * `verdadeira` existe para o laboratório: a mesa nunca sabe, mas quem depura
 * precisa distinguir a leitura honesta da mentira plantada pelo Fogo-fátuo,
 * pela Vidente Confusa ou pelo Pesadelo de um fantasma.
 */
export interface InfoEntry {
  readonly rodada: number;
  readonly paraId: PlayerId;
  readonly origem: 'vidente' | 'detetive' | 'evento' | 'fantasma' | 'app';
  readonly texto: string;
  readonly verdadeira: boolean;
  /** Quem a leitura menciona, para o painel destacar. */
  readonly sobre: readonly PlayerId[];
}

/** Anúncio público, dito em voz alta no amanhecer ou no dia. */
export interface Announcement {
  readonly rodada: number;
  readonly texto: string;
  readonly origem: 'evento' | 'morte' | 'votacao' | 'role' | 'fantasma' | 'modo';
}
