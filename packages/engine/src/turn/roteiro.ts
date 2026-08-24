import type { ActionKind, NightStepId } from '../types/action';
import type { GameState } from '../types/game-state';
import { vivos, mortos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import type { InfoEntry } from '../types/info';
import { etapaEfetiva, type Role } from '../types/role';
import { role } from '../data/roles/index';
import { moduloAtivo } from '../data/ghosts';

/**
 * O roteiro da passagem: o que o app pergunta a cada jogador, na ordem em que o
 * celular circula.
 *
 * Mora no engine porque isto é REGRA, não interface. Quem pode agir, com quantos
 * alvos, sobre quem, e quando o toque é falso — tudo isso sai do catálogo de
 * roles e do estado da partida. O app só desenha o que este módulo descreve, e
 * é por isso que uma role nova não exige tela nova.
 */

export type TipoDePergunta =
  | 'nenhuma' // toque falso: o jogador recebe o celular e não tem o que fazer
  | 'alvo'
  | 'dois-alvos'
  | 'binaria';

export interface Pergunta {
  readonly playerId: PlayerId;
  readonly etapa: NightStepId | null;
  readonly kind: ActionKind;
  readonly tipo: TipoDePergunta;
  readonly titulo: string;
  readonly detalhe: string;
  /** Candidatos válidos. Vazio quando não há alvo a escolher. */
  readonly alvos: readonly PlayerId[];
  readonly opcoes?: readonly { readonly valor: string; readonly rotulo: string }[];
  /** Pode pular sem escolher ninguém. */
  readonly opcional: boolean;
  /** Toque falso: existe para que quem tem poder não se revele pela chamada. */
  readonly falsa: boolean;
}

export interface Passagem {
  readonly player: Player;
  /** A role só é revelada na noite 1, embutida na mesma passagem. */
  readonly revelarRole: boolean;
  /** Companheiros que este jogador conhece (matilha, dupla, amante). */
  readonly companheiros: readonly PlayerId[];
  readonly rotuloCompanheiros: string | null;
  readonly pergunta: Pergunta;
  /** Bilhetes e leituras que chegaram para ele desde a última passagem. */
  readonly recebido: readonly InfoEntry[];
}

/** Um jogador ainda tem uso disponível para a habilidade nesta noite? */
function podeAgir(estado: GameState, p: Player, r: Role): boolean {
  if (p.usosRestantes <= 0) return false;
  const limite = r.usoLimitado;
  if (limite.kind === 'noites-alternadas') {
    const impar = estado.rodada % 2 === 1;
    return limite.paridade === 'impar' ? impar : !impar;
  }
  return true;
}

/**
 * Companheiros que o jogador conhece desde o início.
 * No modo Traição a matilha é TOTALMENTE cega: ninguém conhece ninguém.
 */
function companheirosDe(estado: GameState, p: Player): { ids: PlayerId[]; rotulo: string | null } {
  const r = role(p.roleId);

  if (estado.config.modo === 'duplas') {
    const par = estado.objetivosSecretos[p.id]?.startsWith('dupla:')
      ? estado.objetivosSecretos[p.id]!.slice('dupla:'.length)
      : null;
    if (par) return { ids: [par], rotulo: 'Sua dupla' };
  }

  if (p.amanteDe) {
    // Amor Cego: só um dos dois sabe do vínculo.
    const cego = estado.config.variantes['amantes'] === 'amor-cego';
    if (!cego || p.id < p.amanteDe) return { ids: [p.amanteDe], rotulo: 'Seu amor' };
  }

  if (r.faccao === 'lobos' && estado.config.modo !== 'traicao') {
    const matilha = estado.players
      .filter((x) => x.id !== p.id && role(x.roleId).faccao === 'lobos' && x.status === 'vivo')
      .map((x) => x.id);
    // O Lobo Branco joga contra a matilha, mas conhece ela.
    return { ids: matilha, rotulo: matilha.length > 0 ? 'A matilha' : 'Você caça sozinho' };
  }

  return { ids: [], rotulo: null };
}

/** Alvos válidos para a ação de uma role, já filtrados pela regra dela. */
function alvosValidos(estado: GameState, p: Player, r: Role, etapa: NightStepId): PlayerId[] {
  const vivosAgora = vivos(estado).filter((x) => x.id !== p.id);

  switch (r.id) {
    case 'necromante':
      // Apenas mortes de noites ANTERIORES.
      return mortos(estado)
        .filter((x) => (x.mortoNaRodada ?? 0) < estado.rodada)
        .map((x) => x.id);

    case 'vidente':
      // A Vidente dos Ossos só enxerga mortos.
      return p.varianteId === 'ossos'
        ? mortos(estado).map((x) => x.id)
        : vivosAgora.map((x) => x.id);

    case 'medico':
      // O Curandeiro nunca repete alvo.
      if (p.varianteId === 'curandeiro') {
        const jaCurados = new Set(
          estado.informacoes.filter((i) => i.paraId === p.id).flatMap((i) => i.sobre),
        );
        return vivosAgora.filter((x) => !jaCurados.has(x.id)).map((x) => x.id);
      }
      return vivosAgora.map((x) => x.id);

    default:
      break;
  }

  // A matilha não se ataca: o Lobo Branco é a exceção, e ele ataca sozinho.
  if (etapa === 'ataque' && r.faccao === 'lobos' && r.id !== 'lobo-branco') {
    return vivosAgora.filter((x) => role(x.roleId).faccao !== 'lobos').map((x) => x.id);
  }

  return vivosAgora.map((x) => x.id);
}

/** Texto da pergunta, por role. O app não escreve regra — ele mostra esta frase. */
function enunciado(r: Role, p: Player): { titulo: string; detalhe: string } {
  const variante = p.varianteId
    ? r.variantes.find((v) => v.id === p.varianteId)
    : undefined;
  const detalhe = variante?.descricao ?? r.descricaoCurta;

  const titulos: Record<string, string> = {
    vidente: 'Quem você quer enxergar?',
    detetive: 'Compare dois jogadores.',
    medico: 'Quem você protege esta noite?',
    'guarda-costas': 'Quem você protege com a própria vida?',
    xerife: 'Quem você prende esta noite?',
    taverneiro: 'Quem você embebeda?',
    necromante: 'Quem você traz de volta?',
    padre: 'Anular todas as mortes desta noite?',
    feiticeiro: 'Quem a matilha atravessa esta noite?',
    lobo: 'Quem a matilha mata?',
    alfa: 'Quem a matilha mata?',
    uivador: 'Quem a matilha mata?',
    'lobo-sombra': 'Ficar imune a investigação esta noite?',
    'lobo-carnical': 'Quem a matilha mata?',
    'lobo-branco': 'Quem você mata? Pode ser um lobo.',
    bruxa: 'Usar a sua poção em quem?',
    cacador: 'Deixe a armadilha armada em quem?',
  };

  return { titulo: titulos[r.id] ?? 'Sua vez.', detalhe };
}

/** Monta a pergunta de um jogador — ou o toque falso, que parece igual. */
function perguntarA(estado: GameState, p: Player): Pergunta {
  const r = role(p.roleId);
  const etapa = etapaEfetiva(r, p.varianteId);

  const toqueFalso: Pergunta = {
    playerId: p.id,
    etapa: null,
    kind: 'nenhuma',
    tipo: 'nenhuma',
    titulo: 'Nada se move.',
    detalhe: 'Segure o aparelho por um instante e passe adiante.',
    alvos: [],
    opcional: true,
    falsa: true,
  };

  // Estertores são reação à morte, não ação da noite — só o Caçador Armadilha
  // declara antes, e é a exceção que confirma a regra.
  if (!etapa || etapa === 'estado-inicial') return toqueFalso;
  if (etapa === 'estertores' && p.varianteId !== 'armadilha') return toqueFalso;
  if (!podeAgir(estado, p, r)) return toqueFalso;

  const { titulo, detalhe } = enunciado(r, p);
  const alvos = alvosValidos(estado, p, r, etapa);

  // Sem alvo possível, o toque falso é a resposta honesta.
  if (alvos.length === 0 && r.id !== 'padre' && r.id !== 'lobo-sombra') return toqueFalso;

  const base = { playerId: p.id, etapa, falsa: false, titulo, detalhe };

  if (r.id === 'padre' || r.id === 'lobo-sombra') {
    return {
      ...base,
      kind: r.id === 'padre' ? 'proteger' : 'marcar',
      tipo: 'binaria',
      alvos: [],
      opcoes: [
        { valor: 'sim', rotulo: 'Sim' },
        { valor: 'nao', rotulo: 'Não, esta noite não' },
      ],
      opcional: true,
    };
  }

  if (r.id === 'detetive') {
    return { ...base, kind: 'comparar', tipo: 'dois-alvos', alvos, opcional: false };
  }

  const kind: ActionKind =
    etapa === 'protecao'
      ? 'proteger'
      : etapa === 'bloqueio'
        ? 'bloquear'
        : etapa === 'perfuracao'
          ? 'perfurar'
          : etapa === 'ataque'
            ? 'atacar'
            : etapa === 'ressurreicao'
              ? 'ressuscitar'
              : etapa === 'informacao'
                ? 'investigar'
                : 'marcar';

  return {
    ...base,
    kind,
    tipo: 'alvo',
    alvos,
    // Poderes de uma vez por partida podem ser guardados para depois.
    opcional: r.usoLimitado.kind === 'por-partida',
  };
}

/**
 * A passagem completa da noite: TODOS recebem o celular, na mesma ordem sempre.
 *
 * "Passagem completa, todos recebem o celular, com toques falsos para quem não
 * tem ação" — sem isso, quem tem poder se revela pela chamada.
 */
export function roteiroDaNoite(estado: GameState): readonly Passagem[] {
  const quantosMortos = mortos(estado).length;
  const fantasmasAtivos =
    moduloAtivo('assombrar', estado.config.modulosDeFantasma, quantosMortos) ||
    moduloAtivo('pesadelo', estado.config.modulosDeFantasma, quantosMortos);

  return estado.players
    .filter((p) => p.status === 'vivo' || (fantasmasAtivos && p.usosRestantes > 0))
    .map((p) => {
      const morto = p.status === 'morto';
      const { ids, rotulo } = companheirosDe(estado, p);

      const pergunta: Pergunta = morto
        ? {
            playerId: p.id,
            etapa: 'interferencia-espectral',
            kind: 'assombrar',
            tipo: 'alvo',
            titulo: 'Você está morto. Ainda pode assombrar.',
            detalhe: 'Marque um vivo: se ele tiver ação noturna, ela falha.',
            alvos: vivos(estado).map((x) => x.id),
            opcional: true,
            falsa: false,
          }
        : perguntarA(estado, p);

      return {
        player: p,
        revelarRole: estado.rodada === 1 && !morto,
        companheiros: ids,
        rotuloCompanheiros: rotulo,
        pergunta,
        recebido: estado.informacoes.filter(
          (i) => i.paraId === p.id && i.rodada === estado.rodada - 1,
        ),
      };
    });
}

/** Quantos lobos a mesa sabe que existem, conforme a configuração de setup. */
export function contagemDeLobosVisivel(estado: GameState): string {
  const n = estado.players.filter((p) => role(p.roleId).faccao === 'lobos').length;
  switch (estado.config.contagemDeLobos) {
    case 'publica':
      return `${n} ${n === 1 ? 'lobo' : 'lobos'} nesta mesa`;
    case 'faixa':
      return `entre ${Math.max(1, n - 1)} e ${n + 1} lobos`;
    case 'oculta':
      return 'ninguém sabe quantos lobos há';
  }
}
