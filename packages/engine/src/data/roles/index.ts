import type { Role, RoleId, RoleModifier } from '../../types/role';
import { ROLES_VILA } from './vila';
import { ROLES_LOBOS } from './lobos';
import { ROLES_SOLITARIOS, MODIFICADORES } from './solitarios';

export * from './vila';
export * from './lobos';
export * from './solitarios';

/** Catálogo completo: 24 roles + 1 modificador (Amantes). */
export const ROLES: readonly Role[] = [...ROLES_VILA, ...ROLES_LOBOS, ...ROLES_SOLITARIOS];

export const ROLES_POR_ID: ReadonlyMap<RoleId, Role> = new Map(ROLES.map((r) => [r.id, r]));

export const MODIFICADORES_POR_ID: ReadonlyMap<string, RoleModifier> = new Map(
  MODIFICADORES.map((m) => [m.id, m]),
);

/** Lança se o id não existir — um baralho com id errado é bug, não caso de uso. */
export function role(id: RoleId): Role {
  const r = ROLES_POR_ID.get(id);
  if (!r) throw new Error(`Role desconhecida: ${id}`);
  return r;
}

export { ROLES_VILA, ROLES_LOBOS, ROLES_SOLITARIOS, MODIFICADORES };
