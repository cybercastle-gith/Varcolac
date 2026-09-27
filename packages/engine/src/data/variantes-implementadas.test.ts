import { describe, expect, it } from 'vitest';
import { ROLES } from './roles/index';
import {
  VARIANTES_PENDENTES,
  contagemDeVariantes,
  motivoDaPendencia,
  varianteImplementada,
} from './variantes-implementadas';

describe('registro de variantes implementadas', () => {
  it('todo id pendente existe no catálogo', () => {
    const existentes = new Set(ROLES.flatMap((r) => r.variantes.map((v) => v.id)));
    for (const id of VARIANTES_PENDENTES.keys()) {
      expect(existentes.has(id), `"${id}" está na lista e não existe no catálogo`).toBe(true);
    }
  });

  it('nenhum id de variante se repete entre funções diferentes', () => {
    /*
     * A lista é indexada só pelo id da variante, sem a função. Isso só é
     * seguro enquanto os ids forem únicos no catálogo inteiro — se duas
     * funções tiverem uma variante "rastro", marcar uma marcaria as duas.
     */
    const vistos = new Map<string, string>();
    for (const r of ROLES) {
      for (const v of r.variantes) {
        const anterior = vistos.get(v.id);
        expect(anterior, `"${v.id}" está em ${r.id} e também em ${anterior}`).toBeUndefined();
        vistos.set(v.id, r.id);
      }
    }
  });

  it('toda pendência explica o motivo', () => {
    // Uma pendência sem motivo vira dívida invisível: daqui a um mês ninguém
    // lembra se faltava decidir a regra ou faltava escrever o código.
    for (const [id, motivo] of VARIANTES_PENDENTES) {
      expect(motivo.length, `"${id}" está pendente sem explicação`).toBeGreaterThan(40);
    }
  });

  it('a conta bate com o catálogo', () => {
    const total = ROLES.reduce((n, r) => n + r.variantes.length, 0);
    const conta = contagemDeVariantes();
    expect(conta.total).toBe(total);
    expect(conta.implementadas).toBe(total - VARIANTES_PENDENTES.size);
  });

  it('a esmagadora maioria das variantes funciona', () => {
    /*
     * O teto é deliberado e baixo. Ele não protege contra nada hoje — protege
     * contra o padrão que já aconteceu uma vez: acrescentar variantes ao
     * catálogo em lote e deixar a mecânica para depois. Se alguém subir este
     * número, que seja uma decisão consciente e não um acúmulo.
     */
    const { total, implementadas } = contagemDeVariantes();
    expect(total - implementadas).toBeLessThanOrEqual(5);
  });

  it('varianteImplementada e motivoDaPendencia concordam', () => {
    for (const r of ROLES) {
      for (const v of r.variantes) {
        expect(varianteImplementada(v.id)).toBe(motivoDaPendencia(v.id) === null);
      }
    }
    // Sem variante escolhida, a role base sempre funciona.
    expect(varianteImplementada(undefined)).toBe(true);
    expect(motivoDaPendencia(undefined)).toBeNull();
  });
});
