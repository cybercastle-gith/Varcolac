import { role } from '../../data/roles/index';
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

    estado = reviver(estado, alvo);
    estado = gastarUso(estado, acao.actorId);
    estado = anunciar(estado, `${morto.nome} voltou.`, 'role');

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
        estado = gravar(estado, alvo, { semPoder: true });
        motivo = 'Variante Cova Aberta: ele volta sem a habilidade, só com voz e voto.';
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
        motivo = 'Variante Última Vela: qualquer noite serve, mas ele morre de novo ao fim do dia.';
        break;

      /**
       * Incorporação: o Necromante fica com a habilidade do morto.
       *
       * O ressuscitado volta inteiro e o Necromante passa a agir com a carta
       * dele até o fim da partida. Note que a FACÇÃO não muda: incorporar um
       * lobo dá ao Necromante o poder do lobo, e não o lado dele.
       */
      case 'incorporacao':
        estado = gravar(estado, ator.id, { poderDe: morto.roleId });
        motivo = `Variante Incorporação: ${ator.nome} passa a agir como ${role(morto.roleId).nome}, sem mudar de lado.`;
        break;

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
