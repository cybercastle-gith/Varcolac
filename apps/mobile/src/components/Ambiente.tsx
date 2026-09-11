import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores } from '../theme';
import {
  fundos,
  texturas,
  opacidadeDaTextura,
  gradientes,
  type NomeDeTextura,
} from '../theme/materiais';

/**
 * A ambientação da tela.
 *
 * A identidade define a luz por FÍSICA, não por gosto: uma fonte só, queda ao
 * quadrado da distância, sombra quente, sem contraluz. São cinco camadas, nesta
 * ordem, e a ordem importa:
 *
 *   1. Fuligem      o preto de base, para nada ficar transparente
 *   2. Material     a superfície fotografada, em opacidade baixa — só grão
 *   3. Véu          a cor da fase, por cima do material e por baixo da luz
 *   4. Halo         a chama: uma fonte só, alta na tela, queda ao quadrado
 *   5. Sombra       topo e rodapé, para o texto ter onde pousar
 *
 * O halo e a sombra são ARQUIVOS de rampa (`scripts/gerar-gradientes.py`), e
 * não Views empilhadas. A versão anterior desenhava o halo com dois círculos de
 * borda dura, e eles apareciam na tela como anéis — exatamente o "halo
 * perfeito" que o documento proíbe. Uma rampa em PNG codifica a queda real.
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
  /** O material fotografado que fica por baixo de tudo. */
  readonly fundo: number;
  /**
   * Opacidade do material.
   *
   * Baixa, e por medição na tela: acima disso o texto Linho Cru perde o
   * contraste que a identidade exige, e no escuro a tela inteira vira marrom
   * indistinto — que foi exatamente o que aconteceu na primeira tentativa,
   * com o material a 50%.
   */
  readonly fundoOpacidade: number;
}

const CLIMAS: Record<Clima, Paleta> = {
  // A noite não é azul-clara: é o Fuligem com um sopro de Índigo por trás.
  noite: {
    luz: cores.chama,
    veu: cores.indigo,
    veuOpacidade: 0.16,
    haloOpacidade: 0.5,
    fundo: fundos.noite,
    fundoOpacidade: 0.22,
  },
  // O dia é a única hora em que a luz não vem de vela — ela é mais aberta.
  // E é o único material claro do conjunto: a parede caiada apagaria o texto
  // em qualquer opacidade que sirva para os outros.
  dia: {
    luz: cores.cera,
    veu: cores.ferrugem,
    veuOpacidade: 0.07,
    haloOpacidade: 0.34,
    fundo: fundos.dia,
    fundoOpacidade: 0.1,
  },
  morte: {
    luz: cores.sangueSeco,
    veu: cores.sangueSeco,
    veuOpacidade: 0.12,
    haloOpacidade: 0.55,
    fundo: fundos.morte,
    fundoOpacidade: 0.16,
  },
  vitoria: {
    luz: cores.folhaDeOuro,
    veu: cores.nogueira,
    veuOpacidade: 0.1,
    haloOpacidade: 0.5,
    fundo: fundos.vitoria,
    fundoOpacidade: 0.14,
  },
  neutro: {
    luz: cores.chama,
    veu: cores.nogueira,
    veuOpacidade: 0.06,
    haloOpacidade: 0.4,
    fundo: fundos.neutro,
    fundoOpacidade: 0.24,
  },
};

/**
 * Os dois tipos de tela, e a regra que a identidade nao admite quebrar:
 * **textura em tela de momento, limpeza em tela de operacao.**
 *
 * `momento`   revelacao, passagem, amanhecer, morte, fim — teatro
 * `operacao`  setup, baralho, jogadores, votacao, biblioteca — funcao
 *
 * A razao e de uso, nao de gosto: durante a partida as pessoas estao no escuro,
 * com pressa, passando o aparelho, e textura numa tela de operacao custa
 * legibilidade justo quando ela vale mais. E ha um segundo efeito, que e o que
 * faz valer a pena: poupar a textura faz ela PESAR quando finalmente aparece.
 */
export type TipoDeTela = 'momento' | 'operacao';

