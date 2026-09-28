import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EVENTOS_POR_ID,
  apresentacaoDaCarta,
  contagemDeLobosVisivel,
  nomeDaCarta,
  respostaImediata,
  role,
  type PlayerId,
  type RespostaImediata,
} from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { useTelaAcesa } from '../../hooks/useTelaAcesa';
import { SegurarParaRevelar } from '../../components/SegurarParaRevelar';
import { CartaDeRole } from '../../components/CartaDeRole';
import { corDaFaccao } from '../../components/Motivo';
import { IconeDeRole } from '../../components/IconeDeRole';
import { Ambiente } from '../../components/Ambiente';
import { Sobreposicao } from '../../components/Sobreposicao';
import { Aparicao, Pulso, Revelacao, Surge } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno, Corpo, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Passagem'>;

type Etapa = 'entregar' | 'revelar' | 'trocou' | 'agir' | 'resultado';

/**
 * A cor que domina a tela desta carta.
 *
 * Vem do engine (`apresentacaoDaCarta`), não de `corDaFaccao`: duas cartas da
 * mesma facção podem pedir climas opostos — o Lobo Sombra some no Índigo
 * enquanto o Lobo morde em Sangue, e os dois são da matilha.
 */
const CORES_DE_ACENTO = {
  sangue: cores.garanca,
  cera: cores.cera,
  indigo: cores.indigo,
  folha: cores.folhaDeOuro,
  ferrugem: cores.ferrugem,
} as const;

/**
 * A passagem completa do celular.
 *
 * Três momentos por jogador: "Passe para X" → segurar para revelar (só na noite
 * 1) → agir, ou toque falso. Todos recebem o aparelho, sempre, porque sem isso
 * quem tem poder se revela pela chamada.
 *
 * A ambientação é `noite` o tempo inteiro: é a única tela do app onde o Índigo
 * domina, e é o que faz a mesa perceber que a noite caiu sem ninguém avisar.
 */
