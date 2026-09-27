import type { GameState } from '../../types/game-state';
import type { PlayerId } from '../../types/player';

/**
 * Por que este jogador NÃO pode ser protegido — ou `null` quando pode.
 *
 * Duas variantes negam proteção, e as duas negam de fora: a Marca de Ferro do
 * Feiticeiro queima o alvo pelo resto da partida, e a Maldição do Vingador vale
 * enquanto o Vingador respirar. Nenhuma das duas é do protetor, e é por isso
 * que a checagem mora aqui e não dentro do Médico: quem protege pode ser
 * Médico, Guarda-costas ou o Luto Sagrado, e os três precisam obedecer.
 *
 * Devolve o MOTIVO em vez de um booleano porque o log da noite tem de dizer à
 * mesa por que a cura falhou — "não conseguiu proteger" sem causa é o tipo de
 * linha que faz o host achar que o app bugou.
 */
export function protecaoBloqueada(estado: GameState, alvoId: PlayerId): string | null {
  const alvo = estado.players.find((p) => p.id === alvoId);
  if (!alvo) return null;

  if (alvo.marcas.naoProtegivel) {
    return 'Marca de Ferro: o Feiticeiro queimou este alvo — nada mais o protege.';
  }

  const maldicao = estado.players.find(
    (p) =>
      p.status === 'vivo' &&
      p.roleId === 'vingador' &&
      p.varianteId === 'maldicao-do-vingador' &&
      estado.objetivosSecretos[p.id] === alvoId,
  );
  if (maldicao) {
    return `Maldição do Vingador: enquanto ${maldicao.nome} viver, este alvo não pode ser curado.`;
  }

  return null;
}
