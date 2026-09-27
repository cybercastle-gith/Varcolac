import type { NightAction, NightStepId } from '../../types/action';
import type { GameState } from '../../types/game-state';
import { jogador } from '../../types/game-state';
import type { CauseOfDeath, Player, PlayerFlags, PlayerId } from '../../types/player';
import type { Marcas } from '../../types/marcas';
import type { Role, RoleId } from '../../types/role';
import type { InfoEntry } from '../../types/info';
import type { EfeitoAdiado } from '../../types/effect';
import { efeitosDaRodada, temEfeito } from '../../types/effect';
import { role } from '../../data/roles/index';
import { EVENTOS_POR_ID } from '../../data/events/index';
import type { StepContext } from '../night-pipeline';

/**
 * Ações válidas de uma etapa. Descarta, nesta ordem:
 * toque falso · ator morto · ator bloqueado · ator sem poder (Cova Aberta,
 * Herança Amarga) · role silenciada pelo evento · poderes suspensos pela Anciã,
 * com a exceção do herdeiro do Testamento.
 *
 * Centralizar isto é o que impede que cada etapa reimplemente as mesmas
 * exceções — e que uma delas esqueça alguma.
 */
export function acoesDe(ctx: StepContext, etapa: NightStepId): readonly NightAction[] {
  const ev = ctx.estado.eventoDaNoite ? EVENTOS_POR_ID.get(ctx.estado.eventoDaNoite) : undefined;
  const silenciadas = new Set(
    ev?.efeitos.flatMap((e) => (e.kind === 'silencia-role' ? e.roleIds : [])) ?? [],
  );
  const suspensao = efeitosDaRodada(ctx.estado.efeitos, ctx.estado.rodada).find(
    (e) => e.kind === 'poderes-suspensos',
  );

  return ctx.submissao.acoes.filter((a) => {
    if (a.etapa !== etapa || a.falsa) return false;
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    if (!ator) return false;
    /**
     * Morto não age — com duas exceções, e as duas são pedidas pela carta.
     *
     * `estertores`: a Última Carne do Carniçal é declarada já morto.
     *
     * `ressurreicao`: o Necromante que morreu NESTA noite ainda cumpre o que
     * prometeu. Ele declarou a ressurreição quando o celular passou por ele,
     * vivo; morrer depois, na etapa 8, é um acidente de ordem de etapas e não
     * uma desistência. Descartar a ação transformava a morte da matilha em um
     * cancelamento retroativo do único poder que ele tem na partida.
     */
    const morreuAgora = ator.status === 'morto' && ator.mortoNaRodada === ctx.estado.rodada;
    if (ator.status === 'morto' && etapa !== 'estertores') {
      if (!(etapa === 'ressurreicao' && morreuAgora)) return false;
    }
    if (ator.flags.bloqueado) return false;
    if (semPoder(ator)) return false;
    if (silenciadas.has(ator.roleId)) return false;

    if (suspensao && suspensao.kind === 'poderes-suspensos') {
      // Testamento: a Anciã aponta um herdeiro que escapa da suspensão.
      const poupado = suspensao.exceto === ator.id;
      // Luto da Vila: `todos` estende a queda à matilha e aos solitários.
      const alcancado = suspensao.todos || roleDe(ator).faccao === 'vila';
      if (alcancado && !poupado) return false;
    }
    return true;
  });
}

/**
 * Gravar uma marca PERSISTENTE. O par de `marcar`, que mexe nas flags voláteis.
 *
 * Duas funções com nomes parecidos é um risco, e é deliberado: elas fazem a
 * mesma coisa em campos com tempos de vida opostos, e usar a errada é o defeito
 * mais provável desta área. `marcar` some no amanhecer; `gravar` fica.
 */
export function gravar(estado: GameState, id: PlayerId, marcas: Marcas): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id ? { ...p, marcas: { ...p.marcas, ...marcas } } : p,
    ),
  };
}

/** O jogador está sem habilidade nenhuma? (Cova Aberta, Herança Amarga...) */
export function semPoder(p: Player): boolean {
  return p.marcas.semPoder === true || p.marcas.virouAldeao === true;
}

