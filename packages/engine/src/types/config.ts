import type { EventFrequency } from './event';
import type { RoleId, VariantId } from './role';

export type GameMode = 'classico' | 'traicao' | 'vila-amaldicoada' | 'duplas';

export type WolfCountVisibility = 'publica' | 'oculta' | 'faixa';

export type VoteMode = 'simultanea' | 'secreta';

export type GhostModuleId =
  'peso-da-culpa' | 'assombrar' | 'pesadelo' | 'conselho-dos-mortos' | 'julgamento-do-alem';

/** Os sete sistemas ligáveis no setup. É o coração do produto. */
export interface GameConfig {
  readonly modo: GameMode;
  readonly revelarRoleAoMorrer: boolean;
  readonly contagemDeLobos: WolfCountVisibility;
  readonly frequenciaEventos: EventFrequency;
  /**
   * Seleção aleatória: a mesa escolhe um LEQUE e o app escolhe dentro dele.
   *
   * Substituiu `composicaoOculta` em 2026-09-26. A diferença não é de nome: a
   * composição oculta escondia um baralho que a mesa tinha montado carta por
   * carta, o que é uma tela pedindo para ser espiada. Aqui a mesa marca quais
   * funções ACEITA, em número maior que o de jogadores, e o app escolhe quais
   * entram sem mostrar — não existe lista para ninguém decorar.
   *
   * Muda o jogo de verdade: sem saber a composição, a mesa não conta quantos
   * lobos faltam nem deduz por eliminação, e a dedução passa a ser sobre
   * comportamento. É por isso que é uma escolha, e não o padrão.
   */
  readonly selecaoAleatoria: boolean;
  /**
   * Noite 1 sem sangue: a matilha não age, e nenhum poder dela funciona.
   *
   * Existe porque morrer na primeira noite é ser eliminado de um jogo de
   * conversa antes de ter conversado — a pessoa entrega o celular, recebe a
   * carta, e nunca joga. Com isto ligado todo mundo tem pelo menos um dia.
   *
   * Vale para a matilha INTEIRA e para todos os poderes dela, não só para a
   * mordida: um Feiticeiro que perfura na noite 1 estaria matando, e um Alfa que
   * converte estaria decidindo a partida antes de ela começar.
   */
  readonly semMorteNaPrimeiraNoite: boolean;
  readonly modulosDeFantasma: readonly GhostModuleId[];
  readonly votacao: VoteMode;
  /** Variante escolhida para cada role presente no baralho. */
  readonly variantes: Readonly<Record<RoleId, VariantId>>;
  /** Semente do RNG — permite reproduzir a partida inteira. */
  readonly semente: string;
  readonly tempoDiscussaoSegundos: number;
}

/** Baralho: as roles que entram na mesa, com repetição. */
export interface Deck {
  readonly id: string;
  readonly nome: string;
  readonly roleIds: readonly RoleId[];
  /**
   * A variante de CADA CARTA, alinhada por índice com `roleIds`.
   *
   * `config.variantes` mapeia uma variante por ROLE, e isso não expressa o que
   * a mesa precisa escolher: "quero o Xerife Boca Calada e não quero o Xerife
   * normal" são duas cartas diferentes da mesma função, e as duas podem entrar
   * na mesma partida. Com um vetor paralelo, cada carta carrega a sua.
   *
   * Opcional de propósito: baralhos antigos, os cenários do laboratório e os
   * testes continuam válidos sem ele, e aí `config.variantes` responde.
   */
  readonly variantes?: readonly (VariantId | undefined)[];
}

/** Modo Clássico, tudo transparente: o setup mais gentil para quem nunca jogou. */
export const DEFAULT_CONFIG: GameConfig = {
  modo: 'classico',
  revelarRoleAoMorrer: true,
  contagemDeLobos: 'publica',
  /**
   * `frequente` (45%) e nao `raro` (20%), desde 2026-09-25.
   *
   * Com `raro`, quatro em cada cinco manhãs não tinham evento nenhum, e o
   * sistema inteiro — dezesseis eventos, tela própria, efeitos que atravessam
   * cinco etapas — parecia desligado para quem joga. A calculadora de peso já
   * compensa a frequência (`ajusteDeConfiguracao`), então isto não desequilibra
   * a mesa; só faz o que existe aparecer.
   *
   * Continua ajustável no setup: Desligado, Raro, Frequente, Caótico.
   */
  frequenciaEventos: 'frequente',
  selecaoAleatoria: false,
  semMorteNaPrimeiraNoite: false,
  modulosDeFantasma: [],
  votacao: 'simultanea',
  variantes: {},
  semente: 'padrao',
  // Teto prático de 3 minutos, conforme o orçamento de tempo do dossiê.
  tempoDiscussaoSegundos: 180,
};
