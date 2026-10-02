import type { Role } from '../../types/role';

/** As 7 roles da matilha. */

export const lobo: Role = {
  id: 'lobo',
  nome: 'Lobo',
  faccao: 'lobos',
  categoria: 'ataque',
  peso: 3,
  etapa: 'ataque',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: false,
  descricaoCurta: 'Toda noite, você e os outros lobos escolhem uma pessoa para matar.',
  descricaoLonga:
    'Toda noite, a matilha escolhe uma vítima. Se os lobos apontarem pessoas ' +
    'diferentes, o app sorteia entre elas. Uma proteção pode salvar a vítima. No ' +
    'modo Traição, nenhum lobo sabe quem são os outros.',
  variantes: [
    {
      id: 'rastro',
      nome: 'Rastro',
      descricao:
        'A vítima do ataque não morre na hora. No amanhecer, todos ficam sabendo quem ' +
        'foi atacado; essa pessoa participa do dia e morre depois da votação.',
      peso: 3,
      etapa: 'ataque',
    },
    {
      id: 'voto-de-sangue',
      nome: 'Voto de Sangue',
      descricao: 'Na noite em que você participa de um ataque, perde o voto do dia seguinte.',
      peso: 2,
    },
    {
      id: 'desgarrado',
      nome: 'Lobo Desgarrado',
      descricao:
        'Você escolhe sua vítima separado dos outros lobos. Se dois lobos escolherem a ' +
        'mesma pessoa, ninguém morre naquela noite.',
      peso: 2,
      etapa: 'ataque',
    },
  ],
};

