import { View, Text, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODOS, ESTILOS, type GameMode, type DeckStyle } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Rolagem, Botao, Rotulo, Titulo, Pequeno, Corpo } from '../../components/ui';
import { cores, espaco, raio, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Modo'>;

function Cartao({ titulo, descricao, escolhido, onPress }: {
  titulo: string;
  descricao: string;
  escolhido: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 48,
        backgroundColor: escolhido ? '#241A17' : '#1D1814',
        borderColor: escolhido ? cores.garanca : '#2E2721',
        borderWidth: 1,
        borderRadius: raio.padrao,
        padding: espaco.md,
        gap: 4,
      }}
    >
      <Text style={[tipografia.interface, { color: cores.linhoCru }]}>{titulo}</Text>
      <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{descricao}</Text>
    </Pressable>
  );
}

/** Telas 3 e 4 — Modo e Baralho. Modos mudam REGRAS; baralho muda composição. */
export function ModoScreen({ navigation }: Props) {
  const { config, setConfig, estilo, setEstilo, baralhoSurpresa, deck } = useJogo();

  return (
    <TelaOperacao>
      <Rolagem>
        <Rotulo>Passo 2 de 4</Rotulo>
        <Titulo>Que jogo é hoje?</Titulo>

        <Rotulo>Modo</Rotulo>
        <View style={{ gap: espaco.sm }}>
          {Object.values(MODOS).map((m) => (
            <Cartao
              key={m.id}
              titulo={m.nome}
              descricao={m.descricao}
              escolhido={config.modo === m.id}
              onPress={() => setConfig({ modo: m.id as GameMode })}
            />
          ))}
        </View>

        <View style={{ height: espaco.md }} />
        <Rotulo>Baralho</Rotulo>
        <Corpo cor={cores.ferrugem}>
          {deck.nome} · {deck.roleIds.length} cartas
        </Corpo>

        <Botao tom="secundario" onPress={baralhoSurpresa}>
          Baralho Surpresa
        </Botao>
        <Pequeno>
          O app monta uma composição válida que ninguém na mesa conhece de antemão.
        </Pequeno>

        <View style={{ gap: espaco.sm, marginTop: espaco.sm }}>
          {ESTILOS.map((e) => (
            <Cartao
              key={e.id}
              titulo={e.nome}
              descricao={e.frase}
              escolhido={estilo === e.id && deck.id === e.id}
              onPress={() => setEstilo(e.id as DeckStyle)}
            />
          ))}
        </View>
      </Rolagem>

      <View style={{ padding: espaco.lg }}>
        <Botao onPress={() => navigation.navigate('Sistemas')}>Continuar</Botao>
      </View>
    </TelaOperacao>
  );
}
