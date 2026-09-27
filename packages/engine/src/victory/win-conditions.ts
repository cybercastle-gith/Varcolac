import type { GameState } from '../types/game-state';
import { vivos } from '../types/game-state';
import type { Player, PlayerId } from '../types/player';
import { countsAsWolf, countsAsVillage, type ResolvedAlignment } from '../types/faction';
import { role } from '../data/roles/index';
import { MISSOES_POR_ID } from '../data/missions';
import { faccaoEfetiva } from '../turn/faccao';

/** Vitórias são em camadas: a vila pode vencer e o Bobo também. */
export type VictoryLayer = 'vila' | 'lobos' | 'solitario';

export interface VictoryClaim {
  readonly camada: VictoryLayer;
  readonly vencedores: readonly PlayerId[];
  readonly motivo: string;
}

export interface VictoryResult {
  readonly encerrada: boolean;
  readonly camadas: readonly VictoryClaim[];
}

/**
 * Alinhamento já resolvido de um jogador.
 *
 * `herda` (Ladrão) e `definido-em-jogo` (Bruxa) só existem até a partida
 * começar: a troca do Ladrão acontece na criação e ele passa a ter a role
 * roubada, e a poção da Bruxa fica em `objetivosSecretos`. O que sobra aqui é
 * o caso da Bruxa, resolvido pela poção.
 */
function alinhamento(estado: GameState, p: Player): ResolvedAlignment | undefined {
  const a = role(p.roleId).alinhamento;
  if (a === 'bem' || a === 'mal' || a === 'puro') return a;
  if (a === 'definido-em-jogo') {
    return estado.objetivosSecretos[p.id] === 'pocao-morte' ? 'mal' : 'bem';
  }
  return a === undefined ? undefined : 'puro';
}

function lado(estado: GameState, p: Player): 'vila' | 'lobos' | 'neutro' {
  // `faccaoEfetiva`, não `role(p.roleId).faccao`: o convertido conta para a
  // paridade do lado novo. Sem isso, converter meia mesa não mudava o placar.
  const faccao = faccaoEfetiva(estado, p);
  const a = alinhamento(estado, p);
  if (countsAsWolf(faccao, a)) return 'lobos';
  if (countsAsVillage(faccao, a)) return 'vila';
  return 'neutro';
}