/**
 * A role que vale para AGIR — nem sempre é `p.roleId`.
 *
 * Três variantes emprestam ou trocam poder: Incorporação (o Necromante age com
 * a habilidade do morto), Sombra de Alguém (o Lobo Sombra veste o papel de
 * outro por uma noite) e Herança Amarga (o escolhido vira Aldeão para sempre).
 * Todo lugar que pergunta "o que este jogador faz à noite" tem de passar por
 * aqui, senão a variante existe no papel e não na mesa.
 *
 * O que ela NÃO muda é a facção para efeito de vitória e de investigação: o
 * Necromante que incorporou um lobo continua sendo da vila. Poder emprestado
 * não é lado trocado.
 */
export function roleEfetivaId(p: Player, rodada = Infinity): RoleId {
  if (p.marcas.virouAldeao) return 'aldeao';
  /**
   * O empréstimo COM prazo vence; o sem prazo é para sempre.
   *
   * Sombra de Alguém grava `poderEmprestadoAte`; Incorporação e Herdeiro não
   * gravam prazo nenhum, porque a carta deles diz "até o fim da partida". Sem
   * esta distinção o Lobo Sombra ficaria com o papel copiado para sempre, o
   * que é uma variante completamente diferente da que está escrita.
   */
  if (p.marcas.poderEmprestadoAte !== undefined && rodada > p.marcas.poderEmprestadoAte) {
    return p.roleId;
  }
  return p.marcas.poderDe ?? p.roleId;
}

export function roleDe(p: Player, rodada?: number): Role {
  return role(roleEfetivaId(p, rodada));
}

/** Ações de fantasmas: mesma filtragem, mas exige o ator MORTO. */
export function acoesDeFantasmas(ctx: StepContext, etapa: NightStepId): readonly NightAction[] {
  return ctx.submissao.acoes.filter((a) => {
    if (a.etapa !== etapa || a.falsa) return false;
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    return !!ator && ator.status === 'morto';
  });
}

export function nome(estado: GameState, id: PlayerId): string {
  return jogador(estado, id).nome;
}

export function marcar(estado: GameState, id: PlayerId, flags: Partial<PlayerFlags>): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id ? { ...p, flags: { ...p.flags, ...flags } } : p,
    ),
  };
}

export function matar(estado: GameState, id: PlayerId, causa: CauseOfDeath): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id
        ? { ...p, status: 'morto' as const, mortoNaRodada: estado.rodada, causaMorte: causa }
        : p,
    ),
  };
}

export function reviver(estado: GameState, id: PlayerId): GameState {
  return {
    ...estado,
    players: estado.players.map((p) => {
      if (p.id !== id) return p;
      const { mortoNaRodada: _m, causaMorte: _c, ...resto } = p;
      return { ...resto, status: 'vivo' as const };
    }),
  };
}

export function gastarUso(estado: GameState, id: PlayerId): GameState {
  return {
    ...estado,
    players: estado.players.map((p) =>
      p.id === id ? { ...p, usosRestantes: Math.max(0, p.usosRestantes - 1) } : p,
    ),
  };
}

export function temUso(estado: GameState, id: PlayerId): boolean {
  return jogador(estado, id).usosRestantes > 0;
}

export function entregarInfo(estado: GameState, info: InfoEntry): GameState {
  return { ...estado, informacoes: [...estado.informacoes, info] };
}

export function anunciar(
  estado: GameState,
  texto: string,
  origem: 'evento' | 'morte' | 'votacao' | 'role' | 'fantasma' | 'modo',
): GameState {
  return {
    ...estado,
    anuncios: [...estado.anuncios, { rodada: estado.rodada, texto, origem }],
  };
}

export function agendar(estado: GameState, efeito: EfeitoAdiado): GameState {
  return { ...estado, efeitos: [...estado.efeitos, efeito] };
}

/** Etapa que ainda não faz nada: registra o TODO no log em vez de sumir. */
export function pendente(ctx: StepContext, etapa: NightStepId, oQueFalta: string): StepContext {
  ctx.log.ignorar(etapa, `Não implementado: ${oQueFalta}`);
  return ctx;
}
