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
    narracao: 'A névoa subiu do rio e engoliu a vila.',
    efeitos: [{ kind: 'silencia-role', roleIds: ['vidente'] }],
    descricao: 'A Vidente não enxerga nada esta noite.',
  },
  {
    id: 'lua-cheia',
    nome: 'Lua Cheia',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A lua está inteira. Eles não vão se conter.',
    efeitos: [{ kind: 'matilha-mata-n', n: 2 }],
    descricao: 'A matilha mata dois.',
  },
  {
    id: 'noite-sem-lua',
    nome: 'Noite Sem Lua',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Nada se moveu. Isso é pior.',
    efeitos: [{ kind: 'matilha-mata-n', n: 0 }],
    descricao: 'A matilha não mata.',
  },
  {
    id: 'chuva-de-sangue',
    nome: 'Chuva de Sangue',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Choveu vermelho sobre os telhados.',
    efeitos: [{ kind: 'anula-protecoes' }],
    descricao: 'Todas as proteções falham esta noite.',
  },
  {
    id: 'sono-pesado',
    nome: 'Sono Pesado',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A vila dormiu fundo demais.',
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
    descricao: 'Nenhum poder funciona. Só a matilha age.',
  },
  {
    id: 'ossos-na-encruzilhada',
    nome: 'Ossos na Encruzilhada',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Acharam ossos na encruzilhada, e eles falaram.',
    efeitos: [{ kind: 'revela-role-de-morto' }],
    descricao: 'O app revela a role de um morto sorteado.',
  },
  {
    id: 'fogo-fatuo',
    nome: 'Fogo-fátuo',
    familia: 'sorte',
    visibilidade: 'silencioso',
    efeitos: [{ kind: 'informacao-falsa' }],
    descricao: 'Um jogador vivo recebe uma informação falsa como se fosse verdadeira.',
  },
  {
    id: 'pressagio',
    nome: 'Presságio',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A vila sonhou com {nome} esta noite.',
    // Não faz nada mecanicamente, e provavelmente é o evento mais devastador
    // do jogo: a mesa preenche o silêncio sozinha.
    efeitos: [{ kind: 'nomeia-alguem' }],
    descricao: 'O app diz o nome de um jogador em voz alta. E não explica.',
  },
];
