import type { Deck, GameConfig } from '../types/config';
import { pesoEfetivo, type Role } from '../types/role';
import { role } from '../data/roles/index';
import { MODIFICADORES_POR_ID } from '../data/roles/index';

/**
 * IE = Força da Vila − (Força da Matilha × M)
 *
 * M representa a vantagem estrutural dos lobos: eles se conhecem, agem com
 * certeza e só precisam empatar em número.
 */
export const MULTIPLICADOR_POR_FAIXA = [
  { min: 5, max: 7, m: 1.8 },
  { min: 8, max: 11, m: 1.6 },
  { min: 12, max: Infinity, m: 1.4 },
] as const;

export type BalanceReading =
  | 'equilibrado'
  | 'vila-forte'
  | 'vila-quebrada'
  | 'matilha-forte'
  | 'massacre';

export interface BalanceResult {
  readonly ie: number;
  readonly forcaVila: number;
  readonly forcaMatilha: number;
  readonly multiplicador: number;
  readonly ajusteDeSetup: number;
  readonly leitura: BalanceReading;
  readonly tolerancia: { readonly min: number; readonly max: number };
  /** True quando o IE cai dentro da tolerância — considerando os eventos. */
  readonly aceitavel: boolean;
  readonly violacoes: readonly string[];
  readonly sugestoes: readonly string[];
}

export function multiplicador(jogadores: number): number {
  const faixa = MULTIPLICADOR_POR_FAIXA.find((f) => jogadores >= f.min && jogadores <= f.max);
  // Abaixo de 5 jogadores o jogo não é suportado; usa a faixa mais dura.
  return faixa?.m ?? MULTIPLICADOR_POR_FAIXA[0].m;
}

/**
 * Ajustes de setup, todos a favor da vila. Votação secreta não ajusta.
 * Eventos NÃO entram aqui — ver `toleranciaDeIE`.
 */
export function ajusteDeConfiguracao(config: GameConfig): number {
  let ajuste = 0;
  if (config.revelarRoleAoMorrer) ajuste += 2;
  if (config.contagemDeLobos === 'publica') ajuste += 1;
  if (config.modulosDeFantasma.length > 0) ajuste += 1;
  return ajuste;
}

/**
 * O ponto mais importante do modelo: eventos não deixam o jogo mais justo nem
 * mais injusto — deixam mais imprevisível. Com eventos em "caótico", um IE de
 * −4 é aceitável; sem eventos, é um massacre anunciado.
 */
export function toleranciaDeIE(config: GameConfig): { min: number; max: number } {
  const folga = { desligado: 0, raro: 1, frequente: 2, caotico: 3 }[config.frequenciaEventos];
  return { min: -2 - folga, max: 2 + folga };
}

export function lerIndice(ie: number): BalanceReading {
  if (ie > 5) return 'vila-quebrada';
  if (ie >= 3) return 'vila-forte';
  if (ie >= -2) return 'equilibrado';
  if (ie >= -5) return 'matilha-forte';
  return 'massacre';
}

/** Roles de peso 4+ são as caras: no máximo uma a cada 4 jogadores. */
function verificarRestricoes(roles: readonly Role[], deck: Deck, jogadores: number): string[] {
  const violacoes: string[] = [];

  const lobos = roles.filter((r) => r.faccao === 'lobos').length;
  const esperado = Math.round(jogadores / 3.5);
  if (lobos !== esperado) {
    violacoes.push(`Lobos: ${lobos}, esperado ≈ ${esperado} (jogadores ÷ 3,5).`);
  }

  const solitarios = roles.filter((r) => r.faccao === 'solitario').length;
  const tetoSolitarios = Math.floor(jogadores * 0.25);
  if (solitarios > tetoSolitarios) {
    violacoes.push(`Solitários: ${solitarios}, teto de 25% da mesa é ${tetoSolitarios}.`);
  }

  const pesados = roles.filter((r) => r.peso >= 4).length;
  const tetoPesados = Math.floor(jogadores / 4);
  if (pesados > tetoPesados) {
    violacoes.push(`Roles de peso 4+: ${pesados}, teto é ${tetoPesados} (uma a cada 4).`);
  }

  for (const m of deck.modificadores) {
    if (!MODIFICADORES_POR_ID.has(m)) violacoes.push(`Modificador desconhecido: ${m}.`);
  }

  return violacoes;
}

function sugerir(ie: number, leitura: BalanceReading, roles: readonly Role[]): string[] {
  if (leitura === 'equilibrado') return [];

  const vilaForte = ie > 0;
  const candidata = [...roles]
    .filter((r) => (vilaForte ? r.faccao === 'vila' : r.faccao === 'lobos'))
    .sort((a, b) => b.peso - a.peso)[0];

  if (vilaForte) {
    return [
      candidata
        ? `Vila muito forte. Sugestão: trocar o ${candidata.nome} por um Aldeão, ou adicionar um lobo.`
        : 'Vila muito forte. Sugestão: adicionar um lobo.',
    ];
  }
  return [
    candidata
      ? `Matilha muito forte. Sugestão: trocar o ${candidata.nome} por um Lobo comum, ou dar um poder à vila.`
      : 'Matilha muito forte. Sugestão: dar um poder à vila.',
  ];
}

export function calcularEquilibrio(
  deck: Deck,
  config: GameConfig,
  jogadores: number,
): BalanceResult {
  const roles = deck.roleIds.map(role);

  let forcaVila = 0;
  let forcaMatilha = 0;
  for (const r of roles) {
    const peso = pesoEfetivo(r, config.variantes[r.id]);
    if (r.faccao === 'lobos') forcaMatilha += peso;
    else if (r.faccao === 'vila') forcaVila += peso;
    else {
      // Solitários pendem para o lado do próprio alinhamento; `puro` fica fora
      // da conta, porque não ajuda nenhum dos dois times a vencer.
      if (r.alinhamento === 'mal') forcaMatilha += peso;
      else if (r.alinhamento === 'bem') forcaVila += peso;
    }
  }

  // Amantes reforçam a vila apenas por serem um par que se conhece.
  for (const id of deck.modificadores) {
    forcaVila += MODIFICADORES_POR_ID.get(id)?.peso ?? 0;
  }

  const m = multiplicador(jogadores);
  const ajusteDeSetup = ajusteDeConfiguracao(config);
  const ie = Number((forcaVila + ajusteDeSetup - forcaMatilha * m).toFixed(2));
  const leitura = lerIndice(ie);
  const tolerancia = toleranciaDeIE(config);

  return {
    ie,
    forcaVila,
    forcaMatilha,
    multiplicador: m,
    ajusteDeSetup,
    leitura,
    tolerancia,
    aceitavel: ie >= tolerancia.min && ie <= tolerancia.max,
    violacoes: verificarRestricoes(roles, deck, jogadores),
    sugestoes: sugerir(ie, leitura, roles),
  };
}
