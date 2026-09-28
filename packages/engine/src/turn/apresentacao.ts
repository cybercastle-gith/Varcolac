import type { Player } from '../types/player';
import type { RoleId } from '../types/role';

/**
 * Como cada carta se APRESENTA na passagem do celular.
 *
 * O app desenhava as 97 cartas com a mesma tela: um ícone, um título, uma lista
 * de nomes e um botão "Confirmar". A Vidente enxergando, o Lobo mordendo e o
 * Padre cancelando a noite inteira eram o mesmo formulário com o texto trocado.
 * Pedido do usuário em 2026-09-28: "quero que você deixe o jogo mais integrado
 * com as roles e variantes, não algo genérico para todas".
 *
 * Isto NÃO é vinte e quatro telas feitas à mão — seria impossível de manter e
 * garantiria que uma carta nova nascesse feia. É um punhado de eixos que mudam
 * o comportamento da mesma tela, e o conjunto deles faz cada carta parecer
 * outra coisa:
 *
 * - **verbo** — o botão diz o que aquela carta FAZ. "Morder", "Enxergar",
 *   "Trancar". "Confirmar" é o verbo de um formulário, não de uma mordida.
 * - **atmosfera** — uma frase curta antes da pergunta, no tom da carta. É o que
 *   separa receber o aparelho como Médico de receber como Lobo.
 * - **acento** — a cor que domina a tela. Sangue para quem mata, Cera para quem
 *   enxerga, Índigo para quem some.
 * - **pesado** — o gesto de confirmar pede uma segunda batida. Matar, converter
 *   e delatar não podem sair de um toque distraído no nome errado.
 *
 * Mora no ENGINE, e não no app, pela mesma razão que o roteiro mora: é regra de
 * apresentação da carta, e duas cópias divergiriam. O app desenha o que este
 * módulo descreve.
 */

export type AcentoDaCarta = 'sangue' | 'cera' | 'indigo' | 'folha' | 'ferrugem';

export interface ApresentacaoDaCarta {
  /** O verbo do botão de confirmar. Sem reticências, sem "Confirmar". */
  readonly verbo: string;
  /** Uma linha de clima, lida antes da pergunta. */
  readonly atmosfera: string;
  readonly acento: AcentoDaCarta;
  /**
   * Confirmar pede uma segunda batida.
   *
   * Reservado ao que não tem volta: matar, converter, delatar, queimar o único
   * uso da partida. Pôr isto em tudo transformaria a proteção numa formalidade
   * que todo mundo aprende a atravessar sem ler.
   */
  readonly pesado: boolean;
}

