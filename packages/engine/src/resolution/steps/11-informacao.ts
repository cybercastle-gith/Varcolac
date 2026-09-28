import type { GameState } from '../../types/game-state';
import type { PlayerId } from '../../types/player';
import { efeitosDaRodada } from '../../types/effect';
import { role } from '../../data/roles/index';
import { nomeDaCarta, usosIniciais } from '../../types/role';
import { trocarCarta } from '../../turn/troca-de-carta';
import type { StepFn } from '../night-pipeline';
import {
  acoesDe,
  agendar,
  anunciar,
  entregarInfo,
  gastarUso,
  gravar,
  nome,
  roleEfetivaId,
  temUso,
} from './_helpers';
import { leituraDeFaccao as leitura, visoesDaConfusa } from '../../turn/leitura';

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
    /*
     * A role EFETIVA: Incorporação, Herdeiro e Sombra de Alguém fazem um
     * jogador agir com a carta de outro. Despachar por `ator.roleId` aqui
     * faria o Aldeão que herdou a Vidente cair no ramo do Aldeão.
     */
    const r = role(roleEfetivaId(ator, estado.rodada));

    /**
     * Detetive Obsessivo: um alvo só, e a cada noite uma camada a mais.
     *
     * O alvo trava na primeira noite em que ele age e nunca mais muda — é o
     * oposto do Detetive base, que varre a mesa comparando pares. Aqui ele
     * aposta tudo numa pessoa e, se apostou errado, gasta a partida inteira
     * confirmando que um inocente é inocente.
     */
    if (r.id === 'detetive' && ator.varianteId === 'obsessivo') {
      const travado = ator.marcas.alvoTravado ?? acao.alvos[0];
      if (!travado) continue;
      if (!ator.marcas.alvoTravado) estado = gravar(estado, ator.id, { alvoTravado: travado });

      const alvoP = antes.players.find((x) => x.id === travado)!;
      const passo =
        estado.rodada === 1
          ? `${alvoP.nome} é ${leitura(antes, travado)}.`
          : estado.rodada === 2
            ? `${alvoP.nome} é ${nomeDaCarta(role(roleEfetivaId(alvoP)), alvoP.varianteId)}.`
            : (() => {
                const ultima = antes.historicoVotos.at(-1);
                const votou = ultima?.votos[travado];
                const nomeVotado = votou
                  ? (antes.players.find((x) => x.id === votou)?.nome ?? '?')
                  : null;
                return nomeVotado
                  ? `${alvoP.nome} votou em ${nomeVotado}.`
                  : `${alvoP.nome} não votou em ninguém.`;
              })();

      estado = entregarInfo(estado, {
        rodada: estado.rodada,
        paraId: ator.id,
        origem: 'detetive',
        texto: passo,
        verdadeira: true,
        sobre: [travado],
      });
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} vigiou ${alvoP.nome}: ${passo}`,
        motivo: `Variante Obsessivo, noite ${estado.rodada}: facção, depois role, depois o voto.`,
        atores: [ator.id],
        alvos: [travado],
      });
      continue;
    }

    /**
     * Aldeão Testemunha: o app assina embaixo, uma vez por partida.
     *
     * É a única forma de prova irrefutável do jogo, e ela vale exatamente uma
     * vez — o que faz dela uma carta de última hora, gasta quando a corda já
     * está no pescoço.
     */
    if (r.id === 'aldeao' && ator.varianteId === 'testemunha') {
      if (!temUso(estado, ator.id)) continue;
      estado = gastarUso(estado, ator.id);
      estado = anunciar(estado, `O app confirma, e não mente: ${ator.nome} é Aldeão.`, 'role', {
        rotulo: 'Uma prova',
      });
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} usou a testemunha.`,
        motivo: 'Variante Testemunha: confirmação pública e verdadeira, uma vez por partida.',
        atores: [ator.id],
      });
      continue;
    }

    /**
     * Aldeão Herdeiro: pega a habilidade de um morto, e não o lado dele.
     *
     * Herdar a carta inteira transformaria um Aldeão em lobo por acidente. O
     * que ele herda é o poder; a facção continua sendo a dele.
     */
    if (r.id === 'aldeao' && ator.varianteId === 'herdeiro') {
      const mortoId = acao.alvos[0];
      const mortoP = mortoId ? antes.players.find((x) => x.id === mortoId) : undefined;
      if (!mortoP) continue;

      /**
       * O Herdeiro VIRA o morto — carta inteira, não poder emprestado.
       *
       * `marcas.poderDe` dava a habilidade e deixava a carta antiga na mão: na
       * tela ele continuava Aldeão, o ícone era de Aldeão, e a revelação ao
       * morrer dizia Aldeão. Relatado assim: "ele não está personificando quem
       * ele herdou, ele tem que virar o personagem".
       *
       * A FACÇÃO acompanha. Herdar um lobo morto faz dele um lobo — é o preço
       * de uma carta que pode virar qualquer coisa da mesa, e a razão de ser
       * uma vez só por partida.
       */
      const novaRole = role(mortoP.roleId);
      estado = trocarCarta(estado, ator.id, {
        roleId: mortoP.roleId,
        ...(mortoP.varianteId ? { varianteId: mortoP.varianteId } : {}),
        usos: usosIniciais(novaRole.usoLimitado),
        motivo: `Você herdou o que era de ${mortoP.nome}.`,
      });
      estado = {
        ...estado,
        objetivosSecretos: {
          ...estado.objetivosSecretos,
          [ator.id]: `você herdou a carta de ${mortoP.nome}: agora é ${nomeDaCarta(novaRole, mortoP.varianteId)}`,
        },
      };
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} virou ${nomeDaCarta(novaRole, mortoP.varianteId)}.`,
        motivo:
          'Variante Herdeiro: herda a CARTA inteira, inclusive a facção. Uma vez por partida.',
        atores: [ator.id],
        alvos: [mortoP.id],
      });
      continue;
    }

    /**
     * Ladrão Troca com Mortos: ele veste a carta de um corpo.
     *
     * Ao contrário do Herdeiro e da Incorporação, aqui a troca é da CARTA
     * inteira — `roleId`, e não `marcas.poderDe`. A carta diz "troca seu papel"
     * e "volta ao jogo com o papel escolhido", e isso inclui a facção: um
     * Ladrão que veste um Lobo morto passa a jogar pelos lobos.
     */
    if (r.id === 'ladrao' && ator.varianteId === 'troca-com-mortos') {
      const mortoId = acao.alvos[0];
      const mortoP = mortoId ? antes.players.find((x) => x.id === mortoId) : undefined;
      if (!mortoP || mortoP.status === 'vivo') continue;
      if (!temUso(estado, ator.id)) continue;
      estado = gastarUso(estado, ator.id);
      estado = trocarCarta(estado, ator.id, {
        roleId: mortoP.roleId,
        ...(mortoP.varianteId ? { varianteId: mortoP.varianteId } : {}),
        usos: usosIniciais(role(mortoP.roleId).usoLimitado),
        motivo: `Você vestiu a carta de ${mortoP.nome}.`,
      });
      estado = {
        ...estado,
        objetivosSecretos: {
          ...estado.objetivosSecretos,
          [ator.id]: `roubou a role de ${mortoP.nome}, que já estava morto`,
        },
      };
      estado = entregarInfo(estado, {
        rodada: estado.rodada,
        paraId: ator.id,
        origem: 'app',
        texto: `Você agora é ${role(mortoP.roleId).nome}, o papel de ${mortoP.nome}.`,
        verdadeira: true,
        sobre: [mortoP.id],
      });
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} vestiu a carta de ${mortoP.nome}.`,
        motivo: 'Variante Troca com Mortos: troca a CARTA inteira, inclusive a facção.',
        atores: [ator.id],
        alvos: [mortoP.id],
      });
      continue;
    }

    /**
     * Bobo da Forca: ele marca a votação em que precisa ser acusado.
     *
     * O Bobo base espera a vila errar. Este aponta o dia — e se ninguém votar
     * nele nesse dia, perde a vitória própria e vira Aldeão. É um blefe com
     * prazo, e o prazo é dele.
     */
    if (r.id === 'bobo' && ator.varianteId === 'bobo-da-forca') {
      if (!temUso(estado, ator.id)) continue;
      estado = gastarUso(estado, ator.id);
      estado = gravar(estado, ator.id, { forcaNaRodada: estado.rodada });
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} marcou a votação de hoje.`,
        motivo: 'Variante Bobo da Forca: um voto nele hoje é a vitória; nenhum, e ele vira Aldeão.',
        atores: [ator.id],
      });
      continue;
    }

    if (r.id === 'detetive') {
      const [a, b] = acao.alvos;
      if (!a) continue;
      // O Delegado revista UM. Só o Detetive base precisa do segundo nome.
      if (!b && ator.varianteId !== 'delegado') continue;
      const mesma = b ? leitura(antes, a) === leitura(antes, b) : false;

      if (ator.varianteId === 'delegado') {
        /**
         * A revista revela a FACÇÃO, e é cara.
         *
         * Antes dizia só "tem poder" / "não tem poder" — quase inútil numa mesa
         * onde metade das cartas tem poder. Decisão do usuário em 2026-09-27:
         * revela o lado, em público, e em troca tem um uso a cada quatro
         * jogadores (ver `usosDoDelegado`, em `types/role.ts`).
         */
        if (!temUso(estado, ator.id)) {
          ctx.log.registrar('informacao', {
            mensagem: `${ator.nome} não tem mais revistas.`,
            motivo: 'A revista pública é limitada pelo tamanho da mesa.',
            atores: [ator.id],
          });
          continue;
        }
        estado = gastarUso(estado, ator.id);
        const ehLobo = leitura(antes, a) === 'lobo';
        estado = anunciar(
          estado,
          `A revista em ${nome(antes, a)} terminou. ${nome(antes, a)} é ` +
            (ehLobo ? 'LOBO.' : 'da vila.'),
          'role',
          { rotulo: 'Revista pública' },
        );
      } else {
        estado = entregarInfo(estado, {
          rodada: estado.rodada,
          paraId: ator.id,
          origem: 'detetive',
          texto: `${nome(antes, a)} e ${nome(antes, b!)} ${mesma ? 'são' : 'não são'} da mesma facção.`,
          verdadeira: true,
          sobre: [a, b!],
        });
      }

      if (ator.varianteId === 'delegado') {
        ctx.log.registrar('informacao', {
          mensagem: `${ator.nome} revistou ${nome(antes, a)} em público.`,
          motivo: 'Variante Delegado: a facção do alvo foi lida em voz alta para a mesa.',
          atores: [ator.id],
          alvos: [a],
        });
        continue;
      }

      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} comparou ${nome(antes, a)} e ${nome(antes, b!)}.`,
        motivo: `${mesma ? 'Mesma facção' : 'Facções diferentes'}. Leitura tirada do início da noite.`,
        atores: [ator.id],
        alvos: [a, b!],
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

    /**
     * A Confusa é resolvida em bloco, e NÃO pela entrega genérica abaixo.
     *
     * A entrega genérica grava a primeira leitura como verdadeira antes de
     * qualquer coisa. Quando a mentira caía no PRIMEIRO nome, ela saía marcada
     * como verdadeira e a partida ficava com duas leituras honestas — a variante
     * virava uma Vidente que enxerga duas pessoas por noite, o que é muito mais
     * forte do que a carta diz.
     */
    if (ator.varianteId === 'confusa') {
      /**
       * As duas visões saem de `visoesDaConfusa`, e não de um sorteio local.
       *
       * A resposta imediata da passagem usa a MESMA função. Enquanto cada lado
       * decidia por conta própria, a tela mostrava duas leituras verdadeiras e
       * a noite seguinte entregava a versão com a mentira — dava para achar a
       * falsa por comparação, que é o oposto do que a variante quer.
       */
      const visoes = visoesDaConfusa(antes, ator.id, acao.alvos);
      if (visoes.length < 2) continue;

      for (const v of visoes) {
        estado = entregarInfo(estado, {
          rodada: estado.rodada,
          paraId: ator.id,
          origem: 'vidente',
          texto: v.texto,
          verdadeira: v.verdadeira,
          sobre: [v.alvoId],
        });
      }

      estado = {
        ...estado,
        players: estado.players.map((x) => (x.id === ator.id ? { ...x, semVoto: true } : x)),
      };
      const mentira = visoes.find((v) => !v.verdadeira)!;
      ctx.log.registrar('informacao', {
        mensagem: `${ator.nome} teve duas visões; a falsa foi sobre ${nome(antes, mentira.alvoId)}.`,
        motivo: 'Variante Vidente Confusa: ela não sabe qual das duas mentiu.',
        atores: [ator.id],
        alvos: visoes.map((v) => v.alvoId),
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

  /**
   * Máscara de Luto, cobrada no fim da noite.
   *
   * A condição é "se nenhuma morte acontecer naquela noite", e antes da etapa 8
   * não há como saber. Esta é a última etapa da noite, então aqui a resposta já
   * é definitiva — e a imunidade vale para a noite seguinte, como todas as
   * outras do Lobo Sombra.
   */
  const mascarados = estado.players.filter(
    (p) => p.status === 'vivo' && p.roleId === 'lobo-sombra' && p.varianteId === 'mascara-de-luto',
  );
  if (mascarados.length > 0) {
    const morreuAlguem = estado.players.some((p) => p.mortoNaRodada === estado.rodada);
    for (const m of mascarados) {
      // Só vale para quem gastou o uso nesta noite: `usosRestantes` caiu a zero
      // na etapa 5, e sem essa checagem a imunidade viria de graça toda noite.
      if (m.usosRestantes > 0) continue;
      if (morreuAlguem) {
        ctx.log.registrar('informacao', {
          mensagem: `A Máscara de Luto de ${m.nome} não pegou.`,
          motivo: 'Alguém morreu esta noite: a condição da variante falhou.',
          atores: [m.id],
        });
        continue;
      }
      estado = agendar(estado, {
        kind: 'imune-investigacao',
        naRodada: estado.rodada + 1,
        playerId: m.id,
      });
      ctx.log.registrar('informacao', {
        mensagem: `${m.nome} some da investigação amanhã.`,
        motivo: 'Variante Máscara de Luto: ninguém morreu esta noite.',
        atores: [m.id],
      });
    }
  }

  return { ...ctx, estado };
};
