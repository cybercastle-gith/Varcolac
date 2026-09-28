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
  descricaoCurta: 'Mata com a matilha.',
  descricaoLonga:
    'A matilha declara um alvo por noite na etapa 7; a morte só é decidida na etapa 8. ' +
    'No modo Traição a matilha é cega: nenhum lobo conhece nenhum outro.',
  variantes: [
    {
      id: 'rastro',
      nome: 'Rastro',
      descricao:
        'O alvo do ataque é revelado no início do dia e permanece vivo até o fim da ' +
        'votação, morrendo depois.',
      peso: 3,
      etapa: 'ataque',
    },
    {
      id: 'voto-de-sangue',
      nome: 'Voto de Sangue',
      descricao: 'Depois de participar de um ataque, o Lobo não pode votar no dia seguinte.',
      peso: 2,
    },
    {
      id: 'desgarrado',
      nome: 'Lobo Desgarrado',
      descricao:
        'Escolhe um alvo diferente dos demais Lobos e, se houver qualquer repetição, ' +
        'a matilha não mata ninguém.',
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
  descricaoCurta: 'Uma vez por partida, converte em vez de matar.',
  descricaoLonga: 'O convertido mantém a própria role e passa a jogar pelos lobos.',
  variantes: [
    {
      id: 'sangue-novo',
      nome: 'Sangue Novo',
      descricao:
        'O convertido mantém sua antiga habilidade durante a primeira noite em que ' +
        'agir como Lobo.',
      // 4 → 3: o Alfa base entrega um convertido que mantém a habilidade para
      // SEMPRE; este empresta por uma noite. Menos poder, mesmo peso, até aqui.
      peso: 3,
      etapa: 'ataque',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'sangue-marcado',
      nome: 'Sangue Marcado',
      descricao: 'Se o convertido morrer, a identidade do Alfa é revelada à Vila.',
      peso: 3,
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'treinamento',
      nome: 'Treinamento',
      descricao: 'O convertido só pode participar dos ataques depois que o Alfa morrer.',
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
  descricaoCurta: 'Uma vez por partida, o ataque da matilha atravessa curas e imunidades.',
  descricaoLonga:
    'Não é bloqueador — é perfurador. Perde para o Padre, que cancela a noite inteira ' +
    'em vez de proteger alguém em particular.',
  variantes: [
    {
      id: 'fio-de-prata',
      nome: 'Fio de Prata',
      descricao: 'A perfuração atravessa a proteção, mas não atravessa uma imunidade.',
      peso: 3,
      etapa: 'perfuracao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'marca-de-ferro',
      nome: 'Marca de Ferro',
      descricao: 'A perfuração impede o alvo de receber proteção pelo resto da partida.',
      peso: 3,
      etapa: 'perfuracao',
      usoLimitado: { kind: 'por-partida', total: 1 },
    },
    {
      id: 'olho-do-diabo',
      nome: 'Olho do Diabo',
      descricao:
        'A perfuração informa ao Feiticeiro se o alvo foi protegido ou curado e, se ' +
        'foi, por quem.',
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
  descricaoCurta: 'Ao ser morto, não morre na hora: mata alguém e só expira na noite seguinte.',
  descricaoLonga: 'Entra na cadeia de estertores e pode disparar outros.',
  variantes: [
    {
      id: 'morto-vivo',
      nome: 'Morto-Vivo',
      descricao:
        'Ao morrer, continua em jogo sem poder matar, votar ou agir, mas pode falar e ' +
        'ser morto novamente.',
      // 4 → 3: o Carniçal base leva alguém junto ao morrer. Este não leva
      // ninguém — troca uma morte por voz, e voz vale menos que uma morte.
      peso: 3,
    },
    {
      id: 'sangue-derramado',
      nome: 'Sangue Derramado',
      descricao:
        'Quando o Carniceiro morre, quem causou sua morte perde seu poder na noite ' + 'seguinte.',
      peso: 3,
    },
    {
      id: 'ultima-carne',
      nome: 'Última Carne',
      descricao:
        'Na noite após morrer, escolhe um jogador e, se ele morrer durante a noite ou ' +
        'o dia seguinte, o Carniceiro volta à vida.',
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
  descricaoCurta: 'Escolhe uma noite para ficar imune a investigação.',
  descricaoLonga:
    'Na noite seguinte, a matilha não mata. Pode errar o timing e queimar a imunidade à toa.',
  variantes: [
    {
      id: 'sombra-de-alguem',
      nome: 'Sombra de Alguém',
      descricao:
        'Escolhe um jogador e, na noite seguinte, utiliza o papel dele por uma noite, ' +
        'ficando imune à investigação se não tiver escolhido um Lobo.',
      peso: 3,
    },
    {
      id: 'mascara-de-luto',
      nome: 'Máscara de Luto',
      descricao:
        'Se nenhuma morte acontecer naquela noite, fica imune à investigação ' + 'automaticamente.',
      peso: 3,
    },
    {
      id: 'nome-roubado',
      nome: 'Nome Roubado',
      descricao:
        'Escolhe um jogador morto e, naquela noite, qualquer investigação contra o ' +
        'Lobo-Sombra retorna o papel desse morto.',
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
  descricaoCurta: 'Revela publicamente um lobo — ou a si mesmo.',
  descricaoLonga: 'Em troca, na noite seguinte a matilha mata dois.',
  variantes: [
    {
      id: 'uivo-comprado',
      nome: 'Uivo Comprado',
      descricao:
        'Revela publicamente um Lobo, mas o revelado ganha o direito de votar duas ' +
        'vezes no dia da revelação.',
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
        'Revela publicamente um Lobo, mas perde permanentemente o direito de votar ' +
        'pelo resto da partida.',
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
      descricao: 'Revela publicamente quantos Lobos ainda estão vivos, sem revelar seus nomes.',
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
  descricaoCurta: 'Mata lobos também. Pode vencer sozinho ou com a matilha.',
  descricaoLonga: 'Ataca em separado da matilha, na mesma etapa 7.',
  variantes: [
    {
      id: 'sangue-acumulado',
      nome: 'Sangue Acumulado',
      descricao:
        'Escolhe um Lobo em vez de matar e, se esse Lobo morrer, mata dois Aldeões na ' +
        'noite seguinte.',
      peso: 2,
      etapa: 'ataque',
    },
    {
      id: 'ultimo-da-matilha',
      nome: 'Último da Matilha',
      descricao:
        'Só pode matar um Lobo se houver exatamente ele e mais um Lobo vivos; com ' +
        'três ou mais Lobos, não pode realizar o ataque.',
      peso: 2,
      etapa: 'ataque',
    },
    {
      id: 'jejum-forcado',
      nome: 'Jejum Forçado',
      descricao:
        'Se a matilha matar um Aldeão, na noite seguinte o Lobo-Branco só pode matar ' + 'um Lobo.',
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
