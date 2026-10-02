import { role } from '../../data/roles/index';
import { usosIniciais } from '../../types/role';
import { trocarCarta } from '../../turn/troca-de-carta';
import type { StepFn } from '../night-pipeline';
import { acoesDe, agendar, anunciar, gastarUso, gravar, nome, reviver, temUso } from './_helpers';

/**
 * Etapa 10 — Necromante. APENAS mortes de noites ANTERIORES.
 *
 * Não desfaz estertores já disparados: se o Caçador atirou, o tiro vale. Isso
 * cai de graça da ordem das etapas — a 9 já rodou, e a cadeia não é revisitada.
 */
export const ressurreicao: StepFn = (ctx) => {
  /**
   * A Última Vela alcança QUALQUER noite; as outras, só a anterior.
   *
   * O corte aqui é o mesmo do roteiro, e tem de ser: se a tela oferecesse um
   * morto que a etapa depois recusa, o Necromante gastaria o único uso da
   * partida num nome inválido.
   */
  const necromantes = ctx.estado.players.filter((p) => p.roleId === 'necromante');
  const alcanceTotal = necromantes.some((p) => p.varianteId === 'ultima-vela');
  const elegiveis = ctx.estado.players.filter(
    (p) =>
      p.status === 'morto' && (alcanceTotal ? true : (p.mortoNaRodada ?? 0) < ctx.estado.rodada),
  );

  if (elegiveis.length === 0) {
    ctx.log.ignorar('ressurreicao', 'Nenhuma morte de noite anterior para desfazer.');
    return ctx;
  }

  const acoes = acoesDe(ctx, 'ressurreicao');
  if (acoes.length === 0) {
    ctx.log.ignorar('ressurreicao', 'O Necromante não agiu esta noite.');
    return ctx;
  }

  let estado = ctx.estado;

  for (const acao of acoes) {
    const alvo = acao.alvos[0];
    if (!alvo) continue;

    if (!temUso(estado, acao.actorId)) {
      ctx.log.registrar('ressurreicao', {
        mensagem: `${nome(estado, acao.actorId)} já ressuscitou alguém nesta partida.`,
        motivo: 'Uma vez por partida.',
        atores: [acao.actorId],
      });
      continue;
    }

    const morto = estado.players.find((p) => p.id === alvo);
    if (!morto || morto.status === 'vivo') continue;

    const ator = estado.players.find((p) => p.id === acao.actorId)!;
    const varianteN = ator.varianteId;

    if (varianteN !== 'ultima-vela' && (morto.mortoNaRodada ?? 0) >= estado.rodada) {
      ctx.log.registrar('ressurreicao', {
        mensagem: `${morto.nome} não pode voltar.`,
        motivo: 'Morreu nesta mesma noite; o Necromante só desfaz noites anteriores.',
        atores: [acao.actorId],
        alvos: [alvo],
      });
      continue;
    }

    /**
     * A Incorporação NÃO ressuscita: ela absorve.
     *
     * Decisão do usuário em 2026-09-28. A carta dizia "ressuscita um morto E
     * utiliza sua habilidade", e as duas coisas juntas faziam dela a
     * ressurreição do Necromante base MAIS um poder de brinde — a variante mais
     * forte do jogo, com o mesmo peso das outras duas.
     *
     * Incorporar é tomar do morto o que ele sabia. O corpo fica na cova, e é
     * por isso que ela cabe na etapa de ressurreição sem ser uma.
     */
    if (varianteN !== 'incorporacao') estado = reviver(estado, alvo);
    estado = gastarUso(estado, acao.actorId);
    /*
     * "Fulano voltou." era tudo que a mesa ouvia quando um morto se levantava
     * — a coisa mais rara do jogo, dita no mesmo tom de um comentário de
     * clima. Relatado assim: "ressuscitou o cara e aparece só um texto broxa".
     */
    estado =
      varianteN === 'incorporacao'
        ? anunciar(
            estado,
            'O Necromante tomou para si a função de um morto esta noite.',
            'role',
            { rotulo: 'Função tomada' },
          )
        : anunciar(estado, `${morto.nome} ressuscitou e voltou ao jogo.`, 'role', {
            rotulo: 'Ressurreição',
          });

    let motivo = 'Morte de noite anterior. Estertores já disparados continuam valendo.';

    switch (varianteN) {
      /**
       * Cova Aberta: volta o corpo, não o poder.
       *
       * O ressuscitado recupera voz e voto — que num jogo de dedução é a maior
       * parte do valor de estar vivo — e perde a habilidade. É a ressurreição
       * barata, e é por isso que pesa menos que a do Necromante base.
       */
      case 'cova-aberta':
        /**
         * Cova Aberta troca a CARTA, não só a habilidade.
         *
         * `semPoder` deixava o jogador com a carta antiga na mão e nenhuma
         * ação — ele continuava "sendo" a Vidente na tela final, no ícone e na
         * revelação ao morrer. Relatado assim: "o cara continua com a role
         * dele, ele tem que virar aldeão". Agora vira mesmo.
         */
        estado = trocarCarta(estado, alvo, {
          roleId: 'aldeao',
          usos: Infinity,
          motivo: 'Você voltou da cova, e não trouxe nada com você.',
        });
        estado = anunciar(
          estado,
          `${morto.nome} voltou sem a função que tinha: agora é um Aldeão comum.`,
          'role',
          { rotulo: 'Perdeu a função' },
        );
        motivo = 'Variante Cova Aberta: ele volta como Aldeão, com voz e voto e mais nada.';
        break;

      /**
       * Última Vela: alcança qualquer morto, e o empresta por um dia só.
       *
       * Serve para uma coisa: trazer de volta quem sabia alguma coisa, ouvir o
       * que ele tem a dizer, e votar com ele. Ao fim do dia a vela apaga.
       */
      case 'ultima-vela':
        estado = agendar(estado, {
          kind: 'expira-no-fim-do-dia',
          naRodada: estado.rodada,
          playerId: alvo,
        });
        estado = anunciar(
          estado,
          `${morto.nome} ressuscitou só por hoje: morre de novo no fim do dia.`,
          'role',
          { rotulo: 'Ressurreição por um dia' },
        );
        motivo = 'Variante Última Vela: qualquer noite serve, mas ele morre de novo ao fim do dia.';
        break;

      /**
       * Incorporação: o Necromante VIRA a carta do morto.
       *
       * SUPERADO em 2026-10-02: era `marcas.poderDe` — o Necromante agia com o
       * poder do morto, mas a carta na mão, o ícone e a descrição continuavam
       * de Necromante, e a tela de "sua carta mudou" nunca aparecia. Decisão do
       * usuário: toda transformação troca a carta inteira, como o Herdeiro e a
       * Troca com Mortos. Com a carta vem o lado: incorporar um lobo faz dele
       * um lobo.
       */
      case 'incorporacao': {
        const novaRole = role(morto.roleId);
        estado = trocarCarta(estado, ator.id, {
          roleId: morto.roleId,
          ...(morto.varianteId ? { varianteId: morto.varianteId } : {}),
          usos: usosIniciais(novaRole.usoLimitado),
          motivo: `Você incorporou ${morto.nome}. Agora a carta dele é a sua.`,
        });
        motivo =
          `Variante Incorporação: ${ator.nome} virou ${novaRole.nome}, a carta de ` +
          `${morto.nome}. O morto CONTINUA morto.`;
        break;
      }

      default:
        break;
    }

    ctx.log.registrar('ressurreicao', {
      mensagem: `${nome(estado, acao.actorId)} ressuscitou ${morto.nome}.`,
      motivo,
      atores: [acao.actorId],
      alvos: [alvo],
    });
  }

  return { ...ctx, estado };
};