/** O que cada FUNÇÃO faz, por padrão. As variantes ajustam por cima. */
const POR_ROLE: Readonly<Record<RoleId, ApresentacaoDaCarta>> = {
  aldeao: {
    verbo: 'Dormir',
    atmosfera: 'Você não tem poder nenhum. Tem voz, e ela basta para muita coisa.',
    acento: 'ferrugem',
    pesado: false,
  },
  vidente: {
    verbo: 'Enxergar',
    atmosfera: 'A visão custa o seu voto de amanhã. Escolha com isso em mente.',
    acento: 'cera',
    pesado: false,
  },
  detetive: {
    verbo: 'Comparar',
    atmosfera: 'Você não descobre o que eles são. Descobre se são a mesma coisa.',
    acento: 'cera',
    pesado: false,
  },
  medico: {
    verbo: 'Curar',
    atmosfera: 'Você não saberá se salvou alguém. Só a matilha vai saber.',
    acento: 'folha',
    pesado: false,
  },
  'guarda-costas': {
    verbo: 'Cobrir',
    atmosfera: 'Você não impede o golpe. Você o recebe no lugar dele.',
    acento: 'folha',
    pesado: true,
  },
  xerife: {
    verbo: 'Trancar',
    atmosfera: 'A cela segura qualquer um — inclusive quem está do seu lado.',
    acento: 'ferrugem',
    pesado: false,
  },
  necromante: {
    verbo: 'Chamar de volta',
    atmosfera: 'Uma vez. Depois a cova fica fechada pelo resto da partida.',
    acento: 'indigo',
    pesado: true,
  },
  padre: {
    verbo: 'Rezar',
    atmosfera: 'Você não protege ninguém: você cancela a noite inteira.',
    acento: 'folha',
    pesado: true,
  },
  cacador: {
    verbo: 'Mirar',
    atmosfera: 'O tiro não sai agora. Sai quando você cair.',
    acento: 'sangue',
    pesado: false,
  },
  taverneiro: {
    verbo: 'Servir',
    atmosfera: 'Ele não vai saber que bebeu. Vai só descobrir que não consegue agir.',
    acento: 'ferrugem',
    pesado: false,
  },
  ancia: {
    verbo: 'Deixar dito',
    atmosfera: 'Enquanto você viver, nada acontece. A sua carta age na sua morte.',
    acento: 'indigo',
    pesado: false,
  },
  lobo: {
    verbo: 'Morder',
    atmosfera: 'A matilha decide junta. Se vocês se dividirem, a sorte escolhe.',
    acento: 'sangue',
    pesado: true,
  },
  alfa: {
    verbo: 'Morder',
    atmosfera: 'Você pode fazer um lobo em vez de um corpo. Uma vez só.',
    acento: 'sangue',
    pesado: true,
  },
  feiticeiro: {
    verbo: 'Atravessar',
    atmosfera: 'Nenhuma cura segura o que você atravessa. Menos a do Padre.',
    acento: 'sangue',
    pesado: true,
  },
  'lobo-carnical': {
    verbo: 'Marcar',
    atmosfera: 'Quando te matarem, você ainda leva alguém pelo caminho.',
    acento: 'sangue',
    pesado: false,
  },
  'lobo-sombra': {
    verbo: 'Sumir',
    atmosfera: 'A Vidente vai olhar para você e ver um aldeão qualquer.',
    acento: 'indigo',
    pesado: false,
  },
  uivador: {
    verbo: 'Uivar',
    atmosfera: 'Entregar um lobo é caro. Às vezes é o que salva os outros.',
    acento: 'sangue',
    pesado: true,
  },
  'lobo-branco': {
    verbo: 'Caçar',
    atmosfera: 'Você caça sozinho, e a matilha também é caça.',
    acento: 'sangue',
    pesado: true,
  },
  bruxa: {
    verbo: 'Derramar',
    atmosfera: 'Um frasco, uma noite. O que você escolher define o seu lado.',
    acento: 'folha',
    pesado: true,
  },
  ladrao: {
    verbo: 'Roubar',
    atmosfera: 'A carta que você levar será sua até o fim — com o lado dela junto.',
    acento: 'ferrugem',
    pesado: true,
  },
  coringa: {
    verbo: 'Guardar',
    atmosfera: 'A sua vitória não tem nada a ver com lobos.',
    acento: 'cera',
    pesado: false,
  },
  sobrevivente: {
    verbo: 'Aguentar',
    atmosfera: 'Ganhe quem ganhar, você ganha junto. Basta estar de pé.',
    acento: 'ferrugem',
    pesado: false,
  },
  bobo: {
    verbo: 'Provocar',
    atmosfera: 'Você quer a corda. Convencê-los disso é o jogo inteiro.',
    acento: 'cera',
    pesado: false,
  },
  vingador: {
    verbo: 'Jurar',
    atmosfera: 'Escolha um nome. Se ele cair, por qualquer mão, você venceu.',
    acento: 'sangue',
    pesado: true,
  },
};

/**
 * As variantes que mudam o TOM, e não só a regra.
 *
 * Só entram aqui as que mudariam o que o jogador sente ao pegar o aparelho —
 * uma variante que muda um detalhe de alcance herda a apresentação da função,
 * e isso é correto: ela é a mesma carta com um ajuste.
 */
