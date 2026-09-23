// API pública do engine. Nada aqui pode depender de React Native nem de DOM.

// ── Tipos ───────────────────────────────────────────────────────────────────
export type * from './types/faction';
export type * from './types/role';
export type * from './types/player';
export type * from './types/action';
export type * from './types/event';
export type * from './types/effect';
export type * from './types/info';
export type * from './types/config';
export type * from './types/game-state';

// ── Domínio ─────────────────────────────────────────────────────────────────
export { NIGHT_STEPS } from './types/action';
export { countsAsWolf, countsAsVillage } from './types/faction';
export { pesoEfetivo, etapaEfetiva, usosIniciais } from './types/role';
export { DEFAULT_CONFIG } from './types/config';
export { CHANCE_DE_EVENTO, etapasCanceladasPor, efeitoDo } from './types/event';
export { efeitosDaRodada, temEfeito, limparEfeitosVencidos } from './types/effect';
export {
  jogador,
  vivos,
  mortos,
  nomeDe,
  comJogador,
  CONTADORES_ZERADOS,
} from './types/game-state';

// ── Catálogos ───────────────────────────────────────────────────────────────
export * from './data/roles/index';
export { EVENTOS, EVENTOS_SORTE, EVENTOS_GATILHO, EVENTOS_POR_ID, evento } from './data/events/index';
export { MODULOS_DE_FANTASMA, MODULOS_POR_ID, moduloAtivo } from './data/ghosts';
export type { GhostModule } from './data/ghosts';
export { MODOS, modo, AGRAVAMENTOS } from './data/modes/index';
export type { ModeHooks } from './data/modes/index';
export { MISSOES_DO_CORINGA, MISSOES_POR_ID } from './data/missions';
export { MOTIVOS, motivoDe, complementoDe } from './data/motivos';
export type { Motivo, Primitiva } from './data/motivos';
export type { Missao } from './data/missions';

// ── Partida ─────────────────────────────────────────────────────────────────
export { criarPartida, FLAGS_LIMPAS } from './setup/create-game';
export type { JogadorInicial } from './setup/create-game';

// ── Resolução noturna ───────────────────────────────────────────────────────
export {
  ORDEM_DAS_ETAPAS,
  iniciarNoite,
  resolverEtapa,
  resolverNoite,
  fecharNoite,
} from './resolution/night-pipeline';
export type { StepContext, StepFn, NightResult, Cancelamento } from './resolution/night-pipeline';
export { ETAPAS } from './resolution/steps/index';
export { dispararEstertores } from './resolution/estertor-chain';
export { criarColetor, formatarLog, ordemDaEtapa } from './resolution/resolution-log';
export type { LogEntry, ResolutionLog, LogCollector } from './resolution/resolution-log';

// ── Passagem do celular ────────────────────────────────────────────────────
export { roteiroDaNoite, contagemDeLobosVisivel } from './turn/roteiro';
export type { Passagem, Pergunta, TipoDePergunta } from './turn/roteiro';

// ── Dia ─────────────────────────────────────────────────────────────────────
export { resolverDia, elegiveisParaVotar, apurar } from './day/voting';
export type { Votos, DayResult } from './day/voting';

// ── Vitória ─────────────────────────────────────────────────────────────────
export { verificarVitoria, encerrarSeAcabou } from './victory/win-conditions';
export type { VictoryLayer, VictoryClaim, VictoryResult } from './victory/win-conditions';

// ── Balanceamento ───────────────────────────────────────────────────────────
export {
  calcularEquilibrio,
  multiplicador,
  ajusteDeConfiguracao,
  toleranciaDeIE,
  lerIndice,
  MULTIPLICADOR_POR_FAIXA,
} from './balance/weight-calculator';
export type { BalanceResult, BalanceReading, PesosCustomizados } from './balance/weight-calculator';
export { gerarBaralho, baralhoDeFabrica, lobosPara, ESTILOS } from './balance/deck-generator';
export type { DeckStyle, GenerationOptions, GeneratedDeck } from './balance/deck-generator';

// ── Simulação ───────────────────────────────────────────────────────────────
export { jogarPartida } from './simulation/play-game';
export type { PartidaCompleta } from './simulation/play-game';
export { rodarLote, taxas } from './simulation/batch-runner';
export type { BatchOptions, BatchStats } from './simulation/batch-runner';
export { decidirNoite, decidirVotos } from './simulation/bots';

// ── Aleatoriedade ───────────────────────────────────────────────────────────
export { criarRng, retomarRng, sementeAleatoria } from './utils/rng';
export type { Rng, RngState } from './utils/rng';
