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
      const segundo = alvos[1];
      if (!segundo) return { texto, adiada: false };
      const p2 = estado.players.find((x) => x.id === segundo)!;
      return {
        texto,
        segunda: `${p2.nome} é ${leituraDeFaccao(estado, segundo)}. Uma das duas é falsa.`,
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
      texto: acertou
        ? `A benza pegou em ${alvoP.nome}.`
        : `${alvoP.nome} não tinha nada dentro.`,
      segunda: acertou
        ? 'Você acertou. O resto a mesa descobre de manhã.'
        : 'Você errou, e perdeu a moral: daqui para frente é um Aldeão comum.',
      adiada: false,
    };
  }

  return null;
}