/** Camadas paralelas: valem quando a partida termina, junto de quem venceu. */
function camadasDeSolitarios(estado: GameState, vivosAgora: readonly Player[]): VictoryClaim[] {
  const claims: VictoryClaim[] = [];

  const sobreviventes = vivosAgora.filter(
    (p) => p.roleId === 'sobrevivente' && disputaVitoriaPropria(p),
  );
  if (sobreviventes.length > 0) {
    claims.push({
      camada: 'solitario',
      vencedores: sobreviventes.map((p) => p.id),
      motivo: 'Sobrevivente vivo no fim: vence com qualquer vencedor.',
    });
  }

  // Vingador: vence se o alvo escolhido na noite 1 morreu, por qualquer causa.
  for (const p of estado.players.filter((x) => x.roleId === 'vingador')) {
    const alvoId = estado.objetivosSecretos[p.id];
    const alvo = alvoId ? estado.players.find((x) => x.id === alvoId) : undefined;
    if (alvo?.status !== 'morto') continue;

    /**
     * Vingança da Praça: só vale se a VILA o matou.
     *
     * O Vingador base ganha de graça quando a matilha faz o trabalho por ele.
     * Esta variante o obriga a convencer a mesa, que é a única parte difícil da
     * role — e por isso ela devia pesar mais que a base, não igual.
     */
    if (p.varianteId === 'vinganca-da-praca' && alvo.causaMorte !== 'linchamento') {
      claims.push({
        camada: 'solitario',
        vencedores: [],
        motivo: `Vingador: ${alvo.nome} morreu, mas não pela corda. A Vingança da Praça não conta.`,
      });
      continue;
    }

    claims.push({
      camada: 'solitario',
      vencedores: [p.id],
      motivo: `Vingador: ${alvo.nome} morreu. Vitória passiva.`,
    });
  }

  /**
   * Contaminação: o Ladrão original vence sozinho se só sobrarem Ladrões.
   *
   * A condição é extrema de propósito — precisa de uma mesa que já se dizimou
   * até sobrarem duas pessoas e as duas serem Ladrões.
   */
  const ladroesVivos = vivosAgora.filter((p) => p.roleId === 'ladrao');
  if (ladroesVivos.length > 0 && ladroesVivos.length === vivosAgora.length) {
    const original = estado.players.find(
      (p) => p.varianteId === 'contaminacao' && p.roleId === 'ladrao',
    );
    if (original) {
      claims.push({
        camada: 'solitario',
        vencedores: [original.id],
        motivo: 'Contaminação: todos os vivos são Ladrões. O original vence sozinho.',
      });
    }
  }

  /**
   * Coringa: a missão, e não a carta, é o que define quem disputa.
   *
   * A varredura é por `objetivosSecretos`, não por `roleId === 'coringa'`,
   * porque a variante Missão Partida entrega a segunda missão a um jogador
   * qualquer da mesa — que passa a ter vitória própria sem nunca ter recebido
   * a carta do Coringa.
   */
  for (const p of estado.players) {
    const missao = MISSOES_POR_ID.get(estado.objetivosSecretos[p.id] ?? '');
    if (!missao) continue;

    // Missão Sem Volta: passou do prazo, ele virou Aldeão e não disputa mais.
    if (p.marcas.virouAldeao) {
      claims.push({
        camada: 'solitario',
        vencedores: [],
        motivo: `${p.nome} perdeu a missão no prazo e virou Aldeão comum.`,
      });
      continue;
    }

    const cumpriu = julgarMissao(estado, p, missao.verificacao);

    if (cumpriu === true) {
      claims.push({
        camada: 'solitario',
        vencedores: [p.id],
        motivo: `${p.nome} cumpriu a missão: ${missao.texto}`,
      });
      continue;
    }

    /**
     * Missão Herdada: quem o condenou herda a missão dele.
     *
     * É a única forma de vitória do jogo que muda de dono depois da morte, e o
     * herdeiro nem fica sabendo — a missão é julgada pelo comportamento dele,
     * que ele teve sem saber que estava sendo julgado.
     */
    if (p.status === 'morto' && p.varianteId === 'missao-herdada') {
      const ultimoVoto = [...estado.historicoVotos]
        .reverse()
        .flatMap((v) => Object.entries(v.votos).filter(([, alvo]) => alvo === p.id))
        .map(([quem]) => quem)[0];
      const herdeiro = ultimoVoto ? estado.players.find((x) => x.id === ultimoVoto) : undefined;
      if (herdeiro && julgarMissao(estado, herdeiro, missao.verificacao) === true) {
        claims.push({
          camada: 'solitario',
          vencedores: [herdeiro.id],
          motivo: `Missão Herdada: ${herdeiro.nome} votou em ${p.nome} e cumpriu a missão dele.`,
        });
        continue;
      }
    }

    if (cumpriu === null) {
      claims.push({
        camada: 'solitario',
        vencedores: [],
        motivo: `Missão de ${p.nome}: "${missao.texto}" é julgada na mesa, pelo host.`,
      });
    }
  }

  return claims;
}

/**
 * A missão foi cumprida? `null` quando só o host consegue dizer.
 *
 * Extraído porque a Missão Herdada julga a MESMA missão para outra pessoa, e
 * duas cópias da regra divergiriam no primeiro critério novo.
 */
function julgarMissao(
  estado: GameState,
  p: Player,
  verificacao: 'sobreviver' | 'morrer-de-noite' | 'nunca-votar' | 'manual',
): boolean | null {
  switch (verificacao) {
    case 'sobreviver':
      return p.status === 'vivo';
    case 'morrer-de-noite':
      return p.status === 'morto' && p.causaMorte !== 'linchamento';
    case 'nunca-votar':
      return estado.historicoVotos.every((v) => !v.votos[p.id]);
    default:
      return null;
  }
}

/**
 * Regras (seção 4 do dossiê):
 * - Vila vence eliminando todas as ameaças.
 * - Lobos vencem ao SUPERAR a vila em número (igualar não basta — ver o corpo).
 * - Solitários do mal contam como lobos na paridade.
 * - Lobo Branco pode vencer sozinho ou junto com a matilha.
 * - Bobo vence ao ser linchado, e isso encerra a partida na votação, não aqui.
 */
