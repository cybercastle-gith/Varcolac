import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cores, espaco, raio, tipografia, alvoMinimo, duracaoMaximaMs } from '../theme';

/**
 * Uma folha que sobe por cima da tela, com um X para fechar.
 *
 * Existe porque a consulta rápida não pode custar a tela inteira. O lembrete de
 * função morava dentro da rolagem da passagem e disputava o dedo com ela — o
 * gesto de segurar virava rolagem e a carta nunca aparecia. Uma sobreposição
 * captura o toque sozinha e sai sem levar o jogador para lugar nenhum.
 *
 * O véu escuro por trás é o que faz isto ser uma sobreposição e não outra tela:
 * a mesa continua vendo que existe alguma coisa embaixo, e o jogador sabe que
 * vai voltar exatamente para onde estava.
 */
export function Sobreposicao({
  aberta,
  aoFechar,
  titulo,
  children,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /*
     * A entrada é mais lenta que a saída, de propósito.
     *
     * Abrir é um convite — vale os 250ms da identidade. Fechar é o jogador
     * dizendo "já vi": segurá-lo ali por mais um quarto de segundo é o tipo de
     * atraso que faz um app parecer pesado com sete pessoas esperando.
     */
    Animated.timing(v, {
      toValue: aberta ? 1 : 0,
      duration: aberta ? duracaoMaximaMs : 140,
      easing: aberta ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [aberta, v]);

  return (
    <Modal visible={aberta} transparent animationType="none" onRequestClose={aoFechar}>
      {/* O véu também fecha: tocar fora é o gesto que todo mundo tenta primeiro. */}
      <Pressable style={{ flex: 1 }} onPress={aoFechar}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(10, 8, 6, 0.86)',
            opacity: v,
            justifyContent: 'center',
            padding: espaco.lg,
          }}
        >
          {/*
            O `Pressable` interno engole o toque para que tocar NA folha não a
            feche — sem ele, escolher qualquer coisa aqui dentro fecharia tudo.
          */}
          <Pressable onPress={() => {}}>
            <Animated.View
              style={{
                backgroundColor: '#1A1613',
                borderWidth: 1,
                borderColor: '#2E2721',
                borderRadius: raio.padrao,
                padding: espaco.lg,
                gap: espaco.md,
                opacity: v,
                transform: [
                  { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                  { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
                ],
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={[tipografia.rotulo, { color: cores.cera }]}>{titulo}</Text>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    aoFechar();
                  }}
                  hitSlop={12}
                  style={{
                    minWidth: alvoMinimo,
                    minHeight: alvoMinimo,
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: cores.ferrugem, fontSize: 22, lineHeight: 24 }}>✕</Text>
                </Pressable>
              </View>

              {children}
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
