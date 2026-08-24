import type { RoleId } from '../types/role';

/**
 * O sistema de ícones, como DADO.
 *
 * Os ícones não são desenhos de objetos: são motivos de bordado, geométricos e
 * planos, com um único peso de traço — o repertório do leste europeu. Isso
 * mantém o sistema coerente, funciona a 48px e não custa arquivo de imagem.
 *
 * Mora no engine, e não no app, por dois motivos: o laboratório também desenha
 * ícones, e o motivo é parte da IDENTIDADE da role, do mesmo jeito que o nome.
 * Uma role nova sem motivo é uma role pela metade.
 *
 * **A variante não tem ícone próprio.** Ela acrescenta um COMPLEMENTO ao motivo
 * da role base — o mesmo desenho, mais específico. Quem aprendeu a reconhecer a
 * Vidente reconhece a Vidente dos Ossos sem aprender nada de novo.
 */

/** Primitivas desenháveis. Tudo é composto a partir delas. */
export type Primitiva =
  /** Quadrado girado 45°: o losango, motivo-base do repertório. */
  | { readonly f: 'losango'; readonly t: number; readonly cheio?: boolean; readonly dx?: number; readonly dy?: number }
  | { readonly f: 'circulo'; readonly t: number; readonly cheio?: boolean; readonly dx?: number; readonly dy?: number }
  /** Barra reta. `rot` em graus. */
  | { readonly f: 'barra'; readonly c: number; readonly e?: number; readonly rot?: number; readonly dx?: number; readonly dy?: number }
  | { readonly f: 'triangulo'; readonly t: number; readonly baixo?: boolean; readonly dx?: number; readonly dy?: number }
  /** Ponto pequeno, usado quase só como complemento de variante. */
  | { readonly f: 'ponto'; readonly dx?: number; readonly dy?: number };

export interface Motivo {
  readonly base: readonly Primitiva[];
  /** Complementos por variante: acrescentados ao base, nunca substituem. */
  readonly complementos?: Readonly<Record<string, readonly Primitiva[]>>;
}

// ── Vocabulário compartilhado ───────────────────────────────────────────────
// Repetir estas peças entre roles é o que faz o conjunto parecer um sistema, e
// não vinte desenhos soltos.

const LOSANGO = { f: 'losango', t: 22 } as const;
const LOSANGO_CHEIO = { f: 'losango', t: 22, cheio: true } as const;
const LOSANGO_PEQUENO = { f: 'losango', t: 11 } as const;
const OLHO = { f: 'circulo', t: 12 } as const;
const PUPILA = { f: 'circulo', t: 5, cheio: true } as const;
const DENTE = { f: 'triangulo', t: 18, baixo: true } as const;
const CRUZ = [
  { f: 'barra', c: 22, rot: 0 },
  { f: 'barra', c: 22, rot: 90 },
] as const;

/** Complementos reutilizados: a mesma marca quer dizer a mesma coisa. */
const MENOS = [{ f: 'barra', c: 9, dy: 14 }] as const; // enfraquecido
const MAIS = [
  { f: 'barra', c: 9, dy: 14 },
  { f: 'barra', c: 9, rot: 90, dy: 14 },
] as const; // reforçado
const ATRASO = [{ f: 'ponto', dx: 13, dy: 13 }] as const; // acontece depois
const DUPLO = [{ f: 'losango', t: 30 }] as const; // alcança dois
const PUBLICO = [{ f: 'circulo', t: 32 }] as const; // a mesa toda vê

