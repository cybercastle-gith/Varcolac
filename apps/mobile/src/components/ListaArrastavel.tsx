import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';
import { cores } from '../theme';

/**
 * Uma lista que se reordena arrastando.
 *
 * Feita com `PanResponder` e `Animated` do próprio React Native, sem
 * dependência nova. `react-native-gesture-handler` está instalado e seria uma
 * opção, mas ele exige `GestureDetector` em árvore própria e não se comporta
 * igual no `react-native-web` — e esta tela é de setup, onde o trabalho
 * acontece 80% no navegador. PanResponder funciona nos dois do mesmo jeito.
 *
 * A conta toda depende de UMA suposição: **todas as linhas têm a mesma
 * altura**. Com altura fixa, a posição de destino é `round(dy / altura)` e não
 * é preciso medir nada em tempo de arrasto — que é justamente o que costuma
 * deixar lista arrastável travada em aparelho fraco.
 */
export function ListaArrastavel<T>({
  itens,
  altura,
  aoReordenar,
  children,
}: {
  itens: readonly T[];
  /** Altura de cada linha, em px, INCLUINDO o espaço entre elas. */
  altura: number;
  aoReordenar: (de: number, para: number) => void;
  /** Recebe o item, o índice e a alça que inicia o arrasto. */
  children: (item: T, indice: number, alca: ReactNode) => ReactNode;
}) {
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [destino, setDestino] = useState<number | null>(null);
  const deslocamento = useRef(new Animated.Value(0)).current;

  // O estado vivo do arrasto, para o PanResponder ler sem recriar a si mesmo.
  const vivo = useRef({ de: 0, para: 0, total: itens.length });
  vivo.current.total = itens.length;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesto) => {
          deslocamento.setValue(gesto.dy);
          const passos = Math.round(gesto.dy / altura);
          const alvo = Math.max(0, Math.min(vivo.current.total - 1, vivo.current.de + passos));
          if (alvo !== vivo.current.para) {
            vivo.current.para = alvo;
            setDestino(alvo);
          }
        },
        onPanResponderRelease: () => {
          const { de, para } = vivo.current;
          if (de !== para) aoReordenar(de, para);
          deslocamento.setValue(0);
          setArrastando(null);
          setDestino(null);
        },
        onPanResponderTerminate: () => {
          deslocamento.setValue(0);
          setArrastando(null);
          setDestino(null);
        },
      }),
    [altura, aoReordenar, deslocamento],
  );

  /**
   * De quanto esta linha se afasta para abrir espaço.
   *
   * Só as linhas ENTRE a origem e o destino se mexem, e todas pela mesma
   * altura — é o mínimo de movimento que comunica "o buraco é aqui".
   */
  const desvioDe = (i: number): number => {
    if (arrastando === null || destino === null || i === arrastando) return 0;
    if (arrastando < destino && i > arrastando && i <= destino) return -altura;
    if (arrastando > destino && i < arrastando && i >= destino) return altura;
    return 0;
  };

  return (
    <View style={{ height: itens.length * altura }}>
      {itens.map((item, i) => {
        const emArrasto = arrastando === i;

        const alca = (
          <View
            {...(emArrasto || arrastando === null ? responder.panHandlers : {})}
            onStartShouldSetResponder={() => {
              vivo.current.de = i;
              vivo.current.para = i;
              setArrastando(i);
              setDestino(i);
              return true;
            }}
            // 44px de alvo: no escuro e com pressa, alça pequena é alça errada.
            style={{
              width: 44,
              alignSelf: 'stretch',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Arraste para reordenar"
          >
            <Text style={{ color: emArrasto ? cores.cera : cores.nogueiraTexto, fontSize: 18 }}>≡</Text>
          </View>
        );

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * altura,
              height: altura,
              transform: [{ translateY: emArrasto ? deslocamento : desvioDe(i) }],
              // A linha arrastada sobe acima das outras e ganha um leve
              // destaque: sem isso ela some por baixo da vizinha no meio do
              // movimento.
              zIndex: emArrasto ? 10 : 1,
              opacity: emArrasto ? 0.92 : 1,
            }}
          >
            {children(item, i, alca)}
          </Animated.View>
        );
      })}
    </View>
  );
}
