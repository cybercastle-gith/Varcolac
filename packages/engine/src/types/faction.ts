/** As três facções do jogo. Não existe culto nem terceira facção coletiva. */
export type Faction = 'vila' | 'lobos' | 'solitario';

/**
 * Alinhamento de um solitário.
 * - `bem`   — vence junto com a vila
 * - `mal`   — conta como lobo para efeito de paridade
 * - `puro`  — só a própria condição de vitória importa
 * - `herda` — assume o alinhamento de outra role (Ladrão)
 * - `definido-em-jogo` — decidido durante a partida (Bruxa, pela poção)
 */
export type SoloAlignment = 'bem' | 'mal' | 'puro' | 'herda' | 'definido-em-jogo';

/** Alinhamento já resolvido, usado pela checagem de vitória. */
export type ResolvedAlignment = 'bem' | 'mal' | 'puro';

/**
 * Conta para a paridade lobos × vila?
 * Lobos sempre contam. Solitários contam quando alinhados ao mal.
 */
export function countsAsWolf(
  faction: Faction,
  alignment: ResolvedAlignment | undefined,
): boolean {
  if (faction === 'lobos') return true;
  if (faction === 'solitario') return alignment === 'mal';
  return false;
}

/** Conta como vila para a paridade: vila, e solitários alinhados ao bem. */
export function countsAsVillage(
  faction: Faction,
  alignment: ResolvedAlignment | undefined,
): boolean {
  if (faction === 'vila') return true;
  if (faction === 'solitario') return alignment === 'bem';
  return false;
}
