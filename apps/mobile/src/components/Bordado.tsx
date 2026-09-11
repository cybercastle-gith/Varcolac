import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { cores } from '../theme';

/**
 * Um motivo de bordado em ponto-cruz, desenhado ponto a ponto.
 *
 * A marca anterior era um losango de linha de 1px girando. Linha fina é o
 * vocabulário de ícone de aplicativo genérico, e some no escuro. Bordado de
 * verdade não tem linha: tem PONTO, numa grade, com a irregularidade de
 * densidade que a grade produz sozinha. É o que a identidade pede quando diz
 * "motivos geométricos: losango, roda solar, árvore da vida" sobre linho.
 *
 * Cada ponto é uma View quadrada. Parece caro e não é: um motivo de 13 × 13
 * tem no máximo 169 pontos, e só os preenchidos viram View — este aqui usa 60.
 * Em troca, o motivo é DADO e não desenho: trocar a arte é editar a string.
 */

/** `.` vazio · `r` Garança · `c` Cera · `n` Nogueira */
type Trama = readonly string[];

const TINTA: Record<string, string> = {
  r: cores.garanca,
  c: cores.cera,
  n: cores.nogueira,
};

/**
 * A marca do jogo: losango de pontas, com a roda solar no centro.
 *
 * O losango é o motivo da Vila e a roda solar é o motivo do Dia — juntos são
 * a aposta da partida inteira: a vila chegar ao amanhecer.
 */
export const MARCA: Trama = [
  '......r......',
  '.....r.r.....',
  '....r...r....',
  '...r.....r...',
  '..r...c...r..',
  '.r...ccc...r.',
  'r...ccrcc...r',
  '.r...ccc...r.',
  '..r...c...r..',
  '...r.....r...',
  '....r...r....',
  '.....r.r.....',
  '......r......',
];

/** O mesmo losango, cheio — para uso pequeno, onde o vazado some. */
export const SELO: Trama = [
  '..r..',
  '.rrr.',
  'rrcrr',
  '.rrr.',
  '..r..',
];

/**
 * A unidade que se repete numa faixa de barra.
 *
 * Toda toalha e toda manga da regiao tem uma barra assim: um motivo pequeno
 * repetido ate acabar o pano. E o dispositivo textil mais reconhecivel do
 * conjunto, e o que tira uma carta escura da genericidade em uma olhada.
 */
const UNIDADE: Trama = ['..r..', '.r.r.', 'r...r', '.r.r.', '..r..'];

/** Repete a unidade ate a largura pedida, em pontos. */
export function faixa(largura: number, unidade: Trama = UNIDADE): Trama {
  const passo = unidade[0]?.length ?? 1;
  const vezes = Math.max(1, Math.ceil(largura / passo));
  return unidade.map((linha) => linha.repeat(vezes).slice(0, largura));
}

export function Bordado({
  trama = MARCA,
  ponto = 7,
  folga = 2,
  opacidade = 1,
  tinta,
}: {
  trama?: Trama;
  /** Lado de cada ponto, em px. */
  ponto?: number;
  /** Vão entre pontos: é ele que faz a trama parecer costurada, e não pixel. */
  folga?: number;
  opacidade?: number;
  /** Troca a cor de uma letra — a faixa da carta usa a cor da facção. */
  tinta?: Record<string, string>;
}) {
  const passo = ponto + folga;
  const largura = (trama[0]?.length ?? 0) * passo;
  const altura = trama.length * passo;

  return (
    <View style={{ width: largura, height: altura, opacity: opacidade }}>
      {trama.map((linha, y) =>
        [...linha].map((celula, x) => {
          const cor = tinta?.[celula] ?? TINTA[celula];
          if (!cor) return null;
          return (
            <View
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * passo,
                top: y * passo,
                width: ponto,
                height: ponto,
                backgroundColor: cor,
                // Ponto-cruz é quadrado, mas o fio arredonda a quina.
                borderRadius: 1,
              }}
            />
          );
        }),
      )}
    </View>
  );
}

/**
 * A marca respirando.
 *
 * Não gira: bordado não gira, está costurado no pano. O que muda é a luz que
 * cai nele, e por isso o que oscila aqui é a opacidade — no mesmo ritmo e no
 * mesmo teto de 2-4% da chama do `Ambiente`. O propósito é o mesmo de antes:
 * a tela nunca parecer congelada quando o aparelho está parado na mesa.
 */
export function MarcaViva({ ponto = 8 }: { ponto?: number }) {
  const luz = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(luz, { toValue: 0.9, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(luz, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [luz]);

  return (
    <Animated.View style={{ opacity: luz }}>
      <Bordado trama={MARCA} ponto={ponto} folga={3} />
    </Animated.View>
  );
}
