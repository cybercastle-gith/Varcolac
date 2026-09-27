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
  descricaoCurta: 'Escolhe no início entre poção da vida ou da morte. Um único uso.',
  descricaoLonga:
    'A escolha inicial define secretamente o lado: vida = do bem, morte = do mal. ' +
    'Vence com quem sobrar.',
  variantes: [
    {
      id: 'pocao-compartilhada',
      nome: 'Poção Compartilhada',
      descricao:
        'A poção escolhida pela Bruxa atinge dois jogadores escolhidos às cegas, sem ' +
        'que ela saiba quais serão atingidos.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'pocao-misteriosa',
      nome: 'Poção Misteriosa',
      descricao:
        'Escolhe usar a poção e um alvo, mas só descobre no momento da resolução se a ' +
        'poção era de vida ou de morte.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'pocao-ressonante',
      nome: 'Poção Ressonante',
      descricao:
        'Ao usar a poção de morte, revela publicamente que a Bruxa existe, sem ' +
        'revelar quem ela é nem quem foi o alvo.',
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
  descricaoCurta: 'Na noite 1 troca de role com outro jogador.',
  descricaoLonga:
    'Nenhum dos dois é avisado na hora. A troca é resolvida na atribuição, antes da ' +
    'primeira passagem do celular. Assume o alinhamento da role roubada.',
  variantes: [
    {
      id: 'troca-forcada',
      nome: 'Troca Forçada',
      descricao:
        'Na noite 1, escolhe dois jogadores e troca os papéis entre eles sem trocar o ' +
        'próprio.',
      peso: 2,
      etapa: 'estado-inicial',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'contaminacao',
      nome: 'Contaminação',
      descricao:
        'Na noite 1, transforma o alvo em outro Ladrão e, se todos os vivos forem ' +
        'Ladrões, o Ladrão original vence sozinho.',
      peso: 2,
      etapa: 'estado-inicial',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'troca-com-mortos',
      nome: 'Troca com Mortos',
      descricao:
        'Numa noite à sua escolha, troca seu papel pelo de um jogador morto e passa a ' +
        'jogar com ele. Precisa haver pelo menos um morto.',
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
  descricaoCurta: 'Recebe uma missão sorteada e secreta a cada partida.',
  descricaoLonga: 'Nunca é a mesma missão duas vezes.',
  variantes: [
    {
      id: 'missao-herdada',
      nome: 'Missão Herdada',
      descricao:
        'Se o Coringa morrer antes de cumprir a missão, ela passa para o último ' +
        'jogador que votou nele, que vence no lugar dele.',
      peso: 2,
    },
    {
      id: 'missao-sem-volta',
      nome: 'Missão Sem Volta',
      descricao:
        'Só vence se cumprir a missão antes do prazo definido pelo app e, depois ' +
        'disso, vira Aldeão comum.',
      peso: 2,
    },
    {
      id: 'missao-partida',
      nome: 'Missão Partida',
      descricao:
        'Recebe duas missões, escolhe uma e entrega a outra a um jogador aleatório, ' +
        'que vira um segundo Coringa e pode vencer sozinho.',
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
  descricaoCurta: 'Estar vivo no fim. Vence com qualquer vencedor.',
  descricaoLonga: 'Não é imune aos lobos.',
  variantes: [
    {
      id: 'sobrevivente-invisivel',
      nome: 'Sobrevivente Invisível',
      descricao:
        'Enquanto não receber nenhum voto durante o dia, não pode ser alvo de ataques ' +
        'noturnos.',
      peso: 1,
    },
    {
      id: 'sobrevivente-teimoso',
      nome: 'Sobrevivente Teimoso',
      descricao:
        'Se for escolhido para morrer pela votação da Vila, não morre e continua vivo ' +
        'na partida.',
      // 1 → 2: imunidade ao linchamento SEM uso limitado. A vila pode gastar
      // dias inteiros de votação nele e não acontece nada.
      peso: 2,
    },
    {
      id: 'a-qualquer-custo',
      nome: 'A Qualquer Custo',
      descricao:
        'Se sobreviver a uma tentativa de morte noturna, passa a poder matar um ' +
        'jogador à noite como um Lobo.',
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
  descricaoCurta: 'Ser linchado pela vila.',
  descricaoLonga: 'Não pode votar em si mesmo. Vencer encerra a partida na hora.',
  variantes: [
    {
      id: 'bobo-desesperado',
      nome: 'Bobo Desesperado',
      descricao:
        'Se passar duas votações seguidas sem receber nenhum voto, perde sua vitória ' +
        'própria e vira Aldeão comum.',
      peso: 1,
    },
    {
      id: 'bobo-acusado',
      nome: 'Bobo Acusado',
      descricao: 'Se votar em um jogador que também votar nele, os dois votos são anulados.',
      peso: 1,
    },
    {
      id: 'bobo-da-forca',
      nome: 'Bobo da Forca',
      descricao:
        'Escolhe uma noite para marcar a próxima votação e, se receber pelo menos um ' +
        'voto nessa votação, vence; caso contrário, vira Aldeão comum.',
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
  descricaoCurta: 'Escolhe um alvo na noite 1. Vence se ele morrer, por qualquer causa.',
  descricaoLonga: 'Vitória passiva — ele não precisa fazer mais nada depois de escolher.',
  variantes: [
    {
      id: 'laco-de-sangue',
      nome: 'Laço de Sangue',
      descricao:
        'Se o Vingador morrer por qualquer causa, seu alvo também morre ' + 'imediatamente.',
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
      descricao:
        'Enquanto o Vingador estiver vivo, seu alvo não pode ser protegido ou curado ' +
        'por nenhuma habilidade.',
      peso: 1,
      // Idem: a maldição age na etapa de proteção, mas quem age lá são os
      // protetores, não o Vingador. Ele continua jurando na noite 1.
    },
    {
      id: 'vinganca-da-praca',
      nome: 'Vingança da Praça',
      descricao: 'O Vingador só vence se seu alvo for morto pela votação da Vila.',
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
