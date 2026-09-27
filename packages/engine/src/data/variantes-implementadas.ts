import { ROLES } from './roles/index';

/**
 * As variantes cuja MECÂNICA o engine realmente executa.
 *
 * Em 2026-09-25 esta lista tinha 12 nomes de 73: o catálogo tinha crescido
 * muito mais rápido que a implementação e a maioria das variantes era só
 * nome, descrição, peso e ícone. Quem escolhesse uma delas jogava com a
 * função base e o app não avisava.
 *
 * Em 2026-09-26 as mecânicas foram escritas. O que sobrou de fora está em
 * `VARIANTES_PENDENTES`, logo abaixo, com o motivo de cada uma — e o motivo
 * nunca é "não deu tempo": é uma pergunta de regra que só o autor responde.
 *
 * ## Por que uma lista à mão
 *
 * Não dá para descobrir isto automaticamente. "Implementada" significa que
 * alguma etapa da noite, a votação, o setup ou a checagem de vitória tratam o
 * `varianteId` — e isso aparece no código de formas diferentes (`===`, `!==`,
 * `switch`, filtro de alvos, `marcas`). Uma varredura por texto erra nos dois
 * sentidos.
 *
 * ## Como manter
 *
 * Implementou a mecânica de uma variante? **Tire o id de `VARIANTES_PENDENTES`,
 * no mesmo commit.** O teste em `variantes-implementadas.test.ts` garante que
 * todo id citado existe no catálogo — ele pega remoção e erro de digitação, mas
 * não consegue pegar mentira. A honestidade da lista é de quem mexe.
 */

/**
 * O que ainda NÃO funciona, e por quê.
 *
 * Três casos, todos travados numa decisão de regra e nenhum num obstáculo
 * técnico. Enquanto estiverem aqui, o app mostra o aviso na Biblioteca e no
 * Baralho, que é o mínimo que se deve a quem está montando a mesa.
 */
export const VARIANTES_PENDENTES: ReadonlyMap<string, string> = new Map([
  /*
   * VAZIO desde 2026-09-26.
   *
   * As três últimas pendências eram perguntas de regra, e o usuário respondeu
   * as três na mesma sessão:
   *
   * - Padre Exorcista ganhou regra nova (benze um nome: acerta o lobo e o mata,
   *   erra e vira Aldeão comum) em vez de repetir o Padre base.
   * - Xerife Boca Calada ficou distinto porque o Xerife BASE deixou de
   *   silenciar: o preso comum fala e vota, o do Boca Calada não.
   * - Ladrão Troca com Mortos deixou de ser "na noite 1" e passou a agir em
   *   qualquer noite em que já exista um morto.
   *
   * O Aldeão Teimoso saiu da lista junto, e por outro caminho: a regra é da
   * TELA de votação (o engine recebe a votação fechada e não vê ninguém mudar
   * de ideia), então ela virou `votoTrava()` em `day/voting.ts` — regra no
   * engine, aplicação na tela. Pôr a regra só na tela foi o que o manteve
   * pendente até o fim.
   *
   * Continue mantendo este mapa. Uma variante nova que entre no catálogo sem
   * mecânica entra AQUI, com o motivo, no mesmo commit — foi a ausência disso
   * que deixou 61 variantes serem só enfeite por uma sessão inteira.
   */
]);

/** Todos os ids do catálogo, para a conta e para o teste. */
function todosOsIds(): readonly string[] {
  return ROLES.flatMap((r) => r.variantes.map((v) => v.id));
}

/** A mecânica desta variante está implementada? */
export function varianteImplementada(varianteId: string | undefined): boolean {
  return varianteId === undefined || !VARIANTES_PENDENTES.has(varianteId);
}

/** Por que esta variante ainda não funciona? `null` quando funciona. */
export function motivoDaPendencia(varianteId: string | undefined): string | null {
  if (!varianteId) return null;
  return VARIANTES_PENDENTES.get(varianteId) ?? null;
}

/** Quantas variantes existem, e quantas funcionam. Para telas e documentação. */
export function contagemDeVariantes(): { total: number; implementadas: number } {
  const total = todosOsIds().length;
  return { total, implementadas: total - VARIANTES_PENDENTES.size };
}

/**
 * Mantido para não quebrar quem importava o nome antigo.
 *
 * @deprecated Use `varianteImplementada` ou `VARIANTES_PENDENTES`.
 */
export const VARIANTES_IMPLEMENTADAS: ReadonlySet<string> = new Set(
  todosOsIds().filter((id) => !VARIANTES_PENDENTES.has(id)),
);
