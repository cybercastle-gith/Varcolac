import type { GameState, VoteRecord } from '../types/game-state';
import { vivos, mortos } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { temEfeito } from '../types/effect';
import { role } from '../data/roles/index';
import { moduloAtivo } from '../data/ghosts';
import { retomarRng } from '../utils/rng';
import { dispararEstertores } from '../resolution/estertor-chain';
import { anunciar, marcar, matar } from '../resolution/steps/_helpers';
import type { LogEntry } from '../resolution/resolution-log';

/** Voto declarado. `null` = absteve-se. */
export type Votos = Readonly<Record<PlayerId, PlayerId | null>>;

export interface DayResult {
  readonly estado: GameState;
  /** Mesmo formato do log da noite, para o laboratório exibir junto. */
  readonly log: readonly Omit<LogEntry, 'etapa' | 'ordem'>[];
}

/**
 * Quem pode votar hoje, e por quê não.
 *
 * Exposto porque a tela de votação precisa da MESMA lista que a apuração usa —
 * mostrar alguém como votante e depois descartar o voto seria uma mentira de
 * interface difícil de rastrear na mesa.
 */
export function elegiveisParaVotar(estado: GameState): {
  podem: readonly PlayerId[];
  impedidos: readonly { id: PlayerId; motivo: string }[];
} {
  const motim = temEfeito(estado.efeitos, estado.rodada, 'aldeoes-sem-voto');
  const podem: PlayerId[] = [];
  const impedidos: { id: PlayerId; motivo: string }[] = [];

  for (const p of vivos(estado)) {
    if (p.semVoto) {
      impedidos.push({ id: p.id, motivo: 'Perdeu o voto (custo da Vidente ou evento).' });
    } else if (p.silenciado) {
      impedidos.push({ id: p.id, motivo: 'Preso pelo Xerife: não fala nem vota hoje.' });
    } else if (motim && p.roleId === 'aldeao') {
      impedidos.push({ id: p.id, motivo: 'Motim: os aldeões perderam o voto por um dia.' });
    } else {
      podem.push(p.id);
    }
  }

  // Peso da Culpa: quem foi linchado injustamente ganha voto mesmo morto.
  if (moduloAtivo('peso-da-culpa', estado.config.modulosDeFantasma, mortos(estado).length)) {
    for (const p of mortos(estado)) {
      const injustica = estado.historicoVotos.some((v) => v.linchadoId === p.id && v.inocente);
      if (injustica) podem.push(p.id);
    }
  }

  return { podem, impedidos };
}

/** Apura os votos e devolve os mais votados (pode empatar). */
export function apurar(votos: Votos, elegiveis: readonly PlayerId[]): {
  contagem: ReadonlyMap<PlayerId, number>;
  maisVotados: readonly PlayerId[];
} {
  const contagem = new Map<PlayerId, number>();
  for (const [quem, alvo] of Object.entries(votos)) {
    if (!alvo || !elegiveis.includes(quem)) continue;
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }

  let max = 0;
  for (const n of contagem.values()) max = Math.max(max, n);
  const maisVotados = max === 0 ? [] : [...contagem].filter(([, n]) => n === max).map(([id]) => id);

  return { contagem, maisVotados };
}

/**
 * Resolve o dia inteiro: votação, desempate, execução e estertores.
 *
 * O Bobo é o único caso que encerra a partida aqui dentro: ser linchado É a
 * vitória dele, e continuar jogando depois disso não faria sentido.
 */
