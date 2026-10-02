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
    narracao: 'Caça às bruxas: na próxima votação, a vila pode condenar duas pessoas.',
    efeitos: [{ kind: 'adia', efeito: 'lincha-dois' }],
    descricao: 'Na votação do dia seguinte, a vila pode condenar duas pessoas.',
  },
  {
    id: 'motim',
    nome: 'Motim',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Motim: os aldeões não votam no próximo dia.',
    efeitos: [{ kind: 'adia', efeito: 'aldeoes-sem-voto' }],
    descricao: 'Os aldeões perdem o direito de votar por um dia.',
  },
  {
    id: 'luto-sagrado',
    nome: 'Luto Sagrado',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Luto sagrado: na próxima noite, a vila inteira está protegida.',
    efeitos: [{ kind: 'adia', efeito: 'protecao-coletiva' }],
    descricao: 'Na próxima noite, todos da vila ficam protegidos contra ataques.',
  },
  {
    id: 'sede-de-sangue',
    nome: 'Sede de Sangue',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Sede de sangue: os lobos precisam matar duas pessoas na próxima noite.',
    efeitos: [{ kind: 'adia', efeito: 'matilha-mata-n', n: 2 }],
    descricao: 'Na próxima noite, a matilha é obrigada a escolher duas vítimas.',
  },
  {
    id: 'velorio',
    nome: 'Velório',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Velório: não haverá votação no próximo dia.',
    efeitos: [{ kind: 'adia', efeito: 'sem-votacao' }],
    descricao: 'Não há votação no dia seguinte.',
  },
  {
    id: 'a-corda-escolhe',
    nome: 'A Corda Escolhe',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Se a votação empatar, o app sorteia o condenado.',
    efeitos: [{ kind: 'desempata-por-sorteio' }],
    descricao: 'Em caso de empate, o app sorteia quem é condenado entre os empatados.',
  },
  {
    id: 'delacao',
    nome: 'Delação',
    familia: 'sorte',
    visibilidade: 'narrado',
    // Faltava a narração: o evento era marcado como narrado e não tinha frase
    // nenhuma para alguém ler em voz alta. Encontrado pelo teste que exige
    // narração em todo evento narrado.
    narracao: 'Delação: quem votar em si mesmo terá o lado revelado.',
    efeitos: [{ kind: 'revela-faccao', de: 'gatilho' }],
    descricao: 'O app revela para todos o lado de quem votar em si mesmo.',
  },
  {
    id: 'vinganca-dos-ossos',
    nome: 'Vingança dos Ossos',
    familia: 'sorte',
    visibilidade: 'narrado',
    narracao: 'Vingança dos ossos: os mortos escolhem o próximo evento.',
    efeitos: [{ kind: 'mortos-escolhem-evento' }],
    descricao: 'Os mortos escolhem o próximo evento.',
  },
];
