import type { GameState, VoteRecord } from '../types/game-state';
import { vivos, mortos } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { temEfeito } from '../types/effect';
import { role } from '../data/roles/index';
import { nomeDaCarta } from '../types/role';
import { disputaVitoriaPropria } from '../victory/win-conditions';
import { moduloAtivo } from '../data/ghosts';
import { retomarRng } from '../utils/rng';
import { dispararEstertores } from '../resolution/estertor-chain';
import { anunciar, gravar, marcar, matar } from '../resolution/steps/_helpers';
import { ecosDaMorte } from '../resolution/steps/_mortes';
import { trocarCarta } from '../turn/troca-de-carta';
import type { LogEntry } from '../resolution/resolution-log';

/** Voto declarado. `null` = absteve-se. */
export type Votos = Readonly<Record<PlayerId, PlayerId | null>>;

/**
 * A votação simultânea, contada em voz alta.
 *
 * Na mesa, a votação simultânea é todo mundo apontando ao mesmo tempo — e o
 * host só precisa contar quantos dedos sobraram em cada pessoa. Registrar
 * voto a voto ("em quem a Ana apontou? e o Bruno? e a Célia?") é transcrever
 * uma coisa que já aconteceu, e com oito pessoas leva mais tempo do que a
 * própria votação.
 *
 * O que se PERDE ao contar em vez de registrar é a identidade de quem votou, e
 * com ela duas mecânicas: o voto duplo do Uivo Comprado e a anulação mútua do
 * Bobo Acusado. As duas precisam saber quem apontou para quem. `resolverDia`
 * avisa no log quando elas são puladas, em vez de fingir que foram aplicadas.
 */
export type VotosContados = Readonly<Record<PlayerId, number>>;

/** O que a mesa entregou: a lista nominal, ou só a contagem. */
export type Apuracao =
  | { readonly tipo: 'nominal'; readonly votos: Votos }
  | { readonly tipo: 'contagem'; readonly contagem: VotosContados };

/** Aceita os dois formatos; o antigo continua valendo como `nominal`. */
function normalizar(entrada: Votos | Apuracao): Apuracao {
  return 'tipo' in entrada ? (entrada as Apuracao) : { tipo: 'nominal', votos: entrada as Votos };
}

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
    if (p.marcas.mortoVivo) {
      impedidos.push({ id: p.id, motivo: 'Morto-vivo: fala, mas não vota mais.' });
    } else if (p.marcas.semVotoSempre) {
      impedidos.push({ id: p.id, motivo: 'Uivo de Troca: perdeu o voto pelo resto da partida.' });
    } else if (p.semVoto) {
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
export function apurar(
  votos: Votos,
  elegiveis: readonly PlayerId[],
  /**
   * Quanto vale o voto de cada um. Ausente = 1.
   *
   * Existe por causa do Uivo Comprado, que dá dois votos ao lobo delatado por
   * um dia. Um `Record` em vez de um booleano porque nada garante que a
   * próxima variante de voto seja também "vale dois".
   */
  pesos: Readonly<Record<PlayerId, number>> = {},
): {
  contagem: ReadonlyMap<PlayerId, number>;
  maisVotados: readonly PlayerId[];
} {
  const contagem = new Map<PlayerId, number>();
  for (const [quem, alvo] of Object.entries(votos)) {
    if (!alvo || !elegiveis.includes(quem)) continue;
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + (pesos[quem] ?? 1));
  }

  let max = 0;
  for (const n of contagem.values()) max = Math.max(max, n);
  const maisVotados = max === 0 ? [] : [...contagem].filter(([, n]) => n === max).map(([id]) => id);

  return { contagem, maisVotados };
}

/** A contagem já vem pronta: só falta achar o topo e tratar empate. */
function apurarContagem(contagem: VotosContados): {
  contagem: ReadonlyMap<PlayerId, number>;
  maisVotados: readonly PlayerId[];
} {
  const mapa = new Map<PlayerId, number>();
  for (const [id, n] of Object.entries(contagem)) {
    if (n > 0) mapa.set(id, n);
  }
  let max = 0;
  for (const n of mapa.values()) max = Math.max(max, n);
  const maisVotados = max === 0 ? [] : [...mapa].filter(([, n]) => n === max).map(([id]) => id);
  return { contagem: mapa, maisVotados };
}

/**
 * Resolve o dia inteiro: votação, desempate, execução e estertores.
 *
 * O Bobo é o único caso que encerra a partida aqui dentro: ser linchado É a
 * vitória dele, e continuar jogando depois disso não faria sentido.
 */
