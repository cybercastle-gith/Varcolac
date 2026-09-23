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
      <Image
        source={logo}
        resizeMode="contain"
        style={{ width: 200, height: 150, opacity: 0.96 }}
      />
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
            <Text style={[
              { 
                maxWidth: 320, 
                fontFamily: familia.serifRegular, 
                color: cores.ferrugem, 
                fontSize: 16, 
                textAlign: 'center',
                // --- Adicione as linhas abaixo para o efeito de luz suave ---
                textShadowColor: 'rgba(255, 255, 255, 0.6)', // Cor da luz (Branco com 80% de opacidade)
                textShadowOffset: { width: 0, height: 0 },    // Centraliza o brilho ao redor da letra
                textShadowRadius: 1,                          // Intensidade/difusão do brilho
              }
            ]}> 
              O perigo aguarda a espreita, você está pronto para sobreviver?
            </Text>

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
              tom="claro"
              onPress={() => navigation.navigate('Biblioteca')}
              style={{ flex: 1,  }}
            >
              Funções
            </Botao>
            <Botao
              tom="claro"
              onPress={() => navigation.navigate('ComoJogar')}
              style={{ flex: 1 }}
            >
              Como jogar
            </Botao>
          </View>
        </View>
      </Aparicao>
    </Ambiente>
  );
}
