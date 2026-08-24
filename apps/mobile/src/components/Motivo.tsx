import { useEffect, useRef } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { motivoDe, role, type Primitiva, type RoleId } from '@jogo/engine';
import { cores } from '../theme';

/**
 * Desenha o motivo de uma role.
 *
 * Tudo é composto de Views com borda e rotação — sem SVG, sem PNG. Não é
 * economia: é a única forma de o ícone escalar de 20px a 120px sem serrilhar, e
 * de o traço manter o mesmo peso em todos os tamanhos, que é a regra do sistema
 * de motivos ("um único peso de traço").
 *
 * A variante entra como COMPLEMENTO: o desenho da role base continua ali por
 * baixo, e a variante só acrescenta a marca que a especifica.
 */

const CAIXA = 40; // grade de desenho; tudo é declarado nesta escala e depois escalado

function Peca({ p, cor, escala, traco }: {
  p: Primitiva;
  cor: string;
  escala: number;
  traco: number;
}) {
  const e = (n: number) => n * escala;
  const base: ViewStyle = {
    position: 'absolute',
    borderColor: cor,
    transform: [{ translateX: e(p.dx ?? 0) }, { translateY: e(p.dy ?? 0) }],
  };

  switch (p.f) {
    case 'losango':
      return (
        <View
          style={[
            base,
            {
              width: e(p.t),
              height: e(p.t),
              borderWidth: p.cheio ? 0 : traco,
              backgroundColor: p.cheio ? cor : 'transparent',
              transform: [...(base.transform as object[]), { rotate: '45deg' }] as never,
            },
          ]}
        />
      );

    case 'circulo':
      return (
        <View
          style={[
            base,
            {
              width: e(p.t),
              height: e(p.t),
              borderRadius: e(p.t) / 2,
              borderWidth: p.cheio ? 0 : traco,
              backgroundColor: p.cheio ? cor : 'transparent',
            },
          ]}
        />
      );

    case 'barra':
      return (
        <View
          style={[
            base,
            {
              width: e(p.c),
              height: traco,
              backgroundColor: cor,
              transform: [
                ...(base.transform as object[]),
                { rotate: `${p.rot ?? 0}deg` },
              ] as never,
            },
          ]}
        />
      );

    case 'triangulo':
      // Triângulo por bordas: o truque clássico, e o único jeito sem SVG.
      return (
        <View
          style={[
            base,
            {
              width: 0,
              height: 0,
              borderLeftWidth: e(p.t) / 2,
              borderRightWidth: e(p.t) / 2,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              ...(p.baixo
                ? { borderTopWidth: e(p.t), borderTopColor: cor }
                : { borderBottomWidth: e(p.t), borderBottomColor: cor }),
            },
          ]}
        />
      );

    case 'ponto':
      return (
        <View
          style={[
            base,
            { width: traco * 2, height: traco * 2, borderRadius: traco, backgroundColor: cor },
          ]}
        />
      );
  }
}

export function Motivo({ roleId, varianteId, tamanho = 40, cor, style }: {
  roleId: RoleId;
  varianteId?: string | undefined;
  tamanho?: number;
  cor?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  const pecas = motivoDe(roleId, varianteId);
  const escala = tamanho / CAIXA;
  // O traço engrossa devagar: a 20px ele some se acompanhar a escala inteira.
  const traco = Math.max(1, Math.round(escala * 1.3));
  const tinta = cor ?? corDaFaccao(roleId);

  return (
    <View
      style={[{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {pecas.map((p, i) => (
        <Peca key={i} p={p} cor={tinta} escala={escala} traco={traco} />
      ))}
    </View>
  );
}

export function corDaFaccao(roleId: RoleId): string {
  const f = role(roleId).faccao;
  return f === 'lobos' ? cores.garanca : f === 'vila' ? cores.horezu : cores.cera;
}

/**
 * O motivo respirando à luz de vela.
 *
 * A identidade permite oscilar 2-4% de opacidade em telas de MOMENTO, e proíbe
 * em telas de operação. Este componente é o único lugar onde isso acontece — se
 * a tremulação estivesse solta em cada tela, alguém acabaria pondo numa lista.
 */
export function MotivoVivo(props: Parameters<typeof Motivo>[0]) {
  const brilho = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 0.965,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [brilho]);

  return (
    <Animated.View style={{ opacity: brilho }}>
      <Motivo {...props} />
    </Animated.View>
  );
}
