import type { GameState } from '../../types/game-state';
import type { PlayerId } from '../../types/player';
import { efeitosDaRodada } from '../../types/effect';
import { role } from '../../data/roles/index';
import type { StepFn } from '../night-pipeline';
import { acoesDe, agendar, anunciar, entregarInfo, nome } from './_helpers';

/** Facção como a Vidente enxerga: solitário do mal lê como lobo. */
function leitura(estado: GameState, id: PlayerId): string {
  const p = estado.players.find((x) => x.id === id)!;
  if (p.flags.imuneInvestigacao) return 'da vila';
  const r = role(p.roleId);
  if (r.faccao === 'lobos') return 'lobo';
  if (r.faccao === 'solitario' && r.alinhamento === 'mal') return 'lobo';
  return 'da vila';
}

/**
 * Etapa 11 — Vidente e Detetive.
 *
 * Lê `ctx.estadoInicial`, NUNCA `ctx.estado`: quem investigou alguém que morreu
 * nesta mesma noite ainda recebe a leitura, para que a informação não vaze o
 * resultado da noite. É a invariante mais fácil de quebrar sem perceber, e a
 * razão de o contexto carregar dois estados.
 */
export const informacao: StepFn = (ctx) => {
  const acoes = acoesDe(ctx, 'informacao');
  let estado = ctx.estado;

  // Vidente dos Sonhos: a visão de ontem chega hoje.
  for (const e of efeitosDaRodada(estado.efeitos, estado.rodada)) {
    if (e.kind !== 'visao-atrasada') continue;
    estado = entregarInfo(estado, {
      rodada: estado.rodada,
      paraId: e.paraId,
      origem: 'vidente',
      texto: e.texto,
      verdadeira: true,
      sobre: [],
    });
    ctx.log.registrar('informacao', {
      mensagem: `Visão atrasada entregue a ${nome(estado, e.paraId)}.`,
      motivo: 'Variante Vidente dos Sonhos: a visão chega uma noite depois.',
      alvos: [e.paraId],
    });
  }

  if (acoes.length === 0) {
    if (estado === ctx.estado) ctx.log.ignorar('informacao', 'Ninguém investigou esta noite.');
    return { ...ctx, estado };
  }

  const antes = ctx.estadoInicial;

  for (const acao of acoes) {
    const ator = estado.players.find((p) => p.id === acao.actorId)!;
    const r = role(ator.roleId);

    if (r.id === 'detetive') {
      const [a, b] = acao.alvos;
      if (!a || !b) continue;
      const mesma = leitura(antes, a) === leitura(antes, b);

      if (ator.varianteId === 'delegado') {
        // Revista pública: a mesa inteira ouve, mas não descobre a facção.
        const temPoder =
          role(antes.players.find((p) => p.id === a)!.roleId).categoria !== 'nenhuma';
        estado = anunciar(
          estado,
          `Revista em ${nome(antes, a)}: ${temPoder ? 'tem poder' : 'não tem poder'}.`,
          'role',
        );
      } else {
        estado = entregarInfo(estado, {
          rodada: estado.rodada,
          paraId: ator.id,
          origem: 'detetive',
          texto: `${nome(antes, a)} e ${nome(antes, b)} ${mesma ? 'são' : 'não são'} da mesma facção.`,
          verdadeira: true,
          sobre: [a, b],
        });
      }

      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} comparou ${nome(antes, a)} e ${nome(antes, b)}.`,
        motivo: `${mesma ? 'Mesma facção' : 'Facções diferentes'}. Leitura tirada do início da noite.`,
        atores: [ator.id],
        alvos: [a, b],
      });
      continue;
    }

    // Vidente e variantes.
    const alvo = acao.alvos[0];
    if (!alvo) continue;
    const alvoAntes = antes.players.find((p) => p.id === alvo)!;

    if (ator.varianteId === 'ossos' && alvoAntes.status === 'vivo') {
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} não enxergou nada em ${alvoAntes.nome}.`,
        motivo: 'Variante Vidente dos Ossos: só enxerga mortos.',
        atores: [ator.id],
        alvos: [alvo],
      });
      continue;
    }

    const texto = `${alvoAntes.nome} é ${leitura(antes, alvo)}.`;

    if (ator.varianteId === 'sonhos') {
      estado = agendar(estado, {
        kind: 'visao-atrasada',
        naRodada: estado.rodada + 1,
        paraId: ator.id,
        texto,
      });
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} sonhou com ${alvoAntes.nome}; a visão chega amanhã.`,
        motivo: 'Variante Vidente dos Sonhos.',
        atores: [ator.id],
        alvos: [alvo],
      });
      continue;
    }

    estado = entregarInfo(estado, {
      rodada: estado.rodada,
      paraId: ator.id,
      origem: 'vidente',
      texto,
      verdadeira: true,
      sobre: [alvo],
    });

    if (ator.varianteId === 'confusa') {
      // Duas visões, uma falsa, e ela não sabe qual é qual.
      const outros = antes.players.filter((p) => p.id !== alvo && p.id !== ator.id);
      const falso = outros.length > 0 ? ctx.rng.pick(outros) : null;
      if (falso) {
        const invertida = leitura(antes, falso.id) === 'lobo' ? 'da vila' : 'lobo';
        estado = entregarInfo(estado, {
          rodada: estado.rodada,
          paraId: ator.id,
          origem: 'vidente',
          texto: `${falso.nome} é ${invertida}.`,
          verdadeira: false,
          sobre: [falso.id],
        });
      }
    }

    if (ator.varianteId === 'espelho') {
      estado = entregarInfo(estado, {
        rodada: estado.rodada,
        paraId: alvo,
        origem: 'app',
        texto: 'Alguém observou você esta noite.',
        verdadeira: true,
        sobre: [],
      });
    }

    // O custo da Vidente: perde o voto do dia seguinte, sem precisar declarar.
    estado = {
      ...estado,
      players: estado.players.map((p) => (p.id === ator.id ? { ...p, semVoto: true } : p)),
    };

    ctx.log.registrar('informacao', {
      mensagem: `${ator.nome} viu que ${texto}`,
      motivo: 'Leitura do início da noite. Ela perde o voto do dia seguinte.',
      atores: [ator.id],
      alvos: [alvo],
    });
  }

  return { ...ctx, estado };
};
