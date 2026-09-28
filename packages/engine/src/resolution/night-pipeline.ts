import { NIGHT_STEPS, type NightStepId, type NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import { efeitosDaRodada, limparEfeitosVencidos } from '../types/effect';
import { FLAGS_LIMPAS } from '../setup/create-game';
import { criarColetor, type LogCollector, type ResolutionLog } from './resolution-log';
import { ETAPAS } from './steps/index';
import { retomarRng, type Rng } from '../utils/rng';
import { leituraDeFaccao } from '../turn/leitura';
import { MISSOES_POR_ID, prazoEmRodadas } from '../data/missions';

/**
 * Contexto que atravessa as 12 etapas. Cada etapa recebe o contexto, devolve um
 * novo, e escreve no log o que fez e por quê. Nenhuma etapa muta nada.
 */
export interface StepContext {
  /** Estado no INÍCIO da noite. A etapa 11 (informação) lê daqui. */
  readonly estadoInicial: GameState;
  readonly estado: GameState;
  readonly submissao: NightSubmission;
  /**
   * Etapas canceladas nesta noite, com o motivo junto — pelo evento (etapa 2)
   * ou pelo Padre (etapa 5). O motivo viaja com o cancelamento porque quem lê
   * o log precisa saber QUEM cancelou, não só que houve cancelamento.
   */
  readonly etapasCanceladas: readonly Cancelamento[];
  /**
   * O mesmo gerador atravessa a noite inteira. Se cada etapa criasse o seu, a
   * partida deixaria de ser reproduzível a partir da semente.
   */
  readonly rng: Rng;
  readonly log: LogCollector;
}

export interface Cancelamento {
  readonly etapa: NightStepId;
  readonly motivo: string;
}

export type StepFn = (ctx: StepContext) => StepContext;

export interface NightResult {
  readonly estado: GameState;
  readonly log: ResolutionLog;
}

/** A ordem nunca muda. O laboratório desenha a lista a partir daqui. */
export const ORDEM_DAS_ETAPAS: readonly NightStepId[] = NIGHT_STEPS;

/** Monta o contexto de uma noite, pronto para a primeira etapa. */
export function iniciarNoite(estado: GameState, submissao: NightSubmission): StepContext {
  const emNoite: GameState = { ...estado, fase: 'noite' };
  return {
    estadoInicial: emNoite,
    estado: emNoite,
    submissao,
    etapasCanceladas: [],
    rng: retomarRng(estado.rng),
    log: criarColetor(estado.rodada),
  };
}

/**
 * Roda uma única etapa — é o que dá o botão "próxima etapa" do laboratório.
 * Se a etapa foi cancelada, ela é registrada como ignorada e o estado passa
 * intacto: o cancelamento aparece no log em vez de virar um buraco silencioso.
 */
export function resolverEtapa(ctx: StepContext, etapa: NightStepId): StepContext {
  const cancelada = ctx.etapasCanceladas.find((c) => c.etapa === etapa);
  if (cancelada) {
    ctx.log.ignorar(etapa, cancelada.motivo);
    return ctx;
  }
  return ETAPAS[etapa](ctx);
}

/**
 * Fecha a noite: guarda o estado do RNG, limpa as marcas voláteis, descarta os
 * efeitos vencidos e atualiza os contadores de gatilho.
 *
 * EXPORTADA de propósito. Quem avança etapa por etapa (o laboratório) precisa
 * fechar a noite exatamente como `resolverNoite` fecha — senão existem dois
 * caminhos para a mesma regra, e eles divergem no primeiro detalhe: foi assim
 * que as marcas ficaram presas e os contadores da noite pararam de subir.
 */
export function fecharNoite(ctx: StepContext): GameState {
  const estado = ctx.estado;
  const rodada = estado.rodada;

  const mortesNaNoite = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === rodada,
  ).length;

  return {
    ...estado,
    fase: 'amanhecer',
    rng: ctx.rng.state(),
    // As marcas são voláteis por definição: valem por uma noite. O silêncio do
    // Xerife não está aqui porque ele vale para o DIA que começa agora, e é a
    // votação que o consome.
    players: estado.players.map((p) => ({ ...p, flags: FLAGS_LIMPAS })),
    efeitos: limparEfeitosVencidos(estado.efeitos, rodada),
    contadores: {
      ...estado.contadores,
      mortesNaUltimaNoite: mortesNaNoite,
      mortosNoTotal: estado.players.filter((p) => p.status === 'morto').length,
      noitesSemMatar: mortesNaNoite === 0 ? estado.contadores.noitesSemMatar + 1 : 0,
    },
  };
}

