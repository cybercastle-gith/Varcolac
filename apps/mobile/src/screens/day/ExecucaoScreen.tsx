import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaMomento, Botao, Titulo, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Execucao'>;

/** Tela 15 — Execução: resultado e revelação, se configurada. */
export function ExecucaoScreen({ navigation }: Props) {
  const { estado, vitoria, seguirParaNoite } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  useEffect(() => {
    if (vitoria?.encerrada) navigation.reset({ index: 0, routes: [{ name: 'Fim' }] });
  }, [vitoria, navigation]);

  if (!estado) return <TelaMomento />;

  const votacao = estado.historicoVotos.at(-1);
  const executados = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  const anuncios = estado.anuncios.filter((a) => a.rodada === estado.rodada);

  return (
    <TelaMomento luz={cores.sangueSeco}>
      <Rotulo>Dia {estado.rodada}</Rotulo>

      {!votacao?.linchadoId ? (
        <>
          <Titulo>A corda ficou vazia.</Titulo>
          <Pequeno cor={cores.ferrugem}>
            {votacao?.empate ? 'A vila empatou e não decidiu nada.' : 'Ninguém foi condenado.'}
          </Pequeno>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: espaco.sm }}>
          {executados.map((p) => (
            <View key={p.id} style={{ alignItems: 'center' }}>
              <Text style={{ color: cores.sangueSeco, fontSize: 26 }}>✝</Text>
              <Text style={[tipografia.subtitulo, { color: cores.linhoCru }]}>{p.nome}</Text>
              {estado.config.revelarRoleAoMorrer && (
                <Text style={[tipografia.nomeDeRole, { color: cores.cera, fontSize: 20 }]}>
                  {role(p.roleId).nome}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {anuncios.length > 0 && (
        <View style={{ marginTop: espaco.lg, gap: 6, alignItems: 'center' }}>
          {anuncios.map((a, i) => (
            <Text
              key={i}
              style={[
                tipografia.corpoSerif,
                { color: cores.cera, textAlign: 'center', fontStyle: 'italic' },
              ]}
            >
              {a.texto}
            </Text>
          ))}
        </View>
      )}

      <View style={{ height: espaco.xl }} />
      <View style={{ width: 260 }}>
        <Botao
          onPress={() => {
            seguirParaNoite();
            navigation.reset({ index: 0, routes: [{ name: 'Passagem' }] });
          }}
        >
          A noite cai
        </Botao>
      </View>
    </TelaMomento>
  );
}
