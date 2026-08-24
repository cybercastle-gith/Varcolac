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

/**
 * Votos do dia.
 *
 * A mesa CONVERGE. Este é o ponto em que o bot precisa parecer com gente, e o
 * único em que ele parece: numa mesa real a vila conversa e se junta em cima de
 * um suspeito, enquanto a matilha empurra o alvo dela em bloco.
 *
 * A versão anterior fazia cada aldeão votar ao acaso, e o resultado media outra
 * coisa: com a vila dispersa e a matilha unida, os lobos decidiam o linchamento
 * quase sempre, e a vila ganhava ~13% mesmo em composições que a calculadora
 * lia como quebradas a favor dela. Isso não é força estrutural do baralho — é
 * ausência de coordenação, e nenhuma mesa real joga assim.
 *
 * O modelo, então:
 * - a vila usa a informação que TEM (leitura verdadeira da Vidente vira acusação);
 * - sem informação, ela converge num suspeito só, sorteado;
 * - a matilha vota em bloco num não-lobo.
 *
 * O que continua deliberadamente burro: ninguém mente, ninguém lê comportamento,
 * ninguém deduz por ausência. A medição segue sendo um PISO da vila.
 */
export function decidirVotos(estado: GameState, rng: Rng): Record<PlayerId, PlayerId | null> {
  const { podem } = elegiveisParaVotar(estado);
  const votos: Record<PlayerId, PlayerId | null> = {};
  const vivosAgora = vivos(estado);

  const souLobo = (id: PlayerId) => {
    const p = estado.players.find((x) => x.id === id);
    return !!p && role(p.roleId).faccao === 'lobos';
  };

  // A vila acusa quem uma leitura verdadeira apontou como lobo e ainda está vivo.
  const acusado = estado.informacoes
    .filter((i) => i.verdadeira && i.origem === 'vidente' && i.texto.includes('lobo'))
    .flatMap((i) => i.sobre)
    .find((id) => vivosAgora.some((p) => p.id === id && role(p.roleId).faccao === 'lobos'));

  const presas = vivosAgora.filter((p) => role(p.roleId).faccao !== 'lobos');
  const alvoDaMatilha = presas.length > 0 ? rng.pick(presas).id : null;

  // Suspeito da vila: um só, para a mesa inteira. É a convergência.
  const suspeito = acusado ?? (vivosAgora.length > 0 ? rng.pick(vivosAgora).id : null);

  for (const id of podem) {
    if (souLobo(id)) {
      votos[id] = alvoDaMatilha && alvoDaMatilha !== id ? alvoDaMatilha : null;
      continue;
    }
    votos[id] = suspeito && suspeito !== id ? suspeito : null;
  }

  return votos;
}
