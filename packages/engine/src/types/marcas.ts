import type { PlayerId } from './player';
import type { RoleId } from './role';

/**
 * Estado PERSISTENTE de um jogador, ao contrário de `PlayerFlags`.
 *
 * A diferença é a única coisa que importa aqui: `flags` são voláteis e
 * `fecharNoite` zera todas; `marcas` atravessam a partida inteira e ninguém
 * limpa. Quando uma variante diz "pelo resto da partida", "para sempre" ou
 * "até que fulano morra", o lugar é aqui.
 *
 * Por que um objeto só em vez de um campo por variante em `Player`: são 24
 * funções e 73 variantes, e metade delas precisa lembrar de alguma coisa. Um
 * campo por variante faria de `Player` um formulário de trinta linhas onde o
 * que é regra do jogo e o que é detalhe de uma variante obscura têm o mesmo
 * peso visual. Agrupado, dá para ler `Player` de uma vez e descer aqui quando
 * a marca aparecer.
 *
 * Toda marca é opcional e ausente por padrão. Nenhuma tem valor "falso"
 * significativo — ou está lá, ou a variante não está em jogo.
 */
export interface Marcas {
  // ── Perda e empréstimo de poder ──────────────────────────────────────────
  /** Cova Aberta: voltou da morte sem a habilidade. */
  readonly semPoder?: boolean;
  /** Incorporação: o Necromante usa a habilidade deste morto. */
  readonly poderDe?: RoleId;
  /** Sombra de Alguém: nesta noite o Lobo Sombra joga com o papel de outro. */
  readonly poderEmprestadoAte?: number;
  /** Sangue Novo: o convertido mantém a antiga habilidade até esta rodada. */
  readonly conservaPoderAte?: number;
  /** Herança Amarga, Bobo Desesperado, Missão Sem Volta: virou Aldeão comum. */
  readonly virouAldeao?: boolean;

  // ── Voto ─────────────────────────────────────────────────────────────────
  /** Uivo de Troca: perdeu o voto pelo resto da partida. */
  readonly semVotoSempre?: boolean;
  /** Uivo Comprado: vota duas vezes NESTA rodada. */
  readonly votoDuploNaRodada?: number;
  /** Teimoso: o voto declarado não pode mudar. Lido pela tela de votação. */
  readonly votoTravado?: boolean;

  // ── Proteção e morte ─────────────────────────────────────────────────────
  /** Marca de Ferro, Maldição do Vingador: não pode receber proteção. */
  readonly naoProtegivel?: boolean;
  /** Sobrevivente Invisível: já recebeu voto, então já pode ser atacado. */
  readonly jaRecebeuVoto?: boolean;
  /** A Qualquer Custo: sobreviveu a um ataque e agora mata à noite. */
  readonly podeMatar?: boolean;
  /** Rastro: revelado de manhã, morre depois da votação desta rodada. */
  readonly morreDepoisDaVotacao?: number;
  /** Morto-Vivo: morto, mas continua falando à mesa. */
  readonly mortoVivo?: boolean;
  /** Última Carne: se este jogador morrer, o Carniçal volta à vida. */
  readonly ressuscitaSeMorrer?: PlayerId;
  /** Sangue Marcado: se este morrer, a identidade deste outro é revelada. */
  readonly delataSeMorrer?: PlayerId;

  // ── Investigação ─────────────────────────────────────────────────────────
  /** Nome Roubado: a investigação devolve o papel deste morto. */
  readonly disfarceDe?: RoleId;

  // ── Bloqueio ─────────────────────────────────────────────────────────────
  /** Última Dose: o Taverneiro já embebedou este jogador uma vez. */
  readonly jaEmbebedado?: boolean;
  /** Bebida Forte: pode agir duas vezes NESTA rodada. */
  readonly acaoDuplaNaRodada?: number;

  // ── Alvos e histórico ────────────────────────────────────────────────────
  /** Médico de Plantão: rodada do último ataque sofrido. */
  readonly atacadoNaRodada?: number;
  /** Obsessivo: o alvo travado na noite 1. */
  readonly alvoTravado?: PlayerId;
  /** Treinamento: convertido que só ataca depois que este Alfa morrer. */
  readonly tuteladoPor?: PlayerId;
  /** Sangue Acumulado: o lobo que o Lobo Branco marcou em vez de matar. */
  readonly loboMarcado?: PlayerId;
  /** Jejum Forçado: nesta rodada o Lobo Branco só pode matar lobo. */
  readonly soLoboNaRodada?: number;
  /** Bobo da Forca: a votação marcada — receber um voto nela é a vitória. */
  readonly forcaNaRodada?: number;
  /** Testemunha da Cela: rodada em que o preso é solto e revelado. */
  readonly reveladoNaRodada?: number;
}
