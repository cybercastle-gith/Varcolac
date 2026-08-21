import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { role } from '../data/roles/index';
import { agendar, anunciar, marcar, matar } from './steps/_helpers';

/**
 * A cadeia de estertores, isolada do pipeline noturno.
 *
 * Mora aqui, e não dentro da etapa 9, porque estertor dispara com morte por
 * QUALQUER causa — o Caçador linchado atira, e a Anciã linchada derruba os
 * poderes da vila igual. Se a cadeia vivesse só na noite, o dia precisaria de
 * uma cópia, e as duas divergiriam na primeira variante nova.
 */
export interface RegistroEstertor {
  readonly mensagem: string;
  readonly motivo: string;
  readonly atores: readonly PlayerId[];
  readonly alvos: readonly PlayerId[];
}

export interface ResultadoEstertores {
  readonly estado: GameState;
  readonly registros: readonly RegistroEstertor[];
}

/**
 * Dispara os estertores de `iniciais` e segue a cadeia até ela se esgotar.
 *
 * `jaDispararam` é o que impede laço infinito quando dois estertores se apontam:
 * cada jogador dispara o seu no máximo uma vez.
 */
export function dispararEstertores(
  estadoInicial: GameState,
  iniciais: readonly PlayerId[],
  declarados: ReadonlyMap<PlayerId, PlayerId> = new Map(),
): ResultadoEstertores {
  let estado = estadoInicial;
  const registros: RegistroEstertor[] = [];
  const jaDispararam = new Set<PlayerId>();
  const fila = [...iniciais];

  const abater = (id: PlayerId, motivo: string, autor: PlayerId) => {
    const alvo = estado.players.find((p) => p.id === id);
    if (!alvo || alvo.status === 'morto') return;
    estado = matar(estado, id, 'estertor');
    registros.push({
      mensagem: `${alvo.nome} morreu.`,
      motivo,
      atores: [autor],
      alvos: [id],
    });
    if (!jaDispararam.has(id)) fila.push(id);
  };

  while (fila.length > 0) {
    const id = fila.shift()!;
    if (jaDispararam.has(id)) continue;
    jaDispararam.add(id);

    const morto = estado.players.find((p) => p.id === id);
    if (!morto) continue;
    estado = marcar(estado, id, { estertorPendente: false });

    const r = role(morto.roleId);
    const candidatos = vivos(estado).filter((p) => p.id !== id);

    // Amor Proibido: o amante morre de tristeza. Vale para qualquer role.
    if (morto.amanteDe) {
      const par = estado.players.find((p) => p.id === morto.amanteDe);
      if (par && par.status === 'vivo') {
        abater(par.id, `Amor Proibido: morreu de tristeza por ${morto.nome}.`, id);
      }
    }

    if (r.id === 'cacador') {
      if (morto.varianteId === 'ultimo-uivo') {
        const alvo = declarados.get(id) ?? candidatos[0]?.id;
        if (alvo) {
          const alvoP = estado.players.find((p) => p.id === alvo)!;
          estado = anunciar(estado, `${alvoP.nome} é ${role(alvoP.roleId).nome}.`, 'role');
          registros.push({
            mensagem: `${morto.nome} revelou a role de ${alvoP.nome}.`,
            motivo: 'Variante Último Uivo: revela em vez de matar.',
            atores: [id],
            alvos: [alvo],
          });
        }
        continue;
      }

      let elegiveis = candidatos;
      if (morto.varianteId === 'vingativo') {
        // Só pode atirar em quem votou nele, na última votação registrada.
        const ultima = estado.historicoVotos.at(-1);
        const votaram = new Set(
          Object.entries(ultima?.votos ?? {})
            .filter(([, alvo]) => alvo === id)
            .map(([quem]) => quem),
        );
        elegiveis = candidatos.filter((p) => votaram.has(p.id));
      }

      const escolhido = declarados.get(id) ?? elegiveis[0]?.id;
      if (!escolhido || !elegiveis.some((p) => p.id === escolhido)) {
        registros.push({
          mensagem: `${morto.nome} morreu sem levar ninguém.`,
          motivo:
            morto.varianteId === 'vingativo'
              ? 'Variante Vingativo: ninguém elegível votou nele.'
              : 'Nenhum alvo válido para o tiro.',
          atores: [id],
          alvos: [],
        });
        continue;
      }
      abater(escolhido, `Tiro do Caçador ${morto.nome}.`, id);
      continue;
    }

    if (r.id === 'lobo-carnical') {
      const escolhido = declarados.get(id) ?? candidatos[0]?.id;
      if (escolhido) abater(escolhido, `O Carniçal ${morto.nome} levou alguém junto.`, id);
      // "Não morre na hora": a expiração adiada é o vestígio dessa noite extra.
      estado = agendar(estado, { kind: 'expira', naRodada: estado.rodada + 1, playerId: id });
      continue;
    }

    if (r.id === 'ancia') {
      estado = agendar(estado, { kind: 'poderes-suspensos', naRodada: estado.rodada + 1 });
      estado = anunciar(estado, 'A vila perdeu suas forças esta noite.', 'role');
      registros.push({
        mensagem: `${morto.nome} era a Anciã — a vila perde todos os poderes por uma noite.`,
        motivo: 'Vale para morte por qualquer causa, inclusive linchamento.',
        atores: [id],
        alvos: [],
      });
    }
  }

  return { estado, registros };
}
