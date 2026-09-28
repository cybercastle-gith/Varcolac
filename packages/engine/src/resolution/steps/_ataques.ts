import { temEfeito, efeitosDaRodada } from '../../types/effect';
import { efeitoDo } from '../../types/event';
import type { GameState } from '../../types/game-state';
import type { NightAction } from '../../types/action';
import type { Player, PlayerId } from '../../types/player';
import { EVENTOS_POR_ID } from '../../data/events/index';
import { role } from '../../data/roles/index';
import { faccaoEfetiva } from '../../turn/faccao';
import type { Rng } from '../../utils/rng';

/**
 * Quantos alvos a matilha pode levar nesta noite.
 *
 * Compartilhado entre as etapas 7 e 8 porque as duas precisam da MESMA
 * resposta: a 7 corta a declaração na cota, a 8 não pode matar além dela.
 * Normalmente 1; Lua Cheia e Sede de Sangue sobem para 2; Noite Sem Lua zera.
 */
export function cotaDaMatilha(estado: GameState): number {
  /**
   * Noite 1 sem sangue, quando a mesa pediu.
   *
   * Fica na cota, e não numa checagem dentro da etapa 7, porque a cota é a
   * única resposta que as etapas 7 e 8 consultam — zerar aqui cala a matilha
   * inteira sem que nenhuma das duas precise saber da opção.
   */
  if (estado.config.semMorteNaPrimeiraNoite && estado.rodada === 1) return 0;

  const ev = estado.eventoDaNoite ? EVENTOS_POR_ID.get(estado.eventoDaNoite) : undefined;
  const doEvento = ev ? efeitoDo(ev, 'matilha-mata-n') : undefined;
  if (doEvento) return doEvento.n;

  if (temEfeito(estado.efeitos, estado.rodada, 'matilha-nao-mata')) return 0;

  const adiado = efeitosDaRodada(estado.efeitos, estado.rodada).find(
    (e) => e.kind === 'matilha-mata-n',
  );
  return adiado && adiado.kind === 'matilha-mata-n' ? adiado.n : 1;
}

/**
 * A matilha está proibida de matar esta noite?
 *
 * `cotaDaMatilha` responde pela mordida COLETIVA, e três cartas atacam por
 * conta própria — o Feiticeiro atravessando, o Lobo Branco e o Carniceiro.
 * Elas passavam por fora da cota e matavam na "noite 1 sem sangue", que é a
 * opção cuja promessa inteira é que ninguém morre.
 *
 * A Bruxa e o Sobrevivente armado NÃO entram aqui: são solitários, e a opção
 * fala da matilha.
 */
export function matilhaProibidaDeMatar(estado: GameState): boolean {
  return estado.config.semMorteNaPrimeiraNoite === true && estado.rodada === 1;
}

/** Quantos alvos o Lobo Branco leva nesta noite. Sangue Acumulado dobra. */
export function cotaDoLoboBranco(estado: GameState, id: PlayerId): number {
  const adiado = efeitosDaRodada(estado.efeitos, estado.rodada).find(
    (e) => e.kind === 'lobo-branco-mata-n',
  );
  void id;
  return adiado && adiado.kind === 'lobo-branco-mata-n' ? adiado.n : 1;
}

/**
 * Ataca por conta própria, fora da cota da matilha?
 *
 * O Lobo Branco mata lobos também, a Bruxa é solitária, e o Sobrevivente com a
 * variante A Qualquer Custo passa a matar depois de escapar de um ataque —
 * nenhum dos três combina alvo com ninguém, então nenhum entra na votação da
 * matilha.
 */
