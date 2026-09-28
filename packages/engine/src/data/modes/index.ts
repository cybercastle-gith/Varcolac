import type { GameMode } from '../../types/config';
import type { GameState } from '../../types/game-state';
import { vivos } from '../../types/game-state';
import type { Rng } from '../../utils/rng';
import { role } from '../roles/index';
import { anunciar } from '../../resolution/steps/_helpers';

/**
 * Modos mudam REGRAS, não composição — composição é assunto do baralho.
 *
 * Cada modo é um par de ganchos: um roda no amanhecer (antes do dia), outro
 * responde se a partida acabou por regra própria do modo. Ganchos em vez de
 * `if (modo === ...)` espalhado pelo pipeline porque a Vila Amaldiçoada e a
 * Traição mexem em momentos diferentes, e espalhar isso deixaria o modo
 * impossível de ler inteiro num lugar só.
 */
export interface ModeHooks {
  readonly id: GameMode;
  readonly nome: string;
  readonly descricao: string;
  /** Roda no amanhecer, depois da noite resolvida. */
  readonly aoAmanhecer?: (estado: GameState, rng: Rng) => GameState;
  /** Derrota coletiva por regra do modo (a maldição vencendo o prazo). */
  readonly derrotaDaVila?: (estado: GameState) => boolean;
  /** Ajuste do setup: prazo da maldição, duplas formadas, etc. */
  readonly aoCriarPartida?: (estado: GameState, rng: Rng) => GameState;
}

/** Agravamentos da Vila Amaldiçoada, sorteados um por noite. */
export const AGRAVAMENTOS: readonly { id: string; texto: string }[] = [
  { id: 'poder-perdido', texto: 'Um poder da vila apagou esta noite.' },
  { id: 'ataque-extra', texto: 'A matilha ganhou um ataque.' },
  { id: 'tempo-curto', texto: 'O tempo de discussão encolheu.' },
  { id: 'silencio', texto: 'Alguém amanheceu sem voz.' },
  { id: 'frio', texto: 'O frio chegou cedo. Ninguém dorme direito.' },
];

const classico: ModeHooks = {
  id: 'classico',
  nome: 'Clássico',
  descricao: 'A base. Noite, dia, votação, eliminação.',
};

const traicao: ModeHooks = {
  id: 'traicao',
  nome: 'Traição',
  descricao:
    'A mesa começa SEM nenhum lobo. A cada noite o app converte alguém em segredo. A ' +
    'matilha é totalmente cega: nenhum lobo conhece nenhum outro, em momento algum.',
  // NOTA DE DESIGN: o dossiê resolvia a coordenação da matilha cega com o
  // sussurro noturno, que foi cortado do jogo. Sem ele, os lobos da Traição
  // dependem só do que der para dizer em voz alta durante o dia.

  /**
   * Começa sem lobo nenhum.
   *
   * Antes o modo herdava o baralho normal, com matilha completa desde a noite 1
   * — e aí a conversão noturna só somava lobos em cima dos que já existiam. O
   * modo inteiro perdia o sentido: "todos começam na vila" era falso.
   *
   * Quem era lobo vira Aldeão e a carta muda de verdade; solitários ficam como
   * estão, porque o objetivo próprio deles não depende de facção.
   */
  aoCriarPartida: (estado) => ({
    ...estado,
    players: estado.players.map((p) => {
      if (role(p.roleId).faccao !== 'lobos') return p;
      // `varianteId` é REMOVIDA, não posta como undefined: o tipo é opcional
      // com `exactOptionalPropertyTypes`, e a variante do lobo não existe no
      // Aldeão de qualquer forma.
      const { varianteId: _, ...semVariante } = p;
      return { ...semVariante, roleId: 'aldeao' };
    }),
  }),

  aoAmanhecer: (estado, rng) => {
    // O convertido MANTÉM a própria role: um Médico convertido continua curando.
    // Por isso a conversão mexe na facção, não na habilidade.
    const jaConvertidos = Object.values(estado.objetivosSecretos).filter(
      (o) => o === 'convertido',
    ).length;
    const candidatos = vivos(estado).filter(
      (p) => role(p.roleId).faccao === 'vila' && estado.objetivosSecretos[p.id] !== 'convertido',
    );
    // Para de converter quando a matilha secreta chegaria a metade da mesa:
    // passar disso encerra a partida sozinho, sem ninguém ter jogado.
    if (candidatos.length <= 2 || jaConvertidos >= Math.floor(vivos(estado).length / 2)) {
      return estado;
    }
    const convertido = rng.pick(candidatos);
    return anunciar(
      {
        ...estado,
        objetivosSecretos: { ...estado.objetivosSecretos, [convertido.id]: 'convertido' },
      },
      'Alguém virou esta noite. Ninguém sabe quem.',
      'modo',
    );
  },
};

