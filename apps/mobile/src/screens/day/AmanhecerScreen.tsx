import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaMomento, Botao, Titulo, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Amanhecer'>;

/**
 * Tela 12 — Amanhecer.
 *
 * Tela de MOMENTO: narração, mortes e evento da noite. É onde o app deixa de
 * ser ferramenta e vira mestre — a frase dita em voz alta é o produto.
 */
export function AmanhecerScreen({ navigation }: Props) {
  const { estado, vitoria } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  useEffect(() => {
    if (vitoria?.encerrada) navigation.reset({ index: 0, routes: [{ name: 'Fim' }] });
  }, [vitoria, navigation]);

  if (!estado) return <TelaMomento />;

  const mortosDaNoite = estado.players.filter(
    (p) => p.status === 'morto' && p.mortoNaRodada === estado.rodada,
  );
  const anuncios = estado.anuncios.filter((a) => a.rodada === estado.rodada);
  const bilhetes = estado.sussurrosPendentes.filter((s) => s.deRodada === estado.rodada - 1);

  return (
    <TelaMomento luz={cores.chama}>
      <Rotulo>Noite {estado.rodada} · amanheceu</Rotulo>

      {mortosDaNoite.length === 0 ? (
        <>
          <Titulo>Ninguém morreu.</Titulo>
          <Pequeno cor={cores.ferrugem}>Isso é pior do que parece.</Pequeno>
        </>
      ) : (
        <View style={{ alignItems: 'center', gap: espaco.sm }}>
          {mortosDaNoite.map((p) => (
            <View key={p.id} style={{ alignItems: 'center' }}>
              <Text style={{ color: cores.sangueSeco, fontSize: 22 }}>✝</Text>
              <Text style={[tipografia.subtitulo, { color: cores.linhoCru }]}>{p.nome}</Text>
              {estado.config.revelarRoleAoMorrer && (
                <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
                  era {role(p.roleId).nome}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {anuncios.length > 0 && (
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
      )}

      {bilhetes.length > 0 && (
        <View style={{ marginTop: espaco.lg, alignItems: 'center' }}>
          <Rotulo>{bilhetes.length} bilhete(s) entregue(s)</Rotulo>
          <Pequeno cor={cores.ferrugem}>Quem recebeu já sabe.</Pequeno>
        </View>
      )}

      <View style={{ height: espaco.xl }} />
      <View style={{ width: 260 }}>
        <Botao onPress={() => navigation.navigate('Discussao')}>Abrir a discussão</Botao>
      </View>
    </TelaMomento>
  );
}