export const MOTIVOS: Readonly<Record<RoleId, Motivo>> = {
  // ── Vila ──
  aldeao: {
    base: [LOSANGO],
    complementos: { herdeiro: [LOSANGO_PEQUENO], teimoso: MENOS, testemunha: PUBLICO },
  },
  vidente: {
    base: [OLHO, PUPILA, { f: 'losango', t: 26 }],
    complementos: {
      ossos: [{ f: 'barra', c: 26, rot: 45 }],
      espelho: PUBLICO,
      sonhos: ATRASO,
      confusa: [{ f: 'circulo', t: 5, cheio: true, dx: 9, dy: -9 }],
    },
  },
  detetive: {
    base: [
      { f: 'circulo', t: 12, dx: -6 },
      { f: 'circulo', t: 12, dx: 6 },
    ],
    complementos: { obsessivo: [PUPILA], cansado: MENOS, delegado: PUBLICO },
  },
  medico: {
    base: [...CRUZ, { f: 'circulo', t: 28 }],
    complementos: { curandeiro: MENOS, 'de-guerra': DUPLO, 'de-plantao': ATRASO },
  },
  'guarda-costas': {
    base: [{ f: 'triangulo', t: 22 }, { f: 'barra', c: 26, dy: 12 }],
    complementos: { sacrificio: MAIS, escudo: ATRASO, muralha: DUPLO },
  },
  xerife: {
    base: [{ f: 'circulo', t: 26 }, { f: 'barra', c: 26, rot: 45 }],
  },
  necromante: {
    base: [{ f: 'losango', t: 24 }, { f: 'barra', c: 24, rot: 90 }, { f: 'ponto', dy: -14 }],
  },
  padre: {
    base: [...CRUZ, { f: 'ponto', dy: -16 }],
    complementos: {
      exorcista: [{ f: 'circulo', t: 30 }],
      sino: [{ f: 'triangulo', t: 14, dy: 8 }],
      martir: [{ f: 'losango', t: 30, cheio: false }],
    },
  },
  cacador: {
    base: [{ f: 'barra', c: 30, rot: 45 }, { f: 'triangulo', t: 12, dx: 10, dy: -10 }],
    complementos: { armadilha: [LOSANGO_PEQUENO], 'ultimo-uivo': PUBLICO, vingativo: MENOS },
  },
  taverneiro: {
    base: [{ f: 'triangulo', t: 20, baixo: true }, { f: 'barra', c: 20, dy: -12 }],
  },
  ancia: {
    base: [{ f: 'circulo', t: 28 }, { f: 'circulo', t: 16 }, PUPILA],
  },

  // ── Lobos ── todos carregam o dente: a matilha se reconhece no desenho.
  lobo: { base: [DENTE] },
  alfa: { base: [DENTE, { f: 'barra', c: 26, dy: -14 }] },
  feiticeiro: { base: [DENTE, { f: 'barra', c: 30, rot: 45 }] },
  'lobo-carnical': { base: [DENTE, { f: 'triangulo', t: 10, baixo: true, dy: 12 }] },
  'lobo-sombra': { base: [DENTE, { f: 'circulo', t: 30 }] },
  uivador: { base: [DENTE, { f: 'barra', c: 12, rot: 45, dx: -14, dy: -8 }, { f: 'barra', c: 12, rot: -45, dx: 14, dy: -8 }] },
  'lobo-branco': { base: [{ f: 'triangulo', t: 18 }, DENTE] },

  // ── Solitários ── o losango VAZADO é a marca comum.
  bruxa: { base: [LOSANGO, { f: 'circulo', t: 10, cheio: true }] },
  ladrao: { base: [LOSANGO, { f: 'barra', c: 26, rot: 45 }] },
  coringa: { base: [LOSANGO, { f: 'losango', t: 11 }] },
  sobrevivente: { base: [LOSANGO, { f: 'barra', c: 14, rot: 90, dy: 2 }] },
  bobo: { base: [{ f: 'losango', t: 22, cheio: true }, { f: 'ponto', dy: -15 }] },
  vingador: { base: [LOSANGO, { f: 'triangulo', t: 10, dy: -2 }] },
};

/** Motivo do modificador Amantes, que não é role mas precisa de marca. */
export const MOTIVO_AMANTES: Motivo = {
  base: [
    { f: 'circulo', t: 16, dx: -6 },
    { f: 'circulo', t: 16, dx: 6 },
  ],
  complementos: { 'amor-proibido': [{ f: 'barra', c: 30, rot: 45 }], 'amor-cego': MENOS },
};

/** As primitivas de uma role, já com o complemento da variante aplicado. */
export function motivoDe(roleId: RoleId, varianteId?: string): readonly Primitiva[] {
  const m: Motivo = MOTIVOS[roleId] ?? { base: [LOSANGO_CHEIO] };
  const extra = varianteId ? (m.complementos?.[varianteId] ?? []) : [];
  return [...m.base, ...extra];
}
