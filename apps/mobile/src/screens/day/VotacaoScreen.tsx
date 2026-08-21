import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { elegiveisParaVotar, temEfeito, type PlayerId } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, TelaMomento, Botao, Titulo, Rotulo, Pequeno, ItemJogador } from '../../components/ui';
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

  if (!estado) return <TelaOperacao />;

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
      <TelaMomento>
        <Titulo>Não há julgamento hoje.</Titulo>
        <Pequeno cor={cores.ferrugem}>Ninguém tem estômago para isso.</Pequeno>
        <View style={{ height: espaco.xl }} />
        <View style={{ width: 260 }}>
          <Botao onPress={encerrar}>Seguir para a noite</Botao>
        </View>
      </TelaMomento>
    );
  }

  // ── Votação secreta: uma passagem por votante ──────────────────────────────
  if (estado.config.votacao === 'secreta') {
    const votanteId = elegiveis.podem[indiceSecreto];
    if (!votanteId) {
      return (
        <TelaMomento>
          <Titulo>Todos votaram.</Titulo>
          <View style={{ height: espaco.xl }} />
          <View style={{ width: 260 }}>
            <Botao onPress={encerrar}>Revelar o resultado</Botao>
          </View>
        </TelaMomento>
      );
    }

    if (mostrandoEntrega) {
      return (
        <Pressable style={{ flex: 1 }} onPress={() => setMostrandoEntrega(false)}>
          <TelaMomento luz={cores.cera}>
            <Rotulo>Voto secreto · passe para</Rotulo>
            <Titulo>{nomeDe(votanteId)}</Titulo>
            <View style={{ height: espaco.xl }} />
            <Text style={{ color: cores.ferrugem, fontSize: 11, letterSpacing: 1.5 }}>
              TOQUE PARA VOTAR
            </Text>
          </TelaMomento>
        </Pressable>
      );
    }

    return (
      <TelaOperacao>
        <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
          <Rotulo>{nomeDe(votanteId)} vota</Rotulo>
          <Titulo>Em quem?</Titulo>
          <View style={{ gap: espaco.xs }}>
            {vivos
              .filter((p) => p.id !== votanteId)
              .map((p) => (
                <ItemJogador
                  key={p.id}
                  nome={p.nome}
                  corDoPonto={p.cor}
                  selecionado={votos[votanteId] === p.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    votar(votanteId, p.id);
                  }}
                />
              ))}
            <ItemJogador
              nome="Abster-se"
              selecionado={votos[votanteId] === null}
              onPress={() => votar(votanteId, null)}
            />
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
      </TelaOperacao>
    );
  }

  // ── Votação simultânea: o host registra o que a mesa apontou ───────────────
  const registrados = Object.keys(votos).length;

  return (
    <TelaOperacao>
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
    </TelaOperacao>
  );
}
