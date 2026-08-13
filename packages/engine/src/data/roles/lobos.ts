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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
};

export const loboCarnical: Role = {
  id: 'lobo-carnical',
  nome: 'Lobo Carniçal',
  faccao: 'lobos',
  categoria: 'passivo',
  peso: 4,
  etapa: 'estertores',
  usoLimitado: { kind: 'por-partida', total: 1 },
  vitoriaPropria: false,
  descricaoCurta: 'Ao ser morto, não morre na hora: mata alguém e só expira na noite seguinte.',
  descricaoLonga: 'Entra na cadeia de estertores e pode disparar outros.',
  variantes: [],
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
  variantes: [],
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
  variantes: [],
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
  variantes: [],
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