export function Ambiente({
  clima = 'neutro',
  tipo = 'momento',
  tremula,
  children,
}: {
  clima?: Clima;
  tipo?: TipoDeTela;
  /** Tremulação só em tela de MOMENTO. Em tela de operação é proibida. */
  tremula?: boolean;
  children?: ReactNode;
}) {
  const operacao = tipo === 'operacao';
  const oscila = tremula ?? !operacao;
  const { width, height } = useWindowDimensions();
  /**
   * A área segura é aplicada AQUI, e não em cada tela.
   *
   * O `SafeAreaProvider` existia desde o começo, mas nenhuma tela lia as
   * medidas: o rodapé da Home ficava por baixo da barra de navegação do
   * Android, e o mesmo valia para as outras treze. Resolver no `Ambiente`
   * conserta todas de uma vez, e mantém a propriedade que interessa — o fundo
   * segue sangrando até a borda física da tela; só o conteúdo recua.
   */
  const margens = useSafeAreaInsets();
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
    if (!oscila) return;
    const laco = Animated.loop(
      Animated.sequence([
        Animated.timing(chama, { toValue: 0.97, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chama, { toValue: 1.02, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chama, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    laco.start();
    return () => laco.stop();
  }, [chama, oscila]);

  // O halo passa da largura da tela de propósito: a chama está FORA do quadro,
  // acima. Só a saia da luz entra, que é o que se vê numa mesa de verdade.
  const halo = Math.max(width, height) * 1.25;

  return (
    <View style={[estilos.base, { backgroundColor: cores.fuligem }]}>
      {/*
        O material fotografado. A luz NÃO vem daqui: o arquivo foi gerado com
        luz chapada de scanner, de propósito, para o halo abaixo ser a única
        fonte. Material já iluminado daria duas luzes na mesma tela.
      */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity: Animated.multiply(transicao, operacao ? 0 : p.fundoOpacidade) },
        ]}
      >
        <Image source={p.fundo} resizeMode="cover" style={estilos.preencher} />
      </Animated.View>

      {/* Véu da fase: a cor do momento, por cima do material. */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: p.veu,
            opacity: Animated.multiply(transicao, operacao ? p.veuOpacidade * 0.4 : p.veuOpacidade),
          },
        ]}
      />

      {/*
        A chama e as sombras. Vão dentro de uma View sem toque porque
        `pointerEvents` é propriedade de ViewStyle e não de ImageStyle — uma
        Image posicionada por cima da tela inteira engoliria os botões.
      */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {/* Fonte única, alta e fora do quadro. */}
        <Animated.Image
          source={gradientes.halo}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: halo,
            height: halo,
            top: -halo * 0.52,
            left: (width - halo) / 2,
            tintColor: p.luz,
            opacity: Animated.multiply(chama, operacao ? p.haloOpacidade * 0.3 : p.haloOpacidade),
          }}
        />

        {/* Sombra de topo e de rodapé: é onde o texto pousa. */}
        <Image
          source={gradientes.topo}
          resizeMode="stretch"
          style={[estilos.topo, { tintColor: cores.fuligem }]}
        />
        <Image
          source={gradientes.vinheta}
          resizeMode="stretch"
          style={[estilos.vinheta, { tintColor: cores.fuligem }]}
        />
      </View>

      <View
        style={[
          estilos.conteudo,
          { paddingTop: margens.top, paddingBottom: margens.bottom, paddingLeft: margens.left, paddingRight: margens.right },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Uma superfície de material, para painel e carta.
 *
 * Substitui o "linho" que antes era desenhado com Views cruzadas. Fio falso a
 * 4% dava um quadriculado perfeitamente regular que, de perto, lia como grade
 * de tabela — o oposto de tecido. O arquivo escaneado tem a irregularidade que
 * nenhum laço de View reproduz.
 */
export function Material({
  material = 'linho',
  opacidade,
  raio = 0,
}: {
  material?: NomeDeTextura;
  opacidade?: number;
  raio?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: raio, overflow: 'hidden' }]}
    >
      <Image
        source={texturas[material]}
        resizeMode="repeat"
        style={[estilos.preencher, { opacity: opacidade ?? opacidadeDaTextura[material] }]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  base: { flex: 1, overflow: 'hidden' },
  conteudo: { flex: 1 },
  /*
   * `width: '100%'` não é redundante com o `left/right: 0`.
   *
   * No react-native-web, uma Image sem largura declarada cai no tamanho
   * intrínseco do arquivo: o papel da carta cobria 241px de uma carta de 307px
   * e o resto ficava como uma faixa escura no rodapé, que parecia um elemento
   * de interface e não um defeito. No aparelho o mesmo código tila certo, então
   * o erro só aparecia no navegador — que é onde 80% deste projeto é feito.
   */
  preencher: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  topo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '22%',
    width: undefined,
  },
  vinheta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    width: undefined,
  },
});
