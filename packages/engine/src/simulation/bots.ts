import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import { role, ROLES_POR_ID } from '../data/roles/index';
import { elegiveisParaVotar } from '../day/voting';
import type { Rng } from '../utils/rng';

/**
 * Política de decisão dos bots para a simulação em massa.
 *
 * Isto NÃO é uma tentativa de jogar bem — é um jogador médio deliberadamente
 * burro, e essa escolha é metodológica. A calculadora de peso mede a força
 * ESTRUTURAL de uma composição; se os bots jogassem bem, a taxa de vitória
 * mediria a qualidade do bot junto, e a calibragem passaria a depender de um
 * segundo modelo que ninguém validou.
 *
 * O que os bots fazem:
 * - lobos atacam alguém de fora da matilha, ao acaso;
 * - proteção e investigação escolhem alvo ao acaso, sem memória;
 * - no dia, a vila vota ao acaso entre os vivos; os lobos votam em quem não é
 *   lobo, que é a única assimetria — porque ela existe na mesa real, onde a
 *   matilha se conhece e a vila não.
 */

const outros = (estado: GameState, eu: PlayerId): readonly Player[] =>
  vivos(estado).filter((p) => p.id !== eu);

const naoLobos = (estado: GameState): readonly Player[] =>
  vivos(estado).filter((p) => role(p.roleId).faccao !== 'lobos');

/** Monta a submissão da noite inteira. */
export function decidirNoite(estado: GameState, rng: Rng): NightSubmission {
  const acoes: NightAction[] = [];
  const matilha = vivos(estado).filter((p) => role(p.roleId).faccao === 'lobos');

  // A matilha decide um alvo só, junta — é o que acontece na mesa.
  if (matilha.length > 0) {
    const presas = naoLobos(estado);
    const porta_voz = matilha[0]!;
    if (presas.length > 0) {
      acoes.push({
        actorId: porta_voz.id,
        kind: 'atacar',
        etapa: 'ataque',
        alvos: [rng.pick(presas).id, ...(presas.length > 1 ? [rng.pick(presas).id] : [])],
        falsa: false,
      });
    }
  }

  for (const p of vivos(estado)) {
    const r = ROLES_POR_ID.get(p.roleId);
    if (!r?.etapa || r.etapa === 'ataque' || r.etapa === 'estertores') continue;
    if (p.usosRestantes <= 0) continue;

    const alvos = outros(estado, p.id);
    if (alvos.length === 0) continue;

    const kind =
      r.etapa === 'protecao'
        ? 'proteger'
        : r.etapa === 'bloqueio'
          ? 'bloquear'
          : r.etapa === 'perfuracao'
            ? 'perfurar'
            : r.etapa === 'ressurreicao'
              ? 'ressuscitar'
              : r.id === 'detetive'
                ? 'comparar'
                : 'investigar';

    // O Padre não escolhe alvo: ele cancela a noite. E só faz isso às vezes,
    // senão o poder de uma vez por partida seria gasto sempre na noite 1.
    if (p.roleId === 'padre') {
      if (rng.next() < 0.25) {
        acoes.push({ actorId: p.id, kind: 'proteger', etapa: 'protecao', alvos: [], falsa: false });
      }
      continue;
    }

    if (r.etapa === 'ressurreicao') {
      const mortos = estado.players.filter(
        (x) => x.status === 'morto' && (x.mortoNaRodada ?? 0) < estado.rodada,
      );
      if (mortos.length === 0) continue;
      acoes.push({
        actorId: p.id,
        kind: 'ressuscitar',
        etapa: 'ressurreicao',
        alvos: [rng.pick(mortos).id],
        falsa: false,
      });
      continue;
    }

    const escolhidos =
      kind === 'comparar' && alvos.length >= 2
        ? rng.sample(alvos, 2).map((x) => x.id)
        : [rng.pick(alvos).id];

    acoes.push({ actorId: p.id, kind, etapa: r.etapa, alvos: escolhidos, falsa: false });
  }

  return { rodada: estado.rodada, acoes };
}

/** Votos do dia. Única assimetria: a matilha sabe quem é matilha. */
export function decidirVotos(estado: GameState, rng: Rng): Record<PlayerId, PlayerId | null> {
  const { podem } = elegiveisParaVotar(estado);
  const votos: Record<PlayerId, PlayerId | null> = {};

  for (const id of podem) {
    const eu = estado.players.find((p) => p.id === id);
    if (!eu) continue;
    const souLobo = role(eu.roleId).faccao === 'lobos';
    const alvos = souLobo ? naoLobos(estado).filter((p) => p.id !== id) : outros(estado, id);
    votos[id] = alvos.length > 0 ? rng.pick(alvos).id : null;
  }

  return votos;
}