export function ataqueIndividual(p: Player): boolean {
  if (p.roleId === 'lobo-branco' || p.roleId === 'bruxa') return true;
  /*
   * O Feiticeiro que ATRAVESSA mata sozinho.
   *
   * Ele entrava na votação da matilha, e com dois lobos mirando alvos
   * diferentes o alvo dele ia a sorteio: metade das vezes o poder de uma vez
   * por partida simplesmente não acontecia. Relatado assim: "atravessar cura
   * não está funcionando, um médico cura e eu seleciono para matar aquela
   * pessoa curada mas ela não morre".
   *
   * O botão promete "mata de uma vez". Então mata — fora da cota, como o Lobo
   * Branco e a Bruxa, que também atacam por conta própria.
   */
  if (p.roleId === 'feiticeiro') return true;
  // O Padre Exorcista mata quando acerta um lobo: entra aqui para que a etapa 8
  // resolva a benza dele como resolve qualquer outra morte.
  if (p.roleId === 'padre' && p.varianteId === 'exorcista') return true;
  return p.roleId === 'sobrevivente' && p.marcas.podeMatar === true;
}

export interface AlvoDaMatilha {
  readonly alvo: PlayerId;
  readonly votos: number;
  readonly desempatado: boolean;
}

/**
 * O Lobo Desgarrado arruinou a caçada?
 *
 * A variante exige que ele mire em alguém que nenhum outro lobo mirou, e o
 * castigo por repetir não é só dele: "se houver qualquer repetição, a matilha
 * não mata ninguém". É uma role que obriga a matilha a se coordenar sem poder
 * conversar, que é exatamente a tensão do pass-and-play.
 */
function desgarradoEstragou(estado: GameState, ataques: readonly NightAction[]): boolean {
  const daMatilha = ataques.filter((a) => {
    const p = estado.players.find((x) => x.id === a.actorId);
    return !!p && faccaoEfetiva(estado, p) === 'lobos' && !ataqueIndividual(p);
  });
  const temDesgarrado = daMatilha.some(
    (a) => estado.players.find((x) => x.id === a.actorId)?.varianteId === 'desgarrado',
  );
  if (!temDesgarrado) return false;

  const alvos = daMatilha.flatMap((a) => a.alvos);
  return new Set(alvos).size !== alvos.length;
}

/**
 * A matilha mata JUNTA, uma vez (ou `cota` vezes) por noite.
 *
 * Isto existe porque o pass-and-play passa o celular de um em um: cada lobo
 * declara o seu alvo em separado, e sem agregação três lobos matariam três
 * pessoas. A matilha vota, o mais votado morre, e o empate é sorteado — o mesmo
 * critério que a mesa usaria se estivesse conversando.
 */
export function alvosDaMatilha(
  estado: GameState,
  ataques: readonly NightAction[],
  rng: Rng,
): readonly AlvoDaMatilha[] {
  const cota = cotaDaMatilha(estado);
  if (cota === 0) return [];
  if (desgarradoEstragou(estado, ataques)) return [];

  const votos = new Map<PlayerId, number>();
  for (const a of ataques) {
    const ator = estado.players.find((p) => p.id === a.actorId);
    if (!ator || faccaoEfetiva(estado, ator) !== 'lobos' || ataqueIndividual(ator)) continue;
    // Treinamento: o convertido só caça depois que o Alfa que o virou morrer.
    if (ator.marcas.tuteladoPor) {
      const mestre = estado.players.find((p) => p.id === ator.marcas.tuteladoPor);
      if (mestre && mestre.status === 'vivo') continue;
    }
    for (const alvo of a.alvos) votos.set(alvo, (votos.get(alvo) ?? 0) + 1);
  }
  if (votos.size === 0) return [];

  const escolhidos: AlvoDaMatilha[] = [];
  const restantes = new Map(votos);

  while (escolhidos.length < cota && restantes.size > 0) {
    let max = 0;
    for (const n of restantes.values()) max = Math.max(max, n);
    const empatados = [...restantes].filter(([, n]) => n === max).map(([id]) => id);
    const alvo = empatados.length === 1 ? empatados[0]! : rng.pick(empatados);
    escolhidos.push({ alvo, votos: max, desempatado: empatados.length > 1 });
    restantes.delete(alvo);
  }

  return escolhidos;
}

/** A matilha viva, contando convertidos. Usado pelo Uivo de Manada. */
export function quantosLobosVivos(estado: GameState): number {
  return estado.players.filter((p) => p.status === 'vivo' && faccaoEfetiva(estado, p) === 'lobos')
    .length;
}

export { role };
