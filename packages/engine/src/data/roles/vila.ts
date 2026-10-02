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
  descricaoCurta: 'Você não tem poder noturno. Sua força está na conversa e no voto.',
  descricaoLonga:
    'Você não age à noite. Quando o celular chegar, aparece uma tela de espera, ' +
    'igual à de todo mundo, para que ninguém descubra quem tem poder pelo tempo que ' +
    'cada um leva. De dia, você discute e vota.',
  variantes: [
    {
      id: 'herdeiro',
      nome: 'Herdeiro',
      descricao:
        'Uma vez por partida, à noite, escolha um morto: você passa a ter a carta dele, ' +
        'inclusive o lado. Vale a partir da noite seguinte.',
      peso: 2,
      // O Aldeão base não age à noite, então a variante precisa da própria
      // etapa — sem ela o roteiro devolvia toque falso e a herança não existia.
      etapa: 'informacao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'teimoso',
      nome: 'Teimoso',
      descricao:
        'Na votação, seu primeiro voto é o definitivo: depois de votar, você não pode ' +
        'mudar.',
      peso: 0,
    },
    {
      id: 'testemunha',
      nome: 'Testemunha',
      descricao:
        'Uma vez por partida, à noite, você pode pedir que o app confirme para todos, ' +
        'no amanhecer, que você é Aldeão.',
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
  descricaoCurta:
    'Toda noite, descubra se uma pessoa é lobo ou não. Em troca, seu voto não conta ' +
    'no dia seguinte.',
  descricaoLonga:
    'Toda noite, escolha uma pessoa: o app diz se ela é lobo ou da vila. A maioria ' +
    'dos solitários aparece como da vila. O preço é o voto: no dia seguinte, o seu ' +
    'não é contado, e você não precisa avisar ninguém. Se a pessoa morrer na mesma ' +
    'noite, você recebe a resposta assim mesmo.',
  variantes: [
    {
      id: 'ossos',
      nome: 'Vidente dos Ossos',
      descricao:
        'Você só consegue ler mortos: escolha alguém que já morreu e descubra se era lobo ' +
        'ou não. Se escolher um vivo, não vê nada.',
      peso: 1,
    },
    {
      id: 'espelho',
      nome: 'Vidente do Espelho',
      descricao:
        'Funciona como a Vidente comum, mas a pessoa investigada é avisada de que ' +
        'alguém a observou naquela noite.',
      peso: 3,
    },
    {
      id: 'sonhos',
      nome: 'Vidente dos Sonhos',
      descricao: 'Funciona como a Vidente comum, mas a resposta só chega na noite seguinte.',
      peso: 2,
    },
    {
      id: 'confusa',
      nome: 'Vidente Confusa',
      descricao:
        'Toda noite, escolha duas pessoas e receba uma resposta para cada. Uma das duas ' +
        'é falsa, e você não sabe qual.',
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
  descricaoCurta: 'Toda noite, compare duas pessoas e descubra se elas estão do mesmo lado.',
  descricaoLonga:
    'Toda noite, escolha duas pessoas. O app diz se as duas estão do mesmo lado ou ' +
    'não, mas não diz que lado é esse.',
  variantes: [
    {
      id: 'obsessivo',
      nome: 'Obsessivo',
      // TODO: peso não consta no dossiê; mantido igual ao base até calibrar.
      descricao:
        'Na sua primeira noite, escolha uma pessoa: você fica preso a ela até o fim. Na ' +
        '1ª noite, descobre o lado dela; na 2ª, a função; na 3ª, o que ela fez na noite ' +
        'anterior.',
      peso: 3,
    },
    {
      id: 'cansado',
      nome: 'Cansado',
      descricao: 'Você só age nas noites ímpares: 1, 3, 5 e assim por diante.',
      peso: 2,
      usoLimitado: { kind: 'noites-alternadas', paridade: 'impar' },
    },
    {
      id: 'delegado',
      nome: 'Delegado',
      descricao:
        'Em vez de comparar duas pessoas, você revista uma, e o app anuncia para todos ' +
        'no amanhecer se ela é lobo ou da vila. Você tem um uso para cada quatro ' +
        'jogadores na mesa.',
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
  descricaoCurta: 'Toda noite, proteja uma pessoa. Se ela for atacada, sobrevive.',
  descricaoLonga:
    'Toda noite, escolha uma pessoa para proteger. Se ela for atacada naquela ' +
    'noite, sobrevive. Se você estiver preso ou embriagado, a proteção não ' +
    'acontece. O ataque especial do Feiticeiro atravessa a sua proteção.',
  variantes: [
    {
      id: 'curandeiro',
      nome: 'Curandeiro',
      descricao: 'Você não pode proteger a mesma pessoa duas vezes na partida.',
      peso: 2,
    },
    {
      id: 'de-guerra',
      nome: 'Médico de Guerra',
      descricao:
        'Você pode proteger duas pessoas por noite. Na noite em que proteger duas, o ' +
        'app revela para todos, no amanhecer, que você é o Médico.',
      peso: 4,
    },
    {
      id: 'de-plantao',
      nome: 'Médico de Plantão',
      descricao: 'Você só pode proteger quem foi atacado na noite anterior.',
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
  descricaoCurta: 'Toda noite, escolha uma pessoa. Se ela for atacada, você morre no lugar dela.',
  descricaoLonga:
    'Toda noite, escolha uma pessoa. Se ela for atacada, quem morre é você, e ela ' +
    'sobrevive. O ataque especial do Feiticeiro passa por você: nesse caso, ela ' +
    'morre e você não.',
  variantes: [
    {
      id: 'sacrificio',
      nome: 'Sacrifício',
      descricao: 'Quando você morre no lugar de alguém, quem atacou morre junto.',
      peso: 4,
    },
    {
      id: 'escudo',
      nome: 'Escudo',
      descricao:
        'Quando você recebe um ataque no lugar de alguém, não morre na hora: morre na ' +
        'noite seguinte.',
      peso: 3,
    },
    {
      id: 'muralha',
      nome: 'Muralha',
      descricao:
        'Você protege duas pessoas por noite. Se qualquer uma delas for atacada, você ' +
        'morre no lugar dela.',
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
  descricaoCurta: 'Prenda uma pessoa. Na noite seguinte, ela não usa o poder e não pode morrer.',
  descricaoLonga:
    'Toda noite, escolha uma pessoa para prender. A prisão vale na noite seguinte: ' +
    'nessa noite, ela não usa o poder e não pode ser morta. De dia, ela continua ' +
    'falando e votando. Cuidado: prender o Médico também cancela a proteção dele. O ' +
    'ataque especial do Feiticeiro mata mesmo quem está preso.',
  variantes: [
    {
      id: 'testemunha-da-cela',
      nome: 'Testemunha da Cela',
      descricao:
        'Funciona como o Xerife comum. No amanhecer em que a prisão termina, o app ' +
        'anuncia para todos se o preso é lobo ou da vila.',
      peso: 3,
      etapa: 'bloqueio',
    },
    {
      id: 'xerife-de-si-mesmo',
      nome: 'Xerife de Si Mesmo',
      descricao:
        'Você pode prender a si mesmo. Na noite em que estiver preso, ninguém consegue ' +
        'matar nem investigar você, mas você não age e não vota.',
      peso: 3,
      etapa: 'bloqueio',
    },
    {
      id: 'boca-calada',
      nome: 'Boca Calada',
      descricao:
        'Funciona como o Xerife comum, e o preso também não pode falar nem votar no dia ' +
        'seguinte à noite em que ficou preso.',
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
  descricaoCurta: 'Uma vez por partida, traga de volta à vida alguém que morreu.',
  descricaoLonga:
    'Uma vez por partida, à noite, escolha alguém que morreu antes desta noite. ' +
    'Essa pessoa ressuscita e volta ao jogo com a mesma função. O que a morte dela ' +
    'já causou continua valendo: se ela era o Caçador e já atirou, o tiro não é ' +
    'desfeito.',
  variantes: [
    {
      id: 'cova-aberta',
      nome: 'Cova Aberta',
      descricao: 'A pessoa ressuscita, mas como Aldeão comum: perde a função que tinha.',
      peso: 3,
      etapa: 'ressurreicao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'ultima-vela',
      nome: 'Última Vela',
      descricao:
        'Você pode ressuscitar qualquer morto, inclusive quem morreu nesta mesma noite. ' +
        'Mas ele morre de novo no fim do dia seguinte.',
      peso: 3,
      etapa: 'ressurreicao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'incorporacao',
      nome: 'Incorporação',
      descricao:
        'Em vez de ressuscitar alguém, você vira a carta de um morto: fica com a função ' +
        'dele e com o lado dele até o fim da partida. O morto continua morto.',
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
  descricaoCurta: 'Uma vez por partida, impeça todas as mortes de uma noite.',
  descricaoLonga:
    'Uma vez por partida, à noite, você pode decidir que ninguém morre nesta noite. ' +
    'Vale contra qualquer ataque, inclusive o do Feiticeiro.',
  variantes: [
    {
      id: 'exorcista',
      nome: 'Exorcista',
      descricao:
        'Uma vez por partida, escolha uma pessoa. Se ela for lobo, morre, a não ser que ' +
        'esteja protegida. Se não for, você perde o poder e vira Aldeão comum.',
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
      descricao: 'Uma vez por partida, à noite, você cancela a votação do dia seguinte.',
      peso: 2,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'martir',
      nome: 'Mártir',
      descricao:
        'Toda noite, escolha uma pessoa. Se ela for condenada na votação do dia ' +
        'seguinte, você morre no lugar dela, sem precisar fazer nada.',
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
  descricaoCurta: 'Toda noite, marque uma pessoa. Quando você morrer, ela morre junto.',
  descricaoLonga:
    'Toda noite, você marca uma pessoa. Quando você morrer, de noite ou na votação, ' +
    'a última pessoa que você marcou morre junto. Se não tiver marcado ninguém, o ' +
    'app escolhe por você.',
  variantes: [
    {
      id: 'armadilha',
      nome: 'Armadilha',
      descricao:
        'Toda noite, você arma a armadilha em uma pessoa. Se você for atacado à noite, ' +
        'não morre: quem morre é a pessoa da armadilha. Nem o Feiticeiro desarma.',
      peso: 2,
    },
    {
      id: 'ultimo-uivo',
      nome: 'Último Uivo',
      descricao:
        'Quando você morrer, em vez de matar a pessoa marcada, o app revela a função ' +
        'dela para todos.',
      peso: 2,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'vingativo',
      nome: 'Vingativo',
      descricao:
        'Quando você morrer, só pode levar junto alguém que votou em você na última ' +
        'votação. Se ninguém votou, você morre sozinho.',
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
  descricaoCurta:
    'Embriague uma pessoa. Na noite seguinte, o poder dela falha, e ela não fica ' +
    'sabendo.',
  descricaoLonga:
    'Toda noite, escolha uma pessoa para embriagar. Na noite seguinte, o poder dela ' +
    'não funciona: ela age normalmente, nada acontece, e o app não avisa. Você pode ' +
    'acabar atrapalhando alguém da própria vila.',
  variantes: [
    {
      id: 'ultima-dose',
      nome: 'Última Dose',
      descricao: 'Você não pode embriagar a mesma pessoa duas vezes na partida.',
      peso: 1,
      etapa: 'bloqueio',
    },
    {
      id: 'ressaca-da-vila',
      nome: 'Ressaca da Vila',
      descricao: 'A pessoa embriagada descobre que o poder falhou, mas só uma noite depois.',
      peso: 2,
      etapa: 'bloqueio',
    },
    {
      id: 'bebida-forte',
      nome: 'Bebida Forte',
      descricao:
        'A pessoa embriagada não vota no dia seguinte e não age na noite seguinte. Na ' +
        'noite depois dessa, ela age duas vezes.',
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
  descricaoCurta: 'Se você morrer, por qualquer motivo, a vila fica sem poderes na noite seguinte.',
  descricaoLonga:
    'Se você morrer, de noite ou na votação, ninguém da vila consegue usar o poder ' +
    'na noite seguinte. Os lobos continuam atacando normalmente. Por isso, revelar ' +
    'quem você é coloca a vila em risco.',
  variantes: [
    {
      id: 'testamento',
      nome: 'Testamento',
      descricao:
        'Toda noite, escolha uma pessoa. Se você morrer, ela é a única da vila que ' +
        'mantém o poder na noite sem poderes.',
      peso: 3,
      // A escolha é declarada EM VIDA, na passagem: num pass-and-play o morto
      // não recebe mais o aparelho para escolher nada.
      etapa: 'estertores',
    },
    {
      id: 'luto-da-vila',
      nome: 'Luto da Vila',
      descricao:
        'Se você morrer, ninguém usa poder na noite seguinte: nem a vila, nem os lobos. ' +
        'Ninguém é atacado.',
      peso: 3,
    },
    {
      id: 'heranca-amarga',
      nome: 'Herança Amarga',
      descricao:
        'Toda noite, escolha uma pessoa. Se você morrer, ninguém usa poder na noite ' +
        'seguinte, nem os lobos, e a pessoa escolhida vira Aldeão comum para sempre.',
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
