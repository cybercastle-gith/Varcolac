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
  /**
   * Em que METADE da rodada isto foi dito.
   *
   * As telas filtravam anúncios só por `rodada`, e noite e dia compartilham o
   * número: tudo que a noite narrou reaparecia inteiro na tela de Execução,
   * horas depois. Relatado em mesa assim: "a Anciã morreu na primeira noite e a
   * mensagem dela continua aparecendo".
   *
   * O Amanhecer conta a NOITE; a Execução conta o DIA. Uma frase pertence a um
   * dos dois e nunca aos dois.
   */
  readonly fase: 'noite' | 'dia';
  /**
   * Este anúncio é uma REVELAÇÃO, e não um comentário da noite.
   *
   * O amanhecer imprime os anúncios como uma pilha de frases em itálico no pé
   * da tela — certo para "a vila velou o corpo a noite toda", errado para "Ana
   * é o Médico". Alguns anúncios mudam o resto da partida: a identidade de quem
   * cura, o resultado de uma revista pública, a delação de um lobo. Esses a mesa
   * tem de PARAR para ler, e é isso que a marca liga.
   */
  readonly destaque?: boolean;
  /** O título acima do destaque: "Revista pública", "O Médico se revelou". */
  readonly rotulo?: string;
}
