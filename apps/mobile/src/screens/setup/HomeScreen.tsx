import { Image, View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ROLES } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao } from '../../components/animacoes';
import { Bordado, faixa } from '../../components/Bordado';
import { Botao, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia, familia } from '../../theme';
import { logo } from '../../theme/materiais';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

/**
 * O selo que carrega a marca.
 *
 * É o toque do "Livro de Caça" dentro de uma tela que, no resto, é
 * Xilogravura Popular: a pegada não flutua solta no halo — ela está
 * ESTAMPADA, cera sobre um registro. Cera de verdade não é lisa: o
 * disco de baixo (sheen deslocado para cima-esquerda, onde a luz da
 * vela bateria) é o que evita a marca "adesivo vetorial perfeito".
 */
function SeloDaMarca() {
  return (
    <View
      style={{
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: cores.sangueSeco,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,.45)',
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 96,
          height: 96,
          borderRadius: 48,
          top: 10,
          left: 16,
          backgroundColor: 'rgba(163,38,32,.4)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          right: 6,
          bottom: 6,
          borderRadius: 60,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,.35)',
        }}
      />
      <Image
        source={logo}
        resizeMode="contain"
        style={{ width: 66, height: 82, opacity: 0.96 }}
      />
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  return (
    <Ambiente clima="noite">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.lg }}>
        <Aparicao distancia={0}>
          <SeloDaMarca />
        </Aparicao>

        <Aparicao atraso={120}>
          <View style={{ alignItems: 'center', gap: espaco.md }}>
            <Text
              style={[
                tipografia.titulo,
                { fontFamily: familia.serifBold, color: cores.linhoCru, fontSize: 44, letterSpacing: 1.5 },
              ]}
            >
              VÂRCOLAC
            </Text>
            <Pequeno cor={cores.ferrugem}>
              Um aparelho. A mesa inteira. Ninguém sai antes do fim.
            </Pequeno>
            <Bordado trama={faixa(17)} ponto={4} folga={3} opacidade={0.75} />
          </View>
        </Aparicao>
      </View>

      <Aparicao atraso={240}>
        <View style={{ padding: espaco.lg, gap: espaco.sm }}>
          {/* A linha de pauta: registro antes de botão de operação. */}
          <View style={{ height: 1, backgroundColor: 'rgba(58,42,28,.55)', marginBottom: espaco.xs }} />
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
