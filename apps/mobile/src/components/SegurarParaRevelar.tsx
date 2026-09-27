import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { cores, espaco, tipografia } from '../theme';

/**
 * Segurar para revelar.
 *
 * É a solução do dossiê para o problema central do pass-and-play: proteger o
 * segredo da role. A role só aparece enquanto o dedo está na tela e some ao
 * soltar — e o próprio gesto já cobre a tela com a mão, o que resolve o
 * problema físico de alguém olhar por cima do ombro.
 *
 * O círculo de 66px que preenche em Cera vem da seção 9 da identidade. A espera
 * curta antes de revelar não é enfeite: ela dá tempo de a pessoa posicionar o
 * aparelho antes do conteúdo aparecer.
 */
const ESPERA_MS = 550;

export function SegurarParaRevelar({
  children,
  aviso,
  aoRevelar,
  fixaAposRevelar = true,
}: {
  children: ReactNode;
  aviso?: string;
  aoRevelar?: () => void;
  /**
   * Depois de revelar uma vez, soltar o dedo NÃO esconde de novo.
   *
   * Antes escondia: `soltar()` zerava `revelado` sem condição, então a carta
   * sumia no instante em que a pessoa tirava o dedo para ler com calma. Segurar
   * é o gesto que protege o segredo de quem está ao lado — depois que a pessoa
   * já viu, obrigá-la a continuar segurando não protege mais nada.
   */
  fixaAposRevelar?: boolean;
}) {
  const [revelado, setRevelado] = useState(false);
  const progresso = useRef(new Animated.Value(0)).current;
  const animacao = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const id = progresso.addListener(({ value }) => {
      if (value >= 1 && !revelado) {
        setRevelado(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        aoRevelar?.();
      }
    });
    return () => progresso.removeListener(id);
  }, [progresso, revelado, aoRevelar]);

  const segurar = () => {
    animacao.current = Animated.timing(progresso, {
      toValue: 1,
      duration: ESPERA_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animacao.current.start();
  };

  const soltar = () => {
    animacao.current?.stop();
    if (fixaAposRevelar && revelado) return;
    progresso.setValue(0);
    setRevelado(false);
  };

  const preenchimento = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      onPressIn={segurar}
      onPressOut={soltar}
      style={estilos.area}
      accessibilityLabel="Segure para revelar"
    >
      {revelado ? (
        <View style={estilos.conteudo}>{children}</View>
      ) : (
        <View style={estilos.conteudo}>
          <View style={estilos.circulo}>
            <Animated.View style={[estilos.preenchimento, { height: preenchimento }]} />
            <Text style={estilos.simbolo}>◉</Text>
          </View>
          <Text
            style={[
              tipografia.rotulo,
              { color: cores.ferrugem, marginTop: espaco.lg, fontSize: 20 },
            ]}
          >
            Segure para revelar
          </Text>
          {aviso ? (
            <Text style={[tipografia.pequeno, { color: cores.ferrugem, marginTop: espaco.sm }]}>
              {aviso}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  area: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  conteudo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
  },
  circulo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: cores.ferrugem,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preenchimento: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: cores.cera,
    opacity: 0.35,
  },
  simbolo: {
    color: cores.cera,
    fontSize: 20,
  },
});
