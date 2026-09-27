import type { Role } from '../../types/role';

/**
 * As 11 roles da vila. Pesos conforme a seção 5 do dossiê.
 * Aqui só existe DADO — nenhum comportamento. O comportamento vive nas etapas.
 */

export const aldeao: Role = {
  id: 'aldeao',
  nome: 'Aldeão',
  faccao: 'vila',
  categoria: 'nenhuma',
  peso: 0,
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Nenhuma habilidade. Só voz e voto.',
  descricaoLonga:
    'O Aldeão não age à noite. Recebe o celular e um toque falso, como todo mundo, ' +
    'para que quem tem poder não se revele pela chamada.',
  variantes: [
    {
      id: 'herdeiro',
      nome: 'Herdeiro',
      descricao: 'Uma vez por partida, herda a role de alguém que morreu.',
      peso: 2,
      // O Aldeão base não age à noite, então a variante precisa da própria
      // etapa — sem ela o roteiro devolvia toque falso e a herança não existia.
      etapa: 'informacao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'teimoso',
      nome: 'Teimoso',
      descricao: 'Não pode mudar o voto depois de declarado.',
      peso: 0,
    },
    {
      id: 'testemunha',
      nome: 'Testemunha',
      descricao: 'Uma vez por partida, o app confirma publicamente que ele é aldeão.',
      peso: 1,
      etapa: 'informacao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const vidente: Role = {
  id: 'vidente',
  nome: 'Vidente',
  faccao: 'vila',
  categoria: 'informacao',
  peso: 3,
  etapa: 'informacao',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Vê a facção de um jogador por noite. Perde o voto do dia seguinte.',
  descricaoLonga:
    'Ela não precisa se manifestar sobre o custo — o app simplesmente não conta o voto. ' +
    'A leitura usa o estado do início da noite: investigar quem morreu naquela noite ' +
    'ainda devolve a facção, para que a informação não vaze o resultado.',
  variantes: [
    { id: 'ossos', nome: 'Vidente dos Ossos', descricao: 'Só enxerga mortos.', peso: 1 },
    {
      id: 'espelho',
      nome: 'Vidente do Espelho',
      descricao: 'Vê a facção, e o alvo é avisado de que alguém o observou.',
      peso: 3,
    },
    {
      id: 'sonhos',
      nome: 'Vidente dos Sonhos',
      descricao: 'A visão chega uma noite depois.',
      peso: 2,
    },
    {
      id: 'confusa',
      nome: 'Vidente Confusa',
      descricao: 'Duas visões por noite — uma verdadeira, uma falsa. Não sabe qual é qual.',
      peso: 2,
    },
  ],
};

export const detetive: Role = {
  id: 'detetive',
  nome: 'Detetive',
  faccao: 'vila',
  categoria: 'informacao',
  peso: 3,
  etapa: 'informacao',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Compara dois jogadores: mesma facção ou não.',
  descricaoLonga: 'Não revela quais facções — apenas se coincidem.',
  variantes: [
    {
      id: 'obsessivo',
      nome: 'Obsessivo',
      // TODO: peso não consta no dossiê; mantido igual ao base até calibrar.
      descricao: 'Trava um alvo na noite 1. N1: facção · N2: role · N3: em quem votou.',
      peso: 3,
    },
    {
      id: 'cansado',
      nome: 'Cansado',
      descricao: 'Só age em noites ímpares.',
      peso: 2,
      usoLimitado: { kind: 'noites-alternadas', paridade: 'impar' },
    },
    {
      id: 'delegado',
      nome: 'Delegado',
      descricao: 'Revista pública: a mesa descobre se o alvo tem poder, mas não a facção.',
      peso: 3,
    },
  ],
};

export const medico: Role = {
  id: 'medico',
  nome: 'Médico',
  faccao: 'vila',
  categoria: 'protecao',
  peso: 3,
  etapa: 'protecao',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Protege um jogador por noite.',
  descricaoLonga:
    'A proteção só marca; a morte é decidida na etapa 8. Médico bloqueado não cura, ' +
    'e o Feiticeiro perfura a proteção.',
  variantes: [
    { id: 'curandeiro', nome: 'Curandeiro', descricao: 'Nunca pode repetir alvo.', peso: 2 },
    {
      id: 'de-guerra',
      nome: 'Médico de Guerra',
      descricao: 'Cura duas pessoas, mas amanhece publicamente revelado.',
      peso: 4,
    },
    {
      id: 'de-plantao',
      nome: 'Médico de Plantão',
      descricao: 'Só pode curar quem foi atacado na noite anterior.',
      peso: 2,
    },
  ],
};

export const guardaCostas: Role = {
  id: 'guarda-costas',
  nome: 'Guarda-costas',
  faccao: 'vila',
  categoria: 'protecao',
  peso: 3,
  etapa: 'protecao',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Morre no lugar do protegido.',
  descricaoLonga: 'Troca a própria vida pela do alvo quando o ataque acontece.',
  variantes: [
    {
      id: 'sacrificio',
      nome: 'Sacrifício',
      descricao: 'Morre no lugar do alvo e leva o atacante junto.',
      peso: 4,
    },
    {
      id: 'escudo',
      nome: 'Escudo',
      descricao: 'Absorve o ataque e morre uma noite depois.',
      peso: 3,
    },
    {
      id: 'muralha',
      nome: 'Muralha',
      descricao: 'Protege dois jogadores, mas se qualquer um for atacado, ele morre.',
      peso: 3,
    },
  ],
};

export const xerife: Role = {
  id: 'xerife',
  nome: 'Xerife',
  faccao: 'vila',
  categoria: 'bloqueio',
  peso: 3,
  etapa: 'bloqueio',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta:
    'Prende um jogador para a NOITE seguinte: ele não age e não morre. Continua falando.',
  descricaoLonga:
    'Prender o Médico anula a cura daquela noite — o Xerife pode atrapalhar a própria vila. ' +
    'A imunidade do preso é perfurável pelo Feiticeiro.',
  variantes: [
    {
      id: 'testemunha-da-cela',
      nome: 'Testemunha da Cela',
      descricao:
        'Prende um jogador, revela a prisão no dia seguinte, mantém o preso sem poder ' +
        'agir na segunda noite e o liberta no segundo dia revelando-o como Lobo ou ' +
        'Aldeão.',
      peso: 3,
      etapa: 'bloqueio',
    },
    {
      id: 'xerife-de-si-mesmo',
      nome: 'Xerife de Si Mesmo',
      descricao:
        'Pode prender a si próprio e fica imune a ataques e investigações naquela ' +
        'noite, mas não age nem vota no dia seguinte.',
      peso: 3,
      etapa: 'bloqueio',
    },
    {
      id: 'boca-calada',
      nome: 'Boca Calada',
      descricao: 'Prende um jogador normalmente, e o preso não fala nem vota no dia seguinte.',
      peso: 3,
      etapa: 'bloqueio',
    },
  ],
};

export const necromante: Role = {
  id: 'necromante',
  nome: 'Necromante',
  faccao: 'vila',
  categoria: 'suporte',
  peso: 4,
  etapa: 'ressurreicao',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Ressuscita um morto, uma vez por partida.',
  descricaoLonga:
    'Apenas mortes de noites anteriores. A ressurreição não desfaz estertores já ' +
    'disparados: se o Caçador atirou, o tiro vale.',
  variantes: [
    {
      id: 'cova-aberta',
      nome: 'Cova Aberta',
      descricao: 'Ressuscita um morto da noite anterior, mas ele volta sem sua habilidade.',
      peso: 3,
      etapa: 'ressurreicao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'ultima-vela',
      nome: 'Última Vela',
      descricao:
        'Ressuscita um morto de qualquer noite, mas ele morre novamente ao fim do ' + 'dia.',
      peso: 3,
      etapa: 'ressurreicao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'incorporacao',
      nome: 'Incorporação',
      descricao:
        'Ressuscita um morto e utiliza sua habilidade até o fim da partida sem mudar ' +
        'de facção ou de papel.',
      peso: 4,
      etapa: 'ressurreicao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const padre: Role = {
  id: 'padre',
  nome: 'Padre',
  faccao: 'vila',
  categoria: 'protecao',
  peso: 2,
  etapa: 'protecao',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Uma vez por partida, anula todas as mortes da noite.',
  descricaoLonga:
    'O Padre não protege ninguém: cancela a noite inteira. Por isso vence o Feiticeiro, ' +
    'que só perfura proteções individuais.',
  variantes: [
    {
      id: 'exorcista',
      nome: 'Exorcista',
      descricao:
        'Uma vez por partida, benze um jogador. Se for lobo, o lobo morre; se não for, ' +
        'o Padre perde a moral e vira Aldeão comum.',
      // Aposta tudo num nome: o Padre base garante uma noite sem mortes, e este
      // troca essa garantia pela chance de tirar um lobo — e pelo risco de sair
      // do jogo como Aldeão se errar. Por isso pesa mais que o Padre base.
      peso: 3,
      // `ataque`, e não `protecao`: a benza MATA, e a morte é resolvida na
      // etapa 8 junto com todas as outras.
      etapa: 'ataque',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'sino',
      nome: 'Sino da Igreja',
      descricao: 'Uma vez por partida, cancela a votação do dia seguinte.',
      peso: 2,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'martir',
      nome: 'Mártir',
      descricao:
        'Marca um protegido à noite. Se ele for condenado no dia seguinte, o Mártir morre ' +
        'no lugar, automaticamente — sem passagem de celular, sem revelação.',
      peso: 3,
    },
  ],
};

export const cacador: Role = {
  id: 'cacador',
  nome: 'Caçador',
  faccao: 'vila',
  categoria: 'passivo',
  peso: 2,
  etapa: 'estertores',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Ao morrer, leva alguém junto.',
  descricaoLonga: 'O tiro entra na cadeia de estertores e pode disparar outros estertores.',
  variantes: [
    {
      id: 'armadilha',
      nome: 'Armadilha',
      descricao: 'Declara o alvo à noite, antes de morrer. O tiro só dispara se ele morrer.',
      peso: 2,
    },
    {
      id: 'ultimo-uivo',
      nome: 'Último Uivo',
      descricao: 'Em vez de matar, revela publicamente a role de um jogador.',
      peso: 2,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'vingativo',
      nome: 'Vingativo',
      descricao: 'Só pode atirar em quem votou nele.',
      peso: 1,
    },
  ],
};

export const taverneiro: Role = {
  id: 'taverneiro',
  nome: 'Taverneiro',
  faccao: 'vila',
  categoria: 'bloqueio',
  peso: 1,
  etapa: 'bloqueio',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Embebeda um jogador: na noite seguinte o poder dele falha, e ele não é avisado.',
  descricaoLonga: 'Pode atrapalhar a própria vila — e frequentemente atrapalha.',
  variantes: [
    {
      id: 'ultima-dose',
      nome: 'Última Dose',
      descricao: 'Só pode embebedar jogadores que ainda não tenham sido embebedados.',
      peso: 1,
      etapa: 'bloqueio',
    },
    {
      id: 'ressaca-da-vila',
      nome: 'Ressaca da Vila',
      descricao:
        'O jogador embebedado só descobre na noite seguinte que sua ação foi ' + 'bloqueada.',
      peso: 2,
      etapa: 'bloqueio',
    },
    {
      id: 'bebida-forte',
      nome: 'Bebida Forte',
      descricao:
        'O alvo não pode agir nem votar até a próxima noite, quando pode repetir o ' +
        'mesmo tipo de ação duas vezes.',
      peso: 2,
      etapa: 'bloqueio',
    },
  ],
};

export const ancia: Role = {
  id: 'ancia',
  nome: 'Anciã',
  faccao: 'vila',
  categoria: 'passivo',
  // Peso +2, confirmado com o autor. É um passivo que a vila precisa proteger
  // de si mesma: se ela morrer por QUALQUER causa, a vila perde todos os
  // poderes por uma noite.
  peso: 2,
  etapa: 'estertores',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Se morrer por qualquer causa, a vila perde todos os poderes por uma noite.',
  descricaoLonga:
    'Inclui linchamento. É a razão pela qual revelar a Anciã cedo é perigoso para a vila.',
  variantes: [
    {
      id: 'testamento',
      nome: 'Testamento',
      descricao: 'Ao morrer, escolhe um jogador vivo para manter seu poder na noite seguinte.',
      peso: 3,
      // A escolha é declarada EM VIDA, na passagem: num pass-and-play o morto
      // não recebe mais o aparelho para escolher nada.
      etapa: 'estertores',
    },
    {
      id: 'luto-da-vila',
      nome: 'Luto da Vila',
      descricao: 'Se a Anciã morrer, todos os jogadores perdem seus poderes durante uma noite.',
      peso: 3,
    },
    {
      id: 'heranca-amarga',
      nome: 'Herança Amarga',
      descricao:
        'Escolhe um jogador à noite e, se a Anciã morrer, todos perdem seus poderes ' +
        'por uma noite e o escolhido vira Aldeão para sempre.',
      peso: 3,
      etapa: 'estertores',
    },
  ],
};

export const ROLES_VILA: readonly Role[] = [
  aldeao,
  vidente,
  detetive,
  medico,
  guardaCostas,
  xerife,
  necromante,
  padre,
  cacador,
  taverneiro,
  ancia,
];
