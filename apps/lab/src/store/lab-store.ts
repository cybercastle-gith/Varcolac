import { create } from 'zustand';
import type { GameState, ResolutionLog, NightStepId } from '@jogo/engine';

/** Store único do laboratório. Sem cerimônia — é ferramenta, não produto. */
interface LabStore {
  estado: GameState | null;
  log: ResolutionLog | null;
  etapaAtual: NightStepId | null;
  // TODO: criarPartida, proximaEtapa, resolverNoiteInteira, forcarRole, resetar
}

export const useLabStore = create<LabStore>(() => ({
  estado: null,
  log: null,
  etapaAtual: null,
}));
