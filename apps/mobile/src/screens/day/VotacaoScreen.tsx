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
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Votacao'>;

/**
 * Tela 14 — Votação.
 *
 * Simultânea por padrão: todos apontam na contagem de três e o host registra.
 * Elimina uma volta de celular por dia e é mais teatral. Secreta passa o
 * aparelho de mão em mão, um voto por vez.
 */
export function VotacaoScreen({ navigation }: Props) {
  const { estado, votos, votar, fecharVotacao } = useJogo();
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
              <Text style={[tipografia.rotulo, { color: cores.garanca }]}>Por que não</Text>
              <Text style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                {motivoDoImpedimento}
              </Text>
              <Pequeno cor={cores.nogueira}>
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

  // ── Votação simultânea: o host registra o que a mesa apontou ───────────────
  const registrados = Object.keys(votos).length;

  return (
    <Ambiente clima="dia" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Rotulo>Dia {estado.rodada} · votação simultânea</Rotulo>
        <Titulo>Todos apontam na contagem de três.</Titulo>
        <Pequeno>
          Registre em quem cada um apontou. {registrados} de {elegiveis.podem.length} registrados.
        </Pequeno>

        {elegiveis.impedidos.length > 0 && (
          <View style={{ gap: 2 }}>
            {elegiveis.impedidos.map((i) => (
              <Pequeno key={i.id} cor={cores.nogueira}>
                {nomeDe(i.id)} — {i.motivo}
              </Pequeno>
            ))}
          </View>
        )}

        {elegiveis.podem.map((id) => (
          <View key={id} style={{ gap: espaco.xs }}>
            <Text style={[tipografia.rotulo, { color: cores.ferrugem }]}>
              {nomeDe(id)} aponta para
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: espaco.xs }}>
                {vivos
                  .filter((p) => p.id !== id)
                  .map((p) => {
                    const ativo = votos[id] === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          votar(id, ativo ? null : p.id);
                        }}
                        style={{
                          minHeight: 48,
                          paddingHorizontal: espaco.md,
                          justifyContent: 'center',
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: ativo ? cores.garanca : '#3E362E',
                          backgroundColor: ativo ? '#241A17' : 'transparent',
                        }}
                      >
                        <Text
                          style={[
                            tipografia.pequeno,
                            { color: ativo ? cores.linhoCru : cores.ferrugem },
                          ]}
                        >
                          {p.nome}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        <Botao tom="destrutivo" onPress={encerrar}>
          Encerrar a votação
        </Botao>
      </View>
    </Ambiente>
  );
}
