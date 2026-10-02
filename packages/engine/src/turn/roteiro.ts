import type { ActionKind, NightStepId } from '../types/action';
import type { GameState } from '../types/game-state';
import { vivos, mortos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import type { InfoEntry } from '../types/info';
import { etapaEfetiva, type Role, type UsageLimit } from '../types/role';
import { role } from '../data/roles/index';
import { moduloAtivo } from '../data/ghosts';
import { MISSOES_POR_ID } from '../data/missions';
import { faccaoEfetiva } from './faccao';
import { efeitosDaRodada } from '../types/effect';
import { cotaDaMatilha } from '../resolution/steps/_ataques';
import { roleEfetivaId } from '../resolution/steps/_helpers';

/**
 * O que só este jogador sabe, em uma frase.
 *
 * Tudo isto já existia em `objetivosSecretos` e nada chegava à tela.
 */
function segredoDe(estado: GameState, p: Player): string | null {
  const bruto = estado.objetivosSecretos[p.id];
  if (!bruto) return null;

  /**
   * A missão não pergunta se você é Coringa.
   *
   * A variante Missão Partida entrega a segunda missão a um jogador qualquer
   * da mesa. Se a checagem exigisse `roleId === 'coringa'`, esse jogador teria
   * uma condição de vitória própria que ele nunca leria — exatamente o defeito
   * que a tela de segredo foi criada para resolver.
   */
  const missao = MISSOES_POR_ID.get(bruto);
  if (missao) {
    return p.roleId === 'coringa'
      ? `Sua missão: ${missao.texto}`
      : `Alguém te passou uma missão, e ela é sua agora: ${missao.texto}`;
  }

  if (p.roleId === 'bruxa') {
    return bruto === 'pocao-morte'
      ? 'Você ficou com a poção da MORTE. Um único uso.'
      : 'Você ficou com a poção da VIDA. Um único uso.';
  }

  if (p.roleId === 'vingador') {
    const alvo = estado.players.find((x) => x.id === bruto);
    return alvo ? `Você jurou vingança contra ${alvo.nome}.` : null;
  }

  if (bruto === 'convertido') return 'Você virou. Agora caça com a matilha.';
  if (bruto.startsWith('roubou a role de ')) return bruto;

  return null;
}

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
  | 'binaria'
  /**
   * Escolhe COMO agir e, dependendo da escolha, em quem.
   *
   * Existe porque três roles da matilha têm duas habilidades e só podem usar
   * uma por noite: o Feiticeiro atravessa a cura ou mata normal, o Alfa converte
   * ou mata, o Lobo Sombra se esconde da investigação ou mata. Antes o app
   * perguntava só a habilidade especial, e a alternativa — matar como qualquer
   * lobo — simplesmente não existia na tela.
   */
  | 'opcao-e-alvo';

export interface OpcaoDePergunta {
  readonly valor: string;
  readonly rotulo: string;
  /** Esta opção precisa de alvo? "Ficar imune" não precisa; "matar" precisa. */
  readonly pedeAlvo: boolean;
  /** A etapa em que ESTA opção age. Atravessar perfura; matar ataca. */
  readonly etapa: NightStepId;
}

export interface Pergunta {
  readonly playerId: PlayerId;
  readonly etapa: NightStepId | null;
  readonly kind: ActionKind;
  readonly tipo: TipoDePergunta;
  readonly titulo: string;
  readonly detalhe: string;
  /** Candidatos válidos. Vazio quando não há alvo a escolher. */
  readonly alvos: readonly PlayerId[];
  readonly opcoes?: readonly OpcaoDePergunta[];
  /**
   * Alvos específicos de uma opção, quando ela mira um grupo diferente.
   * O Uivador delata um LOBO; a mesma role, escolhendo caçar, mira fora da
   * matilha. Sem isto, a lista de alvos seria a mesma para as duas coisas.
   */
  readonly alvosPorOpcao?: Readonly<Record<string, readonly PlayerId[]>> | undefined;
  /** Pode pular sem escolher ninguém. */
  readonly opcional: boolean;
  /**
   * Por que não há nada a fazer — quando existe um motivo VERDADEIRO.
   *
   * Diferente do toque falso, que mente por necessidade. O Detetive Cansado só
   * age em noites ímpares, o embebedado do Taverneiro teve o poder anulado e o
   * preso do Xerife está na cela: os três recebiam a mesma tela de "a vila
   * dorme" que um Aldeão qualquer, e ficavam achando que o app tinha bugado.
   *
   * Só é mostrado a quem TEM o motivo, então não vaza nada: quem lê a mensagem
   * já sabia que tinha um poder.
   */
  readonly aviso?: string | undefined;
  /** Toque falso: existe para que quem tem poder não se revele pela chamada. */
  readonly falsa: boolean;
}

export interface Passagem {
  readonly player: Player;
  /** A role só é revelada na noite 1, embutida na mesma passagem. */
  readonly revelarRole: boolean;
  /** Companheiros que este jogador conhece (matilha, dupla). */
  readonly companheiros: readonly PlayerId[];
  readonly rotuloCompanheiros: string | null;
  readonly pergunta: Pergunta;
  /** Bilhetes e leituras que chegaram para ele desde a última passagem. */
  readonly recebido: readonly InfoEntry[];
  /**
   * O que só este jogador sabe: a missão do Coringa, a poção da Bruxa, a role
   * roubada pelo Ladrão.
   *
   * Existia em `objetivosSecretos` desde sempre e **nunca chegava à tela**. O
   * Coringa recebia uma missão sorteada que ele não tinha como ler: do ponto de
   * vista de quem joga, a role não fazia nada.
   */
  readonly segredo: string | null;
  /**
   * A carta na mão, para quem nunca age à noite.
   *
   * Bobo, Sobrevivente, Coringa e Aldeão passam a partida inteira recebendo
   * toque falso, e a função deles só aparece uma vez, na noite 1. Três noites
   * depois ninguém lembra se era Bobo ou Sobrevivente — e as duas jogam de
   * maneira oposta. Vem atrás do "segurar para revelar", como a carta.
   */
  readonly lembrete: string | null;
  /**
   * A carta deste jogador MUDOU e ele ainda não foi avisado.
   *
   * Seis mecânicas trocam o papel de alguém no meio da partida, e todas faziam
   * isso em silêncio: a pessoa pegava o aparelho na noite seguinte e a pergunta
   * era outra, sem uma palavra sobre por quê. Pedido do usuário em 2026-09-28:
   * "após a pessoa mudar de role, seja por qualquer motivo, até para aldeão,
   * deve aparecer uma tela especial antes da ação".
   *
   * A tela mostra isto ANTES da pergunta e consome a marca (ver
   * `marcarTrocaVista`) — aparece uma vez, e só para quem trocou.
   */
  readonly trocaDeCarta: Player['marcas']['viraCarta'];
}

/**
 * A carta na mão, para consulta — de TODO mundo.
 *
 * Nasceu só para quem nunca age (Bobo, Sobrevivente, Coringa, Aldeão), com o
 * receio de que dizer "você é o Padre" a um Padre sem usos o obrigasse a
 * esconder a tela. O receio não se sustenta desde que o lembrete virou uma
 * sobreposição que só abre quando o jogador TOCA: nada aparece sozinho, e o
 * botão é idêntico em todas as passagens — inclusive no toque falso.
 *
 * É essa uniformidade que protege o segredo. Um botão que aparecesse só para
 * algumas cartas entregaria, pela própria presença, quem tem poder e quem não
 * tem. Decisão do usuário em 2026-09-28.
 */
function lembreteDe(p: Player): string | null {
  const efetiva = roleEfetivaId(p);
  const r = role(efetiva);
  // Com poder emprestado, a variante é do dono da CARTA, não do poder.
  const variante =
    efetiva === p.roleId && p.varianteId
      ? r.variantes.find((v) => v.id === p.varianteId)
      : undefined;
  const nome = variante ? variante.nome : r.nome;
  const descricao = variante ? variante.descricao : r.descricaoLonga;
  return `${nome} — ${descricao}`;
}

/**
 * A suspensão de poderes da Anciã alcança este jogador?
 *
 * Espelha a checagem de `acoesDe` — e as duas PRECISAM concordar: se o roteiro
 * perguntar a quem a resolução vai descartar, o jogador gasta a noite à toa.
 */
function suspensaoAlcanca(estado: GameState, p: Player): boolean {
  const suspensao = efeitosDaRodada(estado.efeitos, estado.rodada).find(
    (e) => e.kind === 'poderes-suspensos',
  );
  if (!suspensao || suspensao.kind !== 'poderes-suspensos') return false;
  if (suspensao.exceto === p.id) return false;
  return suspensao.todos === true || role(roleEfetivaId(p)).faccao === 'vila';
}

/** Um jogador ainda tem uso disponível para a habilidade nesta noite? */
function podeAgir(estado: GameState, p: Player, r: Role, emprestado = false): boolean {
  /**
   * `usosRestantes` conta os usos da CARTA, não os do poder emprestado.
   *
   * Tanto a Incorporação quanto a Sombra de Alguém só existem depois de gastar
   * o único uso da carta original — o Necromante ressuscitou, o Lobo Sombra se
   * escondeu. Cobrar esse contador do poder emprestado zerava as duas
   * variantes no instante em que elas começavam a valer: o jogador recebia
   * toque falso na noite exata em que deveria agir com o poder novo.
   *
   * Quando o poder é emprestado, quem manda é o limite da role emprestada.
   */
  if (!emprestado && p.usosRestantes <= 0) return false;
  if (emprestado && r.usoLimitado.kind === 'por-partida' && p.usosRestantes <= 0) return false;
  /**
   * O limite da VARIANTE vem antes do da role.
   *
   * O Detetive Cansado só age em noites ímpares, e isso mora em
   * `variante.usoLimitado`. Lendo só `r.usoLimitado`, ele agia todas as noites
   * e a variante não existia — o mesmo valia para qualquer variante futura que
   * mude a frequência.
   */
  const variante = p.varianteId ? r.variantes.find((v) => v.id === p.varianteId) : undefined;
  const limite: UsageLimit = variante?.usoLimitado ?? r.usoLimitado;
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

  if (faccaoEfetiva(estado, p) === 'lobos' && estado.config.modo !== 'traicao') {
    // `faccaoEfetiva`: o convertido do Alfa passa a enxergar a matilha, que é
    // metade do valor de ter sido convertido.
    const matilha = estado.players
      .filter((x) => x.id !== p.id && faccaoEfetiva(estado, x) === 'lobos' && x.status === 'vivo')
      .map((x) => x.id);
    // O Lobo Branco joga contra a matilha, mas conhece ela.
    return { ids: matilha, rotulo: matilha.length > 0 ? 'A matilha' : 'Você caça sozinho' };
  }

  return { ids: [], rotulo: null };
}

/** Alvos válidos para a ação de uma role, já filtrados pela regra dela. */
function alvosValidos(
  estado: GameState,
  p: Player,
  r: Role,
  etapa: NightStepId,
  /** `undefined` quando o poder é emprestado: a variante é do dono da carta. */
  varianteAtiva = p.varianteId,
): PlayerId[] {
  const vivosAgora = vivos(estado).filter((x) => x.id !== p.id);
  const mortosAgora = mortos(estado);

  switch (r.id) {
    case 'aldeao':
      // Herdeiro escolhe um morto; Testemunha não escolhe ninguém.
      return varianteAtiva === 'herdeiro' ? mortosAgora.map((x) => x.id) : [];

    case 'padre':
      // O Exorcista benze um vivo; o Padre base e o Sino não miram ninguém.
      return varianteAtiva === 'exorcista' ? vivosAgora.map((x) => x.id) : [];

    case 'necromante':
      /**
       * A Última Vela alcança qualquer noite; as outras, só as anteriores.
       *
       * O filtro tem de ser igual ao da etapa 10. Oferecer aqui um morto que
       * a etapa recusa faria o Necromante queimar o único uso da partida.
       */
      return mortosAgora
        .filter((x) => varianteAtiva === 'ultima-vela' || (x.mortoNaRodada ?? 0) < estado.rodada)
        .map((x) => x.id);

    case 'vidente':
      return varianteAtiva === 'ossos' ? mortosAgora.map((x) => x.id) : vivosAgora.map((x) => x.id);

    case 'detetive':
      /**
       * O Obsessivo não escolhe de novo: o alvo travou na primeira noite.
       *
       * Devolver só o alvo travado é o que impede a tela de oferecer uma
       * escolha que a etapa 11 vai ignorar.
       */
      if (varianteAtiva === 'obsessivo' && p.marcas.alvoTravado) {
        return [p.marcas.alvoTravado];
      }
      return vivosAgora.map((x) => x.id);

    case 'medico':
      // O Curandeiro nunca repete alvo.
      if (varianteAtiva === 'curandeiro') {
        const jaCurados = new Set(
          estado.informacoes.filter((i) => i.paraId === p.id).flatMap((i) => i.sobre),
        );
        return vivosAgora.filter((x) => !jaCurados.has(x.id)).map((x) => x.id);
      }
      /**
       * Médico de Plantão: só quem foi atacado na noite passada.
       *
       * A marca é gravada na etapa 8 para todo alvo de ataque, tenha ele
       * morrido ou não — sem isso a lista viria vazia todas as noites.
       */
      if (varianteAtiva === 'de-plantao') {
        return vivosAgora
          .filter((x) => x.marcas.atacadoNaRodada === estado.rodada - 1)
          .map((x) => x.id);
      }
      return vivosAgora.map((x) => x.id);

    case 'xerife':
      // O Xerife de Si Mesmo é o único que pode aparecer na própria lista.
      return varianteAtiva === 'xerife-de-si-mesmo'
        ? vivos(estado).map((x) => x.id)
        : vivosAgora.map((x) => x.id);

    case 'taverneiro':
      // Última Dose: ninguém bebe duas vezes.
      return varianteAtiva === 'ultima-dose'
        ? vivosAgora.filter((x) => !x.marcas.jaEmbebedado).map((x) => x.id)
        : vivosAgora.map((x) => x.id);

    case 'ancia':
      // Testamento e Herança Amarga apontam um vivo, em vida.
      return vivosAgora.map((x) => x.id);

    case 'cacador':
      /*
       * O Caçador declara o tiro EM VIDA, sempre — e não só na Armadilha.
       *
       * "Ao morrer, leva alguém junto" num pass-and-play não tem como
       * perguntar: quando ele morre o celular já está com outra pessoa, e o
       * engine escolhia o primeiro vivo da lista. Ou seja: o Caçador nunca
       * escolheu nada. Decisão do usuário em 2026-09-26.
       */
      return vivosAgora.map((x) => x.id);

    case 'ladrao':
      /*
       * O Ladrão ESCOLHE de quem rouba, na noite 1.
       *
       * Era sorteado em `criarPartida`, em silêncio, e o jogador só descobria
       * depois qual carta tinha caído na mão dele. Escolher é a role inteira.
       *
       * Troca com Mortos é a exceção: ela mira um morto, em qualquer noite.
       */
      if (varianteAtiva === 'troca-com-mortos') return mortosAgora.map((x) => x.id);
      return estado.rodada === 1 ? vivosAgora.map((x) => x.id) : [];

    case 'lobo-carnical':
      /*
       * Serve às duas opções dele: caçar (a matilha é filtrada mais abaixo) e
       * marcar quem leva junto — que pode ser um lobo, porque cair levando um
       * companheiro é decisão dele.
       */
      return vivos(estado)
        .filter((x) => x.id !== p.id)
        .map((x) => x.id);

    case 'lobo-sombra':
      // Nome Roubado veste um morto; Sombra de Alguém veste um vivo.
      return varianteAtiva === 'nome-roubado'
        ? mortosAgora.map((x) => x.id)
        : vivosAgora.map((x) => x.id);

    case 'lobo-branco': {
      const lobos = vivosAgora.filter((x) => faccaoEfetiva(estado, x) === 'lobos');
      // Sangue Acumulado marca um LOBO em vez de matar qualquer um.
      if (varianteAtiva === 'sangue-acumulado') return lobos.map((x) => x.id);
      /**
       * Último da Matilha: só pode mirar lobo quando restam exatamente dois.
       *
       * Com três ou mais lobos vivos os companheiros somem da lista dele, o
       * que o obriga a caçar na vila — e é essa obrigação que o mantém útil à
       * matilha até o fim.
       */
      if (varianteAtiva === 'ultimo-da-matilha') {
        const total = vivos(estado).filter((x) => faccaoEfetiva(estado, x) === 'lobos').length;
        if (total !== 2) {
          return vivosAgora.filter((x) => faccaoEfetiva(estado, x) !== 'lobos').map((x) => x.id);
        }
      }
      // Jejum Forçado: a matilha comeu ontem, hoje ele só mata lobo.
      if (p.marcas.soLoboNaRodada === estado.rodada) return lobos.map((x) => x.id);
      return vivosAgora.map((x) => x.id);
    }

    default:
      break;
  }

  // A matilha não se ataca: o Lobo Branco é a exceção, e ele ataca sozinho.
  if (etapa === 'ataque' && faccaoEfetiva(estado, p) === 'lobos' && r.id !== 'lobo-branco') {
    return vivosAgora.filter((x) => faccaoEfetiva(estado, x) !== 'lobos').map((x) => x.id);
  }

  return vivosAgora.map((x) => x.id);
}

/** Texto da pergunta, por role. O app não escreve regra — ele mostra esta frase. */
function enunciado(
  r: Role,
  p: Player,
  varianteAtiva: string | undefined,
): { titulo: string; detalhe: string } {
  void p;
  const variante = varianteAtiva ? r.variantes.find((v) => v.id === varianteAtiva) : undefined;
  const detalhe = variante?.descricao ?? r.descricaoCurta;

  /**
   * Variantes que perguntam uma coisa DIFERENTE da role base.
   *
   * O título por role não serve quando a variante muda o verbo: perguntar "Quem
   * a matilha mata?" a um Lobo Sombra que vai vestir o papel de outro é uma
   * mentira de interface, e o jogador responde a pergunta errada.
   */
  const porVariante: Record<string, string> = {
    herdeiro: 'De quem você herda o poder?',
    testemunha: 'Pedir ao app que confirme que você é Aldeão?',
    'de-guerra': 'Quem você cura esta noite? Escolha dois.',
    'de-plantao': 'Quem foi atacado ontem e você quer salvar?',
    muralha: 'Quem você cobre? Escolha dois — basta um cair para você morrer.',
    'xerife-de-si-mesmo': 'Quem você prende? Pode ser você mesmo.',
    'ultima-vela': 'Quem você acende por um dia?',
    incorporacao: 'De quem você toma o poder?',
    testamento: 'Com quem fica o seu poder, se você morrer?',
    'heranca-amarga': 'Quem você arrasta junto, se morrer?',
    'sombra-de-alguem': 'De quem você veste o papel na próxima noite?',
    'nome-roubado': 'Qual nome de morto você veste?',
    'ultima-carne': 'Em quem você aposta para poder voltar?',
    'sangue-acumulado': 'Qual lobo você marca em vez de matar?',
    'bobo-da-forca': 'Marcar a votação de amanhã como a sua forca?',
    obsessivo: 'Quem você vigia — hoje e até o fim?',
  };
  if (varianteAtiva && porVariante[varianteAtiva]) {
    return { titulo: porVariante[varianteAtiva]!, detalhe };
  }

  const titulos: Record<string, string> = {
    vidente: 'Quem você quer enxergar?',
    detetive: 'Compare dois jogadores.',
    medico: 'Quem você protege esta noite?',
    'guarda-costas': 'Quem você protege com a própria vida?',
    xerife: 'Quem você prende esta noite?',
    taverneiro: 'Quem você embriaga?',
    necromante: 'Quem você traz de volta?',
    padre: 'Anular todas as mortes desta noite?',
    feiticeiro: 'Quem a matilha atravessa esta noite?',
    lobo: 'Quem a matilha mata?',
    alfa: 'Quem a matilha mata?',
    uivador: 'Quem a matilha mata?',
    'lobo-sombra': 'Sumir da investigação na próxima noite?',
    'lobo-carnical': 'Quem a matilha mata?',
    'lobo-branco': 'Quem você mata? Pode ser um lobo.',
    bruxa: 'Usar a sua poção em quem?',
    cacador: 'Deixe a armadilha armada em quem?',
  };

  return { titulo: titulos[r.id] ?? 'Sua vez.', detalhe };
}

/** Monta a pergunta de um jogador — ou o toque falso, que parece igual. */
function perguntarA(estado: GameState, p: Player): Pergunta {
  /**
   * A pergunta sai da role EFETIVA, não da carta.
   *
   * Três variantes emprestam poder — Incorporação (Necromante), Herdeiro
   * (Aldeão) e Sombra de Alguém (Lobo Sombra) — e todas as três gravavam a
   * marca sem que nada perguntasse por ela: o jogador recebia o aparelho com a
   * pergunta da carta antiga e o poder emprestado não acontecia nunca.
   *
   * A VARIANTE continua sendo a da carta original. Um Necromante que incorporou
   * um Médico age como Médico, e não como "Médico Curandeiro" — a variante é do
   * dono da carta, não do poder.
   */
  const efetiva = roleEfetivaId(p, estado.rodada);
  const r = role(efetiva);
  const emprestado = efetiva !== p.roleId;
  const varianteAtiva = emprestado ? undefined : p.varianteId;
  const etapa = etapaEfetiva(r, varianteAtiva);

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

  /** Mesma tela do toque falso, com o motivo verdadeiro escrito. */
  const impedido = (titulo: string, aviso: string): Pergunta => ({
    ...toqueFalso,
    titulo,
    detalhe: 'Você não age esta noite. Passe o aparelho adiante.',
    aviso,
    // NÃO é `falsa`: a tela mostra o ícone da função e o motivo, porque quem
    // está lendo já sabe que tem poder. Mentir aqui é que confundia.
    falsa: false,
  });

  /**
   * Bloqueio e cela, ditos com o nome da causa.
   *
   * A carta do Taverneiro diz que o alvo "não é avisado", e isso continua
   * verdade para a MESA — ninguém além dele descobre. Mas o jogador embebedado
   * precisa saber por que o app não deixa ele agir, senão a variante vira um
   * defeito aos olhos de quem joga. Decisão do usuário em 2026-09-26.
   */
  if (p.flags.preso) {
    return impedido('A cela.', 'Você foi preso pelo Xerife: não age esta noite.');
  }
  /**
   * Poderes suspensos pela Anciã: a tela DIZ, em vez de engolir a ação.
   *
   * `acoesDe` descartava a ação na resolução, então o jogador escolhia um
   * alvo, confirmava, gastava o uso na cabeça dele e nada acontecia — sem uma
   * palavra. É o mesmo tratamento que a matilha ganhou na noite sem sangue.
   */
  if (suspensaoAlcanca(estado, p)) {
    return impedido(
      'As forças não vêm.',
      'A Anciã morreu, e esta noite ninguém da vila consegue usar o que sabe.',
    );
  }

  if (p.flags.embriagado) {
    return impedido(
      'A cabeça pesa.',
      'Alguém te embebedou na noite passada: seu poder não funciona esta noite.',
    );
  }

  // Estertores são reação à morte, não ação da noite — só o Caçador Armadilha
  // declara antes, e é a exceção que confirma a regra.
  // O Vingador age na etapa `estado-inicial`, mas só na noite 1 — e é a única
  // role que realmente PERGUNTA nessa etapa.
  /*
   * Duas roles PERGUNTAM na etapa 1, e as duas só na noite 1: o Vingador jura
   * vingança e o Ladrão escolhe de quem rouba. Para todo o resto, `estado-inicial`
   * é arrumação interna e a resposta certa é o toque falso.
   */
  const escolheNaPrimeiraNoite = (r.id === 'vingador' || r.id === 'ladrao') && estado.rodada === 1;

  /**
   * O convertido caça — e esta checagem vem ANTES do corte por falta de etapa.
   *
   * Era o defeito por trás de "o modo Traição não converte ninguém". A
   * conversão acontecia certinho e parte dos convertidos nunca agia.
   *
   * O modo sorteia QUALQUER UM da vila. Quem caía com carta de ação noturna
   * (Vidente, Médico) chegava ao bloco de escolha dupla e caçava; quem caía sem
   * etapa — Aldeão, que é o recheio de todo baralho — batia no corte logo
   * abaixo e recebia toque falso. Nas noites em que o sorteio pegava um desses,
   * a matilha secreta simplesmente não mordia, e a mesa concluía, com razão,
   * que o modo não fazia nada.
   *
   * Quem tem carta COM etapa escolhe entre as duas coisas; quem não tem (o
   * Aldeão) só caça. Nos dois casos a facção vem de `faccaoEfetiva`, que lê a
   * marca `'convertido'`.
   */
  const convertido = estado.objetivosSecretos[p.id] === 'convertido';
  if (convertido && etapa !== 'ataque' && p.status === 'vivo') {
    const presas = vivos(estado)
      .filter((x) => x.id !== p.id && faccaoEfetiva(estado, x) !== 'lobos')
      .map((x) => x.id);

    if (presas.length > 0) {
      const alvosProprios = etapa ? alvosValidos(estado, p, r, etapa, varianteAtiva) : [];

      // Sem carta própria para usar (Aldeão convertido), sobra caçar.
      if (!etapa || alvosProprios.length === 0) {
        return {
          // `base` ainda não existe aqui: este bloco precisa vir ANTES do corte
          // por falta de etapa, e `base` é montado depois dele.
          playerId: p.id,
          falsa: false,
          etapa: 'ataque',
          titulo: 'Quem a matilha mata?',
          detalhe: 'Você virou. A fome agora é sua também.',
          kind: 'atacar',
          tipo: 'alvo',
          alvos: presas,
          opcional: false,
        };
      }

      return {
        playerId: p.id,
        falsa: false,
        etapa,
        titulo: 'O que você faz esta noite?',
        detalhe: 'Você virou. O poder antigo continua seu, mas a matilha também.',
        kind: 'atacar',
        tipo: 'opcao-e-alvo',
        alvos: presas,
        alvosPorOpcao: { proprio: alvosProprios, matar: presas },
        opcoes: [
          { valor: 'proprio', rotulo: `Usar seu poder de ${r.nome}`, pedeAlvo: true, etapa },
          { valor: 'matar', rotulo: 'Caçar com a matilha', pedeAlvo: true, etapa: 'ataque' },
        ],
        opcional: false,
      };
    }
  }

  if (!etapa || (etapa === 'estado-inicial' && !escolheNaPrimeiraNoite)) return toqueFalso;
  /**
   * A etapa `estertores` é reação à morte, não ação da noite — mas quatro
   * variantes declaram antes de morrer (ou depois): a Armadilha do Caçador, o
   * Testamento e a Herança Amarga da Anciã, e a Última Carne do Carniçal, que
   * é a única declarada por um jogador já morto.
   */
  const DECLARA_NO_ESTERTOR = ['armadilha', 'testamento', 'heranca-amarga', 'ultima-carne'];
  /*
   * O Caçador, em QUALQUER variante, declara o tiro em vida.
   *
   * Antes só a Armadilha declarava, e o Caçador base tinha o alvo escolhido pelo
   * engine — o primeiro vivo da lista. A carta diz "leva alguém junto" e quem
   * escolhe esse alguém tem de ser ele.
   */
  /*
   * O Carniçal VIVO saiu daqui: a etapa dele virou `ataque` e a marca virou a
   * segunda opção da noite. Morto, ele só volta se for a Última Carne.
   */
  const declaraNoEstertor = r.id === 'cacador' || DECLARA_NO_ESTERTOR.includes(varianteAtiva ?? '');
  if (etapa === 'estertores' && !declaraNoEstertor) return toqueFalso;

  /*
   * A Última Carne é a ÚNICA declarada depois de morrer.
   *
   * Vivo, ele estava sendo perguntado "em quem você aposta para poder voltar?"
   * — uma pergunta sem sentido para quem não morreu, e cuja resposta a etapa 9
   * descartava em silêncio. Gastava a passagem dele e não fazia nada.
   */
  if (varianteAtiva === 'ultima-carne' && p.status === 'vivo') return toqueFalso;
  /*
   * O Carniçal escolhe entre duas coisas — enquanto está VIVO.
   *
   * Morto, só a Última Carne o traz de volta ao roteiro, e aí ele tem uma
   * pergunta só: em quem apostar. Oferecer "caçar com a matilha" a um morto
   * seria uma opção que a etapa 7 descarta em silêncio.
   */
  const carnicalVivo = r.id === 'lobo-carnical' && p.status === 'vivo';
  /**
   * Quem escolhe ENTRE DUAS coisas não pode ser barrado por falta de uso.
   *
   * O Uivador faltava nesta lista, e o bloco de escolha dupla lá embaixo já o
   * incluía — só que nunca era alcançado. Gasto o uivo, `podeAgir` devolvia
   * falso e ele recebia "Já foi" **para sempre**: um lobo que entregou um
   * companheiro e, como castigo, nunca mais mordeu. Relatado assim: "não
   * consegue matar na noite seguinte depois de uivar".
   *
   * A regra destas cartas é justamente essa: o poder especial acaba, a caçada
   * continua. Quem entra aqui tem de estar nas DUAS listas.
   */
  const escolheEntreDuas =
    r.id === 'feiticeiro' ||
    r.id === 'alfa' ||
    r.id === 'lobo-sombra' ||
    r.id === 'uivador' ||
    carnicalVivo;
  if (!podeAgir(estado, p, r, emprestado) && !escolheEntreDuas) {
    /*
     * "Não pode agir" tem duas causas muito diferentes, e antes as duas caíam
     * na mesma tela muda.
     *
     * Noite de paridade errada (Detetive Cansado) é REGRA da carta e o jogador
     * tem de ler isso. Uso esgotado é história da partida, e ele sabe que
     * gastou. Nos dois casos o silêncio total fazia parecer defeito.
     */
    const limite = varianteAtiva
      ? (r.variantes.find((v) => v.id === varianteAtiva)?.usoLimitado ?? r.usoLimitado)
      : r.usoLimitado;
    if (limite.kind === 'noites-alternadas') {
      return impedido(
        'Hoje não.',
        `Você só age em noites ${limite.paridade === 'impar' ? 'ímpares' : 'pares'}. ` +
          `Esta é a noite ${estado.rodada}.`,
      );
    }
    if (p.usosRestantes <= 0 && r.usoLimitado.kind === 'por-partida') {
      return impedido('Já foi.', 'Você já gastou o seu poder nesta partida.');
    }
    return toqueFalso;
  }

  const { titulo, detalhe } = enunciado(r, p, varianteAtiva);
  const alvos = alvosValidos(estado, p, r, etapa, varianteAtiva);

  // Sem alvo possível, o toque falso é a resposta honesta.
  // O Padre base e o Lobo Sombra não miram ninguém, então a lista vazia é normal
  // para eles — menos para o Exorcista, que precisa de um nome.
  /*
   * Quem NÃO mira ninguém não pode cair no toque falso por falta de alvos.
   *
   * A lista era `padre` e `lobo-sombra`, escrita quando só esses dois existiam.
   * A Testemunha do Aldeão e o Bobo da Forca nasceram depois, também não miram
   * ninguém, e caíam aqui: o jogador recebia toque falso a partida inteira e o
   * único uso da carta dele nunca era oferecido.
   *
   * O critério agora é a PERGUNTA, e não uma lista de nomes: quem responde sim
   * ou não não precisa de alvo nenhum, e quem precisa, precisa.
   */
  const perguntaBinaria =
    (r.id === 'padre' && varianteAtiva !== 'exorcista') ||
    r.id === 'lobo-sombra' ||
    varianteAtiva === 'testemunha' ||
    varianteAtiva === 'bobo-da-forca';
  if (alvos.length === 0 && !perguntaBinaria) {
    /*
     * Sem alvo E sem ser binária: o motivo importa. O Médico de Plantão só
     * cura quem foi atacado ontem, e numa noite em que ninguém sobreviveu a um
     * ataque ele simplesmente não tem a quem ir — dizer isso é diferente de
     * fingir que ele não tem poder.
     */
    if (varianteAtiva === 'de-plantao') {
      return impedido(
        'Ninguém para atender.',
        'Você só pode curar quem foi atacado na noite passada, e não há ninguém nessa ' +
          'situação vivo esta noite.',
      );
    }
    if (varianteAtiva === 'curandeiro') {
      return impedido(
        'Não sobrou ninguém.',
        'Você já curou todo mundo uma vez, e não repete alvo.',
      );
    }
    if (varianteAtiva === 'ultima-dose') {
      return impedido('A adega secou.', 'Todo mundo já bebeu uma vez, e você não serve duas.');
    }
    if (
      r.id === 'necromante' ||
      varianteAtiva === 'ossos' ||
      varianteAtiva === 'troca-com-mortos'
    ) {
      return impedido('Ainda não há mortos.', 'Sua carta só funciona quando alguém já caiu.');
    }
    return toqueFalso;
  }

  const base = { playerId: p.id, etapa, falsa: false, titulo, detalhe };

  /**
   * Variantes que só pedem um sim ou um não.
   *
   * A Testemunha do Aldeão e o Bobo da Forca não miram ninguém: gastam o único
   * uso da partida sobre si mesmos, e a única decisão é o momento.
   */
  if (varianteAtiva === 'testemunha' || varianteAtiva === 'bobo-da-forca') {
    return {
      ...base,
      kind: 'marcar',
      tipo: 'binaria',
      alvos: [],
      opcoes: [
        { valor: 'sim', rotulo: 'Sim, agora', pedeAlvo: false, etapa: 'informacao' },
        { valor: 'nao', rotulo: 'Ainda não', pedeAlvo: false, etapa: 'informacao' },
      ],
      opcional: true,
    };
  }

  /**
   * Variantes que cobrem DOIS alvos de uma vez.
   *
   * O Médico de Guerra cura dois e paga com o anonimato; a Muralha cobre dois e
   * morre se qualquer um dos dois for atacado. As duas precisam do mesmo tipo
   * de tela que o Detetive, e nenhuma delas o recebia.
   */
  if (varianteAtiva === 'de-guerra' || varianteAtiva === 'muralha') {
    return { ...base, kind: 'proteger', tipo: 'dois-alvos', alvos, opcional: false };
  }

  // O Exorcista não é uma pergunta de sim ou não: ele aponta um nome.
  if (r.id === 'padre' && varianteAtiva !== 'exorcista') {
    return {
      ...base,
      kind: 'proteger',
      tipo: 'binaria',
      alvos: [],
      opcoes: [
        { valor: 'sim', rotulo: 'Sim', pedeAlvo: false, etapa: 'protecao' },
        { valor: 'nao', rotulo: 'Não, esta noite não', pedeAlvo: false, etapa: 'protecao' },
      ],
      opcional: true,
    };
  }

  /**
   * As três roles da matilha que escolhem ENTRE duas habilidades.
   *
   * Regra comum: a habilidade especial substitui a caçada daquela noite, não se
   * soma a ela — menos no Feiticeiro, cuja perfuração JÁ É o ataque (ele mata
   * atravessando). A cota da matilha continua sendo uma morte por noite, e dois
   * lobos em alvos diferentes vão a sorteio (ver `alvosDaMatilha`).
   */
  const alvosDeCaca = vivos(estado)
    .filter((x) => x.id !== p.id && role(x.roleId).faccao !== 'lobos')
    .map((x) => x.id);

  if (
    r.id === 'feiticeiro' ||
    r.id === 'alfa' ||
    r.id === 'lobo-sombra' ||
    r.id === 'uivador' ||
    carnicalVivo
  ) {
    const especial: OpcaoDePergunta =
      r.id === 'feiticeiro'
        ? {
            valor: 'atravessar',
            rotulo: 'Atravessar a cura (mata de uma vez)',
            pedeAlvo: true,
            etapa: 'perfuracao',
          }
        : r.id === 'alfa'
          ? { valor: 'converter', rotulo: 'Converter', pedeAlvo: true, etapa: 'ataque' }
          : r.id === 'lobo-carnical'
            ? {
                /*
                 * A marca é declarada EM VIDA e cobrada quando ele cair. A
                 * etapa é `estertores` porque é lá que ela é gravada — e de lá
                 * vira `marcas.levaJunto`, que atravessa as noites e sobrevive
                 * até a um linchamento.
                 */
                valor: 'marcar',
                rotulo: 'Marcar quem você leva junto ao cair',
                pedeAlvo: true,
                etapa: 'estertores',
              }
            : r.id === 'uivador'
              ? {
                  valor: 'uivar',
                  // O Uivo de Manada anuncia um NÚMERO: não há quem delatar.
                  rotulo:
                    varianteAtiva === 'uivo-de-manada'
                      ? 'Uivar: dizer quantos lobos restam'
                      : 'Uivar: delatar um lobo (ou você)',
                  pedeAlvo: varianteAtiva !== 'uivo-de-manada',
                  etapa: 'ataque',
                }
              : {
                  // A etapa é `protecao` porque é lá que o esconderijo é
                  // resolvido e o uso é gasto — ver `05-protecao.ts`. Ele NÃO
                  // vale nesta noite: entra em vigor na seguinte.
                  valor: 'esconder',
                  rotulo:
                    varianteAtiva === 'sombra-de-alguem'
                      ? 'Vestir o papel de alguém (vale amanhã)'
                      : varianteAtiva === 'nome-roubado'
                        ? 'Vestir o nome de um morto (vale amanhã)'
                        : 'Sumir da investigação (vale amanhã)',
                  /**
                   * Duas das três variantes MIRAM alguém, e a opção pedia alvo
                   * para nenhuma.
                   *
                   * Sombra de Alguém veste o papel de um vivo e Nome Roubado
                   * veste o nome de um morto — as duas leem `acao.alvos[0]` na
                   * etapa 5, e o alvo chegava sempre vazio. As duas caíam no
                   * ramo genérico e viravam o Lobo Sombra base: "não está
                   * funcionando", exatamente como foi relatado.
                   */
                  pedeAlvo:
                    varianteAtiva === 'sombra-de-alguem' || varianteAtiva === 'nome-roubado',
                  etapa: 'protecao',
                };

    // Poder de uma vez por partida já gasto: sobra caçar como qualquer lobo.
    const podeEspecial = podeAgir(estado, p, r, emprestado);
    const opcoes: OpcaoDePergunta[] = [
      ...(podeEspecial ? [especial] : []),
      { valor: 'matar', rotulo: 'Caçar com a matilha', pedeAlvo: true, etapa: 'ataque' },
    ];

    /**
     * O Uivador delata um LOBO — inclusive a si mesmo —, então a lista de
     * alvos dele é a matilha, e não a caça. As outras três caçam fora dela.
     */
    const matilhaViva = vivos(estado)
      .filter((x) => faccaoEfetiva(estado, x) === 'lobos')
      .map((x) => x.id);

    return {
      ...base,
      titulo: 'O que você faz esta noite?',
      kind: 'atacar',
      tipo: 'opcao-e-alvo',
      alvos: alvosDeCaca,
      alvosPorOpcao: r.id === 'uivador' ? { uivar: matilhaViva } : undefined,
      opcoes,
      opcional: false,
    };
  }

  /**
   * A Bruxa escolhe QUAL poção usar.
   *
   * O lado dela (vida = bem, morte = mal) era sorteado em `criarPartida` e
   * IMPOSTO: ela abria a carta e descobria que tinha a poção da morte sem ter
   * escolhido nada. Decisão do usuário em 2026-09-26 — ela escolhe, e a escolha
   * é o que define o lado, como a carta sempre prometeu ("escolhe no início
   * entre poção da vida ou da morte").
   *
   * A Poção Misteriosa continua sorteando de propósito: é a variante cujo ponto
   * é justamente ela não saber.
   */
  if (r.id === 'bruxa' && varianteAtiva !== 'pocao-misteriosa') {
    return {
      ...base,
      titulo: 'Qual poção você usa, e em quem?',
      kind: 'atacar',
      tipo: 'opcao-e-alvo',
      alvos,
      opcoes: [
        {
          valor: 'pocao-vida',
          rotulo: 'Poção da VIDA — salva o alvo',
          pedeAlvo: true,
          etapa: 'ataque',
        },
        {
          valor: 'pocao-morte',
          rotulo: 'Poção da MORTE — mata o alvo',
          pedeAlvo: true,
          etapa: 'ataque',
        },
      ],
      opcional: true,
    };
  }

  /**
   * Vingador: ele ESCOLHE o alvo, na noite 1.
   *
   * A etapa dele é `estado-inicial`, e o corte lá em cima devolve toque falso
   * para essa etapa — que é certo para todo mundo, menos para ele. Antes o alvo
   * era sorteado em silêncio no `criarPartida` e o jogador nunca decidia nada.
   */
  if (r.id === 'vingador') {
    return {
      ...base,
      titulo: 'Em quem você jurou vingança?',
      kind: 'marcar',
      tipo: 'alvo',
      alvos: vivos(estado)
        .filter((x) => x.id !== p.id)
        .map((x) => x.id),
      opcional: false,
    };
  }

  /**
   * Ladrão: ele aponta de quem rouba.
   *
   * A Troca Forçada embaralha DOIS outros sem mexer na própria carta, então ela
   * é a única que pede dois nomes.
   */
  if (r.id === 'ladrao' && etapa === 'estado-inicial') {
    return {
      ...base,
      titulo:
        varianteAtiva === 'troca-forcada'
          ? 'Quais duas cartas você troca entre si?'
          : varianteAtiva === 'contaminacao'
            ? 'Quem você contamina?'
            : 'De quem você rouba a carta?',
      kind: 'marcar',
      tipo: varianteAtiva === 'troca-forcada' ? 'dois-alvos' : 'alvo',
      alvos,
      opcional: false,
    };
  }

  if (r.id === 'detetive') {
    /*
     * Só o Detetive BASE compara dois.
     *
     * O Obsessivo vigia UMA pessoa e o Delegado revista UMA pessoa — as duas
     * cartas dizem isso, e as duas pediam dois alvos na tela porque herdavam a
     * pergunta da role base. O Obsessivo travava o alvo errado e o Delegado
     * anunciava a revista de um e ignorava o outro.
     */
    const umAlvoSo = varianteAtiva === 'obsessivo' || varianteAtiva === 'delegado';
    return {
      ...base,
      kind: 'comparar',
      tipo: umAlvoSo ? 'alvo' : 'dois-alvos',
      alvos,
      opcional: false,
    };
  }

  /**
   * Vidente Confusa: ela aponta DOIS nomes e uma das duas leituras é falsa.
   *
   * Pedia um alvo só, e a segunda visão era sorteada pelo engine — o que fazia
   * a carta ("duas visões por noite") ser metade escolha e metade acidente. Ela
   * escolhe os dois e recebe os dois na mesma passagem, sem saber qual mentiu.
   */
  if (r.id === 'vidente' && varianteAtiva === 'confusa') {
    return { ...base, kind: 'investigar', tipo: 'dois-alvos', alvos, opcional: false };
  }

  /**
   * Noite sem caçada: a matilha é AVISADA, e não perguntada.
   *
   * Com a opção "Noite 1 sem sangue" ligada (ou com Noite Sem Lua em vigor), a
   * cota é zero e a etapa 7 descarta tudo. O roteiro continuava pedindo um
   * alvo: o lobo escolhia alguém, confirmava, e não acontecia nada. Relatado
   * assim: "o lobisomem seleciona alguém pra matar mas nada acontece".
   */
  if (etapa === 'ataque' && faccaoEfetiva(estado, p) === 'lobos' && cotaDaMatilha(estado) === 0) {
    return impedido(
      'A matilha não caça hoje.',
      estado.config.semMorteNaPrimeiraNoite && estado.rodada === 1
        ? 'A mesa escolheu começar sem sangue: ninguém morre na primeira noite.'
        : 'Alguma coisa segurou a matilha esta noite.',
    );
  }

  /**
   * Cota maior que um: a matilha nomeia DOIS.
   *
   * Era por isso que a Lua Cheia "não funcionava". A cota subia para 2 e a
   * `cotaDaMatilha` respondia 2 corretamente — mas o roteiro pedia UM alvo por
   * lobo, e `alvosDaMatilha` só mata quem recebeu voto. Numa mesa com um lobo
   * só existia um nome votado, então morria um, e o evento parecia decorativo.
   */
  if (etapa === 'ataque' && faccaoEfetiva(estado, p) === 'lobos' && cotaDaMatilha(estado) > 1) {
    return {
      ...base,
      titulo: 'A matilha mata DOIS esta noite. Quem?',
      kind: 'atacar',
      tipo: 'dois-alvos',
      alvos,
      opcional: false,
    };
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

  /**
   * Quem recebe o aparelho esta noite.
   *
   * Vivos sempre. Mortos, quando há módulo de fantasma ativo — e o Carniçal com
   * Última Carne, que é a única role do jogo que declara uma ação estando
   * morta e não depende de módulo nenhum para isso.
   */
  const apostaDoCarnical = (p: Player) =>
    p.status === 'morto' && p.roleId === 'lobo-carnical' && p.varianteId === 'ultima-carne';

  return estado.players
    .filter(
      (p) => p.status === 'vivo' || apostaDoCarnical(p) || (fantasmasAtivos && p.usosRestantes > 0),
    )
    .map((p) => {
      const morto = p.status === 'morto' && !apostaDoCarnical(p);
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
        segredo: segredoDe(estado, p),
        lembrete: morto ? null : lembreteDe(p),
        trocaDeCarta: p.marcas.viraCarta,
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
