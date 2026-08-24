import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { duracaoMaximaMs } from '../theme';

/**
 * As animações do app, num lugar só.
 *
 * Regra da identidade: **transição máxima de 250ms**. Ninguém quer esperar
 * animação com sete pessoas olhando e o aparelho na mão de outra. Por isso não
 * existe `duration` livre aqui — tudo é ancorado em `duracaoMaximaMs`, e o que
 * passa disso é sempre entrada de tela de MOMENTO, nunca de operação.
 */

/** Entrada: sobe um pouco e aparece. O atraso escalona listas. */
export function Aparicao({ children, atraso = 0, distancia = 10, style }: {
  children: ReactNode;
  atraso?: number;
  distancia?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: duracaoMaximaMs,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, atraso]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distancia, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Entrada de tela de momento: mais lenta e com escala, porque aqui a espera É o
 * efeito. Ainda assim curta — 420ms é o limite do que a mesa tolera.
 */
export function Revelacao({ children, atraso = 0 }: { children: ReactNode; atraso?: number }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, atraso]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Pulso lento e discreto, para o que precisa chamar sem gritar. */
export function Pulso({ children, ativo = true }: { children: ReactNode; ativo?: boolean }) {
  const v = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ativo) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.55, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [v, ativo]);

  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

/**
 * Contagem que sobe até o valor. Usado no índice de equilíbrio, onde ver o
 * número correr comunica que ele foi CALCULADO, e não escolhido.
 */
export function useNumeroAnimado(alvo: number, duracao = 400): Animated.Value {
  const v = useRef(new Animated.Value(alvo)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: alvo,
      duration: duracao,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [alvo, duracao, v]);
  return v;
}