export function resolverDia(estado: GameState, entrada: Votos | Apuracao): DayResult {
  const apuracao = normalizar(entrada);
  /*
   * `votos` continua existindo para o resto da função e para o histórico. Na
   * contagem ele vem VAZIO: ninguém sabe quem apontou para quem, e inventar
   * uma atribuição faria o Bobo Acusado anular votos que nunca existiram.
   */
  const votos: Votos = apuracao.tipo === 'nominal' ? apuracao.votos : {};
  const log: Omit<LogEntry, 'etapa' | 'ordem'>[] = [];
  const registrar = (mensagem: string, motivo: string, alvos: PlayerId[] = []) =>
    log.push({ rodada: estado.rodada, mensagem, motivo, atores: [], alvos, ignorada: false });

  let atual: GameState = { ...estado, fase: 'votacao' };

  if (temEfeito(atual.efeitos, atual.rodada, 'sem-votacao')) {
    registrar('Não há votação hoje.', 'Velório ou Sino da Igreja cancelou o dia.');
    return { estado: { ...fecharODia(atual, log), fase: 'dia' }, log };
  }

  const { podem, impedidos } = elegiveisParaVotar(atual);
  for (const i of impedidos) {
    registrar(`${atual.players.find((p) => p.id === i.id)!.nome} não vota hoje.`, i.motivo);
  }

  /**
   * Bobo Acusado: voto mútuo se anula.
   *
   * Dois jogadores que votam um no outro cancelam os dois votos. Numa mesa
   * pequena isso vira arma: o Bobo consegue esvaziar a acusação de quem o
   * acusou, o que é o contrário do que ele quer — e é por isso que a variante
   * pesa igual e não mais.
   */
  const acusado = vivos(atual).find((p) => p.roleId === 'bobo' && p.varianteId === 'bobo-acusado');
  let votosValidos: Votos = votos;
  if (acusado) {
    const anulados = new Set<PlayerId>();
    for (const [quem, alvo] of Object.entries(votos)) {
      if (!alvo) continue;
      if (votos[alvo] === quem) {
        anulados.add(quem);
        anulados.add(alvo);
      }
    }
    if (anulados.size > 0) {
      votosValidos = Object.fromEntries(
        Object.entries(votos).map(([k, v]) => [k, anulados.has(k) ? null : v]),
      );
      registrar(
        `${anulados.size} votos se anularam.`,
        'Variante Bobo Acusado: quem vota em quem votou nele perde o voto.',
      );
    }
  }

  // Uivo Comprado: o lobo delatado fala por dois, e só hoje.
  const pesos: Record<PlayerId, number> = {};
  for (const p of vivos(atual)) {
    if (p.marcas.votoDuploNaRodada === atual.rodada) pesos[p.id] = 2;
  }

  const { contagem, maisVotados } =
    apuracao.tipo === 'contagem'
      ? apurarContagem(apuracao.contagem)
      : apurar(votosValidos, podem, pesos);

  if (apuracao.tipo === 'contagem') {
    registrar(
      'Votação contada em voz alta.',
      'Sem a lista de quem apontou para quem, o voto duplo do Uivo Comprado e a ' +
        'anulação mútua do Bobo Acusado não entram nesta apuração.',
    );
  }

  /**
   * Quem recebeu voto deixa de ser invisível.
   *
   * O Sobrevivente Invisível é intocável enquanto a mesa o ignora. A marca é
   * gravada aqui, e não na etapa da noite, porque a condição é sobre a
   * VOTAÇÃO — inclusive a votação que não linchou ninguém.
   */
  for (const alvo of contagem.keys()) {
    atual = gravar(atual, alvo, { jaRecebeuVoto: true });
  }

  /**
   * Bobo da Forca: a votação que ele marcou é agora.
   *
   * Um voto basta para ele vencer, e zero voto o transforma em Aldeão. A
   * checagem fica antes da execução porque ele pode vencer sem ser linchado —
   * é essa a diferença para o Bobo base.
   */
  for (const b of vivos(atual).filter((x) => x.marcas.forcaNaRodada === atual.rodada)) {
    if ((contagem.get(b.id) ?? 0) > 0) {
      atual = { ...atual, fase: 'fim', vencedores: [b.id] };
      registrar(
        `${b.nome} venceu na forca que ele mesmo marcou.`,
        'Variante Bobo da Forca: recebeu ao menos um voto na votação marcada.',
      );
      return { estado: registrarVoto(fecharODia(atual, log), votosValidos, null, false), log };
    }
    atual = trocarCarta(atual, b.id, {
      roleId: 'aldeao',
      usos: Infinity,
      motivo: 'Ninguém votou em você na votação marcada. Agora você é Aldeão comum.',
    });
    atual = gravar(atual, b.id, { virouAldeao: true });
    registrar(
      `${b.nome} virou Aldeão comum.`,
      'Variante Bobo da Forca: ninguém votou nele na votação marcada.',
    );
  }

  /**
   * Bobo Desesperado: duas votações ignorado e ele desiste.
   *
   * O contador não precisa de campo próprio — o histórico de votos já diz
   * quem recebeu voto em cada rodada, e duas rodadas é tudo que precisa ser
   * olhado para trás.
   */
  for (const b of vivos(atual).filter(
    (x) => x.roleId === 'bobo' && x.varianteId === 'bobo-desesperado' && !x.marcas.virouAldeao,
  )) {
    const semVotoAgora = (contagem.get(b.id) ?? 0) === 0;
    const anterior = atual.historicoVotos.at(-1);
    const semVotoAntes = anterior ? !Object.values(anterior.votos).some((v) => v === b.id) : false;
    if (semVotoAgora && semVotoAntes) {
      /*
       * Vira Aldeão DE VERDADE, com tela e anúncio.
       *
       * `marcas.virouAldeao` sozinho deixava a carta de Bobo na mão dele: o
       * ícone, a revelação ao morrer e a tela final continuavam dizendo Bobo, e
       * ninguém era avisado de nada. É a mesma correção que a Cova Aberta e a
       * Herança Amarga já tinham recebido.
       */
      atual = trocarCarta(atual, b.id, {
        roleId: 'aldeao',
        usos: Infinity,
        motivo: 'Duas votações e ninguém olhou para você. Cansou: agora é um Aldeão comum.',
      });
      atual = gravar(atual, b.id, { virouAldeao: true });
      atual = anunciar(
        atual,
        `${b.nome} era o Bobo e perdeu o objetivo. Agora é um Aldeão comum.`,
        'votacao',
        { rotulo: 'Perdeu a função' },
      );
      registrar(
        `${b.nome} desistiu.`,
        'Variante Bobo Desesperado: duas votações seguidas sem receber um voto.',
      );
    }
  }

  // Delação: quem vota em si mesmo tem a facção revelada à mesa.
  if (atual.config.frequenciaEventos !== 'desligado') {
    for (const [quem, alvo] of Object.entries(votos)) {
      if (quem !== alvo || !alvo) continue;
      const p = atual.players.find((x) => x.id === quem)!;
      atual = anunciar(atual, `${p.nome} é ${({ vila: 'da vila', lobos: 'lobo', solitario: 'solitário' } as const)[role(p.roleId).faccao]}.`, 'evento');
      registrar(`Delação: ${p.nome} votou em si mesmo.`, 'O app revela a facção publicamente.');
    }
  }

  if (maisVotados.length === 0) {
    registrar('Ninguém foi condenado.', 'Nenhum voto válido.');
    return { estado: registrarVoto(fecharODia(atual, log), votosValidos, null, false), log };
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
      return { estado: registrarVoto(fecharODia(atual, log), votosValidos, null, true), log };
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

    /**
     * Sobrevivente Teimoso: a corda não pega nele.
     *
     * Ele continua vivo e continua na mesa, o que é muito pior para a vila do
     * que parece: um dia de votação inteiro foi gasto e ninguém morreu. A
     * variante não tem uso limitado — sobreviver é literalmente o trabalho
     * dele.
     */
    if (alvo.roleId === 'sobrevivente' && alvo.varianteId === 'sobrevivente-teimoso') {
      registrar(
        `${alvo.nome} não morreu.`,
        'Variante Sobrevivente Teimoso: a votação da Vila não o mata.',
        [alvo.id],
      );
      continue;
    }

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
      atual = anunciar(
        atual,
        `${executado.nome} era ${nomeDaCarta(role(executado.roleId), executado.varianteId)}.`,
        'votacao',
      );
    }

    // `disputaVitoriaPropria`, e não só `virouAldeao`: o Bobo ressuscitado pela
    // Cova Aberta voltou SEM habilidade, e a habilidade dele é ganhar na corda.
    if (executado.roleId === 'bobo' && disputaVitoriaPropria(executado)) bobo = executado.id;

    // Sangue Marcado, Última Carne e Sangue Acumulado também valem de dia.
    const eco = ecosDaMorte(atual, executado.id);
    atual = eco.estado;
    for (const r of eco.ecos) registrar(r.mensagem, r.motivo, [...r.alvos]);
  }

  // Estertores do linchamento: Caçador atira, Anciã derruba a vila, amante morre.
  const pendentes = atual.players.filter((p) => p.flags.estertorPendente).map((p) => p.id);
  const cadeia = dispararEstertores(atual, pendentes);
  atual = cadeia.estado;
  for (const r of cadeia.registros) log.push({ ...r, rodada: atual.rodada, ignorada: false });

  const principal = condenados[0]!;
  const inocente = role(atual.players.find((p) => p.id === principal)!.roleId).faccao === 'vila';
  atual = registrarVoto(atual, votosValidos, principal, empate, inocente);

  // Julgamento do Além: os mortos dizem se foi justo, sem revelar o placar.
  if (moduloAtivo('julgamento-do-alem', atual.config.modulosDeFantasma, mortos(atual).length)) {
    atual = anunciar(
      atual,
      inocente ? 'Os mortos dizem: o condenado não era lobo.' : 'Os mortos dizem: o condenado era lobo.',
      'fantasma',
    );
    registrar('Julgamento do Além.', 'Sentimento agregado dos mortos, sem placar.');
  }

  atual = fecharODia(atual, log);

  if (bobo) {
    atual = { ...atual, fase: 'fim', vencedores: [bobo] };
    // A frase é do usuário, e ela é o fecho da piada: a mesa precisa OUVIR isso.
    atual = anunciar(atual, 'O Bobo foi condenado e venceu a partida.', 'votacao');
    registrar('O Bobo venceu.', 'Ser linchado é a condição de vitória dele: a partida acaba aqui.');
  }

  return { estado: { ...atual, fase: atual.fase === 'fim' ? 'fim' : 'dia' }, log };
}

