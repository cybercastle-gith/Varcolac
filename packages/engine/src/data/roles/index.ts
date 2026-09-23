import type { Role, RoleId } from '../../types/role';
import { ROLES_VILA } from './vila';
import { ROLES_LOBOS } from './lobos';
import { ROLES_SOLITARIOS } from './solitarios';

export * from './vila';
export * from './lobos';
export * from './solitarios';

/** Catálogo completo: as 24 roles. */
export const ROLES: readonly Role[] = [...ROLES_VILA, ...ROLES_LOBOS, ...ROLES_SOLITARIOS];

export const ROLES_POR_ID: ReadonlyMap<RoleId, Role> = new Map(ROLES.map((r) => [r.id, r]));


/** Lança se o id não existir — um baralho com id errado é bug, não caso de uso. */
export function role(id: RoleId): Role {
  const r = ROLES_POR_ID.get(id);
  if (!r) throw new Error(`Role desconhecida: ${id}`);
  return r;
}

export { ROLES_VILA, ROLES_LOBOS, ROLES_SOLITARIOS };
