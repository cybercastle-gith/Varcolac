import type { StepFn } from '../night-pipeline';
import { role } from '../../data/roles/index';
import { acoesDe, nome } from './_helpers';

/**
 * Etapa 1 — o ponto de partida da noite.
 *
 * Os vínculos e a troca do Ladrão já foram resolvidos em `criarPartida`, antes
 * da primeira passagem do celular.
 *
 * O que esta etapa FAZ de fato é limpar o evento da noite anterior. Isso não é
 * arrumação: `eventoDaNoite` é lido por cinco etapas (cota da matilha,
 * anula-protecoes, silencia-role, cancela-etapas) e, enquanto ele não era
 * zerado, o evento sorteado na noite 1 continuava valendo em TODAS as noites
 * seguintes — a matilha ficava presa na cota daquele evento e roles silenciadas
 * nunca voltavam a agir.
 */
export const estadoInicial: StepFn = (ctx) => {
  const vivos = ctx.estado.players.filter((p) => p.status === 'vivo').length;
  ctx.log.registrar('estado-inicial', {
    mensagem: `Noite ${ctx.estado.rodada} começa com ${vivos} jogadores vivos.`,
    motivo: 'Vínculos e trocas foram resolvidos na atribuição de roles.',
  });
  // O evento em vigor NÃO é mexido aqui: quem promove o anunciado e limpa o
  // anterior é `prepararNoite`, antes de o aparelho começar a circular.
  let estado = ctx.estado;

  /**
   * O juramento do Vingador.
   *
   * Ele é a única role que age nesta etapa, e só na noite 1. A escolha vira
   * `objetivosSecretos`, que é onde a checagem de vitória vai procurar depois.
   */
  for (const acao of acoesDe(ctx, 'estado-inicial')) {
    const ator = estado.players.find((p) => p.id === acao.actorId);
    const alvo = acao.alvos[0];
    if (!ator || !alvo) continue;

    /**
     * A troca do Ladrão, escolhida por ele.
     *
     * Saiu de `criarPartida` em 2026-09-26. A consequência prática de estar
     * aqui: o Ladrão VÊ a própria carta de Ladrão na revelação da noite 1 e só
     * depois troca — antes ele já acordava com a carta trocada e nunca soube que
     * era o Ladrão.
     *
     * A troca muda a FACÇÃO, porque a carta muda de mão inteira: um Ladrão que
     * rouba um Lobo passa a jogar pelos lobos. É o que `alinhamento: 'herda'`
     * sempre quis dizer.
     */
    if (ator.roleId === 'ladrao') {
      const alvoP = estado.players.find((p) => p.id === alvo);
      if (!alvoP) continue;

      if (ator.varianteId === 'troca-forcada') {
        const outro = acao.alvos[1] ? estado.players.find((p) => p.id === acao.alvos[1]) : undefined;
        if (!outro) continue;
        estado = {
          ...estado,
          players: estado.players.map((p) =>
            p.id === alvoP.id
              ? { ...p, roleId: outro.roleId }
              : p.id === outro.id
                ? { ...p, roleId: alvoP.roleId }
                : p,
          ),
          objetivosSecretos: {
            ...estado.objetivosSecretos,
            [ator.id]: `você trocou as cartas de ${alvoP.nome} e ${outro.nome}`,
          },
        };
        ctx.log.registrar('estado-inicial', {
          mensagem: `${ator.nome} trocou as cartas de ${alvoP.nome} e ${outro.nome}.`,
          motivo: 'Variante Troca Forçada: ele embaralha os outros e continua Ladrão.',
          atores: [ator.id],
          alvos: [alvoP.id, outro.id],
        });
        continue;
      }

      if (ator.varianteId === 'contaminacao') {
        estado = {
          ...estado,
          players: estado.players.map((p) => {
            if (p.id !== alvoP.id) return p;
            const { varianteId: _v, ...semVariante } = p;
            return { ...semVariante, roleId: 'ladrao' };
          }),
          objetivosSecretos: {
            ...estado.objetivosSecretos,
            [ator.id]: `você contaminou ${alvoP.nome}`,
            [alvoP.id]: 'você foi contaminado: agora também é Ladrão',
          },
        };
        ctx.log.registrar('estado-inicial', {
          mensagem: `${ator.nome} contaminou ${alvoP.nome}.`,
          motivo: 'Variante Contaminação: o alvo vira um segundo Ladrão.',
          atores: [ator.id],
          alvos: [alvoP.id],
        });
        continue;
      }

      const nomeRoubado = role(alvoP.roleId).nome;
      estado = {
        ...estado,
        players: estado.players.map((p) =>
          p.id === ator.id
            ? { ...p, roleId: alvoP.roleId }
            : p.id === alvoP.id
              ? { ...p, roleId: 'ladrao' }
              : p,
        ),
        objetivosSecretos: {
          ...estado.objetivosSecretos,
          // Diz QUAL carta, e não só que houve roubo: "roubou a role de Davi"
          // não informava nada a quem não sabe o que Davi era.
          [ator.id]: `você roubou a carta de ${alvoP.nome}: agora é ${nomeRoubado}`,
        },
      };
      ctx.log.registrar('estado-inicial', {
        mensagem: `${ator.nome} roubou a carta de ${alvoP.nome} (${nomeRoubado}).`,
        motivo: 'Escolha do jogador na noite 1. A facção acompanha a carta.',
        atores: [ator.id],
        alvos: [alvoP.id],
      });
      continue;
    }

    if (ator.roleId !== 'vingador') continue;
    estado = {
      ...estado,
      objetivosSecretos: { ...estado.objetivosSecretos, [ator.id]: alvo },
    };
    ctx.log.registrar('estado-inicial', {
      mensagem: `${ator.nome} jurou vingança contra ${nome(estado, alvo)}.`,
      motivo: 'Vitória passiva: basta que o alvo morra, por qualquer causa.',
      atores: [ator.id],
      alvos: [alvo],
    });
  }

  return { ...ctx, estado };
};
