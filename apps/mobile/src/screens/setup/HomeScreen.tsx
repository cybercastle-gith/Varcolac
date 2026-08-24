import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROLES } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao } from '../../components/animacoes';
import { Botao, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * A marca: o losango de bordado, desenhado por Views.
 *
 * Ele gira lentíssimo — 40 segundos por volta. Não é para ser percebido como
 * movimento; é para a tela nunca parecer congelada quando o aparelho está
 * parado na mesa esperando alguém pegar.
 */
function Marca() {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    laco.start();
    return () => laco.stop();
  }, [giro]);

  const rotate = giro.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '405deg'] });

  return (
    <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 84,
          height: 84,
          borderWidth: 1,
          borderColor: cores.garanca,
          transform: [{ rotate }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: 52,
          height: 52,
          borderWidth: 1,
          borderColor: cores.ferrugem,
          opacity: 0.6,
          transform: [{ rotate }],
        }}
      />
      <View
        style={{
          width: 7,
          height: 7,
          backgroundColor: cores.cera,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  return (
    <Ambiente clima="noite">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
        <Aparicao distancia={0}>
          <Marca />
        </Aparicao>

        <Aparicao atraso={120}>
          <View style={{ alignItems: 'center', gap: espaco.sm }}>
            <Text
              style={[
                tipografia.titulo,
                { color: cores.linhoCru, fontSize: 42, letterSpacing: 2 },
              ]}
            >
              Vârcolac
            </Text>
            <Pequeno cor={cores.ferrugem}>
              Um aparelho. A mesa inteira. Ninguém sai antes do fim.
            </Pequeno>
          </View>
        </Aparicao>
      </View>

      <Aparicao atraso={240}>
        <View style={{ padding: espaco.lg, gap: espaco.sm }}>
          <Botao onPress={() => navigation.navigate('Jogadores')}>Jogar</Botao>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            <Botao
              tom="secundario"
              onPress={() => navigation.navigate('Biblioteca')}
              style={{ flex: 1 }}
            >
              Funções
            </Botao>
            <Botao
              tom="secundario"
              onPress={() => navigation.navigate('ComoJogar')}
              style={{ flex: 1 }}
            >
              Como jogar
            </Botao>
          </View>
          <View style={{ alignItems: 'center', marginTop: espaco.sm }}>
            <Rotulo cor={cores.nogueira}>
              {ROLES.length} funções · 5 a 16 jogadores
            </Rotulo>
          </View>
        </View>
      </Aparicao>
    </Ambiente>
  );
}
