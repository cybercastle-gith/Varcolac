import type { GameState } from '../types/game-state';
import type { PlayerId } from '../types/player';
import type { RoleId, VariantId } from '../types/role';

/**
 * Trocar a carta de alguém — o ÚNICO caminho para isso.
 *
 * Seis mecânicas trocam o papel de um jogador no meio da partida: a conversão
 * do Alfa, a herança do Aldeão, a Cova Aberta, a Herança Amarga, a Contaminação
 * e a Troca com Mortos. Cada uma fazia o seu próprio `players.map(...)`, e as
 * seis esqueciam coisas diferentes: uma não zerava a variante antiga, outra não
 * recalculava os usos, nenhuma avisava o jogador.
 *
 * Passando todas por aqui, o que for corrigido vale para as seis — e a marca
 * `viraCarta` garante que o jogador SEMPRE veja a tela de "sua carta mudou"
 * antes de agir de novo.
 */
export function trocarCarta(
  estado: GameState,
  playerId: PlayerId,
  destino: {
    readonly roleId: RoleId;
    readonly varianteId?: VariantId | undefined;
    readonly usos: number;
    /** Uma frase curta para a tela: quem fez isso, e por quê. */
    readonly motivo: string;
  },
): GameState {
  const antes = estado.players.find((p) => p.id === playerId);
  if (!antes) return estado;

  return {
    ...estado,
    players: estado.players.map((p) => {
      if (p.id !== playerId) return p;
      /*
       * `varianteId` é REMOVIDA, não posta como `undefined`: o tipo é opcional
       * com `exactOptionalPropertyTypes`, e uma variante da carta antiga
       * sobrevivendo na carta nova é o defeito clássico desta função.
       */
      const { varianteId: _v, ...semVariante } = p;
      return {
        ...semVariante,
        roleId: destino.roleId,
        ...(destino.varianteId ? { varianteId: destino.varianteId } : {}),
        usosRestantes: destino.usos,
        marcas: {
          ...p.marcas,
          viraCarta: {
            deRoleId: antes.roleId,
            ...(antes.varianteId ? { deVarianteId: antes.varianteId } : {}),
            paraRoleId: destino.roleId,
            ...(destino.varianteId ? { paraVarianteId: destino.varianteId } : {}),
            motivo: destino.motivo,
          },
        },
      };
    }),
  };
}

/** Apaga a marca depois de a tela ter mostrado. */
export function marcarTrocaVista(estado: GameState, playerId: PlayerId): GameState {
  return {
    ...estado,
    players: estado.players.map((p) => {
      if (p.id !== playerId) return p;
      const { viraCarta: _vc, ...resto } = p.marcas;
      return { ...p, marcas: resto };
    }),
  };
}
