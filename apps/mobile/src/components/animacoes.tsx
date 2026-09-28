import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { tempos } from '../theme';

/**
 * As animações do app, num lugar só.
 *
 * Regra da identidade: **transição máxima de 250ms**. Ninguém quer esperar
 * animação com sete pessoas olhando e o aparelho na mão de outra. Por isso não
 * existe `duration` livre aqui — tudo é ancorado em `duracaoMaximaMs`, e o que
 * passa disso é sempre entrada de tela de MOMENTO, nunca de operação.
 */

/** Entrada: sobe um pouco e aparece. O atraso escalona listas. */
export function Aparicao({
  children,
  atraso = 0,
  distancia = 10,
  style,
}: {
  children: ReactNode;
  atraso?: number;
  distancia?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /*
     * Uma bézier no lugar de `Easing.out(Easing.cubic)`.
     *
     * A diferença é toda no FIM: esta curva sai rápido e passa a maior parte do
     * tempo desacelerando, então o elemento parece POUSAR em vez de escorregar
     * até parar. Numa lista com atraso escalonado, cubic faz as últimas linhas
     * parecerem lentas mesmo tendo a mesma duração das primeiras.
     *
     * (`Easing.quart` não existe no React Native — só `quad`, `cubic` e
     * `poly(n)`. Esta bézier é a curva que eu queria e não estava lá.)
     */
    Animated.timing(v, {
      toValue: 1,
      duration: tempos.transicao,
      delay: atraso,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
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
            /*
             * Uma escala quase imperceptível (0.99) junto do deslocamento.
             * Sozinho, o translate parece um texto rolando; com a escala, o
             * bloco parece se aproximar — que é o que o olho lê como "isto
             * chegou agora".
             */
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.99, 1] }) },
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
      duration: tempos.momento,
      delay: atraso,
      // `back` dá um leve passar-do-ponto: a carta assenta em vez de parar seca.
      easing: Easing.out(Easing.back(1.1)),
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
        Animated.timing(v, {
          toValue: 0.55,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
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

/**
 * Surge com mola: para o que APARECE por causa de um toque.
 *
 * Diferente de `Aparicao`, que é entrada de conteúdo e desacelera até parar.
 * Aqui a mola existe porque o elemento é a RESPOSTA a um dedo — o losango que
 * confirma o alvo escolhido, um selo que acende. Sem ela o marcador pisca
 * ligado/desligado e a escolha não parece ter peso.
 *
 * Roda no driver nativo e não anima cor nem layout, só escala: é o que mantém
 * a lista inteira fluida mesmo com dez linhas na tela.
 */
export function Surge({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(v, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    }).start();
  }, [v]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
