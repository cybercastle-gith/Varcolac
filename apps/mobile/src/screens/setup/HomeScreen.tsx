import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROLES } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { TelaMomento, Botao, Titulo, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, motivos } from '../../theme';
import { Text } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * Tela 1 — Home.
 *
 * É tela de MOMENTO, e é a única de entrada que pode se dar a esse luxo: aqui
 * ninguém tem pressa nem está no escuro com sete pessoas olhando.
 */
export function HomeScreen({ navigation }: Props) {
  return (
    <TelaMomento>
      <Text style={{ fontSize: 40, color: cores.garanca, marginBottom: espaco.md }}>
        {motivos.losango}
      </Text>
      <Titulo>Vârcolac</Titulo>
      <Pequeno cor={cores.ferrugem}>
        Um aparelho. A mesa inteira. Ninguém sai antes do fim.
      </Pequeno>

      <View style={{ height: espaco.xl }} />

      <View style={{ gap: espaco.sm, width: 260 }}>
        <Botao onPress={() => navigation.navigate('Jogadores')}>Jogar</Botao>
        <Botao tom="secundario" onPress={() => navigation.navigate('Biblioteca')}>
          Biblioteca de funções
        </Botao>
        <Botao tom="secundario" onPress={() => navigation.navigate('ComoJogar')}>
          Como jogar
        </Botao>
      </View>

      <View style={{ height: espaco.xl }} />
      <Rotulo>{ROLES.length} funções · 5 a 16 jogadores</Rotulo>
    </TelaMomento>
  );
}
