import { NIGHT_STEPS, type NightStepId } from '../types/action';
import type { PlayerId } from '../types/player';

/**
 * Registro auditável: cada etapa diz o que fez e por quê, em linguagem legível.
 * É exatamente isto que o laboratório exibe no ResolutionPanel — e é como você
 * vai depurar "o Feiticeiro perfurou, mas o Padre cancelou".
 */
export interface LogEntry {
  readonly etapa: NightStepId;
  /** Ordem 1-12, para exibição. */
  readonly ordem: number;
  readonly rodada: number;
  /** "Feiticeiro perfurou Ana — proteção do Médico removida." */
  readonly mensagem: string;
  /** A regra aplicada: "Padre vence Feiticeiro: anula a noite inteira." */
  readonly motivo: string;
  readonly atores: readonly PlayerId[];
  readonly alvos: readonly PlayerId[];
  /** True quando a etapa foi pulada (evento cancelou, ninguém agiu). */
  readonly ignorada: boolean;
}

export interface ResolutionLog {
  readonly rodada: number;
  readonly entradas: readonly LogEntry[];
}

export type LogInput = Partial<Omit<LogEntry, 'rodada' | 'ordem' | 'etapa'>> & {
  readonly mensagem: string;
};

export interface LogCollector {
  registrar(etapa: NightStepId, entrada: LogInput): void;
  /** Atalho para "esta etapa não fez nada, e aqui está o porquê". */
  ignorar(etapa: NightStepId, motivo: string): void;
  resultado(): ResolutionLog;
}

export function ordemDaEtapa(step: NightStepId): number {
  return NIGHT_STEPS.indexOf(step) + 1;
}

export function criarColetor(rodada: number): LogCollector {
  const entradas: LogEntry[] = [];

  return {
    registrar(etapa, entrada) {
      entradas.push({
        etapa,
        ordem: ordemDaEtapa(etapa),
        rodada,
        motivo: '',
        atores: [],
        alvos: [],
        ignorada: false,
        ...entrada,
      });
    },
    ignorar(etapa, motivo) {
      this.registrar(etapa, { mensagem: 'Nada aconteceu.', motivo, ignorada: true });
    },
    resultado: () => ({ rodada, entradas: [...entradas] }),
  };
}

/** Log em texto puro, uma linha por etapa. Útil no terminal e nos testes. */
export function formatarLog(log: ResolutionLog): string {
  return log.entradas
    .map((e) => {
      const cabeca = `${String(e.ordem).padStart(2, '0')} ${e.etapa}`;
      const cauda = e.motivo ? `  (${e.motivo})` : '';
      return `${cabeca}: ${e.mensagem}${cauda}`;
    })
    .join('\n');
}
