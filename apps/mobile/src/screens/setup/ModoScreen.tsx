import { View, Text, Pressable, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODOS, type GameMode } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente } from '../../components/Ambiente';
import { Aparicao } from '../../components/animacoes';
import { Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, raio, tipografia, alvoMinimo } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Modo'>;

/** Motivo de cada modo: um desenho geométrico que resume a regra. */
const MARCA: Record<GameMode, string> = {
  classico: '◆',
  traicao: '◇',
  'vila-amaldicoada': '☽',
  duplas: '◈',
};

/**
 * Tela de modo.
 *
 * Modos mudam REGRAS; o baralho, que muda composição, ganhou tela própria logo
 * depois — são decisões de natureza diferente e misturá-las numa tela só fazia
 * o host escolher as duas com o mesmo grau de atenção.
 */
export function ModoScreen({ navigation }: Props) {
  const { config, setConfig } = useJogo();

  return (
    <Ambiente clima="neutro" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Rotulo>Passo 2 de 5</Rotulo>
        <Titulo>Que jogo é hoje?</Titulo>
        <Pequeno>O modo muda as regras da partida, não as funções do baralho.</Pequeno>

        <View style={{ gap: espaco.sm, marginTop: espaco.sm }}>
          {Object.values(MODOS).map((m, i) => {
            const escolhido = config.modo === m.id;
            return (
              <Aparicao key={m.id} atraso={i * 45}>
                <Pressable
                  onPress={() => setConfig({ modo: m.id as GameMode })}
                  style={{
                    minHeight: alvoMinimo,
                    flexDirection: 'row',
                    gap: espaco.md,
                    backgroundColor: escolhido ? '#241A17' : '#1A1613',
                    borderColor: escolhido ? cores.garanca : '#2E2721',
                    borderWidth: 1,
                    borderRadius: raio.padrao,
                    padding: espaco.md,
                  }}
                >
                  <Text
                    style={{
                      color: escolhido ? cores.garanca : cores.nogueira,
                      fontSize: 20,
                      marginTop: 2,
                    }}
                  >
                    {MARCA[m.id]}
                  </Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[tipografia.interface, { color: cores.linhoCru }]}>{m.nome}</Text>
                    <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>
                      {m.descricao}
                    </Text>
                  </View>
                </Pressable>
              </Aparicao>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        <Botao onPress={() => navigation.navigate('Baralho')}>Escolher o baralho</Botao>
      </View>
    </Ambiente>
  );
}
