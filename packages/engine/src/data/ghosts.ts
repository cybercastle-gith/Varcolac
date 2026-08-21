import type { GhostModuleId } from '../types/config';

/**
 * Módulos de fantasma (seção 7 do dossiê).
 *
 * A vantagem estrutural do pass-and-play: quem morre continua fisicamente na
 * mesa, ouvindo tudo e proibido de falar. O app existe para dar a essa pessoa
 * um canal silencioso.
 */
export interface GhostModule {
  readonly id: GhostModuleId;
  readonly nome: string;
  readonly tipo: 'passivo' | 'individual' | 'coletivo';
  /** Usos fixos por partida. `Infinity` para passivos. */
  readonly usos: number;
  /**
   * Coletivos só entram em operação a partir da segunda morte — antes disso
   * "os mortos" são uma pessoa só, e votar sozinho não é votar.
   */
  readonly minimoDeMortos: number;
  readonly descricao: string;
}

export const MODULOS_DE_FANTASMA: readonly GhostModule[] = [
  {
    id: 'peso-da-culpa',
    nome: 'Peso da Culpa',
    tipo: 'passivo',
    usos: Infinity,
    minimoDeMortos: 1,
    descricao:
      'Só ganha voto quem foi linchado injustamente. Quem era lobo não ganha nada. ' +
      'Auto-corretivo: pune o erro da vila e reequilibra sozinho.',
  },
  {
    id: 'assombrar',
    nome: 'Assombrar',
    tipo: 'individual',
    usos: 1,
    minimoDeMortos: 1,
    descricao: 'Marca um vivo; se ele tiver ação noturna, ela falha.',
  },
  {
    id: 'pesadelo',
    nome: 'Pesadelo',
    tipo: 'individual',
    usos: 1,
    minimoDeMortos: 1,
    descricao:
      'Envia a um vivo uma informação privada — o fantasma escolhe se ela é verdadeira ou falsa.',
  },
  {
    id: 'conselho-dos-mortos',
    nome: 'Conselho dos Mortos',
    tipo: 'coletivo',
    usos: 1,
    minimoDeMortos: 2,
    descricao: 'Os mortos votam qual evento atinge a vila na próxima noite.',
  },
  {
    id: 'julgamento-do-alem',
    nome: 'Julgamento do Além',
    tipo: 'coletivo',
    usos: Infinity,
    minimoDeMortos: 2,
    descricao:
      'Depois de cada linchamento, os mortos votam se foi justo. O app anuncia o ' +
      'sentimento agregado, sem revelar o placar.',
  },
];

export const MODULOS_POR_ID: ReadonlyMap<GhostModuleId, GhostModule> = new Map(
  MODULOS_DE_FANTASMA.map((m) => [m.id, m]),
);

/** Um módulo está operante nesta partida, neste momento? */
export function moduloAtivo(
  id: GhostModuleId,
  ativos: readonly GhostModuleId[],
  quantidadeDeMortos: number,
): boolean {
  const m = MODULOS_POR_ID.get(id);
  return !!m && ativos.includes(id) && quantidadeDeMortos >= m.minimoDeMortos;
}
