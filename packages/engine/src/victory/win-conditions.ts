import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import { countsAsWolf, countsAsVillage, type ResolvedAlignment } from '../types/faction';
import { role } from '../data/roles/index';
import { MISSOES_POR_ID } from '../data/missions';

/** Vitórias são em camadas: a vila pode vencer e o Bobo também. */
export type VictoryLayer = 'vila' | 'lobos' | 'solitario';

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
 *
 * `herda` (Ladrão) e `definido-em-jogo` (Bruxa) só existem até a partida
 * começar: a troca do Ladrão acontece na criação e ele passa a ter a role
 * roubada, e a poção da Bruxa fica em `objetivosSecretos`. O que sobra aqui é
 * o caso da Bruxa, resolvido pela poção.
 */
function alinhamento(estado: GameState, p: Player): ResolvedAlignment | undefined {
  const a = role(p.roleId).alinhamento;
  if (a === 'bem' || a === 'mal' || a === 'puro') return a;
  if (a === 'definido-em-jogo') {
    return estado.objetivosSecretos[p.id] === 'pocao-morte' ? 'mal' : 'bem';
  }
  return a === undefined ? undefined : 'puro';
}

function lado(estado: GameState, p: Player): 'vila' | 'lobos' | 'neutro' {
  const r = role(p.roleId);
  const a = alinhamento(estado, p);
  if (countsAsWolf(r.faccao, a)) return 'lobos';
  if (countsAsVillage(r.faccao, a)) return 'vila';
  return 'neutro';
}

/** Camadas paralelas: valem quando a partida termina, junto de quem venceu. */
function camadasDeSolitarios(estado: GameState, vivosAgora: readonly Player[]): VictoryClaim[] {
  const claims: VictoryClaim[] = [];

  const sobreviventes = vivosAgora.filter((p) => p.roleId === 'sobrevivente');
  if (sobreviventes.length > 0) {
    claims.push({
      camada: 'solitario',
      vencedores: sobreviventes.map((p) => p.id),
      motivo: 'Sobrevivente vivo no fim: vence com qualquer vencedor.',
    });
  }

  // Vingador: vence se o alvo escolhido na noite 1 morreu, por qualquer causa.
  for (const p of estado.players.filter((x) => x.roleId === 'vingador')) {
    const alvoId = estado.objetivosSecretos[p.id];
    const alvo = alvoId ? estado.players.find((x) => x.id === alvoId) : undefined;
    if (alvo?.status === 'morto') {
      claims.push({
        camada: 'solitario',
        vencedores: [p.id],
        motivo: `Vingador: ${alvo.nome} morreu. Vitória passiva.`,
      });
    }
  }

  // Coringa: missão sorteada, verificável quando o engine consegue julgar.
  for (const p of estado.players.filter((x) => x.roleId === 'coringa')) {
    const missao = MISSOES_POR_ID.get(estado.objetivosSecretos[p.id] ?? '');
    if (!missao) continue;

    const cumpriu =
      missao.verificacao === 'sobreviver'
        ? p.status === 'vivo'
        : missao.verificacao === 'morrer-de-noite'
          ? p.status === 'morto' && p.causaMorte !== 'linchamento'
          : missao.verificacao === 'nunca-votar'
            ? estado.historicoVotos.every((v) => !v.votos[p.id])
            : null;

    if (cumpriu === true) {
      claims.push({
        camada: 'solitario',
        vencedores: [p.id],
        motivo: `Coringa cumpriu a missão: ${missao.texto}`,
      });
    } else if (cumpriu === null) {
      claims.push({
        camada: 'solitario',
        vencedores: [],
        motivo: `Coringa: a missão "${missao.texto}" é julgada na mesa, pelo host.`,
      });
    }
  }

  return claims;
}

/**
 * Regras (seção 4 do dossiê):
 * - Vila vence eliminando todas as ameaças.
 * - Lobos vencem ao igualar ou superar a vila em número.
 * - Solitários do mal contam como lobos na paridade.
 * - Lobo Branco pode vencer sozinho ou junto com a matilha.
 * - Bobo vence ao ser linchado, e isso encerra a partida na votação, não aqui.
 */
export function verificarVitoria(estado: GameState): VictoryResult {
  // Uma vitória já declarada (o Bobo) não é reavaliada.
  if (estado.vencedores) {
    return {
      encerrada: true,
      camadas: [
        { camada: 'solitario', vencedores: estado.vencedores, motivo: 'Vitória já declarada.' },
      ],
    };
  }

  const vivosAgora = vivos(estado);
  const camadas: VictoryClaim[] = [];

  const lobosVivos = vivosAgora.filter((p) => lado(estado, p) === 'lobos');
  const vilaViva = vivosAgora.filter((p) => lado(estado, p) === 'vila');

  if (lobosVivos.length === 0) {
    camadas.push({
      camada: 'vila',
      vencedores: vilaViva.map((p) => p.id),
      motivo: 'Nenhuma ameaça restante.',
    });
  } else if (lobosVivos.length >= vilaViva.length) {
    // O Lobo Branco joga contra a própria matilha: se sobrou só ele, vence só.
    const soLoboBranco =
      lobosVivos.length === 1 && lobosVivos[0]!.roleId === 'lobo-branco';
    camadas.push({
      camada: 'lobos',
      vencedores: lobosVivos.map((p) => p.id),
      motivo: soLoboBranco
        ? 'O Lobo Branco sobrou sozinho: vence sem a matilha.'
        : `Matilha igualou ou superou a vila: ${lobosVivos.length} × ${vilaViva.length}.`,
    });
  }

  const encerrada = camadas.length > 0;
  if (encerrada) camadas.push(...camadasDeSolitarios(estado, vivosAgora));

  return { encerrada, camadas };
}

/** Aplica o resultado ao estado, para o app e o laboratório lerem um só campo. */
export function encerrarSeAcabou(estado: GameState): GameState {
  const r = verificarVitoria(estado);
  if (!r.encerrada) return estado;
  return {
    ...estado,
    fase: 'fim',
    vencedores: [...new Set(r.camadas.flatMap((c) => c.vencedores))],
  };
}
