import { describe, expect, it } from 'vitest';
import { ROLES, ROLES_VILA, ROLES_LOBOS, ROLES_SOLITARIOS, MODIFICADORES, ancia } from './index';

describe('catálogo', () => {
  it('tem 24 roles + 1 modificador', () => {
    expect(ROLES).toHaveLength(24);
    expect(MODIFICADORES).toHaveLength(1);
  });

  it('distribui as roles como o dossiê: 11 vila, 7 lobos, 6 solitários', () => {
    expect(ROLES_VILA).toHaveLength(11);
    expect(ROLES_LOBOS).toHaveLength(7);
    expect(ROLES_SOLITARIOS).toHaveLength(6);
  });

  it('não repete id', () => {
    expect(new Set(ROLES.map((r) => r.id)).size).toBe(ROLES.length);
  });

  it('todo solitário declara alinhamento', () => {
    for (const r of ROLES_SOLITARIOS) expect(r.alinhamento).toBeDefined();
  });

  it('a Anciã pesa +2', () => {
    expect(ancia.peso).toBe(2);
  });
});
