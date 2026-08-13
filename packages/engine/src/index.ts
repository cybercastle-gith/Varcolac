// API pública do engine. Nada aqui pode depender de React Native nem de DOM.

// Tipos
export type * from './types/faction';
export type * from './types/role';
export type * from './types/player';
export type * from './types/action';
export type * from './types/event';
export type * from './types/config';
export type * from './types/game-state';

// Domínio
export { NIGHT_STEPS } from './types/action';
export { countsAsWolf, countsAsVillage } from './types/faction';
export { pesoEfetivo, etapaEfetiva, usosIniciais } from './types/role';
export { DEFAULT_CONFIG } from './types/config';
export { jogador, vivos, mortos, comJogador } from './types/game-state';

// Catálogo
export * from './data/roles/index';

// Partida
export { criarPartida, FLAGS_LIMPAS } from './setup/create-game';
export type { JogadorInicial } from './setup/create-game';

// Resolução noturna
export {
  ORDEM_DAS_ETAPAS,
  iniciarNoite,
  resolverEtapa,
  resolverNoite,
} from './resolution/night-pipeline';
export type { StepContext, StepFn, NightResult } from './resolution/night-pipeline';
export { ETAPAS } from './resolution/steps/index';
export { criarColetor, formatarLog, ordemDaEtapa } from './resolution/resolution-log';
export type { LogEntry, ResolutionLog, LogCollector } from './resolution/resolution-log';

// Vitória
export { verificarVitoria } from './victory/win-conditions';
export type { VictoryLayer, VictoryClaim, VictoryResult } from './victory/win-conditions';

// Balanceamento
export {
  calcularEquilibrio,
  multiplicador,
  ajusteDeConfiguracao,
  toleranciaDeIE,
  lerIndice,
  MULTIPLICADOR_POR_FAIXA,
} from './balance/weight-calculator';
export type { BalanceResult, BalanceReading } from './balance/weight-calculator';
export { gerarBaralho, baralhoDeFabrica, lobosPara } from './balance/deck-generator';
export type { DeckStyle, GenerationOptions, GeneratedDeck } from './balance/deck-generator';

// Simulação
export { rodarLote } from './simulation/batch-runner';
export type { BatchOptions, BatchStats } from './simulation/batch-runner';

// Aleatoriedade
export { criarRng, retomarRng, sementeAleatoria } from './utils/rng';
export type { Rng, RngState } from './utils/rng';
