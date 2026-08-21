import type { GameEvent } from '../../types/event';

/**
 * Família 2 — por gatilho. Disparam quando a partida entra em certo estado.
 * Podem vazar informação, e isso é intencional: a Delação e o Velório contam
 * algo à mesa que ninguém declarou.
 */
export const EVENTOS_GATILHO: readonly GameEvent[] = [
  {
    id: 'caca-as-bruxas',
    nome: 'Caça às Bruxas',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'A vila perdeu a paciência. Amanhã, duas cordas.',
    trigger: { kind: 'inocentes-linchados-seguidos', n: 2 },
    efeitos: [{ kind: 'adia', efeito: 'lincha-dois' }],
    descricao: 'No dia seguinte a vila pode linchar dois.',
  },
  {
    id: 'motim',
    nome: 'Motim',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'Ninguém mais confia no julgamento da vila.',
    trigger: { kind: 'inocentes-linchados-total', n: 3 },
    efeitos: [{ kind: 'adia', efeito: 'aldeoes-sem-voto' }],
    descricao: 'Os aldeões perdem o direito de votar por um dia.',
  },
  {
    id: 'luto-sagrado',
    nome: 'Luto Sagrado',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'A vila velou o corpo a noite toda.',
    trigger: { kind: 'role-morreu', roleIds: ['padre', 'guarda-costas'] },
    efeitos: [{ kind: 'adia', efeito: 'protecao-coletiva' }],
    descricao: 'A vila ganha uma proteção coletiva por uma noite.',
  },
  {
    id: 'sede-de-sangue',
    nome: 'Sede de Sangue',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'Eles ficaram tempo demais com fome.',
    trigger: { kind: 'matilha-sem-matar', noites: 2 },
    efeitos: [{ kind: 'adia', efeito: 'matilha-mata-n', n: 2 }],
    descricao: 'A matilha é obrigada a matar dois na próxima noite.',
  },
  {
    id: 'velorio',
    nome: 'Velório',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'Dois caixões. Ninguém tem estômago para julgar hoje.',
    trigger: { kind: 'mortes-na-noite', n: 2 },
    efeitos: [{ kind: 'adia', efeito: 'sem-votacao' }],
    descricao: 'Não há votação no dia seguinte.',
  },
  {
    id: 'a-corda-escolhe',
    nome: 'A Corda Escolhe',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'A corda não espera a vila decidir.',
    trigger: { kind: 'votacao-empatada' },
    efeitos: [{ kind: 'desempata-por-sorteio' }],
    descricao: 'O app sorteia entre os empatados e narra como destino.',
  },
  {
    id: 'delacao',
    nome: 'Delação',
    familia: 'gatilho',
    visibilidade: 'narrado',
    trigger: { kind: 'voto-em-si-mesmo' },
    efeitos: [{ kind: 'revela-faccao', de: 'gatilho' }],
    descricao: 'O app revela publicamente a facção de quem votou em si mesmo.',
  },
  {
    id: 'vinganca-dos-ossos',
    nome: 'Vingança dos Ossos',
    familia: 'gatilho',
    visibilidade: 'narrado',
    narracao: 'Os mortos já são muitos, e agora escolhem.',
    trigger: { kind: 'enesimo-morto', n: 3 },
    efeitos: [{ kind: 'mortos-escolhem-evento' }],
    descricao: 'Os mortos escolhem o próximo evento.',
  },
];