export function PassagemScreen({ navigation }: Props) {
  useTelaAcesa();

  const { estado, roteiro, indice, registrarAcao, proximaPassagem, verTroca } = useJogo();
  const [etapa, setEtapa] = useState<Etapa>('entregar');
  const [alvos, setAlvos] = useState<PlayerId[]>([]);
  /** Qual das duas habilidades a role de escolha dupla vai usar esta noite. */
  const [opcao, setOpcao] = useState<string | null>(null);
  /** A leitura do investigador, mostrada na MESMA passagem. */
  const [resposta, setResposta] = useState<RespostaImediata | null>(null);
  /** O lembrete de função fica escondido até alguém tocar. */
  const [lembreteAberto, setLembreteAberto] = useState(false);
  /**
   * Primeira batida dada numa carta "pesada".
   *
   * Matar, converter e queimar o único uso da partida não podem sair de um
   * toque distraído no nome errado — e num pass-and-play o aparelho está indo
   * de mão em mão, com gente com pressa.
   */
  const [confirmando, setConfirmando] = useState(false);

  const passagem = roteiro[indice];

  /**
   * VAZAMENTO DE INFORMAÇÃO — o defeito mais grave que este app já teve.
   *
   * Isto era um `useEffect` com `[indice]`. Efeito roda DEPOIS da renderização:
   * quando o índice mudava, o React desenhava um quadro com a passagem NOVA e
   * a etapa ANTIGA (`agir`) — e a tela de agir mostra o ícone da função de quem
   * está com o aparelho. Resultado: ao passar o celular, o símbolo da função do
   * PRÓXIMO jogador piscava por um quadro para quem ainda estava segurando.
   *
   * Relatado em jogo real: "piscou rapidamente o símbolo do Uivador, que a
   * Elza era realmente". Num jogo de dedução social isso não é um glitch
   * visual, é o jogo inteiro perdido.
   *
   * O conserto é ajustar o estado DURANTE a renderização, que é o padrão
   * documentado do React para "derivar estado de props que mudaram". O React
   * descarta a saída e re-renderiza na hora, sem nunca pintar o quadro
   * intermediário. Não existe frame em que os dois se misturam.
   *
   * NÃO troque isto por `useEffect` de novo, por mais que o lint peça.
   */
  const [indiceDesenhado, setIndiceDesenhado] = useState(indice);
  if (indiceDesenhado !== indice) {
    setIndiceDesenhado(indice);
    setEtapa('entregar');
    setAlvos([]);
    setOpcao(null);
    setResposta(null);
    // Some junto com a passagem: o lembrete do jogador anterior não pode
    // continuar aberto quando o aparelho troca de mão.
    setLembreteAberto(false);
    setConfirmando(false);
  }

  useEffect(() => {
    if (!estado || estado.fase === 'noite') return;
    /**
     * Evento narrado tem tela própria, ANTES das mortes.
     * A `EventoScreen` se encarrega de seguir para o Amanhecer — inclusive se
     * o evento for silencioso, caso em que ela nem chega a desenhar.
     */
    const ev = estado.eventoAnunciado ? EVENTOS_POR_ID.get(estado.eventoAnunciado) : undefined;
    const destino = ev?.visibilidade === 'narrado' ? 'Evento' : 'Amanhecer';
    navigation.reset({ index: 0, routes: [{ name: destino }] });
  }, [estado, navigation]);

  if (!estado || !passagem) return <Ambiente clima="noite" />;

  const p = passagem.player;
  const cor = corDaFaccao(p.roleId);
  const nomeDe = (id: PlayerId) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const seguir = () => {
    void Haptics.selectionAsync();
    proximaPassagem();
  };

  const confirmarAcao = () => {
    const { pergunta } = passagem;
    const escolhida = pergunta.opcoes?.find((o) => o.valor === opcao);
    // Numa escolha dupla, quem manda na etapa é a OPÇÃO: atravessar perfura,
    // caçar ataca. Nas demais, a etapa da própria pergunta.
    const etapaDaAcao = escolhida?.etapa ?? pergunta.etapa;

    if (!pergunta.falsa && etapaDaAcao && (alvos.length > 0 || escolhida?.pedeAlvo === false)) {
      registrarAcao({
        actorId: p.id,
        kind: pergunta.kind,
        etapa: etapaDaAcao,
        alvos,
        ...(opcao ? { escolha: opcao } : {}),
        falsa: false,
      });
    }

    /**
     * A leitura aparece AGORA, e não na noite seguinte.
     *
     * O estado ainda é o do início da noite — nada foi resolvido — então esta é
     * exatamente a mesma leitura que a etapa 11 vai gravar no log. Ver
     * `packages/engine/src/turn/leitura.ts`.
     */
    const r = estado ? respostaImediata(estado, p.id, alvos) : null;
    if (r) {
      setResposta(r);
      setEtapa('resultado');
      return;
    }

    seguir();
  };

  // ── Entregar ───────────────────────────────────────────────────────────────
  if (etapa === 'entregar') {
    return (
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          /*
           * A ordem das telas: revelar (noite 1) → trocou → agir.
           *
           * A troca de carta vem ANTES da ação de propósito: o jogador precisa
           * saber que virou outra coisa antes de responder uma pergunta que
           * não é mais a dele.
           */
          setEtapa(passagem.revelarRole ? 'revelar' : passagem.trocaDeCarta ? 'trocou' : 'agir');
        }}
      >
        <Ambiente clima="noite">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
            <Revelacao>
              <View style={{ alignItems: 'center', gap: espaco.md }}>
                <Text style={{ color: cores.nogueira, fontSize: 28 }}>☽</Text>
                <Rotulo>Passe o aparelho para</Rotulo>
                <Text style={[tipografia.titulo, { color: cores.linhoCru, fontSize: 38 }]}>
                  {p.nome}
                </Text>
                <View
                  style={{
                    width: 44,
                    height: 1,
                    backgroundColor: cores.nogueira,
                    marginVertical: espaco.sm,
                  }}
                />
              </View>
            </Revelacao>
          </View>

          <View style={{ alignItems: 'center', paddingBottom: espaco.xl }}>
            <Pulso>
              <Text style={[tipografia.rotulo, { color: cores.ferrugem }]}>
                Toque quando estiver com ele
              </Text>
            </Pulso>
            <Text style={[tipografia.pequeno, { color: cores.nogueira, marginTop: espaco.sm }]}>
              {indice + 1} de {roteiro.length}
            </Text>
          </View>
        </Ambiente>
      </Pressable>
    );
  }

  // ── Revelar a função (noite 1) ─────────────────────────────────────────────
  if (etapa === 'revelar') {
    return (
      <Ambiente clima="noite">
        <View style={{ flex: 1 }}>
          <SegurarParaRevelar>
            <Revelacao>
              <View style={{ alignItems: 'center', gap: espaco.md }}>
                <CartaDeRole roleId={p.roleId} varianteId={p.varianteId} largura={230} />

                {passagem.companheiros.length > 0 && (
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={[tipografia.rotulo, { color: cor }]}>
                      {passagem.rotuloCompanheiros}
                    </Text>
                    <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
                      {passagem.companheiros.map(nomeDe).join(' · ')}
                    </Text>
                  </View>
                )}

                <Pequeno cor={cores.nogueira}>{contagemDeLobosVisivel(estado)}</Pequeno>
              </View>
            </Revelacao>
          </SegurarParaRevelar>
        </View>

        <View style={{ padding: espaco.lg }}>
          <Botao
            onPress={() => {
              void Haptics.selectionAsync();
              setEtapa(passagem.trocaDeCarta ? 'trocou' : 'agir');
            }}
          >
            Prosseguir
          </Botao>
        </View>
      </Ambiente>
    );
  }

  // ── Sua carta mudou ───────────────────────────────────────────────────────
  /**
   * A tela que faltava: seis mecânicas trocavam o papel de alguém em silêncio.
   *
   * O jogador pegava o aparelho na noite seguinte e a pergunta era outra, sem
   * uma palavra sobre por quê — convertido pelo Alfa, herdeiro de um morto,
   * devolvido pela Cova Aberta como Aldeão. Vem atrás do mesmo gesto da
   * revelação da noite 1, porque é exatamente a mesma informação: qual é a sua
   * carta.
   */
  if (etapa === 'trocou' && passagem.trocaDeCarta) {
    const t = passagem.trocaDeCarta;
    const antes = role(t.deRoleId);
    const depois = role(t.paraRoleId);
    return (
      <Ambiente clima="noite">
        <View style={{ flex: 1 }}>
          <SegurarParaRevelar>
            <Revelacao>
              <View style={{ alignItems: 'center', gap: espaco.md }}>
                <Rotulo cor={cores.garanca}>Sua carta mudou</Rotulo>
                <Text
                  style={[
                    tipografia.corpoSerif,
                    { color: cores.cera, fontSize: 18, textAlign: 'center' },
                  ]}
                >
                  {t.motivo}
                </Text>

                {/* O que ele ERA, apagado, e o que ele É, inteiro. Sem o antes,
                    a tela é só uma carta nova e não explica nada. */}
                <Text
                  style={[
                    tipografia.pequeno,
                    { color: cores.nogueira, textDecorationLine: 'line-through' },
                  ]}
                >
                  {nomeDaCarta(antes, t.deVarianteId)}
                </Text>
                <CartaDeRole roleId={t.paraRoleId} varianteId={t.paraVarianteId} largura={220} />
                <Pequeno cor={cores.ferrugem}>
                  {apresentacaoDaCarta(t.paraRoleId, t.paraVarianteId).atmosfera}
                </Pequeno>
                <Pequeno cor={cores.nogueira}>{depois.descricaoCurta}</Pequeno>
              </View>
            </Revelacao>
          </SegurarParaRevelar>
        </View>

        <View style={{ padding: espaco.lg }}>
          <Botao
            onPress={() => {
              void Haptics.selectionAsync();
              verTroca(p.id);
              setEtapa('agir');
            }}
          >
            Entendi
          </Botao>
        </View>
      </Ambiente>
    );
  }

  // ── O que o investigador viu, na mesma passagem ───────────────────────────
  if (etapa === 'resultado' && resposta) {
    return (
      <Ambiente clima="noite" tremula={false}>
        <View style={{ flex: 1, justifyContent: 'center', padding: espaco.lg, gap: espaco.lg }}>
          <Revelacao>
            <View style={{ alignItems: 'center', gap: espaco.md }}>
              <IconeDeRole roleId={p.roleId} varianteId={p.varianteId} tamanho={64} cor={cor} />
              <Rotulo cor={resposta.adiada ? cores.nogueira : cores.cera}>
                {resposta.adiada ? 'Ainda não' : 'Você viu'}
              </Rotulo>
              {/*
                Duas visões, dois tamanhos iguais.

                A segunda linha nasceu como rodapé ("Uma segunda visão virá") e
                continuou pequena quando virou uma LEITURA de verdade. A Vidente
                Confusa saía da passagem tratando a segunda como observação e a
                primeira como resposta — uma hierarquia que a carta não tem, já
                que qualquer uma das duas pode ser a mentira.
              */}
              <Text
                style={[
                  tipografia.corpoSerif,
                  { color: cores.linhoCru, fontSize: 22, textAlign: 'center' },
                ]}
              >
                {resposta.texto}
              </Text>
              {resposta.segunda &&
                (resposta.duasVisoes ? (
                  <Text
                    style={[
                      tipografia.corpoSerif,
                      { color: cores.linhoCru, fontSize: 22, textAlign: 'center' },
                    ]}
                  >
                    {resposta.segunda}
                  </Text>
                ) : (
                  <Pequeno cor={cores.ferrugem}>{resposta.segunda}</Pequeno>
                ))}
              {resposta.rodape && <Pequeno cor={cores.ferrugem}>{resposta.rodape}</Pequeno>}
            </View>
          </Revelacao>
        </View>

        <View style={{ padding: espaco.lg, gap: espaco.sm }}>
          <Pequeno cor={cores.nogueira}>Guarde para você. Passe o aparelho adiante.</Pequeno>
          <Botao onPress={seguir}>Passar adiante</Botao>
        </View>
      </Ambiente>
    );
  }

  // ── Agir (ou toque falso) ──────────────────────────────────────────────────
  const { pergunta } = passagem;
  /**
   * Como ESTA carta se apresenta. Ver `turn/apresentacao.ts`.
   *
   * O toque falso não recebe nada disto: ele tem de parecer o que é — uma tela
   * sem carta. Vestir o toque falso com o clima da função seria entregar a
   * função pela cor.
   */
  const vestido = pergunta.falsa ? null : apresentacaoDaCarta(p.roleId, p.varianteId);
  const acento = vestido ? CORES_DE_ACENTO[vestido.acento] : cores.nogueira;
  /*
   * `origem: 'app'` é o que o app conta SOBRE você; o resto é o que você viu.
   * É a única marca que distingue as duas coisas no `InfoEntry`.
   */
  const leituras = passagem.recebido.filter((i) => i.origem !== 'app');
  const sobreVoce = passagem.recebido.filter((i) => i.origem === 'app');
  const opcaoEscolhida = pergunta.opcoes?.find((o) => o.valor === opcao);
  const alvosVisiveis = pergunta.alvosPorOpcao?.[opcao ?? ''] ?? pergunta.alvos;
  const precisaDe =
    pergunta.tipo === 'dois-alvos'
      ? 2
      : pergunta.tipo === 'alvo'
        ? 1
        : pergunta.tipo === 'opcao-e-alvo' && opcaoEscolhida?.pedeAlvo
          ? 1
          : 0;
  const completo =
    pergunta.tipo === 'opcao-e-alvo'
      ? !!opcaoEscolhida && alvos.length >= precisaDe
      : pergunta.opcional || alvos.length >= precisaDe;

  const alternar = (id: PlayerId) => {
    void Haptics.selectionAsync();
    // Mudou de ideia sobre o alvo: a confirmação pendente perde a validade.
    setConfirmando(false);
    setAlvos((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= precisaDe) return [...atual.slice(1), id];
      return [...atual, id];
    });
  };

  return (
    <Ambiente clima="noite" tremula={false}>
      {/*
        `key={etapa}`: a troca de etapa REMONTA o conteúdo.

        Sem isto o React reaproveita a árvore e as `Aparicao` de dentro não
        rodam de novo — sair de "segure para revelar" para "sua vez" era um
        corte seco, a transição mais vista do jogo (uma por jogador por noite)
        e a única que não tinha nenhuma. Remontar faz as entradas escalonadas
        acontecerem outra vez, e o conteúdo novo entra em vez de aparecer.
      */}
      <ScrollView
        key={etapa}
        /*
         * `flexGrow: 1` no CONTEÚDO, não `flex: 1` na rolagem.
         *
         * Sem ele o conteúdo se encolhe no topo e sobra um vazio de quase
         * metade da tela — o toque falso ficava com a lua perdida na parte de
         * cima e quinhentos pixels de nada embaixo. Com `flexGrow`, o bloco
         * cresce até o tamanho disponível quando é curto, e continua rolando
         * quando é longo.
         */
        contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, flexGrow: 1 }}
      >
        <Aparicao>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
            {/* O toque falso não mostra motivo: ele não pode entregar nada. */}
            {!pergunta.falsa && (
              <IconeDeRole roleId={p.roleId} varianteId={p.varianteId} tamanho={46} cor={acento} />
            )}
            <View style={{ flex: 1 }}>
              {/*
                O nome da CARTA no lugar do nome do jogador.

                Quem está com o aparelho sabe o próprio nome; o que ele esquece
                é qual variante está jogando — e a tela dizia "Xerife" a quem
                escolheu Boca Calada no setup, três noites antes. O toque falso
                continua mostrando só o nome, porque ele não pode entregar nada.
              */}
              <Rotulo cor={pergunta.falsa ? cores.nogueira : acento}>
                {pergunta.falsa ? p.nome : nomeDaCarta(role(p.roleId), p.varianteId)}
              </Rotulo>
              <Text style={[tipografia.subtitulo, { color: cores.linhoCru }]}>
                {pergunta.titulo}
              </Text>
            </View>
          </View>
        </Aparicao>

        {/*
          A linha de clima da carta.

          É o que separa receber o aparelho como Médico de receber como Lobo —
          antes as duas telas eram o mesmo formulário com o texto trocado. Fica
          ACIMA da regra porque é o que a pessoa lê primeiro, no meio segundo em
          que ainda está se lembrando de quem é nesta partida.
        */}
        {vestido && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: acento,
              paddingLeft: espaco.md,
              paddingVertical: 2,
            }}
          >
            <Text
              style={[
                tipografia.corpoSerif,
                { color: cores.linhoCru, fontSize: 17, lineHeight: 25 },
              ]}
            >
              {vestido.atmosfera}
            </Text>
          </View>
        )}

        <Corpo cor={cores.ferrugem}>{pergunta.detalhe}</Corpo>

        {/*
          O motivo VERDADEIRO de não haver nada a fazer.

          Preso pelo Xerife, embebedado pelo Taverneiro, Detetive Cansado numa
          noite par: os três recebiam a tela de "a vila dorme" e ficavam achando
          que o app tinha bugado. Quem lê isto já sabia que tem poder, então a
          mensagem não entrega nada a ninguém.
        */}
        {pergunta.aviso && (
          <Aparicao atraso={30}>
            <View
              style={{
                backgroundColor: '#2A1B17',
                borderLeftWidth: 2,
                borderLeftColor: cores.garanca,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.garanca }]}>Por que não</Text>
              <Text style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                {pergunta.aviso}
              </Text>
            </View>
          </Aparicao>
        )}

        {/*
          O segredo do jogador: missão do Coringa, poção da Bruxa, role roubada.
          Existia no estado desde sempre e nunca chegava à tela — o Coringa
          jogava a partida inteira sem saber qual era a missão dele.
        */}
        {passagem.segredo && (
          <Aparicao atraso={40}>
            <View
              style={{
                backgroundColor: '#221B17',
                borderLeftWidth: 2,
                borderLeftColor: cores.folhaDeOuro,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.folhaDeOuro }]}>Só você sabe</Text>
              <Text style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                {passagem.segredo}
              </Text>
            </View>
          </Aparicao>
        )}

        {/*
          DUAS caixas, e a separação é o ponto.

          "Davi é lobo" é uma leitura que VOCÊ pediu. "Alguém observou você esta
          noite" é uma coisa que aconteceu COM você — e foi outra pessoa que a
          causou. Empilhadas na mesma caixa, o jogador lia as duas como se
          fossem a mesma informação e saía da passagem achando que a Vidente do
          Espelho tinha lhe contado algo. São origens opostas: uma é o resultado
          do poder dele, a outra é o rastro do poder de outro.
        */}
        {leituras.length > 0 && (
          <Aparicao atraso={60}>
            <View
              style={{
                backgroundColor: '#221B17',
                borderLeftWidth: 2,
                borderLeftColor: cores.cera,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.cera }]}>Você soube</Text>
              {leituras.map((i, k) => (
                <Text key={k} style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                  {i.texto}
                </Text>
              ))}
            </View>
          </Aparicao>
        )}

        {sobreVoce.length > 0 && (
          <Aparicao atraso={80}>
            <View
              style={{
                backgroundColor: '#1B1F22',
                borderLeftWidth: 2,
                borderLeftColor: cores.indigo,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.linhoCru }]}>Aconteceu com você</Text>
              {sobreVoce.map((i, k) => (
                <Text key={k} style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                  {i.texto}
                </Text>
              ))}
            </View>
          </Aparicao>
        )}

        {pergunta.tipo === 'binaria' && (
          <View style={{ gap: espaco.sm }}>
            {pergunta.opcoes?.map((o) => (
              <Botao
                key={o.valor}
                tom={o.valor === 'sim' ? 'primario' : 'secundario'}
                onPress={() => {
                  if (o.valor === 'sim' && pergunta.etapa) {
                    registrarAcao({
                      actorId: p.id,
                      kind: pergunta.kind,
                      etapa: pergunta.etapa,
                      alvos: [],
                      falsa: false,
                    });
                  }
                  seguir();
                }}
              >
                {o.rotulo}
              </Botao>
            ))}
          </View>
        )}

        {/*
          Escolha dupla: primeiro COMO, depois EM QUEM.
          A lista de alvos só aparece quando a opção escolhida pede alvo — "ficar
          imune a investigação" não tem em quem.
        */}
        {pergunta.tipo === 'opcao-e-alvo' && (
          <View style={{ gap: espaco.sm }}>
            {pergunta.opcoes?.map((o) => (
              <Botao
                key={o.valor}
                tom={opcao === o.valor ? 'primario' : 'secundario'}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setOpcao(o.valor);
                  setAlvos([]);
                }}
              >
                {o.rotulo}
              </Botao>
            ))}
          </View>
        )}

        {(pergunta.tipo === 'alvo' ||
          pergunta.tipo === 'dois-alvos' ||
          (pergunta.tipo === 'opcao-e-alvo' &&
            pergunta.opcoes?.find((o) => o.valor === opcao)?.pedeAlvo === true)) && (
          <View style={{ gap: espaco.xs }}>
            {/*
              A opção pode mirar um grupo diferente: o Uivador DELATA um lobo,
              e a mesma role, escolhendo caçar, mira fora da matilha. Sem isto
              ele só conseguiria delatar quem não é lobo — o oposto da carta.
            */}
            {(pergunta.alvosPorOpcao?.[opcao ?? ''] ?? pergunta.alvos).map((id, i) => {
              const alvo = estado.players.find((x) => x.id === id)!;
              return (
                <Aparicao key={id} atraso={i * 25}>
                  <ItemJogador
                    nome={alvo.nome}
                    morto={alvo.status === 'morto'}
                    selecionado={alvos.includes(id)}
                    corDoPonto={alvo.cor}
                    onPress={() => alternar(id)}
                    direita={
                      alvos.includes(id) ? (
                        // Mola: o losango é a RESPOSTA ao dedo, não conteúdo
                        // que chegou. Sem ela a escolha pisca e não tem peso.
                        <Surge>
                          <Text style={{ color: acento, fontSize: 15 }}>◆</Text>
                        </Surge>
                      ) : undefined
                    }
                  />
                </Aparicao>
              );
            })}
          </View>
        )}

        {pergunta.tipo === 'nenhuma' && (
          // `flex: 1` + centro: a lua fica no meio do vazio, e não pendurada
          // no topo dele.
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: espaco.md,
            }}
          >
            <Pulso>
              <Text style={{ color: cores.nogueira, fontSize: 40 }}>☽</Text>
            </Pulso>
            <Pequeno cor={cores.nogueira}>A vila dorme.</Pequeno>
          </View>
        )}
      </ScrollView>

      {/*
        A consulta da própria carta, presente em TODA passagem.

        Nasceu dentro da rolagem e só para quem nunca age. Os dois erros eram o
        mesmo erro: um atalho de consulta tem de estar sempre no mesmo lugar e
        nunca disputar o dedo com o conteúdo. Um botão que aparecesse só em
        algumas passagens entregaria, pela própria presença, quem tem poder —
        por isso ele está aqui inclusive no toque falso, e nada abre sozinho.
      */}
      {passagem.lembrete && (
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setLembreteAberto(true);
          }}
          hitSlop={10}
          style={({ pressed }) => [
            {
              alignSelf: 'center',
              paddingVertical: espaco.sm,
              paddingHorizontal: espaco.md,
              opacity: pressed ? 0.55 : 1,
            },
          ]}
        >
          <Text style={[tipografia.rotulo, { color: cores.nogueira, fontSize: 10 }]}>
            ◈ ver minha carta
          </Text>
        </Pressable>
      )}

      <Sobreposicao
        aberta={lembreteAberto}
        aoFechar={() => setLembreteAberto(false)}
        titulo="Sua carta"
      >
        <View style={{ alignItems: 'center', gap: espaco.md }}>
          <CartaDeRole roleId={p.roleId} varianteId={p.varianteId} largura={200} />
          <Pequeno cor={cores.ferrugem}>{passagem.lembrete}</Pequeno>
          {/* A matilha também se esquece de quem é matilha na terceira noite. */}
          {passagem.companheiros.length > 0 && (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={[tipografia.rotulo, { color: cor }]}>{passagem.rotuloCompanheiros}</Text>
              <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>
                {passagem.companheiros.map(nomeDe).join(' · ')}
              </Text>
            </View>
          )}
        </View>
      </Sobreposicao>

      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        {/*
          O botão diz o que a CARTA faz: "Morder", "Enxergar", "Trancar".
          "Confirmar" é o verbo de um formulário, e era o mesmo nas 97 cartas.
        */}
        {confirmando && (
          <Text style={[tipografia.rotulo, { color: cores.garanca, textAlign: 'center' }]}>
            Isto não tem volta. Toque de novo para confirmar.
          </Text>
        )}
        {pergunta.tipo !== 'binaria' && (
          <Botao
            desabilitado={!completo}
            tom={confirmando ? 'primario' : undefined}
            onPress={() => {
              /*
               * Cartas "pesadas" pedem duas batidas: o aparelho está passando
               * de mão em mão, com gente com pressa, e um toque no nome errado
               * mata a pessoa errada sem nenhuma chance de desfazer.
               */
              if (vestido?.pesado && !confirmando && alvos.length > 0) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConfirmando(true);
                return;
              }
              confirmarAcao();
            }}
          >
            {pergunta.tipo === 'nenhuma'
              ? 'Passar adiante'
              : confirmando
                ? `${vestido?.verbo ?? 'Confirmar'} — tem certeza?`
                : alvos.length > 0
                  ? `${vestido?.verbo ?? 'Confirmar'} ${alvos.map(nomeDe).join(' e ')}`
                  : pergunta.tipo === 'opcao-e-alvo' && !opcaoEscolhida
                    ? 'Escolha o que fazer'
                    : pergunta.tipo === 'opcao-e-alvo' && opcaoEscolhida
                      ? `Confirmar: ${opcaoEscolhida.rotulo}`
                      : pergunta.opcional
                        ? 'Não usar esta noite'
                        : `Escolha ${precisaDe}`}
          </Botao>
        )}
      </View>
    </Ambiente>
  );
}
