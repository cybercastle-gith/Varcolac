import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROLES } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao } from '../../components/animacoes';
import { MarcaViva } from '../../components/Bordado';
import { Botao, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <Ambiente clima="noite">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
        <Aparicao distancia={0}>
          <MarcaViva />
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