const POR_VARIANTE: Readonly<Record<string, Partial<ApresentacaoDaCarta>>> = {
  ossos: {
    verbo: 'Ouvir os mortos',
    atmosfera: 'Os vivos não te dizem nada. Os mortos, sim.',
    acento: 'indigo',
  },
  sonhos: {
    verbo: 'Sonhar',
    atmosfera: 'Você vai dormir com a pergunta. A resposta chega amanhã.',
    acento: 'indigo',
  },
  confusa: {
    verbo: 'Enxergar os dois',
    atmosfera: 'Duas visões, e uma delas mente. Nem você vai saber qual.',
  },
  espelho: { verbo: 'Espiar', atmosfera: 'Quem você olhar vai sentir o olhar.' },
  delegado: {
    verbo: 'Revistar',
    atmosfera: 'A mesa inteira vai ouvir o resultado. Inclusive ele.',
    pesado: true,
  },
  obsessivo: {
    verbo: 'Vigiar',
    atmosfera: 'Uma pessoa, todas as noites, até o fim. Escolha bem.',
    pesado: true,
  },
  'de-guerra': {
    verbo: 'Operar',
    atmosfera: 'Você salva dois e amanhece sem disfarce. A matilha vai saber quem você é.',
    pesado: true,
  },
  martir: { verbo: 'Marcar', atmosfera: 'Se a corda pegar nele, ela pega em você.' },
  sino: { verbo: 'Tocar o sino', atmosfera: 'Amanhã ninguém julga ninguém.' },
  exorcista: {
    verbo: 'Benzer',
    atmosfera: 'Se for lobo, ele cai. Se não for, você deixa de ser Padre.',
    acento: 'folha',
    pesado: true,
  },
  armadilha: {
    verbo: 'Armar',
    atmosfera: 'Quem entrar na sua casa não sai. E você fica de pé.',
  },
  'ultimo-uivo': { verbo: 'Denunciar', atmosfera: 'Em vez de um corpo, um nome.' },
  'sombra-de-alguem': {
    verbo: 'Vestir',
    atmosfera: 'Amanhã você acorda sendo outra pessoa.',
    acento: 'indigo',
    pesado: true,
  },
  'nome-roubado': {
    verbo: 'Roubar o nome',
    atmosfera: 'Quem te investigar vai encontrar um morto no seu lugar.',
    acento: 'indigo',
  },
  'uivo-de-manada': {
    verbo: 'Uivar',
    atmosfera: 'Um número, e nenhum nome. Deixe que eles imaginem.',
  },
  'pocao-misteriosa': {
    verbo: 'Derramar às cegas',
    atmosfera: 'Você não sabe o que tem no frasco. Vai descobrir com todo mundo.',
    pesado: true,
  },
  'troca-forcada': {
    verbo: 'Embaralhar',
    atmosfera: 'Dois deles vão trocar de vida sem nunca saber.',
  },
  contaminacao: { verbo: 'Contaminar', atmosfera: 'Ele vai acordar sendo o que você é.' },
  herdeiro: {
    verbo: 'Herdar',
    atmosfera: 'A carta dele passa a ser sua — com o lado dela junto.',
    acento: 'indigo',
    pesado: true,
  },
  testemunha: {
    verbo: 'Pedir a prova',
    atmosfera: 'O app vai confirmar, em voz alta, que você é aldeão. Uma vez só.',
    pesado: true,
  },
  'bobo-da-forca': {
    verbo: 'Marcar a forca',
    atmosfera: 'Amanhã é o seu dia. Um voto basta — nenhum te apaga.',
    pesado: true,
  },
  'laco-de-sangue': {
    verbo: 'Jurar',
    atmosfera: 'Se você cair, ele cai junto. Não há como desfazer.',
    pesado: true,
  },
};

/** Como esta carta se apresenta ao jogador que está com o aparelho. */
export function apresentacaoDaCarta(
  roleId: RoleId,
  varianteId?: string | undefined,
): ApresentacaoDaCarta {
  const base = POR_ROLE[roleId] ?? {
    verbo: 'Confirmar',
    atmosfera: 'Sua vez.',
    acento: 'ferrugem' as const,
    pesado: false,
  };
  const ajuste = varianteId ? POR_VARIANTE[varianteId] : undefined;
  return ajuste ? { ...base, ...ajuste } : base;
}

/** Atalho para quem já tem o jogador na mão. */
export function apresentacaoDe(p: Player): ApresentacaoDaCarta {
  return apresentacaoDaCarta(p.roleId, p.varianteId);
}
