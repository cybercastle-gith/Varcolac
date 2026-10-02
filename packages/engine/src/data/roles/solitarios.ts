import type { Role } from '../../types/role';

/** As 6 roles solitárias. */

export const bruxa: Role = {
  id: 'bruxa',
  nome: 'Bruxa',
  faccao: 'solitario',
  alinhamento: 'definido-em-jogo',
  categoria: 'ataque',
  peso: 3,
  etapa: 'ataque',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta:
    'Você tem uma poção para usar uma vez: a da vida salva alguém, a da morte mata. ' +
    'A escolha define o seu lado.',
  descricaoLonga:
    'Você tem uma única poção. Quando decidir usá-la, escolha qual e em quem: a da ' +
    'vida salva a pessoa de um ataque naquela noite; a da morte mata. Escolher a ' +
    'vida coloca você do lado da vila; escolher a morte, do lado dos lobos. Você ' +
    'vence junto com esse lado.',
  variantes: [
    {
      id: 'pocao-compartilhada',
      nome: 'Poção Compartilhada',
      descricao:
        'A poção atinge a pessoa que você escolher e mais uma, sorteada pelo app. Você ' +
        'não fica sabendo quem foi a segunda.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'pocao-misteriosa',
      nome: 'Poção Misteriosa',
      descricao:
        'Você escolhe em quem usar a poção, mas não sabe se ela é de vida ou de morte. ' +
        'O app sorteia, e você descobre junto com todos.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'pocao-ressonante',
      nome: 'Poção Ressonante',
      descricao:
        'Quando você usa a poção da morte, o app anuncia que existe uma Bruxa na vila, ' +
        'sem dizer quem é nem quem foi atingido.',
      peso: 3,
      etapa: 'ataque',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const ladrao: Role = {
  id: 'ladrao',
  nome: 'Ladrão',
  faccao: 'solitario',
  alinhamento: 'herda',
  categoria: 'suporte',
  peso: 2,
  etapa: 'estado-inicial',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Na primeira noite, troque sua carta com a de outra pessoa.',
  descricaoLonga:
    'Na primeira noite, escolha uma pessoa: você fica com a carta dela, e ela fica ' +
    'com a de Ladrão. A partir daí, você joga pelo lado da carta que pegou.',
  variantes: [
    {
      id: 'troca-forcada',
      nome: 'Troca Forçada',
      descricao:
        'Na primeira noite, escolha duas outras pessoas: as cartas delas são trocadas ' +
        'entre si. A sua não muda.',
      peso: 2,
      etapa: 'estado-inicial',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'contaminacao',
      nome: 'Contaminação',
      descricao:
        'Na primeira noite, transforme uma pessoa em Ladrão. Se em algum momento todos ' +
        'os vivos forem Ladrões, você vence sozinho.',
      peso: 2,
      etapa: 'estado-inicial',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'troca-com-mortos',
      nome: 'Troca com Mortos',
      descricao:
        'Uma vez por partida, em qualquer noite em que já houver um morto, troque sua ' +
        'carta pela dele. Você passa a jogar com essa função e esse lado.',
      peso: 2,
      /*
       * NÃO é `estado-inicial`.
       *
       * A carta dizia "na noite 1", e na noite 1 não existe nenhum morto para
       * trocar: o baralho tem exatamente uma carta por pessoa e ninguém caiu
       * ainda. Decisão do usuário em 2026-09-26: ele age na noite que quiser,
       * menos enquanto não houver morto — o que faz dele um Ladrão que ESCOLHE,
       * e não um que sorteia às cegas antes de o jogo começar.
       */
      etapa: 'informacao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const coringa: Role = {
  id: 'coringa',
  nome: 'Coringa',
  faccao: 'solitario',
  alinhamento: 'puro',
  categoria: 'nenhuma',
  peso: 2,
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: true,
  descricaoCurta: 'Você recebe uma missão secreta. Se cumprir, vence.',
  descricaoLonga:
    'No começo da partida, o app sorteia uma missão secreta para você, como "morra ' +
    'durante uma noite" ou "nunca vote em ninguém". Se cumprir a missão, você ' +
    'vence.',
  variantes: [
    {
      id: 'missao-herdada',
      nome: 'Missão Herdada',
      descricao:
        'Se você morrer sem cumprir a missão, ela passa para a última pessoa que votou ' +
        'em você. Se essa pessoa cumprir, ela vence no seu lugar, sem nem saber que ' +
        'herdou.',
      peso: 2,
    },
    {
      id: 'missao-sem-volta',
      nome: 'Missão Sem Volta',
      descricao:
        'Sua missão tem prazo. Se o prazo passar sem você cumprir, você vira Aldeão ' +
        'comum.',
      peso: 2,
    },
    {
      id: 'missao-partida',
      nome: 'Missão Partida',
      descricao:
        'Você recebe duas missões: fica com uma, e a outra vai para uma pessoa ' +
        'sorteada, que vira um segundo Coringa e também pode vencer.',
      peso: 2,
    },
  ],
};

export const sobrevivente: Role = {
  id: 'sobrevivente',
  nome: 'Sobrevivente',
  faccao: 'solitario',
  alinhamento: 'puro',
  categoria: 'nenhuma',
  peso: 1,
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: true,
  descricaoCurta: 'Esteja vivo no fim da partida e você vence junto com quem vencer.',
  descricaoLonga:
    'Você não tem poder. Se estiver vivo quando a partida acabar, vence junto com o ' +
    'lado vencedor. Os lobos podem matar você como qualquer outra pessoa.',
  variantes: [
    {
      id: 'sobrevivente-invisivel',
      nome: 'Sobrevivente Invisível',
      descricao:
        'Enquanto ninguém votar em você, os ataques noturnos não atingem você. Basta um ' +
        'voto, em qualquer dia, para isso acabar.',
      peso: 1,
    },
    {
      id: 'sobrevivente-teimoso',
      nome: 'Sobrevivente Teimoso',
      descricao: 'Se a votação condenar você, você não morre.',
      // 1 → 2: imunidade ao linchamento SEM uso limitado. A vila pode gastar
      // dias inteiros de votação nele e não acontece nada.
      peso: 2,
    },
    {
      id: 'a-qualquer-custo',
      nome: 'A Qualquer Custo',
      descricao:
        'Se você sobreviver a um ataque noturno, passa a poder matar uma pessoa por ' +
        'noite.',
      // 1 → 2: um Sobrevivente que ganha ataque deixa de ser passivo. Peso 1 é
      // o do Sobrevivente que só existe na mesa.
      peso: 2,
      etapa: 'ataque',
    },
  ],
};

export const bobo: Role = {
  id: 'bobo',
  nome: 'Bobo',
  faccao: 'solitario',
  alinhamento: 'puro',
  categoria: 'nenhuma',
  peso: 1,
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: true,
  descricaoCurta:
    'Seu objetivo é ser condenado na votação. Se conseguir, você vence e a partida ' +
    'acaba.',
  descricaoLonga:
    'Você vence se a vila condenar você na votação, e a partida termina na hora. ' +
    'Você não pode votar em si mesmo. Se morrer de qualquer outro jeito, perde.',
  variantes: [
    {
      id: 'bobo-desesperado',
      nome: 'Bobo Desesperado',
      descricao:
        'Se passar duas votações seguidas sem receber nenhum voto, você perde o seu ' +
        'objetivo e vira Aldeão comum.',
      peso: 1,
    },
    {
      id: 'bobo-acusado',
      nome: 'Bobo Acusado',
      descricao:
        'Se você votar em alguém que também votou em você, os dois votos são anulados. ' +
        'Não vale na votação por placar.',
      peso: 1,
    },
    {
      id: 'bobo-da-forca',
      nome: 'Bobo da Forca',
      descricao:
        'Uma vez por partida, à noite, marque a votação do dia seguinte. Se receber ' +
        'pelo menos um voto nela, você vence. Se não receber nenhum, vira Aldeão comum.',
      // 1 → 2: vence com UM voto e sem precisar ser linchado, o que é muito
      // mais fácil que a condição do Bobo base.
      peso: 2,
      etapa: 'informacao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const vingador: Role = {
  id: 'vingador',
  nome: 'Vingador',
  faccao: 'solitario',
  alinhamento: 'bem',
  categoria: 'nenhuma',
  peso: 1,
  etapa: 'estado-inicial',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: true,
  descricaoCurta: 'Na primeira noite, escolha um alvo. Se ele morrer, você vence.',
  descricaoLonga:
    'Na primeira noite, escolha uma pessoa. Se ela morrer em qualquer momento da ' +
    'partida, por qualquer motivo, você vence. Depois da escolha, não precisa fazer ' +
    'mais nada.',
  variantes: [
    {
      id: 'laco-de-sangue',
      nome: 'Laço de Sangue',
      descricao: 'Se você morrer, seu alvo morre junto.',
      // 1 → 2: garante a vitória dele no pior cenário possível (morrer) e ainda
      // leva um jogador junto. É a variante mais forte do Vingador e pesava
      // como a mais fraca.
      peso: 2,
      // Sem `etapa` própria: o juramento continua sendo declarado na etapa 1,
      // na noite 1. O que muda é o efeito da morte dele, e efeito não é etapa.
    },
    {
      id: 'maldicao-do-vingador',
      nome: 'Maldição do Vingador',
      descricao: 'Enquanto você estiver vivo, nenhuma proteção funciona no seu alvo.',
      peso: 1,
      // Idem: a maldição age na etapa de proteção, mas quem age lá são os
      // protetores, não o Vingador. Ele continua jurando na noite 1.
    },
    {
      id: 'vinganca-da-praca',
      nome: 'Vingança da Praça',
      descricao: 'Você só vence se o seu alvo for condenado na votação.',
      // 1 → 0: é a única variante estritamente MAIS DIFÍCIL que a própria base
      // (o base vence com o alvo morto por qualquer causa) e vinha com o mesmo
      // peso. Ele ameaça menos a partida, então pesa menos.
      peso: 0,
    },
  ],
};

export const ROLES_SOLITARIOS: readonly Role[] = [
  bruxa,
  ladrao,
  coringa,
  sobrevivente,
  bobo,
  vingador,
];