export const alfa: Role = {
  id: 'alfa',
  nome: 'Alfa',
  faccao: 'lobos',
  categoria: 'ataque',
  peso: 4,
  etapa: 'ataque',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Uma vez por partida, em vez de matar, transforme a vítima em lobo.',
  descricaoLonga:
    'Toda noite, você caça com a matilha. Uma vez por partida, pode converter ' +
    'alguém em vez de caçar: essa pessoa vira um Lobo comum e passa a jogar pela ' +
    'matilha.',
  variantes: [
    {
      id: 'sangue-novo',
      nome: 'Sangue Novo',
      descricao:
        'O convertido mantém a função antiga por uma noite e pode usá-la a favor da ' +
        'matilha. Depois disso, vira Lobo comum.',
      // 4 → 3: o Alfa base entrega um convertido que mantém a habilidade para
      // SEMPRE; este empresta por uma noite. Menos poder, mesmo peso, até aqui.
      peso: 3,
      etapa: 'ataque',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'sangue-marcado',
      nome: 'Sangue Marcado',
      descricao: 'Se o convertido morrer, o app revela para todos que foi você quem o converteu.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'treinamento',
      nome: 'Treinamento',
      descricao:
        'Enquanto você estiver vivo, o convertido acompanha a matilha, mas não decide ' +
        'quem morre.',
      peso: 3,
      etapa: 'ataque',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const feiticeiro: Role = {
  id: 'feiticeiro',
  nome: 'Feiticeiro',
  faccao: 'lobos',
  categoria: 'suporte',
  peso: 4,
  etapa: 'perfuracao',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Uma vez por partida, mate alguém mesmo que essa pessoa esteja protegida.',
  descricaoLonga:
    'Toda noite, você caça com a matilha. Uma vez por partida, pode atacar sozinho ' +
    'uma pessoa: nem o Médico, nem o Guarda-costas, nem a prisão do Xerife a ' +
    'salvam. Só o Padre, que impede todas as mortes da noite, consegue evitar.',
  variantes: [
    {
      id: 'fio-de-prata',
      nome: 'Fio de Prata',
      descricao:
        'Seu ataque especial atravessa o Médico e o Guarda-costas, mas não mata quem ' +
        'está preso pelo Xerife.',
      peso: 3,
      etapa: 'perfuracao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'marca-de-ferro',
      nome: 'Marca de Ferro',
      descricao:
        'A pessoa que você atacar com o ataque especial fica marcada: até o fim da ' +
        'partida, nenhuma proteção funciona nela.',
      peso: 3,
      etapa: 'perfuracao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'olho-do-diabo',
      nome: 'Olho do Diabo',
      descricao:
        'Ao usar o ataque especial, você descobre se a pessoa estava protegida naquela ' +
        'noite e por quem.',
      peso: 3,
      etapa: 'perfuracao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const loboCarnical: Role = {
  id: 'lobo-carnical',
  nome: 'Lobo Carniçal',
  faccao: 'lobos',
  categoria: 'ataque',
  peso: 4,
  /*
   * `ataque`, e não `estertores`.
   *
   * Ele é um LOBO, e com a etapa em `estertores` nunca recebia a pergunta de
   * ataque: era um lobo que não mordia, e o voto dele na matilha não existia.
   * Levantado em três sessões seguidas e decidido pelo usuário em 2026-09-28.
   *
   * A marca de quem ele leva junto continua existindo — agora é a segunda
   * opção da noite dele (ver o roteiro), como nas outras cartas da matilha que
   * escolhem entre duas coisas.
   */
  etapa: 'ataque',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta:
    'Toda noite, marque uma pessoa. Quando você for morto, ela morre, e você só sai ' +
    'do jogo na noite seguinte.',
  descricaoLonga:
    'Toda noite, escolha entre caçar com a matilha ou marcar uma pessoa. Quando ' +
    'você for morto, de noite ou na votação, a última pessoa marcada morre, e você ' +
    'ainda fica no jogo até a noite seguinte. Se não tiver marcado ninguém, o app ' +
    'escolhe por você.',
  variantes: [
    {
      id: 'morto-vivo',
      nome: 'Morto-Vivo',
      descricao:
        'Na primeira vez que morre, você não sai do jogo: continua à mesa, conta como ' +
        'lobo e pode falar, mas não ataca, não vota e não usa poder. Na segunda morte, ' +
        'sai de vez. Você não leva ninguém junto.',
      // 4 → 3: o Carniçal base leva alguém junto ao morrer. Este não leva
      // ninguém — troca uma morte por voz, e voz vale menos que uma morte.
      peso: 3,
    },
    {
      id: 'sangue-derramado',
      nome: 'Sangue Derramado',
      descricao:
        'Quando alguém mata você à noite, você não leva ninguém junto, mas essa pessoa ' +
        'perde o poder na noite seguinte. Se você for condenado na votação, nada ' +
        'acontece.',
      peso: 3,
    },
    {
      id: 'ultima-carne',
      nome: 'Última Carne',
      descricao:
        'Quando você morre, não leva ninguém junto. Na noite seguinte, você aposta em ' +
        'uma pessoa: se ela morrer naquela noite ou no dia seguinte, você ressuscita.',
      peso: 4,
      etapa: 'estertores',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
  ],
};

export const loboSombra: Role = {
  id: 'lobo-sombra',
  nome: 'Lobo Sombra',
  faccao: 'lobos',
  categoria: 'suporte',
  peso: 3,
  etapa: 'protecao',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Uma vez por partida, fique escondido das investigações por uma noite.',
  descricaoLonga:
    'Toda noite, você caça com a matilha. Uma vez por partida, pode se esconder em ' +
    'vez de caçar: na noite seguinte, quem investigar você vai ver "da vila".',
  variantes: [
    {
      id: 'sombra-de-alguem',
      nome: 'Sombra de Alguém',
      descricao:
        'Em vez de se esconder, escolha uma pessoa: na noite seguinte, você usa a ' +
        'função dela. Se ela não for lobo, você também fica escondido das investigações ' +
        'nessa noite.',
      peso: 3,
    },
    {
      id: 'mascara-de-luto',
      nome: 'Máscara de Luto',
      descricao:
        'O esconderijo só funciona se ninguém morrer na noite em que você o usar. Se ' +
        'funcionar, na noite seguinte quem investigar você vai ver "da vila".',
      peso: 3,
    },
    {
      id: 'nome-roubado',
      nome: 'Nome Roubado',
      descricao:
        'Em vez de se esconder, escolha um morto. Na noite seguinte, quem investigar ' +
        'você recebe a resposta que receberia sobre esse morto.',
      peso: 3,
    },
  ],
};

export const uivador: Role = {
  id: 'uivador',
  nome: 'Uivador',
  faccao: 'lobos',
  categoria: 'suporte',
  peso: 3,
  etapa: 'ataque',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta:
    'Uma vez por partida, revele um lobo para todos. Em troca, a matilha mata duas ' +
    'pessoas na noite seguinte.',
  descricaoLonga:
    'Toda noite, você caça com a matilha. Uma vez por partida, pode uivar em vez de ' +
    'caçar: escolha um lobo, que pode ser você, e o app anuncia no amanhecer que ' +
    'ele é lobo. Em troca, na noite seguinte a matilha mata duas pessoas.',
  variantes: [
    {
      id: 'uivo-comprado',
      nome: 'Uivo Comprado',
      descricao:
        'O lobo revelado vota duas vezes no dia da revelação. A matilha não ganha a ' +
        'segunda morte.',
      peso: 3,
      // A etapa é `ataque`, como a do Uivador base: o uivo SUBSTITUI a caçada
      // da noite e é resolvido lá. Estas três estavam marcadas como
      // `informacao`, e com isso a tela nunca oferecia a escolha entre uivar e
      // caçar — a variante inteira ficava inalcançável.
      etapa: 'ataque',
    },
    {
      id: 'uivo-de-troca',
      nome: 'Uivo de Troca',
      descricao:
        'Ao uivar, você perde o direito de votar até o fim da partida. A matilha não ' +
        'ganha a segunda morte.',
      peso: 3,
      // A etapa é `ataque`, como a do Uivador base: o uivo SUBSTITUI a caçada
      // da noite e é resolvido lá. Estas três estavam marcadas como
      // `informacao`, e com isso a tela nunca oferecia a escolha entre uivar e
      // caçar — a variante inteira ficava inalcançável.
      etapa: 'ataque',
    },
    {
      id: 'uivo-de-manada',
      nome: 'Uivo de Manada',
      descricao:
        'Em vez de revelar um nome, o app anuncia quantos lobos ainda estão vivos. A ' +
        'matilha não ganha a segunda morte.',
      peso: 3,
      // A etapa é `ataque`, como a do Uivador base: o uivo SUBSTITUI a caçada
      // da noite e é resolvido lá. Estas três estavam marcadas como
      // `informacao`, e com isso a tela nunca oferecia a escolha entre uivar e
      // caçar — a variante inteira ficava inalcançável.
      etapa: 'ataque',
    },
  ],
};

export const loboBranco: Role = {
  id: 'lobo-branco',
  nome: 'Lobo Branco',
  faccao: 'lobos',
  categoria: 'ataque',
  // Vale menos para a matilha porque joga contra ela.
  peso: 2,
  etapa: 'ataque',
  usoLimitado: { kind: 'ilimitado' },
  vitoriaPropria: true,
  descricaoCurta:
    'Você ataca sozinho e pode matar lobos. Vence com a matilha, ou sozinho se for ' +
    'o último lobo.',
  descricaoLonga:
    'Toda noite, você escolhe sua vítima separado da matilha, e ela pode ser um ' +
    'lobo. Você vence junto com a matilha, ou sozinho se for o único lobo vivo ' +
    'quando os lobos vencerem.',
  variantes: [
    {
      id: 'sangue-acumulado',
      nome: 'Sangue Acumulado',
      descricao:
        'Em vez de matar, você pode marcar um lobo. Quando esse lobo morrer, por ' +
        'qualquer motivo, você mata duas pessoas na noite seguinte.',
      peso: 2,
      etapa: 'ataque',
    },
    {
      id: 'ultimo-da-matilha',
      nome: 'Último da Matilha',
      descricao:
        'Você só pode matar um lobo quando restarem apenas você e mais um lobo vivos. ' +
        'Antes disso, só ataca quem não é lobo.',
      peso: 2,
      etapa: 'ataque',
    },
    {
      id: 'jejum-forcado',
      nome: 'Jejum Forçado',
      descricao:
        'Se a matilha matar alguém numa noite, na noite seguinte você só pode atacar ' +
        'lobos.',
      peso: 2,
      etapa: 'ataque',
    },
  ],
};

export const ROLES_LOBOS: readonly Role[] = [
  lobo,
  alfa,
  feiticeiro,
  loboCarnical,
  loboSombra,
  uivador,
  loboBranco,
];
