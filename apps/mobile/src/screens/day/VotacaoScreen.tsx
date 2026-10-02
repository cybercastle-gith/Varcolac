import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { elegiveisParaVotar, temEfeito, votoTrava, type PlayerId } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Botao, Titulo, Rotulo, Pequeno, ItemJogador } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao, Revelacao } from '../../components/animacoes';
import { cores, espaco, tipografia, alvoMinimo } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Votacao'>;

/**
 * Tela 14 — Votação.
 *
 * Simultânea por padrão: todos apontam na contagem de três e o host registra.
 * Elimina uma volta de celular por dia e é mais teatral. Secreta passa o
 * aparelho de mão em mão, um voto por vez.
 */
export function VotacaoScreen({ navigation }: Props) {
  const { estado, votos, votar, fecharVotacao, votosContados, ajustarVoto } = useJogo();
  const [indiceSecreto, setIndiceSecreto] = useState(0);
  const [mostrandoEntrega, setMostrandoEntrega] = useState(true);

  const elegiveis = useMemo(
    () => (estado ? elegiveisParaVotar(estado) : { podem: [], impedidos: [] }),
    [estado],
  );

  if (!estado) return <Ambiente tipo="operacao" clima="dia" />;

  const semVotacao = temEfeito(estado.efeitos, estado.rodada, 'sem-votacao');
  const vivos = estado.players.filter((p) => p.status === 'vivo');
  const nomeDe = (id: PlayerId) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const encerrar = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    fecharVotacao();
    navigation.reset({ index: 0, routes: [{ name: 'Execucao' }] });
  };

  if (semVotacao) {
    return (
      <Ambiente clima="dia">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
          <Revelacao>
            <View style={{ alignItems: 'center', gap: espaco.sm }}>
              <Titulo>Não há julgamento hoje.</Titulo>
              <Pequeno cor={cores.ferrugem}>Ninguém tem estômago para isso.</Pequeno>
            </View>
          </Revelacao>
        </View>
        <View style={{ padding: espaco.lg }}>
          <Botao onPress={encerrar}>Seguir para a noite</Botao>
        </View>
      </Ambiente>
    );
  }

  // ── Votação secreta: uma passagem por votante ──────────────────────────────
  if (estado.config.votacao === 'secreta') {
    /**
     * TODOS recebem o aparelho, inclusive quem não pode votar.
     *
     * A fila percorria só `elegiveis.podem`, e pular alguém é anúncio público:
     * a mesa vê o celular passar por cima da pessoa e sabe na hora que ela
     * perdeu o voto — ou seja, que ela é a Vidente, ou que está presa, ou que o
     * Taverneiro a pegou. Num voto que se chama SECRETO isso é o defeito
     * inteiro.
     *
     * Agora a fila é a ordem da mesa. Quem não pode votar recebe o aparelho
     * como todo mundo, vê a mesma tela, e nela só existe "Abster-se" — com o
     * motivo escrito, que só ele lê.
     */
    const ordemDeVoto = [
      ...estado.players.filter((p) => p.status === 'vivo'),
      // Peso da Culpa: o linchado injustamente vota mesmo morto.
      ...estado.players.filter((p) => p.status === 'morto' && elegiveis.podem.includes(p.id)),
    ].map((p) => p.id);

    const votanteId = ordemDeVoto[indiceSecreto];
    if (!votanteId) {
      return (
        <Ambiente clima="dia">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Revelacao>
              <Titulo>Todos votaram.</Titulo>
            </Revelacao>
          </View>
          <View style={{ padding: espaco.lg }}>
            <Botao onPress={encerrar}>Revelar o resultado</Botao>
          </View>
        </Ambiente>
      );
    }

    if (mostrandoEntrega) {
      return (
        <Pressable style={{ flex: 1 }} onPress={() => setMostrandoEntrega(false)}>
          <Ambiente clima="noite">
            <View
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}
            >
              <Revelacao>
                <View style={{ alignItems: 'center', gap: espaco.sm }}>
                  <Rotulo>Voto secreto · passe para</Rotulo>
                  <Titulo>{nomeDe(votanteId)}</Titulo>
                </View>
              </Revelacao>
              <Text style={[tipografia.rotulo, { color: cores.ferrugem, marginTop: espaco.lg }]}>
                Toque para votar
              </Text>
            </View>
          </Ambiente>
        </Pressable>
      );
    }

    const travado = estado ? votoTrava(estado, votanteId) : false;
    const podeVotar = elegiveis.podem.includes(votanteId);
    const motivoDoImpedimento = elegiveis.impedidos.find((i) => i.id === votanteId)?.motivo;

    return (
      <Ambiente clima="dia" tremula={false}>
        <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
          <Rotulo>{nomeDe(votanteId)} vota</Rotulo>
          <Titulo>{podeVotar ? 'Em quem?' : 'Você não vota hoje.'}</Titulo>

          {/*
            O motivo, só para quem está segurando o aparelho.

            A tela é idêntica à de quem pode votar até este ponto — mesmo
            cabeçalho, mesmo "passe para". Quem olha de longe não distingue as
            duas, que é o objetivo.
          */}
          {!podeVotar && motivoDoImpedimento && (
            <View
              style={{
                backgroundColor: '#2A1B17',
                borderLeftWidth: 2,
                borderLeftColor: cores.garanca,
                padding: espaco.md,
                gap: 4,
              }}
            >
              <Text style={[tipografia.rotulo, { color: cores.garancaTexto }]}>Por que não</Text>
              <Text style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                {motivoDoImpedimento}
              </Text>
              <Pequeno cor={cores.nogueiraTexto}>
                Ninguém além de você está vendo isto. Abstenha-se e passe adiante.
              </Pequeno>
            </View>
          )}

          <View style={{ gap: espaco.xs }}>
            {podeVotar &&
              vivos
                .filter((p) => p.id !== votanteId)
                .map((p) => (
                  <ItemJogador
                    key={p.id}
                    nome={p.nome}
                    corDoPonto={p.cor}
                    selecionado={votos[votanteId] === p.id}
                    /*
                     * Aldeão Teimoso: o voto trava quando é declarado.
                     *
                     * A regra vem do engine (`votoTrava`) e não de uma checagem
                     * escrita aqui: a apuração recebe a votação fechada e não tem
                     * como saber que alguém mudou de ideia, então esta tela é o
                     * único lugar do jogo capaz de cumprir a carta.
                     */
                    desabilitado={travado && votos[votanteId] !== undefined}
                    onPress={() => {
                      if (travado && votos[votanteId] !== undefined) return;
                      void Haptics.selectionAsync();
                      votar(votanteId, p.id);
                    }}
                  />
                ))}
            <ItemJogador
              nome="Abster-se"
              selecionado={votos[votanteId] === null}
              desabilitado={travado && votos[votanteId] !== undefined}
              onPress={() => {
                if (travado && votos[votanteId] !== undefined) return;
                votar(votanteId, null);
              }}
            />
            {travado && (
              <Pequeno cor={cores.ferrugem}>
                Você é Teimoso: o primeiro voto é o definitivo.
              </Pequeno>
            )}
          </View>
        </ScrollView>
        <View style={{ padding: espaco.lg }}>
          <Botao
            desabilitado={votos[votanteId] === undefined}
            onPress={() => {
              setIndiceSecreto((i) => i + 1);
              setMostrandoEntrega(true);
            }}
          >
            Confirmar e passar
          </Botao>
        </View>
      </Ambiente>
    );
  }

  // ── Votação simultânea: o host CONTA os dedos levantados ───────────────────
  /**
   * Um placar, e não uma entrevista.
   *
   * A tela antiga perguntava, pessoa por pessoa, em quem ela tinha apontado —
   * oito perguntas para transcrever uma votação que já tinha acontecido na
   * mesa, em três segundos. Relatado assim: "não precisa contabilizar voto a
   * voto, é só colocar cada pessoa com um - 0 + e adicionar votos conforme".
   *
   * O que se perde está dito no log pelo próprio engine: sem saber quem apontou
   * para quem, o voto duplo do Uivo Comprado e a anulação mútua do Bobo Acusado
   * ficam de fora desta apuração.
   */
  const totalContado = Object.values(votosContados).reduce((n, v) => n + v, 0);

  return (
    <Ambiente clima="dia" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Rotulo>Dia {estado.rodada} · votação simultânea</Rotulo>
        <Titulo>Todos apontam na contagem de três.</Titulo>
        <Pequeno>
          Conte os dedos e marque aqui. {totalContado} de {elegiveis.podem.length} votos possíveis.
        </Pequeno>

        {/*
          Quem NÃO pode votar aparece em destaque, e não numa nota de rodapé.

          A mesa precisa saber disso ANTES de apontar — é o que impede alguém de
          votar sem poder e o host de contar um dedo a mais. Na votação secreta
          o motivo é privado; aqui é público por necessidade.
        */}
        {elegiveis.impedidos.length > 0 && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: cores.garanca,
              backgroundColor: '#2A1B17',
              padding: espaco.md,
              gap: espaco.xs,
            }}
          >
            <Text style={[tipografia.rotulo, { color: cores.garancaTexto }]}>Estes não votam hoje</Text>
            {elegiveis.impedidos.map((i) => (
              <Text key={i.id} style={[tipografia.pequeno, { color: cores.linhoCru }]}>
                {nomeDe(i.id)} — {i.motivo}
              </Text>
            ))}
          </View>
        )}

        <View style={{ gap: espaco.xs }}>
          {vivos.map((p) => {
            const n = votosContados[p.id] ?? 0;
            return (
              <View
                key={p.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: espaco.md,
                  minHeight: alvoMinimo,
                  borderWidth: 1,
                  borderColor: n > 0 ? cores.garanca : '#2E2721',
                  backgroundColor: n > 0 ? '#241A17' : '#1A1613',
                  borderRadius: 4,
                  paddingHorizontal: espaco.md,
                  paddingVertical: espaco.sm,
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: p.cor,
                    borderColor: cores.linhoCru,
                    borderWidth: 0.25,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
                <Text style={[tipografia.corpo, { color: cores.folhaDeOuro, flex: 1 }]}>
                  {p.nome}
                </Text>

                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    ajustarVoto(p.id, -1);
                  }}
                  disabled={n === 0}
                  hitSlop={8}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: n === 0 ? 0.3 : 1,
                  }}
                >
                  <Text style={{ color: cores.ferrugem, fontSize: 24 }}>−</Text>
                </Pressable>

                <Text
                  style={[
                    tipografia.interface,
                    {
                      color: n > 0 ? cores.linhoCru : cores.nogueiraTexto,
                      minWidth: 22,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {n}
                </Text>

                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    ajustarVoto(p.id, 1);
                  }}
                  hitSlop={8}
                  style={{
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: cores.folhaDeOuro, fontSize: 22 }}>+</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {totalContado > elegiveis.podem.length && (
          <Pequeno cor={cores.garancaTexto}>
            Você contou mais votos do que há gente podendo votar. Confira.
          </Pequeno>
        )}
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        <Botao tom="destrutivo" onPress={encerrar}>
          Encerrar a votação
        </Botao>
      </View>
    </Ambiente>
  );
}