/**
 * Quantas noites a vila tem, por tamanho de mesa.
 *
 * Exportado porque a tela de revisão precisa dizer o número ANTES de a partida
 * começar — a mesa decide se topa o modo sabendo o prazo, e não descobrindo
 * na terceira manhã.
 */
export function noitesDaMaldicao(jogadores: number): number {
  return Math.max(3, Math.ceil(jogadores / 2));
}

const vilaAmaldicoada: ModeHooks = {
  id: 'vila-amaldicoada',
  nome: 'Vila Amaldiçoada',
  descricao:
    'A vila tem um número fixo de noites. Se não eliminar os lobos até lá, todos morrem. ' +
    'A cada noite o app sorteia um agravamento e narra em uma frase.',
  aoCriarPartida: (estado) => {
    // O prazo escala com a mesa: mesa grande precisa de mais noites para agir.
    const prazo = noitesDaMaldicao(estado.players.length);
    return anunciar(
      { ...estado, prazoDaMaldicao: prazo },
      `A maldição tem prazo: ${prazo} noites. Se os lobos continuarem de pé depois da ` +
        `noite ${prazo}, a vila inteira se perde.`,
      'modo',
      { rotulo: 'O prazo da maldição' },
    );
  },
  aoAmanhecer: (estado, rng) => {
    const a = rng.pick(AGRAVAMENTOS);
    let e = anunciar(estado, a.texto, 'modo');

    /*
     * A contagem regressiva é dita TODA manhã.
     *
     * "A vila tem um número fixo de noites" não serve de nada se a mesa não
     * souber quantas faltam — relatado assim: "não tem noites fixas claramente
     * declaradas". A última noite é anunciada com destaque, porque é a única em
     * que a informação muda a decisão do dia.
     */
    const prazo = estado.prazoDaMaldicao;
    if (prazo !== null) {
      const faltam = prazo - estado.rodada;
      e =
        faltam <= 0
          ? anunciar(e, 'Esta é a última noite. Depois dela não há vila.', 'modo', {
              rotulo: 'A última noite',
            })
          : anunciar(
              e,
              faltam === 1
                ? 'Resta UMA noite antes de a maldição se fechar.'
                : `Restam ${faltam} noites antes de a maldição se fechar.`,
              'modo',
            );
    }
    return e;
  },
  derrotaDaVila: (estado) =>
    estado.prazoDaMaldicao !== null && estado.rodada > estado.prazoDaMaldicao,
};

const duplas: ModeHooks = {
  id: 'duplas',
  nome: 'Duplas',
  descricao:
    'Todos jogam em duplas fixas que se conhecem desde o início. As duplas são mistas: ' +
    'você pode saber que seu parceiro é lobo, ou ele pode saber que você é.',
  aoCriarPartida: (estado, rng) => {
    const ordem = rng.shuffle(estado.players.map((p) => p.id));
    const parDe: Record<string, string> = {};
    for (let i = 0; i + 1 < ordem.length; i += 2) {
      parDe[ordem[i]!] = ordem[i + 1]!;
      parDe[ordem[i + 1]!] = ordem[i]!;
    }
    return {
      ...estado,
      objetivosSecretos: {
        ...estado.objetivosSecretos,
        ...Object.fromEntries(Object.entries(parDe).map(([k, v]) => [k, `dupla:${v}`])),
      },
    };
  },
};

export const MODOS: Readonly<Record<GameMode, ModeHooks>> = {
  classico,
  traicao,
  'vila-amaldicoada': vilaAmaldicoada,
  duplas,
};

export function modo(id: GameMode): ModeHooks {
  return MODOS[id];
}
