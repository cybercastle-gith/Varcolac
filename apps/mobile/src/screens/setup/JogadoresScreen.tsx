import { useState } from 'react';
import { Pressable, TextInput, View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Rolagem, Botao, Rotulo, Titulo, Pequeno, ItemJogador } from '../../components/ui';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Jogadores'>;

/**
 * Tela 2 — Jogadores.
 *
 * Nome + cor, salvos por grupo: digita uma vez, usa sempre. Tela de OPERAÇÃO,
 * então nada de textura — só alvos grandes e contraste.
 */
export function JogadoresScreen({ navigation }: Props) {
  const { jogadores, adicionarJogador, removerJogador, renomearJogador } = useJogo();
  const [editando, setEditando] = useState<number | null>(null);

  const podeSeguir = jogadores.length >= 5;

  return (
    <TelaOperacao>
      <Rolagem>
        <Rotulo>Passo 1 de 5</Rotulo>
        <Titulo>Quem está na mesa?</Titulo>
        <Pequeno>
          {jogadores.length} de 16 · mínimo 5. O celular vai circular nesta ordem.
        </Pequeno>

        <View style={{ gap: espaco.sm, marginTop: espaco.md }}>
          {jogadores.map((j, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
              <View style={{ flex: 1 }}>
                {editando === i ? (
                  <TextInput
                    value={j.nome}
                    onChangeText={(t) => renomearJogador(i, t)}
                    onBlur={() => setEditando(null)}
                    autoFocus
                    selectTextOnFocus
                    style={[
                      tipografia.corpo,
                      {
                        color: cores.linhoCru,
                        backgroundColor: '#1D1814',
                        borderColor: cores.garanca,
                        borderWidth: 1,
                        borderRadius: 4,
                        paddingHorizontal: espaco.md,
                        minHeight: 48,
                      },
                    ]}
                  />
                ) : (
                  <ItemJogador
                    nome={j.nome}
                    detalhe={`jogador ${i + 1}`}
                    corDoPonto={j.cor}
                    onPress={() => setEditando(i)}
                  />
                )}
              </View>
              <Pressable
                onPress={() => removerJogador(i)}
                disabled={jogadores.length <= 5}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: jogadores.length <= 5 ? 0.25 : 1,
                }}
              >
                <Text style={{ color: cores.ferrugem, fontSize: 20 }}>−</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Botao tom="secundario" onPress={() => adicionarJogador('')}>
          + Adicionar jogador
        </Botao>
      </Rolagem>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        {!podeSeguir && <Pequeno cor={cores.garanca}>São necessários pelo menos 5 jogadores.</Pequeno>}
        <Botao desabilitado={!podeSeguir} onPress={() => navigation.navigate('Modo')}>
          Continuar
        </Botao>
      </View>
    </TelaOperacao>
  );
}
