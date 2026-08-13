import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import { countsAsWolf, countsAsVillage, type ResolvedAlignment } from '../types/faction';
import { role } from '../data/roles/index';

/** Vitórias são em camadas: a vila pode vencer e o Bobo também. */
export type VictoryLayer = 'vila' | 'lobos' | 'solitario' | 'amantes';

export interface VictoryClaim {
  readonly camada: VictoryLayer;
  readonly vencedores: readonly PlayerId[];
  readonly motivo: string;
}

export interface VictoryResult {
  readonly encerrada: boolean;
  readonly camadas: readonly VictoryClaim[];
}

/**
 * Alinhamento já resolvido de um jogador.
 * TODO: `herda` (Ladrão) e `definido-em-jogo` (Bruxa) precisam do estado real;
 * até lá caem em `puro`, que é o neutro seguro — não contam para nenhum lado.
 */
function alinhamento(p: Player): ResolvedAlignment | undefined {
  const a = role(p.roleId).alinhamento;
  if (a === 'bem' || a === 'mal' || a === 'puro') return a;
  return a === undefined ? undefined : 'puro';
}

/**
 * Regras (seção 4 do dossiê):
 * - Vila vence eliminando todas as ameaças.
 * - Lobos vencem ao igualar ou superar a vila em número.
 * - Solitários do mal contam como lobos na paridade.
 * - Bobo vence ao ser linchado — encerra a partida na hora.
 * - Vingador vence se o alvo morrer, por qualquer causa.
 * - Sobrevivente vence com qualquer vencedor, desde que vivo.
 * - Amantes vencem se forem os dois últimos vivos.
 * - Lobo Branco pode vencer sozinho ou junto com a matilha.
 */
export function verificarVitoria(estado: GameState): VictoryResult {
  const vivosAgora = vivos(estado);
  const camadas: VictoryClaim[] = [];

  const lado = (p: Player) => {
    const r = role(p.roleId);
    const a = alinhamento(p);
    if (countsAsWolf(r.faccao, a)) return 'lobos' as const;
    if (countsAsVillage(r.faccao, a)) return 'vila' as const;
    return 'neutro' as const;
  };

  const lobosVivos = vivosAgora.filter((p) => lado(p) === 'lobos');
  const vilaViva = vivosAgora.filter((p) => lado(p) === 'vila');

  // Amantes: os dois últimos vivos, e são um par.
  const [a, b] = vivosAgora;
  if (vivosAgora.length === 2 && a && b && a.amanteDe === b.id && b.amanteDe === a.id) {
    camadas.push({
      camada: 'amantes',
      vencedores: [a.id, b.id],
      motivo: 'Os dois amantes são os últimos vivos.',
    });
  } else if (lobosVivos.length === 0) {
    camadas.push({
      camada: 'vila',
      vencedores: vilaViva.map((p) => p.id),
      motivo: 'Nenhuma ameaça restante.',
    });
  } else if (lobosVivos.length >= vilaViva.length) {
    camadas.push({
      camada: 'lobos',
      vencedores: lobosVivos.map((p) => p.id),
      motivo: `Matilha igualou ou superou a vila: ${lobosVivos.length} × ${vilaViva.length}.`,
    });
  }

  const encerrada = camadas.length > 0;

  if (encerrada) {
    // Sobrevivente vence junto com quem vencer, desde que vivo.
    const sobreviventes = vivosAgora
      .filter((p) => p.roleId === 'sobrevivente')
      .map((p) => p.id);
    if (sobreviventes.length > 0) {
      camadas.push({
        camada: 'solitario',
        vencedores: sobreviventes,
        motivo: 'Sobrevivente vivo no fim.',
      });
    }
    // TODO: Vingador (alvo morto), Coringa (missão sorteada), Bobo (linchamento,
    // que encerra a partida fora daqui, na resolução da votação).
  }

  return { encerrada, camadas };
}
