import type { GameState } from '../../types/game-state';
import type { PlayerId } from '../../types/player';
import { agendar, anunciar, gravar, reviver } from './_helpers';

export interface EcoDaMorte {
  readonly mensagem: string;
  readonly motivo: string;
  readonly alvos: readonly PlayerId[];
}

/**
 * O que dispara quando alguém morre e NÃO é estertor da própria role.
 *
 * Três variantes apostam no corpo dos outros: Sangue Marcado (o convertido
 * entrega o Alfa), Última Carne (o Carniçal volta se o nome apostado cair) e
 * Sangue Acumulado (o Lobo Branco cobra a marca). As três têm em comum que a
 * marca está em OUTRO jogador, e é por isso que nada disso cabe em
 * `estertor-chain`, que percorre a role de quem morreu.
 *
 * Chamado das duas mortes do jogo — a da noite e a do linchamento —, porque
 * nenhuma das três cartas diz "à noite".
 */
export function ecosDaMorte(
  estado: GameState,
  id: PlayerId,
): { estado: GameState; ecos: readonly EcoDaMorte[] } {
  const morto = estado.players.find((p) => p.id === id);
  if (!morto) return { estado, ecos: [] };

  let e = estado;
  const ecos: EcoDaMorte[] = [];

  if (morto.marcas.delataSeMorrer) {
    const alfa = e.players.find((p) => p.id === morto.marcas.delataSeMorrer);
    if (alfa) {
      e = anunciar(e, `A marca no corpo de ${morto.nome} é de ${alfa.nome}.`, 'role');
      ecos.push({
        mensagem: `${alfa.nome} foi revelado como Alfa.`,
        motivo: 'Variante Sangue Marcado: o convertido morreu.',
        alvos: [alfa.id],
      });
    }
  }

  const apostador = e.players.find(
    (p) => p.status === 'morto' && p.marcas.ressuscitaSeMorrer === id,
  );
  if (apostador) {
    e = reviver(e, apostador.id);
    e = anunciar(e, `${apostador.nome} se levantou de novo.`, 'role');
    ecos.push({
      mensagem: `${apostador.nome} voltou à vida.`,
      motivo: `Variante Última Carne: ${morto.nome}, o alvo da aposta, morreu.`,
      alvos: [apostador.id],
    });
  }

  const branco = e.players.find(
    (p) => p.status === 'vivo' && p.roleId === 'lobo-branco' && p.marcas.loboMarcado === id,
  );
  if (branco) {
    e = agendar(e, { kind: 'lobo-branco-mata-n', naRodada: e.rodada + 1, n: 2 });
    e = gravar(e, branco.id, {});
    ecos.push({
      mensagem: `${branco.nome} vai levar dois na próxima noite.`,
      motivo: `Variante Sangue Acumulado: o lobo marcado (${morto.nome}) caiu.`,
      alvos: [branco.id],
    });
  }

  return { estado: e, ecos };
}