/**
 * O jogador ainda disputa a vitória PRÓPRIA dele?
 *
 * Não, quando ele voltou da morte sem habilidade (Cova Aberta) ou virou Aldeão
 * comum (Herança Amarga, Bobo Desesperado, Missão Sem Volta). Para o Bobo a
 * "habilidade" É a vitória por linchamento — um Bobo ressuscitado sem poder que
 * continuasse ganhando na corda tornaria a Cova Aberta um presente para ele, o
 * oposto do que a carta diz.
 */
export function disputaVitoriaPropria(p: Player): boolean {
  return p.marcas.semPoder !== true && p.marcas.virouAldeao !== true;
}

export function verificarVitoria(estado: GameState): VictoryResult {
  // Uma vitória já declarada (o Bobo) não é reavaliada.
  if (estado.vencedores) {
    return {
      encerrada: true,
      camadas: [
        { camada: 'solitario', vencedores: estado.vencedores, motivo: 'Vitória já declarada.' },
      ],
    };
  }

  const vivosAgora = vivos(estado);
  const camadas: VictoryClaim[] = [];

  const lobosVivos = vivosAgora.filter((p) => lado(estado, p) === 'lobos');
  /**
   * Para a paridade, TODO mundo que não é lobo conta contra a matilha.
   *
   * Antes só `lado === 'vila'` contava, e os solitários puros (Bobo,
   * Sobrevivente, Coringa) ficavam de fora da conta dos dois lados. O efeito
   * era uma matilha vencendo com 2 × 1 numa mesa em que ainda havia três
   * pessoas vivas — porque duas delas eram neutras e simplesmente não existiam
   * no placar. Decisão do usuário em 2026-09-26: os lobos têm de superar o
   * número de jogadores que não são lobos.
   */
  const naoLobos = vivosAgora.filter((p) => lado(estado, p) !== 'lobos');
  const vilaViva = vivosAgora.filter((p) => lado(estado, p) === 'vila');

  /**
   * No modo Traição a mesa começa SEM lobo nenhum, de propósito.
   *
   * A matilha nasce na primeira conversão, no amanhecer. Sem esta guarda, a
   * checagem via "zero lobos vivos" e declarava a vila vencedora no fim da
   * noite 1 — a partida acabava antes de o modo começar a existir.
   */
  const traicaoAindaVaiConverter =
    estado.config.modo === 'traicao' &&
    lobosVivos.length === 0 &&
    vivosAgora.length > 2;

  if (traicaoAindaVaiConverter) {
    return { encerrada: false, camadas: [] };
  }

  if (lobosVivos.length === 0) {
    camadas.push({
      camada: 'vila',
      vencedores: vilaViva.map((p) => p.id),
      motivo: 'Nenhuma ameaça restante.',
    });
  } else if (lobosVivos.length > naoLobos.length) {
    // SUPERAR, não igualar.
    //
    // O dossiê dizia "igualar ou superar", e isso foi mudado a pedido do
    // usuário em 2026-09-25: empate numérico encerrava a partida cedo demais e
    // tirava da vila o dia que ela ainda tinha para votar.
    //
    // Não gera partida infinita: no 1 × 1 a noite seguinte resolve — o lobo
    // mata e passa a superar. O que o empate ganha é exatamente um dia de
    // votação a mais, que é o ponto.
    // O Lobo Branco joga contra a própria matilha: se sobrou só ele, vence só.
    const soLoboBranco = lobosVivos.length === 1 && lobosVivos[0]!.roleId === 'lobo-branco';
    camadas.push({
      camada: 'lobos',
      vencedores: lobosVivos.map((p) => p.id),
      motivo: soLoboBranco
        ? 'O Lobo Branco sobrou sozinho: vence sem a matilha.'
        : `Matilha superou o resto da mesa: ${lobosVivos.length} × ${naoLobos.length}.`,
    });
  }

  const encerrada = camadas.length > 0;
  if (encerrada) camadas.push(...camadasDeSolitarios(estado, vivosAgora));

  return { encerrada, camadas };
}

/** Aplica o resultado ao estado, para o app e o laboratório lerem um só campo. */
export function encerrarSeAcabou(estado: GameState): GameState {
  const r = verificarVitoria(estado);
  if (!r.encerrada) return estado;
  return {
    ...estado,
    fase: 'fim',
    vencedores: [...new Set(r.camadas.flatMap((c) => c.vencedores))],
  };
}
