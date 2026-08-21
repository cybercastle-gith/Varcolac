import type { Deck, GameConfig } from '../types/config';
import type { GameState } from '../types/game-state';
import type { JogadorInicial } from '../setup/create-game';
import { criarPartida } from '../setup/create-game';
import { resolverNoite } from '../resolution/night-pipeline';
import { resolverDia } from '../day/voting';
import { verificarVitoria, type VictoryResult } from '../victory/win-conditions';
import { modo } from '../data/modes/index';
import { retomarRng } from '../utils/rng';
import { decidirNoite, decidirVotos } from './bots';

export interface PartidaCompleta {
  readonly estadoFinal: GameState;
  readonly vitoria: VictoryResult;
  readonly noites: number;
  /** True quando a partida bateu no teto de rodadas sem terminar. */
  readonly abortada: boolean;
}

/**
 * Roda uma partida inteira com bots. É o motor da simulação em massa e, no
 * laboratório, o botão "jogar até o fim".
 *
 * O teto de rodadas não é decoração: uma composição travada (dois imortais se
 * protegendo, por exemplo) precisa terminar em vez de rodar para sempre dentro
 * de um lote de 10.000 partidas.
 */
export function jogarPartida(
  deck: Deck,
  config: GameConfig,
  jogadores: readonly JogadorInicial[],
  tetoDeRodadas = 30,
): PartidaCompleta {
  const ganchos = modo(config.modo);
  let estado = criarPartida(deck, config, jogadores);

  if (ganchos.aoCriarPartida) {
    const rng = retomarRng(estado.rng);
    estado = { ...ganchos.aoCriarPartida(estado, rng), rng: rng.state() };
  }

  let noites = 0;

  while (noites < tetoDeRodadas) {
    noites++;

    // Noite
    const rngNoite = retomarRng(estado.rng);
    const submissao = decidirNoite(estado, rngNoite);
    estado = { ...estado, rng: rngNoite.state() };
    estado = resolverNoite(estado, submissao).estado;

    if (ganchos.aoAmanhecer) {
      const rng = retomarRng(estado.rng);
      estado = { ...ganchos.aoAmanhecer(estado, rng), rng: rng.state() };
    }

    let vitoria = verificarVitoria(estado);
    if (vitoria.encerrada) return fim(estado, vitoria, noites);

    if (ganchos.derrotaDaVila?.(estado)) {
      // A maldição venceu o prazo: a vila inteira morre.
      const lobos = estado.players.filter((p) => p.status === 'vivo');
      return fim(
        { ...estado, fase: 'fim' },
        {
          encerrada: true,
          camadas: [
            {
              camada: 'lobos',
              vencedores: lobos.map((p) => p.id),
              motivo: 'A vila não eliminou os lobos dentro do prazo da maldição.',
            },
          ],
        },
        noites,
      );
    }

    // Dia
    const rngDia = retomarRng(estado.rng);
    const votos = decidirVotos(estado, rngDia);
    estado = { ...estado, rng: rngDia.state() };
    estado = resolverDia(estado, votos).estado;

    vitoria = verificarVitoria(estado);
    if (vitoria.encerrada) return fim(estado, vitoria, noites);

    estado = { ...estado, rodada: estado.rodada + 1, fase: 'noite' };
  }

  return {
    estadoFinal: estado,
    vitoria: { encerrada: false, camadas: [] },
    noites,
    abortada: true,
  };
}

function fim(estado: GameState, vitoria: VictoryResult, noites: number): PartidaCompleta {
  return {
    estadoFinal: {
      ...estado,
      fase: 'fim',
      vencedores: [...new Set(vitoria.camadas.flatMap((c) => c.vencedores))],
    },
    vitoria,
    noites,
    abortada: false,
  };
}