export function resolverDia(estado: GameState, votos: Votos): DayResult {
  const log: Omit<LogEntry, 'etapa' | 'ordem'>[] = [];
  const registrar = (mensagem: string, motivo: string, alvos: PlayerId[] = []) =>
    log.push({ rodada: estado.rodada, mensagem, motivo, atores: [], alvos, ignorada: false });

  let atual: GameState = { ...estado, fase: 'votacao' };

  if (temEfeito(atual.efeitos, atual.rodada, 'sem-votacao')) {
    registrar('Não há votação hoje.', 'Velório ou Sino da Igreja cancelou o dia.');
    return { estado: { ...atual, fase: 'dia' }, log };
  }

  const { podem, impedidos } = elegiveisParaVotar(atual);
  for (const i of impedidos) {
    registrar(`${atual.players.find((p) => p.id === i.id)!.nome} não vota hoje.`, i.motivo);
  }

  const { contagem, maisVotados } = apurar(votos, podem);

  // Delação: quem vota em si mesmo tem a facção revelada à mesa.
  if (atual.config.frequenciaEventos !== 'desligado') {
    for (const [quem, alvo] of Object.entries(votos)) {
      if (quem !== alvo || !alvo) continue;
      const p = atual.players.find((x) => x.id === quem)!;
      atual = anunciar(atual, `${p.nome} é ${role(p.roleId).faccao}.`, 'evento');
      registrar(`Delação: ${p.nome} votou em si mesmo.`, 'O app revela a facção publicamente.');
    }
  }

  if (maisVotados.length === 0) {
    registrar('Ninguém foi condenado.', 'Nenhum voto válido.');
    return { estado: registrarVoto(atual, votos, null, false), log };
  }

  let condenados = [...maisVotados];
  const empate = condenados.length > 1;

  if (empate) {
    if (atual.config.frequenciaEventos !== 'desligado') {
      // A Corda Escolhe: o app sorteia entre os empatados e narra como destino.
      const rng = retomarRng(atual.rng);
      const sorteado = rng.pick(condenados);
      atual = { ...atual, rng: rng.state() };
      condenados = [sorteado];
      registrar(
        `A corda escolheu ${atual.players.find((p) => p.id === sorteado)!.nome}.`,
        'A Corda Escolhe: empate resolvido por sorteio e narrado como destino.',
      );
    } else {
      registrar('Empate: ninguém foi condenado.', 'Sem eventos, o empate não é desfeito.');
      return { estado: registrarVoto(atual, votos, null, true), log };
    }
  }

  // Caça às Bruxas: a vila pode linchar dois neste dia.
  if (temEfeito(atual.efeitos, atual.rodada, 'lincha-dois')) {
    const segundo = [...contagem]
      .filter(([id]) => !condenados.includes(id))
      .sort((a, b) => b[1] - a[1])[0];
    if (segundo) {
      condenados.push(segundo[0]);
      registrar('Duas cordas hoje.', 'Caça às Bruxas: a vila pode linchar dois.');
    }
  }

  let bobo: PlayerId | null = null;

  for (const id of condenados) {
    const alvo = atual.players.find((p) => p.id === id)!;

    // Mártir: marcado à noite, morre no lugar do condenado, sem revelação.
    const martir = atual.players.find(
      (p) =>
        p.status === 'vivo' &&
        p.roleId === 'padre' &&
        p.varianteId === 'martir' &&
        p.flags.protegido === false &&
        atual.informacoes.some(
          (i) => i.rodada === atual.rodada && i.origem === 'app' && i.sobre.includes(id),
        ),
    );

    const executado = martir ?? alvo;
    atual = matar(atual, executado.id, 'linchamento');
    atual = marcar(atual, executado.id, { estertorPendente: true });

    registrar(
      `${executado.nome} foi executado.`,
      martir
        ? 'Mártir: morreu no lugar do condenado, automaticamente e sem revelação.'
        : `${contagem.get(id) ?? 0} voto(s).`,
      [executado.id],
    );

    if (atual.config.revelarRoleAoMorrer && !martir) {
      atual = anunciar(atual, `${executado.nome} era ${role(executado.roleId).nome}.`, 'votacao');
    }

    if (executado.roleId === 'bobo') bobo = executado.id;
  }

  // Estertores do linchamento: Caçador atira, Anciã derruba a vila, amante morre.
  const pendentes = atual.players.filter((p) => p.flags.estertorPendente).map((p) => p.id);
  const cadeia = dispararEstertores(atual, pendentes);
  atual = cadeia.estado;
  for (const r of cadeia.registros) log.push({ ...r, rodada: atual.rodada, ignorada: false });

  const principal = condenados[0]!;
  const inocente = role(atual.players.find((p) => p.id === principal)!.roleId).faccao === 'vila';
  atual = registrarVoto(atual, votos, principal, empate, inocente);

  // Julgamento do Além: os mortos dizem se foi justo, sem revelar o placar.
  if (moduloAtivo('julgamento-do-alem', atual.config.modulosDeFantasma, mortos(atual).length)) {
    atual = anunciar(
      atual,
      inocente ? 'Os mortos estão inquietos.' : 'Os mortos aprovam.',
      'fantasma',
    );
    registrar('Julgamento do Além.', 'Sentimento agregado dos mortos, sem placar.');
  }

  if (bobo) {
    atual = { ...atual, fase: 'fim', vencedores: [bobo] };
    registrar('O Bobo venceu.', 'Ser linchado é a condição de vitória dele: a partida acaba aqui.');
  }

  return { estado: { ...atual, fase: atual.fase === 'fim' ? 'fim' : 'dia' }, log };
}

/** Guarda a votação e atualiza os contadores que alimentam os gatilhos. */
function registrarVoto(
  estado: GameState,
  votos: Votos,
  linchadoId: PlayerId | null,
  empate: boolean,
  inocente = false,
): GameState {
  const registro: VoteRecord = { rodada: estado.rodada, votos, linchadoId, empate, inocente };
  return {
    ...estado,
    historicoVotos: [...estado.historicoVotos, registro],
    // O voto perdido vale por um dia só.
    players: estado.players.map((p) => ({ ...p, semVoto: false, silenciado: false })),
    contadores: {
      ...estado.contadores,
      inocentesLinchadosSeguidos: inocente
        ? estado.contadores.inocentesLinchadosSeguidos + 1
        : 0,
      inocentesLinchadosTotal:
        estado.contadores.inocentesLinchadosTotal + (inocente ? 1 : 0),
      mortosNoTotal: estado.players.filter((p) => p.status === 'morto').length,
    },
  };
}
