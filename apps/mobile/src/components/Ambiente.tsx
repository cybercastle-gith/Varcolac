import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { cores } from '../theme';

/**
 * A ambientação da tela.
 *
 * A identidade define a luz por FÍSICA, não por gosto: uma fonte só, queda ao
 * quadrado da distância, sombra quente, sem contraluz. Traduzido para tela isso
 * vira três camadas empilhadas — halo curto, véu de cor e vinheta — e nunca um
 * degradê suave e longo, que é a assinatura do "glow" genérico que o documento
 * proíbe.
 *
 * A ambientação MUDA com a fase da partida. É o que faz a mesa sentir a noite
 * cair sem ninguém avisar: o azul do Índigo entra, o calor da chama recua.
 */

export type Clima = 'noite' | 'dia' | 'morte' | 'vitoria' | 'neutro';

interface Paleta {
  readonly luz: string;
  readonly veu: string;
  /** Opacidade do véu. Baixa de propósito: cor demais vira filtro. */
  readonly veuOpacidade: number;
  readonly haloOpacidade: number;
}

const CLIMAS: Record<Clima, Paleta> = {
  // A noite não é azul-clara: é o Fuligem com um sopro de Índigo por trás.
  noite: { luz: cores.chama, veu: cores.indigo, veuOpacidade: 0.16, haloOpacidade: 0.07 },
  // O dia é a única hora em que a luz não vem de vela — ela é mais aberta.
  dia: { luz: cores.cera, veu: cores.ferrugem, veuOpacidade: 0.07, haloOpacidade: 0.05 },
  morte: { luz: cores.sangueSeco, veu: cores.sangueSeco, veuOpacidade: 0.12, haloOpacidade: 0.1 },
  vitoria: { luz: cores.folhaDeOuro, veu: cores.nogueira, veuOpacidade: 0.1, haloOpacidade: 0.09 },
  neutro: { luz: cores.chama, veu: cores.nogueira, veuOpacidade: 0.06, haloOpacidade: 0.05 },
};

export function Ambiente({ clima = 'neutro', tremula = true, children }: {
  clima?: Clima;
  /** Tremulação só em tela de MOMENTO. Em tela de operação é proibida. */
  tremula?: boolean;
  children?: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const p = CLIMAS[clima];

  const chama = useRef(new Animated.Value(1)).current;
  const transicao = useRef(new Animated.Value(0)).current;

  // Troca de clima: um fade curto, dentro do teto de 250ms da identidade.
  useEffect(() => {
    transicao.setValue(0);
    Animated.timing(transicao, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [clima, transicao]);

  // Tremulação de 2-4%: o teto que a identidade permite, e nem um ponto a mais.
  useEffect(() => {
    if (!tremula) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(chama, { toValue: 0.97, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chama, { toValue: 1.02, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chama, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [chama, tremula]);

  const halo = Math.max(width, height) * 0.95;

  return (
    <View style={[estilos.base, { backgroundColor: cores.fuligem }]}>
      {/* Véu da fase: a cor do momento, por baixo de tudo. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: p.veu, opacity: Animated.multiply(transicao, p.veuOpacidade) },
        ]}
      />

      {/* Fonte de luz única, alta na tela: a vela está acima, não atrás. */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: halo,
          height: halo,
          borderRadius: halo / 2,
          top: -halo * 0.42,
          left: (width - halo) / 2,
          backgroundColor: p.luz,
          opacity: Animated.multiply(chama, p.haloOpacidade),
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: halo * 0.45,
          height: halo * 0.45,
          borderRadius: halo * 0.225,
          top: -halo * 0.15,
          left: (width - halo * 0.45) / 2,
          backgroundColor: p.luz,
          opacity: Animated.multiply(chama, p.haloOpacidade * 0.9),
        }}
      />

      {/* Vinheta: a queda rápida da luz de vela, feita por camadas nas bordas. */}
      <View pointerEvents="none" style={estilos.vinhetaBaixo} />
      <View pointerEvents="none" style={estilos.vinhetaBaixoForte} />

      <View style={estilos.conteudo}>{children}</View>
    </View>
  );
}

/** Textura de linho: fios cruzados a 4% — some no escuro, aparece na luz. */
export function Linho({ opacidade = 0.045 }: { opacidade?: number }) {
  const linhas = Array.from({ length: 26 }, (_, i) => i);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {linhas.map((i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: i * 14,
            height: 1,
            backgroundColor: cores.linhoCru,
            opacity: opacidade,
          }}
        />
      ))}
      {linhas.map((i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: i * 18,
            width: 1,
            backgroundColor: cores.linhoCru,
            opacity: opacidade * 0.7,
          }}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { flex: 1, overflow: 'hidden' },
  conteudo: { flex: 1 },
  vinhetaBaixo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    backgroundColor: cores.fuligem,
    opacity: 0.55,
  },
  vinhetaBaixoForte: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '16%',
    backgroundColor: cores.fuligem,
    opacity: 0.75,
  },
});
