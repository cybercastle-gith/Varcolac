import type { GameEvent } from '../../types/event';

/**
 * Família 1 — por sorte. Sorteados no início da noite, na etapa 2.
 * Visibilidade varia de propósito: alguns são narrados, outros acontecem em
 * silêncio, e é essa mistura que impede a mesa de deduzir o evento pelo efeito.
 */
export const EVENTOS_SORTE: readonly GameEvent[] = [
  {
    id: 'nevoa-cerrada',
    nome: 'Névoa Cerrada',
    familia: 'sorte',
    visibilidade: 'silencioso',
    narracao: 'Névoa: a Vidente não vê nada na próxima noite.',
    efeitos: [{ kind: 'silencia-role', roleIds: ['vidente'] }],
    descricao: 'A Vidente escolhe normalmente, mas não recebe resposta.',
  },
  {
    id: 'lua-cheia',
    nome: 'Lua Cheia',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Lua cheia: os lobos matam duas pessoas na próxima noite.',
    efeitos: [{ kind: 'matilha-mata-n', n: 2 }],
    descricao: 'A matilha escolhe duas vítimas em vez de uma.',
  },
  {
    id: 'noite-sem-lua',
    nome: 'Noite Sem Lua',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Noite sem lua: os lobos não atacam na próxima noite.',
    efeitos: [{ kind: 'matilha-mata-n', n: 0 }],
    descricao: 'A matilha não mata ninguém.',
  },
  {
    id: 'chuva-de-sangue',
    nome: 'Chuva de Sangue',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Chuva de sangue: nenhuma proteção funciona na próxima noite.',
    efeitos: [{ kind: 'anula-protecoes' }],
    descricao: 'Médico, Guarda-costas e qualquer outra proteção não salvam ninguém.',
  },
  {
    id: 'sono-pesado',
    nome: 'Sono Pesado',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Sono pesado: na próxima noite, só os lobos agem.',
    // Só a matilha age: tudo o que não é ataque nem morte é cancelado.
    efeitos: [
      {
        kind: 'cancela-etapas',
        etapas: [
          'bloqueio',
          'interferencia-espectral',
          'protecao',
          'perfuracao',
          'ressurreicao',
          'informacao',
        ],
      },
    ],
    descricao: 'Nenhum poder funciona. Só o ataque da matilha acontece.',
  },
];
