import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck } from '../types/config';
import { ROLES } from '../data/roles/index';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from '../resolution/night-pipeline';
import { roteiroDaNoite } from '../turn/roteiro';
import { resolverDia } from '../day/voting';
import { verificarVitoria } from '../victory/win-conditions';
import { criarRng } from '../utils/rng';
import type { NightAction } from '../types/action';

/**
 * Partidas inteiras, com variante em TODAS as funções, só para ver se quebra.
 *
 * Não verifica regra nenhuma — para isso existe `resolution/variantes.test.ts`.
 * O que este arquivo cobre é o buraco que os testes unitários deixam: uma
 * variante que agenda um efeito que ninguém consome, uma pergunta cujo alvo não
 * existe, um `!` num jogador que já morreu. Esses defeitos não aparecem num
 * caso montado à mão; aparecem na terceira noite de uma partida qualquer.
 *
 * As respostas são sorteadas dentro do que o roteiro diz ser válido, que é
 * exatamente o contrato entre o engine e a tela: se o bot consegue jogar só
 * lendo o roteiro, o app também consegue.
 */

const NOMES = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gina', 'Hugo', 'Iara', 'Job'];

/** Todas as variantes de todas as roles, em pares (roleId, varianteId). */
function todasAsCombinacoes(): { roleId: string; varianteId: string }[] {
  return ROLES.flatMap((r) => r.variantes.map((v) => ({ roleId: r.id, varianteId: v.id })));
}

function jogarUmaPartida(semente: string, variantes: Record<string, string>, roleIds: string[]) {
  const rng = criarRng(`bot-${semente}`);
  const deck: Deck = { id: 'smoke', nome: 'smoke', roleIds };
  let estado = criarPartida(
    deck,
    { ...DEFAULT_CONFIG, semente, variantes, frequenciaEventos: 'frequente' },
    NOMES.slice(0, roleIds.length).map((nome) => ({ nome, cor: '#000' })),
  );

  for (let volta = 0; volta < 8; volta += 1) {
    if (verificarVitoria(estado).encerrada) break;

    estado = volta === 0 ? { ...estado, fase: 'noite' } : prepararNoite(estado);

    // Responde cada passagem com uma escolha válida, sorteada.
    const acoes: NightAction[] = [];
    for (const passagem of roteiroDaNoite(estado)) {
      const q = passagem.pergunta;
      if (q.falsa || !q.etapa) continue;

      const opcao = q.opcoes && q.opcoes.length > 0 ? rng.pick([...q.opcoes]) : null;
      const alvosDaOpcao = opcao && q.alvosPorOpcao ? q.alvosPorOpcao[opcao.valor] : undefined;
      const candidatos = [...(alvosDaOpcao ?? q.alvos)];
      const precisaAlvo = opcao ? opcao.pedeAlvo : q.tipo === 'alvo' || q.tipo === 'dois-alvos';

      if (precisaAlvo && candidatos.length === 0) continue;

      const alvos = !precisaAlvo
        ? []
        : q.tipo === 'dois-alvos' && candidatos.length >= 2
          ? rng.shuffle(candidatos).slice(0, 2)
          : [rng.pick(candidatos)];

      acoes.push({
        actorId: passagem.player.id,
        kind: q.kind,
        etapa: opcao?.etapa ?? q.etapa,
        alvos,
        falsa: false,
        ...(opcao ? { escolha: opcao.valor } : {}),
      });
    }

    estado = resolverNoite(estado, { rodada: estado.rodada, acoes }).estado;
    if (verificarVitoria(estado).encerrada) break;

    // Votação: todo mundo que pode votar vota em alguém que não é ele.
    const votos: Record<string, string | null> = {};
    const vivos = estado.players.filter((p) => p.status === 'vivo');
    for (const p of vivos) {
      const outros = vivos.filter((x) => x.id !== p.id);
      votos[p.id] = outros.length > 0 ? rng.pick(outros).id : null;
    }
    estado = resolverDia(estado, votos).estado;
  }

  return estado;
}

describe('partidas completas com variantes (fumaça)', () => {
  it('nenhuma variante derruba uma partida inteira', () => {
    /*
     * Uma partida por variante: a variante sob teste entra na mesa junto de um
     * elenco fixo, para que a falha aponte para uma carta só. Rodar todas as
     * combinações seria bonito e inútil — são 73 variantes e o que quebra
     * quebra sozinho.
     */
    const elenco = ['lobo', 'aldeao', 'vidente', 'medico', 'xerife', 'cacador', 'ancia'];

    for (const { roleId, varianteId } of todasAsCombinacoes()) {
      const roleIds = elenco.includes(roleId) ? [...elenco] : [...elenco.slice(0, 6), roleId];
      expect(
        () => jogarUmaPartida(`${roleId}-${varianteId}`, { [roleId]: varianteId }, roleIds),
        `a variante ${roleId}/${varianteId} derrubou a partida`,
      ).not.toThrow();
    }
  });

  it('com variante em TODAS as roles da mesa, dez partidas seguidas terminam', () => {
    const elenco = [
      'lobo',
      'alfa',
      'vidente',
      'medico',
      'xerife',
      'cacador',
      'ancia',
      'bruxa',
      'bobo',
      'sobrevivente',
    ];

    for (let i = 0; i < 10; i += 1) {
      const rng = criarRng(`mesa-${i}`);
      const variantes: Record<string, string> = {};
      for (const roleId of elenco) {
        const r = ROLES.find((x) => x.id === roleId)!;
        if (r.variantes.length > 0) variantes[roleId] = rng.pick([...r.variantes]).id;
      }
      expect(
        () => jogarUmaPartida(`mesa-${i}`, variantes, elenco),
        `mesa ${i} com ${JSON.stringify(variantes)}`,
      ).not.toThrow();
    }
  });
});
