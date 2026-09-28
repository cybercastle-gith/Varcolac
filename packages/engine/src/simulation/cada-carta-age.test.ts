import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type Deck, type GameConfig } from '../types/config';
import type { NightAction, NightSubmission } from '../types/action';
import type { GameState } from '../types/game-state';
import type { PlayerId } from '../types/player';
import { ROLES } from '../data/roles/index';
import { criarPartida } from '../setup/create-game';
import { prepararNoite, resolverNoite } from '../resolution/night-pipeline';
import { roteiroDaNoite, type Pergunta } from '../turn/roteiro';
import { criarRng } from '../utils/rng';

/**
 * A pergunta que eu deveria ter feito antes de dizer "revisei todas as roles".
 *
 * A revisão anterior foi uma varredura de `grep` atrás de UM padrão de defeito
 * (uso limitado que ninguém cobra). Isso não é revisar: uma carta pode ter o
 * uso cobrado direitinho e mesmo assim não fazer nada, porque a etapa que a
 * resolveria nunca é alcançada, ou porque o roteiro oferece uma pergunta cuja
 * resposta ninguém lê.
 *
 * Este arquivo faz cada carta do catálogo AGIR de verdade — respondendo só o
 * que o roteiro oferece, como o app faz — e cobra o mínimo indiscutível:
 *
 *   **responder uma pergunta verdadeira tem de deixar rastro.**
 *
 * O rastro é uma linha de log não-ignorada que cita o ator, ou uma mudança
 * observável no estado. Uma carta que passa por aqui ainda pode estar com a
 * regra errada; uma que NÃO passa está garantidamente sem regra nenhuma, e foi
 * exatamente esse o buraco que dez partidas de mesa encontraram e os meus
 * testes isolados não.
 */

const NOMES = ['Ana', 'Bruno', 'Célia', 'Davi', 'Elza', 'Fábio', 'Gina', 'Hugo', 'Iara'];

const CONFIG: GameConfig = {
  ...DEFAULT_CONFIG,
  semente: 'varredura',
  frequenciaEventos: 'desligado',
};

/**
 * Elenco de apoio fixo.
 *
 * Tem DOIS lobos de propósito: um lobo só não exercita `alvosDaMatilha`, que é
 * onde mora metade da complexidade da noite — foi assim que o Rastro e o
 * "atravessar" passaram em teste e falharam em mesa.
 */
const APOIO = ['lobo', 'alfa', 'aldeao', 'aldeao', 'medico', 'vidente'];

interface Resultado {
  readonly agiu: boolean;
  readonly motivo: string;
}

/** Responde uma pergunta escolhendo sempre a primeira opção válida. */
function responder(p: Pergunta, rng: ReturnType<typeof criarRng>): NightAction | null {
  if (p.falsa || !p.etapa) return null;

  const opcao = p.opcoes?.[0];
  const alvosDaOpcao = opcao && p.alvosPorOpcao ? p.alvosPorOpcao[opcao.valor] : undefined;
  const candidatos = [...(alvosDaOpcao ?? p.alvos)];

  // Perguntas binárias: "sim" é a resposta que faz alguma coisa acontecer.
  if (p.tipo === 'binaria') {
    const sim = p.opcoes?.find((o) => o.valor === 'sim') ?? opcao;
    if (!sim) return null;
    return { actorId: p.playerId, kind: p.kind, etapa: sim.etapa, alvos: [], falsa: false };
  }

  const precisaAlvo = opcao ? opcao.pedeAlvo : p.tipo === 'alvo' || p.tipo === 'dois-alvos';
  if (precisaAlvo && candidatos.length === 0) return null;

  const alvos = !precisaAlvo
    ? []
    : p.tipo === 'dois-alvos' && candidatos.length >= 2
      ? candidatos.slice(0, 2)
      : [candidatos[0]!];

  void rng;
  return {
    actorId: p.playerId,
    kind: p.kind,
    etapa: opcao?.etapa ?? p.etapa,
    alvos,
    falsa: false,
    ...(opcao ? { escolha: opcao.valor } : {}),
  };
}

/**
 * Joga até `maxNoites` e devolve se a carta em teste deixou rastro.
 *
 * Mata um figurante na noite 1 (pela matilha) para que as cartas que precisam
 * de um corpo — Necromante, Herdeiro, Vidente dos Ossos, Troca com Mortos —
 * tenham com o que trabalhar a partir da noite 2.
 */
