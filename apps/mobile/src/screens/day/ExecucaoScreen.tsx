import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Botao, Titulo, Rotulo, Pequeno } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { Motivo, corDaFaccao } from '../../components/Motivo';
import { Revelacao } from '../../components/animacoes';
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

  if (!estado) return <Ambiente clima="morte" />;

  const votacao = estado.historicoVotos.at(-1);
  const executados = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  const anuncios = estado.anuncios.filter((a) => a.rodada === estado.rodada);

  return (
    <Ambiente clima="morte">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco.lg, gap: espaco.md }}>
      <Rotulo>Dia {estado.rodada}</Rotulo>

      {!votacao?.linchadoId ? (
        <>
          <Titulo>A corda ficou vazia.</Titulo>
          <Pequeno cor={cores.ferrugem}>
            {votacao?.empate ? 'A vila empatou e não decidiu nada.' : 'Ninguém foi condenado.'}
          </Pequeno>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: espaco.lg }}>
          {executados.map((p, i) => (
            <Revelacao key={p.id} atraso={i * 320}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ color: cores.sangueSeco, fontSize: 26 }}>✝</Text>
                <Text style={[tipografia.titulo, { color: cores.linhoCru }]}>{p.nome}</Text>
                {estado.config.revelarRoleAoMorrer && (
                  <>
                    <Motivo
                      roleId={p.roleId}
                      varianteId={p.varianteId}
                      tamanho={36}
                      cor={corDaFaccao(p.roleId)}
                    />
                    <Text style={[tipografia.nomeDeRole, { color: cores.cera, fontSize: 20 }]}>
                      {role(p.roleId).nome}
                    </Text>
                  </>
                )}
              </View>
            </Revelacao>
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

      </View>

      <View style={{ padding: espaco.lg }}>
        <Botao
          onPress={() => {
            seguirParaNoite();
            navigation.reset({ index: 0, routes: [{ name: 'Passagem' }] });
          }}
        >
          A noite cai
        </Botao>
      </View>
    </Ambiente>
  );
}
