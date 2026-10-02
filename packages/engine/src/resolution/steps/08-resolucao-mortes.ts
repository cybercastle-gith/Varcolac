import { trocarCarta } from '../../turn/troca-de-carta';
import type { CauseOfDeath, PlayerId } from '../../types/player';
import type { GameState } from '../../types/game-state';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import {
  acoesDe,
  agendar,
  anunciar,
  gastarUso,
  gravar,
  marcar,
  matar,
  nome,
  temUso,
} from './_helpers';
import {
  alvosDaMatilha,
  ataqueIndividual,
  cotaDoLoboBranco,
  matilhaProibidaDeMatar,
} from './_ataques';
import { faccaoEfetiva } from '../../turn/faccao';
import { protecaoBloqueada } from './_protecao';
import { ecosDaMorte } from './_mortes';

/** Ataque já reduzido ao que a etapa precisa saber. */
interface Investida {
  readonly alvo: PlayerId;
  readonly atacanteId: PlayerId;
  readonly causa: CauseOfDeath;
}

/**
 * Etapa 8 — cruza ataques com proteções e perfurações e decide quem morre.
 * É a única etapa que mata por ataque; estertores vêm na 9.
 */
export const resolucaoMortes: StepFn = (ctx) => {
  /**
   * O "atravessar" do Feiticeiro CONTA como ataque da matilha.
   *
   * Ele não perfura para outro lobo aproveitar: ele mata atravessando, e essa é
   * a escolha que ele faz em vez de caçar normal. Sem esta linha, escolher
   * atravessar removia a proteção do alvo e **ninguém morria** — o poder
   * custava a noite inteira e não fazia nada.
   */
  const perfuracoesQueMatam = acoesDe(ctx, 'perfuracao').filter((a) => {
    const ator = ctx.estado.players.find((p) => p.id === a.actorId);
    if (ator?.roleId !== 'feiticeiro' || a.escolha !== 'atravessar') return false;
    /*
     * O uso é lido em `estadoInicial`, e não em `estado`.
     *
     * A etapa 6 já cobrou o uso desta noite, então `estado` mostra zero para
     * quem ACABOU de perfurar — cobrar de novo aqui anularia toda perfuração
     * válida. A pergunta certa é "ele tinha uso quando a noite começou?", e só
     * `estadoInicial` responde isso.
     *
     * Sem esta checagem a etapa 6 recusava a perfuração por falta de uso e a
     * etapa 8 matava assim mesmo: o Feiticeiro perdia a perfuração e continuava
     * matando todas as noites.
     */
    const antesDaNoite = ctx.estadoInicial.players.find((p) => p.id === a.actorId);
    return (antesDaNoite?.usosRestantes ?? 0) > 0;
  });

  const ataques = [
    ...acoesDe(ctx, 'ataque').filter((a) => a.escolha !== 'uivar' && a.escolha !== 'converter'),
    ...perfuracoesQueMatam,
  ];
  const idsQueAtravessam = new Set(perfuracoesQueMatam.map((a) => a.actorId));
  const protecoes = acoesDe(ctx, 'protecao');

  // Quem cada guarda-costas está cobrindo, para a troca de vida na hora certa.
  const guardas = protecoes
    .filter((a) => ctx.estado.players.find((p) => p.id === a.actorId)?.roleId === 'guarda-costas')
    .flatMap((a) => a.alvos.map((alvo) => ({ guardaId: a.actorId, alvo })));

  let estado = ctx.estado;
  const investidas: Investida[] = [];

  // Os nomes declarados na etapa de estertores, que a Armadilha consulta aqui.
  const declaracoesDeEstertor = new Map<PlayerId, PlayerId>();
  for (const a of acoesDe(ctx, 'estertores')) {
    if (a.alvos[0]) declaracoesDeEstertor.set(a.actorId, a.alvos[0]);
  }

  // A matilha mata JUNTA: os votos dos lobos viram um alvo só (ou `cota`).
  for (const { alvo, votos, desempatado } of alvosDaMatilha(estado, ataques, ctx.rng)) {
    const primeiroLobo = ataques.find((a) => a.alvos.includes(alvo))?.actorId ?? '';
    investidas.push({ alvo, atacanteId: primeiroLobo, causa: 'matilha' });
    if (desempatado) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: 'A matilha se dividiu; o alvo saiu por sorteio entre os empatados.',
        motivo: `${votos} voto(s) para ${nome(estado, alvo)}.`,
        alvos: [alvo],
      });
    }
  }

  // Lobo Branco, Bruxa e Sobrevivente armado atacam fora da cota da matilha.
  for (const a of ataques) {
    const atacante = estado.players.find((p) => p.id === a.actorId)!;
    if (!ataqueIndividual(atacante)) continue;

    /*
     * Noite sem sangue vale para quem é da MATILHA, mesmo atacando sozinho.
     * A Bruxa e o Sobrevivente armado continuam livres: são solitários.
     */
    if (matilhaProibidaDeMatar(estado) && role(atacante.roleId).faccao === 'lobos') {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${atacante.nome} não caçou.`,
        motivo: 'Noite 1 sem sangue: nenhum lobo mata, nem os que atacam sozinhos.',
        atores: [atacante.id],
      });
      continue;
    }

    /**
     * A poção da VIDA nunca curou ninguém.
     *
     * A Bruxa escolhe no início entre vida e morte, e a etapa de ataque tratava
     * as duas do mesmo jeito: quem tinha a poção da vida MATAVA o alvo que
     * tentou salvar. Metade da role fazia o oposto do que a carta prometia.
     */
    if (atacante.roleId === 'bruxa') {
      /*
       * A poção é de uso ÚNICO e ninguém gastava o uso.
       *
       * `usoLimitado` da Bruxa é `por-partida: 1` desde sempre, e nenhuma etapa
       * chamava `gastarUso` — ela usava a poção todas as noites. Relatado
       * assim: "a poção da bruxa não está com um único uso".
       */
      if (!temUso(estado, atacante.id)) {
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${atacante.nome} não tem mais poção.`,
          motivo: 'Uma por partida.',
          atores: [atacante.id],
        });
        continue;
      }
      estado = gastarUso(estado, atacante.id);
      estado = resolverPocao(ctx, estado, atacante.id, a.alvos, investidas, a.escolha);
      continue;
    }

    /**
     * A benza do Padre Exorcista: acerta o lobo ou acaba a carreira dele.
     *
     * Regra dada pelo usuário em 2026-09-26. O Padre base garante uma noite sem
     * mortes; este troca a garantia por uma aposta num nome. Acertou, o lobo
     * cai; errou, ele vira Aldeão comum e a vila perde o poder inteiro.
     *
     * A morte passa pela fila normal de investidas, o que significa que uma
     * proteção sobre o lobo ainda o salva — a benza não perfura nada.
     */
    if (atacante.roleId === 'padre' && atacante.varianteId === 'exorcista') {
      const alvo = a.alvos[0] ? estado.players.find((p) => p.id === a.alvos[0]) : undefined;
      if (!alvo) continue;
      estado = gastarUso(estado, atacante.id);
      const ehLobo = faccaoEfetiva(estado, alvo) === 'lobos';
      if (ehLobo) {
        investidas.push({ alvo: alvo.id, atacanteId: atacante.id, causa: 'exorcismo' });
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${atacante.nome} benzeu ${alvo.nome}, e acertou.`,
          motivo: 'Variante Exorcista: o alvo era lobo. A morte é resolvida como qualquer outra.',
          atores: [atacante.id],
          alvos: [alvo.id],
        });
      } else {
        estado = trocarCarta(estado, atacante.id, {
          roleId: 'aldeao',
          usos: Infinity,
          motivo: 'Você benzeu quem não era lobo e perdeu o poder. Agora é Aldeão comum.',
        });
        estado = gravar(estado, atacante.id, { virouAldeao: true });
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${atacante.nome} benzeu ${alvo.nome} e errou.`,
          motivo: 'Variante Exorcista: o alvo não era lobo. O Padre perdeu a moral e virou Aldeão.',
          atores: [atacante.id],
          alvos: [alvo.id],
        });
      }
      continue;
    }

    if (atacante.roleId === 'lobo-branco') {
      /**
       * Jejum Forçado: obrigado a virar contra a própria matilha.
       *
       * A regra só morde quando a matilha comeu na noite anterior, e é aí que a
       * variante é boa: o Lobo Branco vira um problema para os lobos justamente
       * quando eles estão indo bem.
       */
      const soLobo = atacante.marcas.soLoboNaRodada === estado.rodada;
      const permitidos = a.alvos.filter((id) => {
        if (!soLobo) return true;
        return role(estado.players.find((p) => p.id === id)!.roleId).faccao === 'lobos';
      });
      if (soLobo && permitidos.length < a.alvos.length) {
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${atacante.nome} não pôde caçar fora da matilha esta noite.`,
          motivo: 'Variante Jejum Forçado: a matilha comeu ontem, hoje ele só mata lobo.',
          atores: [atacante.id],
        });
      }

      /**
       * Último da Matilha: só pode matar lobo no fim, quando restam dois.
       *
       * Com três ou mais lobos vivos ele é obrigado a caçar na vila, o que o
       * mantém útil à matilha até o momento exato em que passa a ser fatal.
       */
      if (atacante.varianteId === 'ultimo-da-matilha') {
        const lobos = estado.players.filter(
          (p) => p.status === 'vivo' && role(p.roleId).faccao === 'lobos',
        ).length;
        const mirouLobo = permitidos.some(
          (id) => role(estado.players.find((p) => p.id === id)!.roleId).faccao === 'lobos',
        );
        if (mirouLobo && lobos !== 2) {
          ctx.log.registrar('resolucao-mortes', {
            mensagem: `${atacante.nome} recuou.`,
            motivo: `Variante Último da Matilha: ${lobos} lobos vivos, e ele só ataca lobo quando restam dois.`,
            atores: [atacante.id],
          });
          continue;
        }
      }

      const cota = cotaDoLoboBranco(estado, atacante.id);
      for (const alvo of permitidos.slice(0, cota)) {
        investidas.push({ alvo, atacanteId: atacante.id, causa: 'lobo-branco' });
      }
      continue;
    }

    /*
     * O Feiticeiro só ataca por conta própria quando ESCOLHEU atravessar. Se
     * escolheu caçar, o voto dele é da matilha como o de qualquer lobo —
     * `ataqueIndividual` não distingue as duas escolhas, e é aqui que a
     * distinção existe.
     */
    if (atacante.roleId === 'feiticeiro' && !idsQueAtravessam.has(a.actorId)) continue;

    // Sobrevivente com A Qualquer Custo, e o Feiticeiro atravessando.
    for (const alvo of a.alvos) {
      investidas.push({
        alvo,
        atacanteId: atacante.id,
        causa: atacante.roleId === 'feiticeiro' ? 'matilha' : 'lobo-branco',
      });
    }
  }

  if (investidas.length === 0) {
    ctx.log.ignorar('resolucao-mortes', 'Nenhum ataque para resolver.');
    return { ...ctx, estado };
  }

  const jaResolvidos = new Set<PlayerId>();

  for (const { alvo, atacanteId, causa } of investidas) {
    if (jaResolvidos.has(alvo)) continue;
    jaResolvidos.add(alvo);

    const vitima = estado.players.find((p) => p.id === alvo);
    if (!vitima || vitima.status === 'morto') continue;

    /**
     * Ter sido atacado é informação, mesmo quando o ataque falha.
     *
     * O Médico de Plantão só pode curar quem foi atacado na noite anterior, e
     * sem esta marca ele não teria como saber de ninguém — a lista de alvos
     * dele viria vazia todas as noites e a variante seria um Médico que nunca
     * age.
     */
    estado = gravar(estado, alvo, { atacadoNaRodada: estado.rodada });

    /**
     * Sobrevivente Invisível: quem a mesa ignora, a matilha não acha.
     *
     * A condição é elegante e o jogador a controla mal de propósito: basta um
     * voto, um só, em qualquer dia, para ele virar alvo pelo resto da partida.
     */
    if (
      vitima.roleId === 'sobrevivente' &&
      vitima.varianteId === 'sobrevivente-invisivel' &&
      !vitima.marcas.jaRecebeuVoto
    ) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${vitima.nome} não foi encontrado.`,
        motivo: 'Variante Sobrevivente Invisível: ninguém votou nele ainda, então ninguém o acha.',
        alvos: [alvo],
      });
      estado = armarSobrevivente(estado, vitima.id);
      continue;
    }

    /**
     * Caçador Armadilha: quem entra na casa dele não sai.
     *
     * Regra dada pelo usuário em 2026-09-26: ele NÃO morre quando tentam matá-lo
     * — quem morre é o nome que ele deixou armado. É a diferença entre a
     * Armadilha e o Caçador base, que morre e atira depois: aqui a armadilha
     * dispara em lugar da morte dele.
     *
     * Fica antes da checagem de proteção porque não é proteção: nenhuma cura
     * está envolvida, e a perfuração do Feiticeiro não desarma a armadilha.
     */
    if (vitima.roleId === 'cacador' && vitima.varianteId === 'armadilha') {
      const armado = declaracoesDeEstertor.get(vitima.id);
      const presa = armado ? estado.players.find((p) => p.id === armado) : undefined;
      if (presa && presa.status === 'vivo') {
        investidas.push({ alvo: presa.id, atacanteId: vitima.id, causa: 'estertor' });
      }
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${vitima.nome} sobreviveu: a armadilha disparou.`,
        motivo: presa
          ? `Variante Armadilha: ele não morre, e ${presa.nome} cai no lugar.`
          : 'Variante Armadilha: ele não morre. Nenhum nome estava armado.',
        alvos: [vitima.id],
      });
      continue;
    }

    const { protegido, preso, perfurado } = vitima.flags;

    // O Guarda-costas entra ANTES da checagem de proteção: ele não impede o
    // ataque, ele recebe o ataque no lugar do protegido.
    const guarda = guardas.find((g) => g.alvo === alvo);
    if (guarda && !perfurado) {
      const g = estado.players.find((p) => p.id === guarda.guardaId)!;
      if (g.varianteId === 'escudo') {
        // Escudo: absorve agora e morre uma noite depois (ver `prepararNoite`).
        estado = agendar(estado, { kind: 'expira', naRodada: estado.rodada + 1, playerId: g.id });
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `${g.nome} absorveu o ataque a ${vitima.nome}.`,
          motivo: 'Variante Escudo: ele morre na noite seguinte, não agora.',
          alvos: [alvo, g.id],
        });
        continue;
      }

      estado = matar(estado, g.id, 'guarda-costas');
      estado = marcar(estado, g.id, { estertorPendente: true });
      let motivo =
        g.varianteId === 'muralha'
          ? 'Variante Muralha: cobria dois, e bastou um ser atacado.'
          : 'Guarda-costas morre no lugar do protegido.';

      if (g.varianteId === 'sacrificio') {
        const atacante = estado.players.find((p) => p.id === atacanteId);
        if (atacante && atacante.status === 'vivo') {
          estado = matar(estado, atacante.id, 'guarda-costas');
          estado = marcar(estado, atacante.id, { estertorPendente: true });
          motivo += ` Variante Sacrifício: levou ${atacante.nome} junto.`;
        }
      }

      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${g.nome} morreu no lugar de ${vitima.nome}.`,
        motivo,
        alvos: [alvo, g.id],
      });
      estado = registrarEcos(ctx, estado, g.id);
      continue;
    }

    if ((protegido || preso) && !perfurado) {
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${vitima.nome} sobreviveu ao ataque.`,
        motivo: preso ? 'Preso pelo Xerife não morre.' : 'Estava protegido.',
        alvos: [alvo],
      });
      estado = armarSobrevivente(estado, vitima.id);
      continue;
    }

    /**
     * Rastro: o corpo é anunciado de manhã e só cai depois do julgamento.
     *
     * A vila passa o dia inteiro sabendo quem a matilha escolheu, e vota
     * sabendo — inclusive podendo ouvir o condenado à morte falar. É a variante
     * que mais muda o dia sem mudar nada da noite.
     */
    /**
     * Basta UM lobo com Rastro na mordida — não o primeiro da lista.
     *
     * `atacanteId` guarda o primeiro atacante que declarou aquele alvo, e a
     * checagem olhava só para ele. Com dois lobos no mesmo alvo, se o Rastro
     * não fosse o primeiro a passar o celular, a variante não acontecia.
     * Relatado assim: "Lobo rastro não está funcionando".
     */
    const rastro = ataques.some((acaoDeAtaque) => {
      const lobo = estado.players.find((p) => p.id === acaoDeAtaque.actorId);
      return (
        !!lobo &&
        lobo.roleId === 'lobo' &&
        lobo.varianteId === 'rastro' &&
        acaoDeAtaque.alvos.includes(alvo)
      );
    });
    if (rastro && causa === 'matilha') {
      estado = gravar(estado, alvo, { morreDepoisDaVotacao: estado.rodada });
      estado = anunciar(
        estado,
        `Os lobos atacaram ${vitima.nome}. Essa pessoa continua no jogo hoje e morre depois da votação.`,
        'morte',
        { rotulo: 'Ataque anunciado' },
      );
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${vitima.nome} foi marcado, e não morre agora.`,
        motivo: 'Variante Rastro: revelado no amanhecer, morre depois da votação.',
        alvos: [alvo],
      });
      continue;
    }

    estado = matar(estado, alvo, causa);
    // O estertor não dispara aqui: a etapa 9 varre quem morreu nesta etapa.
    estado = marcar(estado, alvo, { estertorPendente: true });
    ctx.log.registrar('resolucao-mortes', {
      mensagem: `${vitima.nome} morreu.`,
      motivo: perfurado ? 'Proteção removida pela perfuração na etapa 6.' : 'Sem proteção alguma.',
      alvos: [alvo],
    });
    estado = registrarEcos(ctx, estado, alvo);
  }

  /**
   * Jejum Forçado: a matilha comeu, o Lobo Branco jejua.
   *
   * A marca era LIDA na mira do Lobo Branco e não era escrita em lugar nenhum
   * — a variante estava metade pronta e parecia inteira. Fica no fim da etapa
   * porque só aqui se sabe quem a matilha levou de fato.
   */
  const matilhaComeu = estado.players.some(
    (p) => p.mortoNaRodada === estado.rodada && p.causaMorte === 'matilha',
  );
  if (matilhaComeu) {
    for (const jejuador of estado.players) {
      if (jejuador.status !== 'vivo' || jejuador.varianteId !== 'jejum-forcado') continue;
      estado = gravar(estado, jejuador.id, { soLoboNaRodada: estado.rodada + 1 });
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${jejuador.nome} só poderá matar lobo na próxima noite.`,
        motivo: 'Variante Jejum Forçado: a matilha matou fora dela esta noite.',
        atores: [jejuador.id],
      });
    }
  }

  return { ...ctx, estado };
};

/**
 * A Qualquer Custo: escapar de uma noite arma o Sobrevivente.
 *
 * Chamado dos dois pontos em que o ataque falha — proteção e invisibilidade —,
 * porque a carta diz "se sobreviver a uma tentativa de morte noturna" e não
 * distingue como ele sobreviveu.
 */
function armarSobrevivente(estado: GameState, id: PlayerId): GameState {
  const p = estado.players.find((x) => x.id === id);
  if (!p || p.roleId !== 'sobrevivente' || p.varianteId !== 'a-qualquer-custo') return estado;
  if (p.marcas.podeMatar) return estado;
  return gravar(estado, id, { podeMatar: true });
}

/** Aplica os ecos da morte e transcreve cada um no log desta etapa. */
function registrarEcos(ctx: Parameters<StepFn>[0], estado: GameState, id: PlayerId): GameState {
  const { estado: novo, ecos } = ecosDaMorte(estado, id);
  for (const eco of ecos) ctx.log.registrar('resolucao-mortes', eco);
  return novo;
}

/**
 * A poção da Bruxa, com as três variantes.
 *
 * A escolha vida/morte mora em `objetivosSecretos` desde a criação da partida.
 * O que muda por variante é QUEM ela atinge e QUANDO a Bruxa descobre o que
 * tinha na mão.
 */
function resolverPocao(
  ctx: Parameters<StepFn>[0],
  estado: GameState,
  bruxaId: PlayerId,
  alvos: readonly PlayerId[],
  investidas: Investida[],
  /** A poção que ELA escolheu nesta passagem. */
  escolha: string | undefined,
): GameState {
  const bruxa = estado.players.find((p) => p.id === bruxaId)!;
  let e = estado;

  /**
   * A escolha da noite manda, e ela fica gravada.
   *
   * A poção era sorteada em `criarPartida` e definia o lado da Bruxa sem ela
   * opinar. Agora a escolha vem da passagem; `objetivosSecretos` continua sendo
   * onde o lado mora, porque é de lá que `win-conditions` o lê.
   */
  if (escolha === 'pocao-vida' || escolha === 'pocao-morte') {
    e = { ...e, objetivosSecretos: { ...e.objetivosSecretos, [bruxaId]: escolha } };
  }

  /**
   * Poção Misteriosa: ela só descobre agora o que estava no frasco.
   *
   * O sorteio usa o RNG semeado da noite, então a partida continua
   * reproduzível a partir da semente — e o log registra o resultado, para o
   * host poder explicar à mesa o que aconteceu.
   */
  let morte = e.objetivosSecretos[bruxaId] === 'pocao-morte';
  if (bruxa.varianteId === 'pocao-misteriosa') {
    morte = ctx.rng.next() < 0.5;
    e = {
      ...e,
      objetivosSecretos: {
        ...e.objetivosSecretos,
        [bruxaId]: morte ? 'pocao-morte' : 'pocao-vida',
      },
    };
    ctx.log.registrar('resolucao-mortes', {
      mensagem: `A poção de ${bruxa.nome} era de ${morte ? 'MORTE' : 'VIDA'}.`,
      motivo: 'Variante Poção Misteriosa: o conteúdo só é decidido na resolução.',
      atores: [bruxaId],
    });
  }

  /**
   * Poção Compartilhada: dois alvos, e ela não escolhe o segundo.
   *
   * "Às cegas" está na carta, então o segundo alvo é sorteado entre os vivos.
   * Isso faz da poção da vida uma bênção dupla e da poção da morte um risco
   * que pode voltar contra a própria Bruxa.
   */
  let atingidos = [...alvos];
  if (bruxa.varianteId === 'pocao-compartilhada') {
    const outros = e.players.filter(
      (p) => p.status === 'vivo' && !atingidos.includes(p.id) && p.id !== bruxaId,
    );
    if (outros.length > 0) atingidos.push(ctx.rng.pick(outros).id);
    ctx.log.registrar('resolucao-mortes', {
      mensagem: `A poção de ${bruxa.nome} atingiu ${atingidos.length} pessoas.`,
      motivo: 'Variante Poção Compartilhada: o segundo alvo é sorteado, e ela não o conhece.',
      atores: [bruxaId],
      alvos: atingidos,
    });
  }

  if (!morte) {
    // Poção da VIDA: protege em vez de matar. Era isto que faltava.
    for (const alvo of atingidos) {
      const impedimento = protecaoBloqueada(e, alvo);
      if (impedimento) {
        ctx.log.registrar('resolucao-mortes', {
          mensagem: `A poção não pegou em ${nome(e, alvo)}.`,
          motivo: impedimento,
          atores: [bruxaId],
          alvos: [alvo],
        });
        continue;
      }
      e = marcar(e, alvo, { protegido: true });
      ctx.log.registrar('resolucao-mortes', {
        mensagem: `${bruxa.nome} curou ${nome(e, alvo)}.`,
        motivo:
          'Poção da vida. A Bruxa da vida nunca matou ninguém — a etapa tratava as duas igual.',
        atores: [bruxaId],
        alvos: [alvo],
      });
    }
    return e;
  }

  /**
   * Poção Ressonante: a morte anuncia a existência da Bruxa.
   *
   * Nem quem ela é, nem quem morreu por ela — só que existe uma. Numa mesa que
   * já tem lobos, saber que há mais um assassino muda toda a leitura do dia.
   */
  if (bruxa.varianteId === 'pocao-ressonante') {
    e = anunciar(e, 'Existe uma Bruxa na vila: ela usou a poção da morte esta noite.', 'role');
  }

  for (const alvo of atingidos) investidas.push({ alvo, atacanteId: bruxaId, causa: 'bruxa' });
  return e;
}