function cartaAge(roleId: string, varianteId: string | undefined, maxNoites = 4): Resultado {
  const rng = criarRng(`${roleId}:${varianteId ?? 'base'}`);
  const roleIds = [roleId, ...APOIO];
  const deck: Deck = {
    id: 'varredura',
    nome: 'varredura',
    roleIds,
    variantes: [varianteId, ...APOIO.map(() => undefined)],
  };

  let estado: GameState = criarPartida(
    deck,
    CONFIG,
    roleIds.map((_, i) => ({ nome: NOMES[i]!, cor: '#000' })),
  );
  // A carta em teste é sempre a primeira posição do baralho... mas o baralho é
  // embaralhado na criação, então ela é localizada pelo par (role, variante).
  const emTeste = estado.players.find((p) => p.roleId === roleId && p.varianteId === varianteId);
  if (!emTeste) return { agiu: false, motivo: 'a carta não entrou na mesa' };
  const alvoId: PlayerId = emTeste.id;

  let perguntou = false;
  let impedidaComMotivo = '';

  for (let n = 1; n <= maxNoites; n += 1) {
    if (n > 1) estado = prepararNoite(estado);
    else estado = { ...estado, fase: 'noite' };

    const roteiro = roteiroDaNoite(estado);
    const acoes: NightAction[] = [];
    for (const passagem of roteiro) {
      const resposta = responder(passagem.pergunta, rng);
      if (resposta) acoes.push(resposta);
      if (passagem.player.id === alvoId) {
        if (!passagem.pergunta.falsa && resposta) perguntou = true;
        /*
         * Ser IMPEDIDA com motivo não é falhar.
         *
         * O Médico de Plantão só cura quem foi atacado ontem; numa noite em que
         * ninguém sobreviveu a um ataque, ele não tem a quem ir. A carta está
         * certa e o app diz o porquê — o que esta varredura persegue é o
         * silêncio, não a recusa explicada.
         */
        if (passagem.pergunta.aviso) impedidaComMotivo = passagem.pergunta.aviso;
      }
    }

    const submissao: NightSubmission = { rodada: estado.rodada, acoes };
    const { estado: depois, log } = resolverNoite(estado, submissao);

    const rastro = log.entradas.some((e) => !e.ignorada && e.atores.includes(alvoId));
    if (rastro) return { agiu: true, motivo: `agiu na noite ${n}` };

    estado = depois;
    // A carta em teste pode ter morrido; aí não há mais o que provar.
    if (estado.players.find((p) => p.id === alvoId)!.status === 'morto') {
      return { agiu: true, motivo: 'morreu antes de poder agir — fora do escopo desta varredura' };
    }
  }

  if (impedidaComMotivo) {
    return { agiu: true, motivo: `impedida, e o app explicou: "${impedidaComMotivo}"` };
  }

  return {
    agiu: false,
    motivo: perguntou
      ? 'o roteiro PERGUNTOU e a resolução não registrou nada: a resposta foi jogada fora'
      : 'o roteiro nunca fez pergunta nem deu motivo em 4 noites — toque falso mudo',
  };
}

/** Cartas que, por desenho, não agem à noite. Não são defeito. */
const SEM_ACAO_NOTURNA = new Set([
  'aldeao', // só voz e voto
  'teimoso', // regra da tela de votação
  'sobrevivente', // estar vivo é o trabalho
  'sobrevivente-invisivel',
  'sobrevivente-teimoso',
  'coringa', // a missão é comportamento na mesa
  'missao-herdada',
  'missao-sem-volta',
  'missao-partida',
  'bobo', // ser linchado é a condição
  'bobo-desesperado',
  'bobo-acusado',
  'ancia', // passivo: dispara ao morrer
  'luto-da-vila',
  'lobo-carnical', // o estertor dele é reação à morte
  'morto-vivo',
  'sangue-derramado',
  'ultima-carne', // declarada já morto
  'voto-de-sangue', // passivo, depende de atacar
  'sangue-marcado', // passivo, dispara na morte do convertido
  'laco-de-sangue', // passivo, dispara na morte do Vingador
  'vinganca-da-praca', // muda só a condição de vitória
  'maldicao-do-vingador', // passivo contínuo
  'mascara-de-luto', // condicional, avaliada no fim da noite
]);

