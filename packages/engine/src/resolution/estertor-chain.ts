import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { role } from '../data/roles/index';
import { nomeDaCarta } from '../types/role';
import {
  agendar,
  anunciar,
  gravar,
  marcar,
  matar,
  nome as nomeDe,
  reviver,
} from './steps/_helpers';
import { trocarCarta } from '../turn/troca-de-carta';

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
/**
 * O nome que este morto tinha declarado, venha de onde vier.
 *
 * `declarados` é o mapa da NOITE em curso; `marcas.levaJunto` é a declaração
 * que atravessou as noites. A cadeia do dia é chamada sem o mapa, e sem a
 * marca a escolha do jogador sumia exatamente quando ele era linchado.
 */
function escolhaDe(
  morto: { readonly id: PlayerId; readonly marcas: { readonly levaJunto?: PlayerId } },
  declarados: ReadonlyMap<PlayerId, PlayerId>,
): PlayerId | undefined {
  return declarados.get(morto.id) ?? morto.marcas.levaJunto;
}

export function dispararEstertores(
  estadoInicial: GameState,
  iniciais: readonly PlayerId[],
  declarados: ReadonlyMap<PlayerId, PlayerId> = new Map(),
  /**
   * Quem matou quem, quando se sabe.
   *
   * Só o Sangue Derramado do Carniçal precisa disto, e só a noite sabe
   * responder: no linchamento quem matou foi a mesa, e punir "a mesa" não
   * significa nada. Por isso o mapa vem vazio a partir da votação, e a variante
   * simplesmente não dispara quando o Carniçal é enforcado.
   */
  culpados: ReadonlyMap<PlayerId, PlayerId> = new Map(),
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

    if (r.id === 'cacador') {
      if (morto.varianteId === 'ultimo-uivo') {
        const alvo = escolhaDe(morto, declarados) ?? candidatos[0]?.id;
        if (alvo) {
          const alvoP = estado.players.find((p) => p.id === alvo)!;
          estado = anunciar(
            estado,
            `${alvoP.nome} é ${nomeDaCarta(role(alvoP.roleId), alvoP.varianteId)}.`,
            'role',
          );
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

      const escolhido = escolhaDe(morto, declarados) ?? elegiveis[0]?.id;
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
      /**
       * Morto-Vivo: ele não leva ninguém e não expira — ele fica.
       *
       * Um lobo que morreu e continua falando é a coisa mais perigosa que a
       * matilha tem: a vila já o descartou como ameaça e continua ouvindo. Em
       * compensação ele não mata, não vota e não age nunca mais.
       */
      if (morto.varianteId === 'morto-vivo') {
        /**
         * Ele NÃO sai do jogo na primeira morte.
         *
         * A carta diz "continua em jogo (...) e pode ser morto novamente", e
         * isso não é enfeite narrativo: enquanto ele estiver em jogo, a matilha
         * ainda tem um representante na contagem. Relatado em mesa: o
         * Carniceiro Morto-Vivo foi linchado, virou "morto", e a vila venceu na
         * hora com um lobo ainda sentado à mesa.
         *
         * Volta a `vivo` com `mortoVivo` e `semPoder`: conta na paridade, fala,
         * e não age nem vota (ver `elegiveisParaVotar` e `acoesDe`). A segunda
         * morte é definitiva, porque aí `mortoVivo` já está gravado e este
         * ramo não roda de novo.
         */
        if (!morto.marcas.mortoVivo) {
          estado = reviver(estado, id);
          estado = gravar(estado, id, { mortoVivo: true, semPoder: true });
          estado = anunciar(
            estado,
            `${morto.nome} morreu, mas continua no jogo como morto-vivo: pode falar, mas não vota nem usa poder.`,
            'role',
            { rotulo: 'Morto-vivo' },
          );
          registros.push({
            mensagem: `${morto.nome} virou morto-vivo.`,
            motivo:
              'Variante Morto-Vivo: a primeira morte não o tira do jogo. Ele fala, não age, ' +
              'não vota, e ainda conta para a matilha até morrer de novo.',
            atores: [id],
            alvos: [],
          });
          continue;
        }

        estado = gravar(estado, id, { mortoVivo: true });
        estado = anunciar(estado, `${morto.nome} morreu de novo e saiu do jogo.`, 'role');
        registros.push({
          mensagem: `${morto.nome} virou morto-vivo.`,
          motivo: 'Variante Morto-Vivo: fala à mesa, mas não mata, não vota e não age.',
          atores: [id],
          alvos: [],
        });
        continue;
      }

      /**
       * Sangue Derramado: o assassino paga com o próprio poder.
       *
       * A punição é para a noite seguinte porque é quando o poder seria usado —
       * e porque o Carniçal já está morto: o castigo é o rastro dele, não a
       * ação dele.
       */
      if (morto.varianteId === 'sangue-derramado') {
        const culpado = culpados.get(id);
        const quem = culpado ? estado.players.find((x) => x.id === culpado) : undefined;
        if (quem) {
          estado = agendar(estado, {
            kind: 'bloqueado-na-noite',
            naRodada: estado.rodada + 1,
            playerId: quem.id,
            preso: false,
          });
          registros.push({
            mensagem: `${quem.nome} perde o poder na próxima noite.`,
            motivo: `Variante Sangue Derramado: matou o Carniçal ${morto.nome}.`,
            atores: [id],
            alvos: [quem.id],
          });
        } else {
          registros.push({
            mensagem: `${morto.nome} morreu sem saber quem o matou.`,
            motivo: 'Variante Sangue Derramado: sem um culpado único (linchamento), ninguém paga.',
            atores: [id],
            alvos: [],
          });
        }
        estado = agendar(estado, { kind: 'expira', naRodada: estado.rodada + 1, playerId: id });
        continue;
      }

      /**
       * Última Carne: ele não mata agora, ele aposta.
       *
       * A escolha do alvo é declarada na passagem da noite seguinte, já morto
       * (ver a etapa 9). Aqui só se registra que ele NÃO levou ninguém junto —
       * é esse o troco da chance de voltar.
       */
      if (morto.varianteId === 'ultima-carne') {
        registros.push({
          mensagem: `${morto.nome} caiu sem levar ninguém.`,
          motivo: 'Variante Última Carne: na próxima noite ele aposta num nome para poder voltar.',
          atores: [id],
          alvos: [],
        });
        continue;
      }

      const escolhido = escolhaDe(morto, declarados) ?? candidatos[0]?.id;
      if (escolhido) abater(escolhido, `O Carniçal ${morto.nome} levou alguém junto.`, id);
      // "Não morre na hora": a expiração adiada é o vestígio dessa noite extra.
      estado = agendar(estado, { kind: 'expira', naRodada: estado.rodada + 1, playerId: id });
      continue;
    }

    /**
     * Laço de Sangue: o Vingador leva o alvo do juramento com ele.
     *
     * O Vingador base vence se o alvo morrer por qualquer causa e não faz nada
     * para que isso aconteça. Esta variante garante a vitória dele no pior
     * cenário possível — morrer — e faz de matá-lo uma decisão cara para a
     * matilha e para a vila.
     */
    if (r.id === 'vingador' && morto.varianteId === 'laco-de-sangue') {
      const jurado = estado.objetivosSecretos[id];
      if (jurado) {
        abater(jurado, `Laço de Sangue: ${morto.nome} jurou vingança e não morreu sozinho.`, id);
      } else {
        registros.push({
          mensagem: `${morto.nome} morreu sem ter jurado contra ninguém.`,
          motivo: 'Variante Laço de Sangue, sem alvo declarado.',
          atores: [id],
          alvos: [],
        });
      }
      continue;
    }

    /**
     * Laço de Sangue: o Vingador leva o alvo do juramento com ele.
     *
     * O Vingador base vence se o alvo morrer por qualquer causa e não faz nada
     * para que isso aconteça. Esta variante garante a vitória dele no pior
     * cenário possível — morrer — e faz de matá-lo uma decisão cara para a
     * matilha e para a vila.
     */
    if (r.id === 'vingador' && morto.varianteId === 'laco-de-sangue') {
      const jurado = estado.objetivosSecretos[id];
      if (jurado) {
        abater(jurado, `Laço de Sangue: ${morto.nome} jurou vingança e não morreu sozinho.`, id);
      } else {
        registros.push({
          mensagem: `${morto.nome} morreu sem ter jurado contra ninguém.`,
          motivo: 'Variante Laço de Sangue, sem alvo declarado.',
          atores: [id],
          alvos: [],
        });
      }
      continue;
    }

    if (r.id === 'ancia') {
      const escolhido = escolhaDe(morto, declarados) ?? morto.marcas.alvoTravado;
      const amanha = estado.rodada + 1;

      switch (morto.varianteId) {
        /**
         * Testamento: a Anciã aponta um herdeiro antes de cair.
         *
         * "Ao morrer, escolhe" é impossível num pass-and-play — o morto não
         * recebe mais o aparelho. A escolha é declarada em vida, na passagem da
         * noite, e fica guardada até fazer falta. O herdeiro é o único que
         * atravessa a suspensão.
         */
        case 'testamento':
          estado = agendar(estado, {
            kind: 'poderes-suspensos',
            naRodada: amanha,
            ...(escolhido ? { exceto: escolhido } : {}),
          });
          estado = anunciar(
            estado,
            'A Anciã morreu: na próxima noite, ninguém da vila usa poder, exceto uma pessoa.',
            'role',
          );
          registros.push({
            mensagem: escolhido
              ? `${morto.nome} deixou o poder com ${estado.players.find((x) => x.id === escolhido)?.nome ?? '?'}.`
              : `${morto.nome} morreu sem nomear herdeiro.`,
            motivo: 'Variante Testamento: um jogador escapa da suspensão dos poderes.',
            atores: [id],
            alvos: escolhido ? [escolhido] : [],
          });
          break;

        /**
         * Luto da Vila: a queda alcança a matilha também.
         *
         * A Anciã base pune só a vila, o que faz de matá-la um bom negócio para
         * os lobos. Nesta variante matá-la custa a eles a própria noite
         * seguinte, e é isso que a torna uma carta de defesa de verdade.
         */
        case 'luto-da-vila':
          estado = agendar(estado, { kind: 'poderes-suspensos', naRodada: amanha, todos: true });
          estado = anunciar(
            estado,
            'A Anciã morreu: na próxima noite, ninguém usa poder, nem os lobos.',
            'role',
          );
          registros.push({
            mensagem: `${morto.nome} era a Anciã — TODOS perdem os poderes por uma noite.`,
            motivo: 'Variante Luto da Vila: a matilha e os solitários caem junto.',
            atores: [id],
            alvos: [],
          });
          break;

        /**
         * Herança Amarga: a queda geral, e um jogador arruinado para sempre.
         *
         * O escolhido vira Aldeão e não volta atrás. É a única marca do jogo
         * que apaga uma role definitivamente, e é a razão de a Anciã ser
         * perigosa até para quem a protege.
         */
        case 'heranca-amarga':
          estado = agendar(estado, { kind: 'poderes-suspensos', naRodada: amanha, todos: true });
          if (escolhido) {
            estado = trocarCarta(estado, escolhido, {
              roleId: 'aldeao',
              usos: Infinity,
              motivo: 'A Anciã levou o seu poder junto com ela.',
            });
            estado = gravar(estado, escolhido, { virouAldeao: true });
          }
          /*
           * Quem MUDOU de papel é dito em voz alta, com o nome.
           *
           * Relatado em mesa: "não avisou quem foi transformado". Vale para
           * toda variante que troca a carta de alguém — a pessoa precisa saber
           * que perdeu o poder, e a mesa precisa saber que ela perdeu, senão
           * continua contando com uma função que não existe mais.
           */
          estado = escolhido
            ? anunciar(
                estado,
                `A Anciã morreu e tirou o poder de ${nomeDe(estado, escolhido)}. ` +
                  `${nomeDe(estado, escolhido)} é um Aldeão comum a partir de agora.`,
                'role',
                { rotulo: 'Perdeu a função' },
              )
            : anunciar(estado, 'A Anciã morreu sem escolher ninguém.', 'role');
          registros.push({
            mensagem: escolhido
              ? `${estado.players.find((x) => x.id === escolhido)?.nome ?? '?'} virou Aldeão para sempre.`
              : `${morto.nome} morreu sem apontar ninguém.`,
            motivo:
              'Variante Herança Amarga: todos perdem os poderes por uma noite, e um os perde para sempre.',
            atores: [id],
            alvos: escolhido ? [escolhido] : [],
          });
          break;

        default:
          estado = agendar(estado, { kind: 'poderes-suspensos', naRodada: amanha });
          estado = anunciar(estado, 'A Anciã morreu: na próxima noite, ninguém da vila usa poder.', 'role');
          registros.push({
            mensagem: `${morto.nome} era a Anciã — a vila perde todos os poderes por uma noite.`,
            motivo: 'Vale para morte por qualquer causa, inclusive linchamento.',
            atores: [id],
            alvos: [],
          });
          break;
      }
    }
  }

  return { estado, registros };
}
