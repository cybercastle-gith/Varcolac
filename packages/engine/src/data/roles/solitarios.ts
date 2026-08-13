import type { Role, RoleModifier } from '../../types/role';

/** As 6 roles solitárias + o modificador Amantes. */

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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
};

/** Amantes é modificador, não role: aplica-se sobre duas roles existentes. */
export const amantes: RoleModifier = {
  id: 'amantes',
  nome: 'Amantes',
  peso: 2,
  alvos: 2,
  descricao:
    'Cada amante mantém a própria role. Vencem se forem os dois últimos vivos.',
  variantes: [
    {
      id: 'amor-proibido',
      nome: 'Amor Proibido',
      descricao: 'Se um morre, o outro morre de tristeza.',
      peso: 2,
      etapa: 'estertores',
    },
    {
      id: 'amor-cego',
      nome: 'Amor Cego',
      descricao: 'Só um dos dois sabe do vínculo.',
      peso: 2,
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

export const MODIFICADORES: readonly RoleModifier[] = [amantes];
