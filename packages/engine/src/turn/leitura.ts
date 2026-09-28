import type { GameState } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { role } from '../data/roles/index';
import { faccaoEfetiva } from './faccao';

/**
 * A leitura de facção, como a Vidente enxerga: solitário do mal lê como lobo.
 *
 * Mora aqui, e não dentro da etapa 11, porque agora tem DOIS consumidores: a
 * etapa 11 (que grava no log e entrega a informação) e a resposta imediata na
 * passagem do celular. Duas cópias divergiriam, e a divergência seria invisível
 * — o jogador veria uma coisa na tela e o log registraria outra.
 */
export function leituraDeFaccao(estado: GameState, id: PlayerId): string {
  const p = estado.players.find((x) => x.id === id)!;
  if (p.flags.imuneInvestigacao) return 'da vila';

  /*
   * Nome Roubado (Lobo Sombra): a investigação devolve a leitura do MORTO cujo
   * nome ele vestiu, e não a dele. Fica antes da checagem de facção porque o
   * disfarce substitui a resposta inteira, não a corrige.
   */
  if (p.marcas.disfarceDe) {
    const d = role(p.marcas.disfarceDe);
    return d.faccao === 'lobos' || (d.faccao === 'solitario' && d.alinhamento === 'mal')
      ? 'lobo'
      : 'da vila';
  }

  const r = role(p.roleId);
  if (faccaoEfetiva(estado, p) === 'lobos') return 'lobo';
  if (r.faccao === 'solitario' && r.alinhamento === 'mal') return 'lobo';
  return 'da vila';
}

export interface RespostaImediata {
  /** O que mostrar na tela, agora. */
  readonly texto: string;
  /** Uma segunda linha, quando a variante entrega duas visões. */
  readonly segunda?: string;
  /**
   * As duas linhas valem o MESMO e devem ser desenhadas do mesmo tamanho.
   *
   * Sem isto a tela imprimia a primeira grande e a segunda pequena, e a
   * Vidente Confusa saía da passagem achando que a segunda era um rodapé — uma
   * hierarquia visual que a variante não tem.
   */
  readonly duasVisoes?: boolean;
  /** Linha de contexto sob as visões, em tom menor. */
  readonly rodape?: string;
  /** `true` quando a resposta NÃO é a leitura, e sim o aviso de que ela atrasa. */
  readonly adiada: boolean;
}

/**
 * A resposta que o investigador vê na MESMA tela, logo depois de escolher.
 *
 * Por que isto é correto e não fura a invariante da etapa 11: a etapa 11 lê o
 * estado do INÍCIO da noite, e no instante da passagem nada da noite foi
 * resolvido ainda — o estado atual É o estado inicial. As duas leituras dão a
 * mesma resposta por construção.
 *
 * Por que existe: a informação era entregue só na passagem da noite SEGUINTE.
 * Na prática o Detetive via uma tela piscar e nada mais; a Vidente descobria a
 * facção um dia depois de ter pago o voto por ela. Quem atrasa de propósito
 * continua atrasando — é o caso da Vidente dos Sonhos, e só dela.
 */
