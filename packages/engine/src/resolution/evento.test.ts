import { describe, expect, it } from 'vitest';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from './night-pipeline';
import { MAXIMO_DE_EVENTOS } from './steps/02-evento';
import { EVENTOS, EVENTOS_POR_ID } from '../data/events/index';
import { DEFAULT_CONFIG } from '../types/config';
import type { Deck } from '../types/config';
import type { GameState } from '../types/game-state';

/**
 * O evento é ANUNCIADO numa noite e VIGORA na seguinte.
 *
 * A separação existe para a mesa ter um dia inteiro para discutir a ameaça
 * antes de ela acontecer: ouvir "Lua Cheia" no amanhecer e jogar o dia sabendo
 * que à noite a matilha mata dois.
 */

const MESA = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gil', 'Hilda'].map((nome, i) => ({
  nome,
  cor: `#00000${i}`,
}));

const DECK: Deck = {
  id: 'teste',
  nome: 'teste',
  roleIds: ['lobo', 'lobo', 'vidente', 'medico', 'aldeao', 'aldeao', 'cacador', 'xerife'],
};

function partida(semente: string, frequencia: 'raro' | 'frequente' | 'caotico' = 'caotico') {
  return criarPartida(DECK, { ...DEFAULT_CONFIG, semente, frequenciaEventos: frequencia }, MESA);
}

const noiteVazia = (estado: GameState) =>
  resolverNoite(estado, { rodada: estado.rodada, acoes: [] }).estado;

describe('evento da noite', () => {
  it('a noite 1 nunca tem evento em vigor', () => {
    // Não houve amanhecer antes dela para anunciar nada.
    for (let i = 0; i < 10; i++) {
      expect(partida(`n1-${i}`).eventoDaNoite).toBeNull();
    }
  });

  it('é anunciado numa noite e só vigora na seguinte', () => {
    let comAnuncio = 0;
    for (let i = 0; i < 20; i++) {
      const depois = noiteVazia(partida(`semente-${i}`));
      // Em vigor continua vazio na noite 1; o que muda é o anúncio.
      expect(depois.eventoDaNoite).toBeNull();
      if (!depois.eventoAnunciado) continue;
      comAnuncio++;

      const noite2 = prepararNoite(depois);
      expect(noite2.eventoDaNoite).toBe(depois.eventoAnunciado);
      expect(noite2.eventoAnunciado).toBeNull();
    }
    // 0.8 de chance por noite: vinte tentativas sem nenhum anúncio seria
    // defeito, não azar.
    expect(comAnuncio).toBeGreaterThan(10);
  });

  it('no máximo dois eventos por partida', () => {
    let estado = partida('teto', 'caotico');
    for (let i = 0; i < 12; i++) {
      estado = noiteVazia(estado);
      estado = prepararNoite(estado);
    }
    expect(estado.eventosUsados.length).toBeLessThanOrEqual(MAXIMO_DE_EVENTOS);
  });

  it('nenhum evento se repete na mesma partida', () => {
    let estado = partida('repeticao', 'caotico');
    for (let i = 0; i < 12; i++) {
      estado = prepararNoite(noiteVazia(estado));
    }
    expect(new Set(estado.eventosUsados).size).toBe(estado.eventosUsados.length);
  });

  it('todos os eventos são da família sorte — gatilho não existe mais', () => {
    for (const ev of EVENTOS) {
      expect(ev.familia, `${ev.id} não é sorte`).toBe('sorte');
    }
  });

  it('todo evento narrado tem narração — é a frase que alguém lê em voz alta', () => {
    for (const ev of EVENTOS_POR_ID.values()) {
      if (ev.visibilidade !== 'narrado') continue;
      expect(ev.narracao, `${ev.id} é narrado e não tem narração`).toBeTruthy();
      expect(ev.descricao, `${ev.id} não diz o que muda`).toBeTruthy();
    }
  });

  it('o padrão de fábrica faz evento aparecer na maioria das mesas', () => {
    expect(DEFAULT_CONFIG.frequenciaEventos).toBe('frequente');
  });
});
