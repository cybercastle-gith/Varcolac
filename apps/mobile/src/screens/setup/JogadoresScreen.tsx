import { useState } from 'react';
import { Pressable, TextInput, View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Rolagem, Botao, Titulo, Pequeno, ItemJogador } from '../../components/ui';
import { ListaArrastavel } from '../../components/ListaArrastavel';
import { cores, espaco, tipografia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Jogadores'>;

/**
 * Tela 2 — Jogadores.
 *
 * Nome + cor, salvos por grupo: digita uma vez, usa sempre. Tela de OPERAÇÃO,
 * então nada de textura — só alvos grandes e contraste.
 */
export function JogadoresScreen({ navigation }: Props) {
  const { jogadores, adicionarJogador, removerJogador, renomearJogador, reordenarJogadores } =
    useJogo();
  const [editando, setEditando] = useState<number | null>(null);

  const podeSeguir = jogadores.length >= 5;

  /**
   * Altura fixa da linha, e a lista arrastável depende disso.
   * 48px é o alvo mínimo da identidade; os 8 restantes são o respiro entre
   * linhas, que a lista precisa contar junto para acertar o destino do arrasto.
   */
  const ALTURA_DA_LINHA = 56;

  return (
    <TelaOperacao>
      <Rolagem>
        <Titulo>Quem irá jogar?</Titulo>
        <Pequeno>{jogadores.length} de 16 · mínimo 5 jogadores</Pequeno>
        <Pequeno cor={cores.nogueiraTexto}>
          Arraste pelo ≡ para pôr na ordem em que vocês estão sentados — é a ordem em que o celular
          vai circular.
        </Pequeno>

        <View style={{ marginTop: espaco.md }}>
          <ListaArrastavel
            itens={jogadores}
            altura={ALTURA_DA_LINHA}
            aoReordenar={reordenarJogadores}
          >
            {(j, i, alca) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 48 }}>
                {/* A alça só existe fora da edição: arrastar e digitar ao mesmo
                    tempo não é gesto, é acidente. */}
                {editando === i ? <View style={{ width: 44 }} /> : alca}
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
                    ></TextInput>
                  ) : (
                    <ItemJogador
                      nome={j.nome}
                      detalhe={`${i + 1}º a receber o aparelho`}
                      corDoPonto={j.cor}
                      onPress={() => setEditando(i)}
                      direita={
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
                          <Text style={{ color: cores.linhoCru, fontSize: 30 }}>−</Text>
                        </Pressable>
                      }
                    />
                  )}
                </View>
              </View>
            )}
          </ListaArrastavel>
        </View>

        <Botao tom="alternativo" onPress={() => adicionarJogador('')}>
          + Adicionar jogador
        </Botao>
      </Rolagem>

      <View style={{ padding: espaco.lg, gap: espaco.sm }}>
        {!podeSeguir && (
          <Pequeno cor={cores.garancaTexto}>São necessários pelo menos 5 jogadores.</Pequeno>
        )}
        <Botao desabilitado={!podeSeguir} onPress={() => navigation.navigate('Modo')}>
          Continuar
        </Botao>
      </View>
    </TelaOperacao>
  );
}