export function respostaImediata(
  estado: GameState,
  actorId: PlayerId,
  alvos: readonly PlayerId[],
): RespostaImediata | null {
  const ator = estado.players.find((p) => p.id === actorId);
  if (!ator) return null;
  const r = role(ator.roleId);
  const nomeDe = (id: PlayerId) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  if (r.id === 'detetive') {
    const [a, b] = alvos;
    if (!a || !b) return null;

    // O Delegado faz revista PÚBLICA: quem responde é a mesa, no amanhecer.
    if (ator.varianteId === 'delegado') {
      return {
        texto: `A revista em ${nomeDe(a)} será anunciada à mesa no amanhecer.`,
        adiada: true,
      };
    }

    const mesma = leituraDeFaccao(estado, a) === leituraDeFaccao(estado, b);
    return {
      texto: `${nomeDe(a)} e ${nomeDe(b)} ${mesma ? 'são' : 'não são'} da mesma facção.`,
      adiada: false,
    };
  }

  if (r.id === 'vidente') {
    const alvo = alvos[0];
    if (!alvo) return null;
    const alvoP = estado.players.find((p) => p.id === alvo)!;

    if (ator.varianteId === 'ossos' && alvoP.status === 'vivo') {
      return { texto: `${alvoP.nome} está vivo. Você não enxerga os vivos.`, adiada: true };
    }

    // A única que atrasa de propósito.
    if (ator.varianteId === 'sonhos') {
      return { texto: `Você sonhou com ${alvoP.nome}. A visão chega amanhã.`, adiada: true };
    }

    const texto = `${alvoP.nome} é ${leituraDeFaccao(estado, alvo)}.`;

    /**
     * A Confusa vê as DUAS leituras agora, e uma delas mente.
     *
     * A resposta imediata não pode dizer qual é a falsa — nem ela sabe. Mas
     * pode entregar as duas de uma vez, que é o que a carta promete: antes a
     * segunda chegava na noite seguinte e vinha sozinha, o que revelava por
     * eliminação qual era qual.
     */
    if (ator.varianteId === 'confusa') {
      const visoes = visoesDaConfusa(estado, actorId, alvos);
      if (visoes.length < 2) return { texto, adiada: false };
      return {
        texto: visoes[0]!.texto,
        segunda: visoes[1]!.texto,
        // As DUAS têm o mesmo peso na tela: nenhuma é rodapé da outra.
        duasVisoes: true,
        rodape: 'Uma das duas é falsa, e nem você sabe qual.',
        adiada: false,
      };
    }

    return { texto, adiada: false };
  }

  /**
   * O Aldeão Herdeiro recebe a herança NA HORA.
   *
   * A etapa 11 já gravava `poderDe` na mesma noite, mas o aviso viajava como
   * `InfoEntry`, e a tela de passagem só mostra o que chegou na rodada
   * ANTERIOR — ele descobria o que tinha herdado um dia depois de herdar.
   */
  if (r.id === 'aldeao' && ator.varianteId === 'herdeiro') {
    const alvo = alvos[0];
    const morto = alvo ? estado.players.find((p) => p.id === alvo) : undefined;
    if (!morto) return null;
    return {
      texto: `Você herdou o poder de ${morto.nome}: ${role(morto.roleId).nome}.`,
      segunda: 'Vale a partir da próxima noite.',
      adiada: false,
    };
  }

  /**
   * O Padre Exorcista sabe imediatamente se acertou.
   *
   * Errar custa a carreira dele — vira Aldeão comum —, e a carta não pode cobrar
   * um preço desses sem dizer nada na tela. Note que a resposta NÃO afirma a
   * facção de quem ele benzeu quando acerta: quem morreu a mesa descobre no
   * amanhecer, como qualquer morte.
   */
  if (r.id === 'padre' && ator.varianteId === 'exorcista') {
    const alvo = alvos[0];
    const alvoP = alvo ? estado.players.find((p) => p.id === alvo) : undefined;
    if (!alvoP) return null;
    const acertou = leituraDeFaccao(estado, alvoP.id) === 'lobo';
    return {
      texto: acertou ? `A benza pegou em ${alvoP.nome}.` : `${alvoP.nome} não tinha nada dentro.`,
      segunda: acertou
        ? 'Você acertou. O resto a mesa descobre de manhã.'
        : 'Você errou, e perdeu a moral: daqui para frente é um Aldeão comum.',
      adiada: false,
    };
  }

  return null;
}

/**
 * Qual das duas visões da Vidente Confusa é a MENTIRA.
 *
 * Precisa ser decidido em dois lugares muito distantes: na resposta imediata,
 * que aparece na passagem do celular, e na etapa 11, que grava as informações.
 * A etapa 11 tem o RNG semeado da noite; a passagem não tem RNG nenhum — ela
 * roda antes de qualquer resolução.
 *
 * Enquanto cada lado decidia por conta própria, a tela mostrava as duas leituras
 * VERDADEIRAS e a noite seguinte entregava uma versão diferente com a mentira.
 * Quem prestasse atenção descobria a falsa por comparação, que é exatamente o
 * que a variante existe para impedir.
 *
 * A saída é não sortear: uma função pura da semente, da rodada, de quem
 * investiga e de quem foi investigado. Determinística, idêntica dos dois lados,
 * e sem consumir o RNG — consumir mudaria o resto da noite dependendo de a tela
 * ter perguntado ou não.
 */
export function mentiraDaConfusa(
  estado: GameState,
  actorId: PlayerId,
  alvos: readonly PlayerId[],
): PlayerId | null {
  const [a, b] = alvos;
  if (!a || !b) return null;
  const semente = `${estado.config.semente}|${estado.rodada}|${actorId}|${a}|${b}`;
  let h = 2166136261;
  for (let i = 0; i < semente.length; i += 1) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2 === 0 ? a : b;
}

/** A leitura da Confusa, já com a mentira no lugar. Uma linha por alvo. */
export function visoesDaConfusa(
  estado: GameState,
  actorId: PlayerId,
  alvos: readonly PlayerId[],
): readonly { readonly alvoId: PlayerId; readonly texto: string; readonly verdadeira: boolean }[] {
  const falso = mentiraDaConfusa(estado, actorId, alvos);
  return alvos.slice(0, 2).map((id) => {
    const p = estado.players.find((x) => x.id === id)!;
    const real = leituraDeFaccao(estado, id);
    const mente = id === falso;
    const dito = mente ? (real === 'lobo' ? 'da vila' : 'lobo') : real;
    return { alvoId: id, texto: `${p.nome} é ${dito}.`, verdadeira: !mente };
  });
}
