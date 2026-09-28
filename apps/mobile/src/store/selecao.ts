import { ROLES, role, type Role, type RoleId } from '@jogo/engine';

/**
 * Uma CARTA selecionável: a função, ou uma variante dela.
 *
 * O setup deixou de contar cópias (`- 0 +`) e passou a marcar cartas com sim ou
 * não, por decisão do usuário em 2026-09-26. A consequência que obrigou este
 * módulo a existir: variante virou carta própria. "Quero o Xerife Boca Calada e
 * NÃO quero o Xerife normal" é uma frase que o modelo antigo não conseguia
 * dizer, porque `config.variantes` guardava uma variante por função — escolher
 * a variante apagava a base.
 *
 * Uma mesa de dez pessoas continua cabendo: são 24 funções e 73 variantes, 97
 * cartas distintas. O que não existe mais é "dois Lobos" — a matilha se monta
 * escolhendo Lobo, Alfa, Feiticeiro, Uivador, e assim por diante, que é um
 * baralho mais interessante do que três cartas iguais.
 */
export interface CartaSelecionavel {
  readonly roleId: RoleId;
  /** `undefined` é a função base. Cada variante é uma carta à parte. */
  readonly varianteId?: string | undefined;
}

/** A chave textual de uma carta. É o que o store guarda e o disco persiste. */
export function chaveDaCarta(roleId: RoleId, varianteId?: string | undefined): string {
  return varianteId ? `${roleId}:${varianteId}` : roleId;
}

export function lerChave(chave: string): CartaSelecionavel {
  const [roleId, varianteId] = chave.split(':');
  return { roleId: roleId!, ...(varianteId ? { varianteId } : {}) };
}

/** Nome e descrição da carta, já resolvendo variante. */
export function descreverCarta(c: CartaSelecionavel): { nome: string; descricao: string } {
  const r = role(c.roleId);
  const v = c.varianteId ? r.variantes.find((x) => x.id === c.varianteId) : undefined;
  return v
    ? { nome: v.nome, descricao: v.descricao }
    : { nome: r.nome, descricao: r.descricaoCurta };
}

/**
 * As funções que o modo permite pôr na mesa.
 *
 * No modo Traição a mesa começa SEM lobo nenhum — a matilha nasce das
 * conversões do amanhecer. Oferecer cartas de lobo ali é oferecer uma escolha
 * que o próprio modo desfaz no `aoCriarPartida` (ele transforma todo lobo em
 * Aldeão), e o host passava o setup inteiro montando uma matilha que nunca
 * chegava à mesa.
 */
export function funcoesDoModo(modo: string): readonly Role[] {
  if (modo === 'traicao') return ROLES.filter((r) => r.faccao !== 'lobos');
  return ROLES;
}

/** Todas as cartas que o modo oferece, base e variantes. */
export function cartasDoModo(modo: string): readonly CartaSelecionavel[] {
  return funcoesDoModo(modo).flatMap((r) => [
    { roleId: r.id },
    ...r.variantes.map((v) => ({ roleId: r.id, varianteId: v.id })),
  ]);
}

/** A seleção, limpa do que o modo atual não aceita mais. */
export function podarParaModo(chaves: readonly string[], modo: string): string[] {
  const validas = new Set(cartasDoModo(modo).map((c) => chaveDaCarta(c.roleId, c.varianteId)));
  return chaves.filter((k) => validas.has(k));
}