/** Roda a noite inteira, em ordem, e devolve estado novo + log auditável. */
/**
 * Abre a noite seguinte: avança a rodada e aplica o que estava engatilhado.
 *
 * Existe porque a ordem real do jogo é **passagens primeiro, resolução depois**.
 * Um efeito aplicado dentro de `resolverNoite` só passa a valer para a noite
 * seguinte na prática — e efeitos que mudam o que um jogador VÊ (bloqueio,
 * imunidade a investigação) precisam estar valendo quando o celular começa a
 * circular, senão dependem de quem passou antes de quem.
 *
 * Chame isto em vez de mexer em `rodada` na mão. O app fazia
 * `{ ...estado, rodada: rodada + 1 }` e era por isso que as marcas da noite
 * anterior sobreviviam.
 */
export function prepararNoite(estado: GameState): GameState {
  const rodada = estado.rodada + 1;

  // As marcas são de UMA noite. Sobreviver à noite seguinte é defeito, não
  // mecânica: um protegido continuaria protegido para sempre.
  const limpo = estado.players.map((p) => ({
    ...p,
    flags: {
      ...p.flags,
      protegido: false,
      bloqueado: false,
      perfurado: false,
      preso: false,
      imuneInvestigacao: false,
      embriagado: false,
    },
  }));

  const daRodada = efeitosDaRodada(estado.efeitos, rodada);

  let players = limpo.map((p) => {
    const bloqueio = daRodada.find((e) => e.kind === 'bloqueado-na-noite' && e.playerId === p.id);
    const imune = daRodada.some((e) => e.kind === 'imune-investigacao' && e.playerId === p.id);
    if (!bloqueio && !imune) return p;
    return {
      ...p,
      /**
       * O silêncio do preso é da variante Boca Calada, e só dela.
       *
       * Decisão do usuário em 2026-09-26: **o Xerife normal deixa a pessoa
       * falar.** O preso comum não age e não morre; quem também perde a voz é
       * o preso do Boca Calada, e é isso que faz a variante existir.
       *
       * O campo é consumido pela votação do dia que começa depois desta noite,
       * que é exatamente o dia certo.
       */
      silenciado:
        p.silenciado ||
        (bloqueio?.kind === 'bloqueado-na-noite' && bloqueio.preso && bloqueio.calaAVoz === true),
      flags: {
        ...p.flags,
        ...(bloqueio && bloqueio.kind === 'bloqueado-na-noite'
          ? { bloqueado: true, preso: bloqueio.preso, embriagado: !bloqueio.preso }
          : {}),
        ...(imune ? { imuneInvestigacao: true } : {}),
      },
    };
  });

  /**
   * Prazos que vencem quando a noite vira.
   *
   * Sangue Novo: o convertido tinha UMA noite com a habilidade antiga; passou a
   * data, vira lobo comum e sem poder.
   * Missão Sem Volta: o Coringa tinha até a rodada 3 para cumprir; depois disso
   * a carta diz que ele vira Aldeão comum, e a marca é o que a checagem de
   * vitória consulta.
   */
  const totalDeJogadores = estado.players.length;
  players = players.map((p) => {
    if (p.marcas.conservaPoderAte !== undefined && rodada > p.marcas.conservaPoderAte) {
      /*
       * Sangue Novo: venceu o prazo, ele vira Lobo comum.
       *
       * Antes isto punha `semPoder` e deixava a carta antiga na mão — o mesmo
       * defeito do poder emprestado que já foi corrigido em outras três cartas.
       * A troca acontece aqui e não na etapa 7 porque é aqui que o prazo vence.
       */
      const { conservaPoderAte: _c, ...semPrazo } = p.marcas;
      const { varianteId: _v, ...semVariante } = p;
      return {
        ...semVariante,
        roleId: 'lobo',
        usosRestantes: Infinity,
        marcas: {
          ...semPrazo,
          viraCarta: {
            deRoleId: p.roleId,
            ...(p.varianteId ? { deVarianteId: p.varianteId } : {}),
            paraRoleId: 'lobo',
            motivo: 'O que você era acabou. Agora é lobo, como os outros.',
          },
        },
      };
    }
    if (p.roleId !== 'coringa' || p.varianteId !== 'missao-sem-volta') return p;
    if (p.marcas.virouAldeao) return p;

    /*
     * O prazo sai da MISSÃO e do tamanho da mesa, não de uma constante.
     *
     * Era 3 para todas, o que é quase impossível numa mesa de 6 e folgado numa
     * de 12 — e tratava "morra durante uma noite" e "esteja vivo no fim" como
     * se tivessem a mesma urgência. Ver `prazoEmRodadas`.
     */
    const missao = MISSOES_POR_ID.get(estado.objetivosSecretos[p.id] ?? '');
    if (!missao) return p;
    if (rodada <= prazoEmRodadas(missao, totalDeJogadores)) return p;
    return { ...p, marcas: { ...p.marcas, virouAldeao: true } };
  });

  /**
   * `expira`: a morte que foi só adiada.
   *
   * O Guarda-costas Escudo absorve o ataque e "morre uma noite depois"; o
   * Carniçal "não morre na hora" e expira na noite seguinte. Os dois agendavam
   * este efeito desde sempre e **ninguém o consumia** — o Escudo simplesmente
   * nunca morria, o que fazia dele uma proteção infinita e de graça, e o
   * Carniçal virava imortal. Aqui a conta é cobrada, antes de o aparelho
   * circular, para que a mesa veja o corpo no amanhecer seguinte.
   */
  let anuncios = estado.anuncios;
  for (const e of daRodada) {
    if (e.kind !== 'expira') continue;
    const alvo = players.find((p) => p.id === e.playerId);
    if (!alvo || alvo.status === 'morto') continue;
    players = players.map((p) =>
      p.id === e.playerId
        ? { ...p, status: 'morto' as const, mortoNaRodada: rodada, causaMorte: 'estertor' as const }
        : p,
    );
    anuncios = [
      ...anuncios,
      {
        rodada,
        texto: `${alvo.nome} não resistiu ao que trouxe da noite passada.`,
        origem: 'morte' as const,
        // Acontece na virada da noite, antes de o aparelho circular.
        fase: 'noite' as const,
        destaque: true,
        rotulo: 'A conta chegou',
      },
    ];
  }

  /**
   * Testemunha da Cela: a soltura, com a facção lida em voz alta.
   *
   * O segundo dia de cela é o que a variante troca pela informação — e a
   * informação é pública, diferente de qualquer outra leitura do jogo.
   */
  for (const e of daRodada) {
    if (e.kind !== 'revelar-preso') continue;
    const alvo = players.find((p) => p.id === e.playerId);
    if (!alvo) continue;
    const ehLobo = leituraDeFaccao({ ...estado, players }, alvo.id) === 'lobo';
    anuncios = [
      ...anuncios,
      {
        rodada,
        texto: `A cela se abriu. ${alvo.nome} é ${ehLobo ? 'LOBO' : 'da vila'}.`,
        origem: 'role' as const,
        fase: 'noite' as const,
        destaque: true,
        rotulo: 'A testemunha da cela',
      },
    ];
  }

  return {
    ...estado,
    rodada,
    fase: 'noite',
    players,
    anuncios,
    /**
     * O anunciado de ontem vira o que vigora hoje.
     *
     * É aqui que a promessa feita no amanhecer é cobrada. Note que o campo de
     * anúncio é zerado: a etapa 2 desta noite vai sortear o próximo.
     */
    eventoDaNoite: estado.eventoAnunciado,
    eventoAnunciado: null,
    efeitos: limparEfeitosVencidos(estado.efeitos, rodada),
  };
}

export function resolverNoite(estado: GameState, submissao: NightSubmission): NightResult {
  let ctx = iniciarNoite(estado, submissao);
  for (const etapa of ORDEM_DAS_ETAPAS) ctx = resolverEtapa(ctx, etapa);
  return { estado: fecharNoite(ctx), log: ctx.log.resultado() };
}
