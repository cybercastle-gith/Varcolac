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
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A vila perdeu a paciência. Amanhã, duas cordas.',
    efeitos: [{ kind: 'adia', efeito: 'lincha-dois' }],
    descricao: 'No dia seguinte a vila pode linchar dois.',
  },
  {
    id: 'motim',
    nome: 'Motim',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Ninguém mais confia no julgamento da vila.',
    efeitos: [{ kind: 'adia', efeito: 'aldeoes-sem-voto' }],
    descricao: 'Os aldeões perdem o direito de votar por um dia.',
  },
  {
    id: 'luto-sagrado',
    nome: 'Luto Sagrado',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A vila velou o corpo a noite toda.',
    efeitos: [{ kind: 'adia', efeito: 'protecao-coletiva' }],
    descricao: 'A vila ganha uma proteção coletiva por uma noite.',
  },
  {
    id: 'sede-de-sangue',
    nome: 'Sede de Sangue',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Eles ficaram tempo demais com fome.',
    efeitos: [{ kind: 'adia', efeito: 'matilha-mata-n', n: 2 }],
    descricao: 'A matilha é obrigada a matar dois na próxima noite.',
  },
  {
    id: 'velorio',
    nome: 'Velório',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Dois caixões. Ninguém tem estômago para julgar hoje.',
    efeitos: [{ kind: 'adia', efeito: 'sem-votacao' }],
    descricao: 'Não há votação no dia seguinte.',
  },
  {
    id: 'a-corda-escolhe',
    nome: 'A Corda Escolhe',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'A corda não espera a vila decidir.',
    efeitos: [{ kind: 'desempata-por-sorteio' }],
    descricao: 'O app sorteia entre os empatados e narra como destino.',
  },
  {
    id: 'delacao',
    nome: 'Delação',
    familia: 'sorte',
    visibilidade: 'narrado',
    // Faltava a narração: o evento era marcado como narrado e não tinha frase
    // nenhuma para alguém ler em voz alta. Encontrado pelo teste que exige
    // narração em todo evento narrado.
    narracao: 'Quem se acusa sozinho acaba dizendo mais do que queria.',
    efeitos: [{ kind: 'revela-faccao', de: 'gatilho' }],
    descricao: 'O app revela publicamente a facção de quem votou em si mesmo.',
  },
  {
    id: 'vinganca-dos-ossos',
    nome: 'Vingança dos Ossos',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Os mortos já são muitos, e agora escolhem.',
    efeitos: [{ kind: 'mortos-escolhem-evento' }],
    descricao: 'Os mortos escolhem o próximo evento.',
  },
];
