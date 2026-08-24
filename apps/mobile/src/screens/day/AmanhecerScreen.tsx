import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente } from '../../components/Ambiente';
import { Motivo, corDaFaccao } from '../../components/Motivo';
import { Revelacao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Amanhecer'>;

/**
 * Amanhecer — narração, mortes e evento da noite.
 *
 * É onde o app deixa de ser ferramenta e vira mestre: a frase dita em voz alta
 * é o produto. A ambientação vira `morte` quando houve morte, e `dia` quando
 * não houve — a mesa sente a diferença antes de ler a tela.
 */
export function AmanhecerScreen({ navigation }: Props) {
  const { estado, vitoria } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  useEffect(() => {
    if (vitoria?.encerrada) navigation.reset({ index: 0, routes: [{ name: 'Fim' }] });
  }, [vitoria, navigation]);

  if (!estado) return <Ambiente clima="dia" />;

  const mortosDaNoite = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  const anuncios = estado.anuncios.filter((a) => a.rodada === estado.rodada);
  const houveMorte = mortosDaNoite.length > 0;

  return (
    <Ambiente clima={houveMorte ? 'morte' : 'dia'}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: espaco.lg, gap: espaco.md }}>
        <Revelacao>
          <View style={{ alignItems: 'center', gap: espaco.sm }}>
            <Text style={{ color: houveMorte ? cores.sangueSeco : cores.cera, fontSize: 26 }}>
              {houveMorte ? '✝' : '☉'}
            </Text>
            <Rotulo>Noite {estado.rodada} · amanheceu</Rotulo>
          </View>
        </Revelacao>

        {!houveMorte ? (
          <Revelacao atraso={220}>
            <View style={{ alignItems: 'center', gap: espaco.sm }}>
              <Titulo>Ninguém morreu.</Titulo>
              <Pequeno cor={cores.ferrugem}>Isso é pior do que parece.</Pequeno>
            </View>
          </Revelacao>
        ) : (
          <View style={{ alignItems: 'center', gap: espaco.lg, marginTop: espaco.sm }}>
            {mortosDaNoite.map((p, i) => (
              <Revelacao key={p.id} atraso={220 + i * 320}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  {estado.config.revelarRoleAoMorrer && (
                    <Motivo
                      roleId={p.roleId}
                      varianteId={p.varianteId}
                      tamanho={40}
                      cor={corDaFaccao(p.roleId)}
                    />
                  )}
                  <Text style={[tipografia.titulo, { color: cores.linhoCru }]}>{p.nome}</Text>
                  {estado.config.revelarRoleAoMorrer && (
                    <Text style={[tipografia.nomeDeRole, { color: cores.ferrugem, fontSize: 18 }]}>
                      era {role(p.roleId).nome}
                    </Text>
                  )}
                </View>
              </Revelacao>
            ))}
          </View>
        )}

        {anuncios.length > 0 && (
          <Revelacao atraso={600}>
            <View style={{ marginTop: espaco.lg, gap: espaco.sm, alignItems: 'center' }}>
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
          </Revelacao>
        )}
      </View>

      <View style={{ padding: espaco.lg }}>
        <Botao onPress={() => navigation.navigate('Discussao')}>Abrir a discussão</Botao>
      </View>
    </Ambiente>
  );
}
