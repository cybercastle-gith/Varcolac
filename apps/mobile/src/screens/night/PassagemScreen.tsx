import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EVENTOS_POR_ID,
  contagemDeLobosVisivel,
  respostaImediata,
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
import { Aparicao, Pulso, Revelacao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno, Corpo, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Passagem'>;

type Etapa = 'entregar' | 'revelar' | 'agir' | 'resultado';

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

  const { estado, roteiro, indice, registrarAcao, proximaPassagem } = useJogo();
  const [etapa, setEtapa] = useState<Etapa>('entregar');
  const [alvos, setAlvos] = useState<PlayerId[]>([]);
  /** Qual das duas habilidades a role de escolha dupla vai usar esta noite. */
  const [opcao, setOpcao] = useState<string | null>(null);
  /** A leitura do investigador, mostrada na MESMA passagem. */
  const [resposta, setResposta] = useState<RespostaImediata | null>(null);

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
          setEtapa(passagem.revelarRole ? 'revelar' : 'agir');
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
              setEtapa('agir');
            }}
          >
            Prosseguir
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
              <Text
                style={[
                  tipografia.corpoSerif,
                  { color: cores.linhoCru, fontSize: 22, textAlign: 'center' },
                ]}
              >
                {resposta.texto}
              </Text>
              {resposta.segunda && <Pequeno cor={cores.ferrugem}>{resposta.segunda}</Pequeno>}
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
    setAlvos((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= precisaDe) return [...atual.slice(1), id];
      return [...atual, id];
    });
  };

  return (
    <Ambiente clima="noite" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Aparicao>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
            {/* O toque falso não mostra motivo: ele não pode entregar nada. */}
            {!pergunta.falsa && (
              <IconeDeRole roleId={p.roleId} varianteId={p.varianteId} tamanho={46} cor={cor} />
            )}
            <View style={{ flex: 1 }}>
              <Rotulo>{p.nome}</Rotulo>
              <Text style={[tipografia.subtitulo, { color: cores.linhoCru }]}>
                {pergunta.titulo}
              </Text>
            </View>
          </View>
        </Aparicao>

        <Corpo cor={cores.ferrugem}>{pergunta.detalhe}</Corpo>

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

        {passagem.recebido.length > 0 && (
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
              {passagem.recebido.map((i, k) => (
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
                        <Text style={{ color: cores.garanca, fontSize: 15 }}>◆</Text>
                      ) : undefined
                    }
                  />
                </Aparicao>
              );
            })}
          </View>
        )}

        {pergunta.tipo === 'nenhuma' && (
          <View style={{ alignItems: 'center', paddingVertical: espaco.xl, gap: espaco.md }}>
            <Pulso>
              <Text style={{ color: cores.nogueira, fontSize: 40 }}>☽</Text>
            </Pulso>
            <Pequeno cor={cores.nogueira}>A vila dorme.</Pequeno>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        {pergunta.tipo !== 'binaria' && (
          <Botao desabilitado={!completo} onPress={confirmarAcao}>
            {pergunta.tipo === 'nenhuma'
              ? 'Passar adiante'
              : alvos.length > 0
                ? `Confirmar ${alvos.map(nomeDe).join(' e ')}`
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