/**
 * O fim do dia, cobrado em TODA saída de `resolverDia`.
 *
 * Duas dívidas vencem quando o sol cai: o Rastro (o alvo da matilha foi
 * anunciado de manhã e só morre depois da votação) e a Última Vela (o
 * ressuscitado do Necromante teve o seu dia).
 *
 * Nasceu como um bloco no fim de `resolverDia` e estava errado: a função sai
 * cedo em três casos — dia sem votação, nenhum voto válido, empate sem
 * desempate —, e nesses três o Rastro simplesmente não acontecia. O jogador
 * anunciado de manhã como morto continuava vivo para sempre, e bastava a mesa
 * se abster para conseguir isso.
 */
function fecharODia(estado: GameState, log: Omit<LogEntry, 'etapa' | 'ordem'>[]): GameState {
  let atual = estado;
  const registrar = (mensagem: string, motivo: string, alvos: PlayerId[] = []) =>
    log.push({ rodada: atual.rodada, mensagem, motivo, atores: [], alvos, ignorada: false });

  for (const p of vivos(atual)) {
    const rastro = p.marcas.morreDepoisDaVotacao === atual.rodada;
    const vela = atual.efeitos.some(
      (e) =>
        e.kind === 'expira-no-fim-do-dia' && e.naRodada === atual.rodada && e.playerId === p.id,
    );
    if (!rastro && !vela) continue;
    atual = matar(atual, p.id, rastro ? 'matilha' : 'estertor');
    atual = marcar(atual, p.id, { estertorPendente: true });
    /*
     * As duas mortes de fim de dia eram SILENCIOSAS: o corpo aparecia na lista
     * e ninguém dizia por quê. Relatado sobre a Última Vela: "o cara voltou
     * pra cova e nada foi anunciado nem nada".
     */
    atual = anunciar(
      atual,
      rastro
        ? `${p.nome} morreu: o ataque da noite passada se cumpriu depois da votação.`
        : `${p.nome} morreu de novo: a ressurreição durava só um dia.`,
      'morte',
      { rotulo: rastro ? 'O rastro cobrou' : 'A vela apagou' },
    );
    registrar(
      `${p.nome} morreu ao fim do dia.`,
      rastro
        ? 'Variante Rastro: a mordida da noite passada cobrou o preço depois da votação.'
        : 'Variante Última Vela: a vela apagou.',
      [p.id],
    );
  }

  const pendentes = atual.players.filter((x) => x.flags.estertorPendente).map((x) => x.id);
  if (pendentes.length > 0) {
    const cadeia = dispararEstertores(atual, pendentes);
    atual = cadeia.estado;
    for (const r of cadeia.registros) log.push({ ...r, rodada: atual.rodada, ignorada: false });
  }

  return atual;
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
      inocentesLinchadosSeguidos: inocente ? estado.contadores.inocentesLinchadosSeguidos + 1 : 0,
      inocentesLinchadosTotal: estado.contadores.inocentesLinchadosTotal + (inocente ? 1 : 0),
      mortosNoTotal: estado.players.filter((p) => p.status === 'morto').length,
    },
  };
}

/**
 * O voto deste jogador trava assim que for declarado?
 *
 * Só o Aldeão Teimoso trava. Mora no engine porque é REGRA, ainda que só a tela
 * consiga aplicá-la: a apuração recebe a votação já fechada e não tem como
 * saber se alguém mudou de ideia no caminho. Deixar a regra na tela e não aqui
 * foi o que manteve o Teimoso como a última variante sem mecânica.
 */
export function votoTrava(estado: GameState, id: PlayerId): boolean {
  const p = estado.players.find((x) => x.id === id);
  return p?.roleId === 'aldeao' && p.varianteId === 'teimoso';
}
