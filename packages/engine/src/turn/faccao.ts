import type { GameState } from '../types/game-state';
import type { Faction } from '../types/faction';
import type { Player } from '../types/player';
import { role } from '../data/roles/index';

/**
 * A facção que vale AGORA, que nem sempre é a da carta.
 *
 * Existe por causa da conversão. `objetivosSecretos[id] === 'convertido'` é a
 * marca que o modo Traição já usava, e o Alfa passou a usar a mesma — mas nada
 * lia essa marca para decidir de que lado a pessoa está. O resultado era que
 * converter não convertia: o convertido continuava contando como vila na
 * paridade, continuava sendo alvo válido da matilha e continuava lendo "da
 * vila" para a Vidente. O poder existia na tela e em lugar nenhum.
 *
 * A conversão muda o LADO e só o lado. A habilidade continua sendo a da carta
 * original — um Médico convertido continua curando, e é justamente isso que
 * torna a conversão interessante para a matilha.
 */
export function faccaoEfetiva(estado: GameState, p: Player): Faction {
  if (estado.objetivosSecretos[p.id] === 'convertido') return 'lobos';
  return role(p.roleId).faccao;
}

/** Os lobos vivos que o jogo reconhece, incluindo convertidos. */
export function matilhaViva(estado: GameState): readonly Player[] {
  return estado.players.filter((p) => p.status === 'vivo' && faccaoEfetiva(estado, p) === 'lobos');
}