describe('cada carta do catálogo age', () => {
  const casos: { nome: string; roleId: string; varianteId?: string }[] = [];
  for (const r of ROLES) {
    if (!SEM_ACAO_NOTURNA.has(r.id)) casos.push({ nome: r.nome, roleId: r.id });
    for (const v of r.variantes) {
      if (!SEM_ACAO_NOTURNA.has(v.id)) {
        casos.push({ nome: `${r.nome} · ${v.nome}`, roleId: r.id, varianteId: v.id });
      }
    }
  }

  it('a varredura cobre o catálogo inteiro', () => {
    const total = ROLES.reduce((n, r) => n + 1 + r.variantes.length, 0);
    expect(casos.length + SEM_ACAO_NOTURNA.size).toBe(total);
  });

  for (const c of casos) {
    it(`${c.nome} deixa rastro`, () => {
      const r = cartaAge(c.roleId, c.varianteId);
      expect(r.agiu, `${c.nome}: ${r.motivo}`).toBe(true);
    });
  }
});

/**
 * Quem TROCA de carta consegue usar a carta nova?
 *
 * A varredura acima aceita o primeiro rastro e para. Para o Herdeiro isso é
 * pouco: o rastro dele é a própria herança ("virou Vidente"), e o defeito
 * relatado em mesa é justamente o passo SEGUINTE — "selecionava a role,
 * teoricamente herdava, mas ele não conseguia usar".
 *
 * Aqui a pergunta é outra: depois de trocar, a noite seguinte oferece a
 * pergunta da carta NOVA, e responder deixa rastro?
 */
describe('quem troca de carta consegue usar a carta nova', () => {
  function herdar(roleDoMorto: string) {
    const rng = criarRng(`herdeiro:${roleDoMorto}`);
    const roleIds = ['aldeao', roleDoMorto, 'lobo', 'alfa', 'aldeao', 'medico'];
    const deck: Deck = {
      id: 'h',
      nome: 'h',
      roleIds,
      variantes: ['herdeiro', undefined, undefined, undefined, undefined, undefined],
    };
    let estado: GameState = criarPartida(
      deck,
      CONFIG,
      roleIds.map((_, i) => ({ nome: NOMES[i]!, cor: '#000' })),
    );
    const herdeiroId = estado.players.find((p) => p.varianteId === 'herdeiro')!.id;
    const doadorId = estado.players.find(
      (p) => p.roleId === roleDoMorto && p.id !== herdeiroId,
    )!.id;

    // Noite 1: a matilha mata o doador, para haver de quem herdar.
    estado = { ...estado, fase: 'noite' };
    const lobos = estado.players.filter((p) => ['lobo', 'alfa'].includes(p.roleId));
    estado = resolverNoite(estado, {
      rodada: 1,
      acoes: lobos.map((l) => ({
        actorId: l.id,
        kind: 'atacar' as const,
        etapa: 'ataque' as const,
        alvos: [doadorId],
        falsa: false,
        ...(l.roleId === 'alfa' ? { escolha: 'matar' } : {}),
      })),
    }).estado;
    expect(estado.players.find((p) => p.id === doadorId)!.status).toBe('morto');

    // Noite 2: ele herda.
    estado = prepararNoite(estado);
    const pergunta2 = roteiroDaNoite(estado).find((p) => p.player.id === herdeiroId)!.pergunta;
    expect(pergunta2.falsa, 'a noite da herança não ofereceu pergunta').toBe(false);
    const resposta2 = responder(pergunta2, rng)!;
    expect(resposta2, 'não deu para responder a pergunta da herança').toBeTruthy();
    estado = resolverNoite(estado, { rodada: estado.rodada, acoes: [resposta2] }).estado;

    const virou = estado.players.find((p) => p.id === herdeiroId)!;
    expect(virou.roleId, 'a carta não trocou').toBe(roleDoMorto);

    // Noite 3: ele USA o que herdou.
    estado = prepararNoite(estado);
    const passagem3 = roteiroDaNoite(estado).find((p) => p.player.id === herdeiroId)!;
    return { estado, herdeiroId, passagem3, rng };
  }

  for (const roleDoMorto of ['vidente', 'xerife', 'taverneiro', 'necromante', 'padre']) {
    it(`herdando ${roleDoMorto}, ele age na noite seguinte`, () => {
      const { estado, herdeiroId, passagem3, rng } = herdar(roleDoMorto);

      expect(
        passagem3.pergunta.falsa,
        `herdou ${roleDoMorto} e recebeu TOQUE FALSO na noite seguinte`,
      ).toBe(false);

      const resposta = responder(passagem3.pergunta, rng);
      expect(resposta, `herdou ${roleDoMorto} e não houve resposta possível`).toBeTruthy();

      const { log } = resolverNoite(estado, {
        rodada: estado.rodada,
        acoes: [resposta!],
      });
      const rastro = log.entradas.some((e) => !e.ignorada && e.atores.includes(herdeiroId));
      expect(rastro, `herdou ${roleDoMorto}, agiu, e a resolução ignorou`).toBe(true);
    });
  }
});
