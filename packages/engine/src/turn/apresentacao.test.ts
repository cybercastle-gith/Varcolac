import { describe, expect, it } from 'vitest';
import { ROLES } from '../data/roles/index';
import { apresentacaoDaCarta } from './apresentacao';

describe('apresentação das cartas', () => {
  it('toda função tem verbo e atmosfera próprios', () => {
    /*
     * O fallback existe para não quebrar, mas cair nele é o defeito que este
     * módulo foi criado para resolver: uma carta desenhada como formulário
     * genérico. Se uma função nova entrar no catálogo sem apresentação, este
     * teste cobra antes de alguém ver "Confirmar" na tela.
     */
    const semApresentacao = ROLES.filter((r) => {
      const a = apresentacaoDaCarta(r.id);
      return a.verbo === 'Confirmar' || a.atmosfera === 'Sua vez.';
    });
    expect(semApresentacao.map((r) => r.nome)).toEqual([]);
  });

  it('nenhum verbo se repete entre funções de facções diferentes', () => {
    /*
     * Verbo repetido dentro da matilha é aceitável — Lobo e Alfa mordem os
     * dois. Entre facções é sinal de preguiça: se o Médico e o Lobo apertam o
     * mesmo botão, a tela voltou a ser genérica.
     */
    const porVerbo = new Map<string, Set<string>>();
    for (const r of ROLES) {
      const { verbo } = apresentacaoDaCarta(r.id);
      const faccoes = porVerbo.get(verbo) ?? new Set<string>();
      faccoes.add(r.faccao);
      porVerbo.set(verbo, faccoes);
    }
    const atravessaFaccoes = [...porVerbo].filter(([, f]) => f.size > 1).map(([v]) => v);
    expect(atravessaFaccoes).toEqual([]);
  });

  it('o que não tem volta pede confirmação dupla', () => {
    // Matar, converter e queimar o único uso da partida não saem de um toque
    // distraído no nome errado.
    for (const id of ['lobo', 'alfa', 'feiticeiro', 'padre', 'necromante', 'bruxa']) {
      expect(apresentacaoDaCarta(id).pesado, `${id} devia pedir confirmação dupla`).toBe(true);
    }
    // E o que tem volta NÃO pede: proteção virando formalidade é o mesmo que
    // não ter proteção, porque todo mundo aprende a atravessar sem ler.
    for (const id of ['vidente', 'detetive', 'medico', 'taverneiro']) {
      expect(apresentacaoDaCarta(id).pesado, `${id} não devia pedir confirmação dupla`).toBe(false);
    }
  });

  it('a variante pode mudar o tom sem perder o resto da função', () => {
    const base = apresentacaoDaCarta('vidente');
    const ossos = apresentacaoDaCarta('vidente', 'ossos');
    expect(ossos.verbo).not.toBe(base.verbo);
    // Herda o que não foi sobrescrito.
    expect(ossos.pesado).toBe(base.pesado);

    // Uma variante sem ajuste próprio herda TUDO: é a mesma carta com um
    // detalhe de alcance diferente, e inventar um tom novo para ela seria
    // ruído — o jogador leria uma diferença que a regra não tem.
    expect(apresentacaoDaCarta('medico', 'curandeiro')).toEqual(apresentacaoDaCarta('medico'));
  });
});
