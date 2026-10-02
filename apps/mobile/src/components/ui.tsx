import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cores, espaco, raio, alvoMinimo, tipografia } from '../theme';
import { Ambiente } from './Ambiente';

/**
 * O kit de operação (item 4 da ordem de produção da identidade).
 *
 * A separação rígida do documento: TEXTURA em telas de momento, LIMPEZA em
 * telas de operação. Durante a partida as pessoas estão no escuro, com pressa,
 * passando o aparelho — textura em tela de operação custa legibilidade num
 * momento em que ela vale mais que beleza.
 */

/**
 * Tela de OPERAÇÃO: Fuligem liso, contraste alto, zero material.
 *
 * Delega ao `Ambiente`, e isso é o principal desta função.
 *
 * Antes existiam DOIS sistemas de luz no app: este arquivo tinha um
 * `TelaMomento` com dois círculos de borda dura, e o `Ambiente` tinha o dele.
 * Telas diferentes acendiam de jeitos diferentes, e é isso que faz um app
 * parecer montado de pedaços. Agora a luz tem uma implementação só; o que varia
 * é o `tipo`. De quebra, estas telas passaram a respeitar a área segura, que o
 * `Ambiente` aplica.
 */
export function TelaOperacao({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  return (
    <Ambiente tipo="operacao">
      <View style={[estilos.telaOperacao, style]}>{children}</View>
    </Ambiente>
  );
}

export function Rotulo({
  children,
  cor = cores.ferrugem,
}: {
  children: ReactNode;
  cor?: string | undefined;
}) {
  return <Text style={[tipografia.rotulo, { color: cor }]}>{children}</Text>;
}

export function Titulo({
  children,
  cor = cores.linhoCru,
}: {
  children: ReactNode;
  cor?: string | undefined;
}) {
  return <Text style={[tipografia.titulo, { color: cor }]}>{children}</Text>;
}

export function Corpo({
  children,
  cor = cores.linhoCru,
  serif = false,
}: {
  children: ReactNode;
  cor?: string | undefined;
  serif?: boolean | undefined;
}) {
  return (
    <Text style={[serif ? tipografia.corpoSerif : tipografia.corpo, { color: cor }]}>
      {children}
    </Text>
  );
}

export function Pequeno({
  children,
  cor = cores.ferrugem,
  style,
}: {
  children: ReactNode;
  cor?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  return <Text style={[tipografia.pequeno, { color: cor }, style]}>{children}</Text>;
}

export type TomDeBotao = 'primario' | 'secundario' | 'destrutivo' | 'claro' | 'alternativo';

/** Altura 48px, raio 4px, semibold — especificação da seção 9. */
/**
 * A mola de toque, para `Pressable` de verdade.
 *
 * **NÃO use `Animated.createAnimatedComponent(Pressable)`.** Ele não invoca
 * `style` em formato de função — repassa a função como se fosse um objeto de
 * estilo, e o resultado é um componente SEM ESTILO NENHUM. Foi o que deixou
 * todos os botões do app invisíveis: o texto continuava no DOM (e por isso
 * `get_page_text` não acusou nada), sem fundo, sem borda e sem altura.
 *
 * O padrão correto é o inverso: o `Pressable` fica nu, cuidando só do toque, e
 * quem carrega a aparência e a transformação é um `Animated.View` por dentro.
 */
function useMolejo(ativo: boolean) {
  const escala = useRef(new Animated.Value(1)).current;
  const mover = (para: number) =>
    Animated.spring(escala, {
      toValue: para,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  return {
    escala,
    aoApertar: () => ativo && mover(0.97),
    aoSoltar: () => mover(1),
  };
}

export function Botao({
  children,
  onPress,
  tom = 'primario',
  desabilitado,
  style,
}: {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  tom?: TomDeBotao | undefined;
  desabilitado?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  const fundo =
    tom === 'primario' ? cores.garanca : tom === 'destrutivo' ? cores.sangueSeco : 'transparent';
  const borda =
    tom === 'secundario'
      ? '#3E362E'
      : tom === 'destrutivo'
        ? '#8C3A32'
        : tom === 'claro'
          ? cores.linhoCru
          : tom === 'alternativo'
            ? '#C2453C'
            : // Um fio mais claro que o proprio fundo: e o que da aresta a peca.
              '#C2453C';
  const texto = tom === 'secundario' ? cores.ferrugem : cores.linhoCru;

  const { escala, aoApertar, aoSoltar } = useMolejo(!desabilitado);

  return (
    <Pressable
      onPress={desabilitado ? undefined : onPress}
      onPressIn={aoApertar}
      onPressOut={aoSoltar}
      style={style}
    >
      <Animated.View
        style={[
          estilos.botao,
          { backgroundColor: fundo, borderColor: borda, borderWidth: 1 },
          { transform: [{ scale: escala }] },
          desabilitado && { opacity: 0.35 },
        ]}
      >
        {/*
        O fio de luz na aresta de cima.
        Um retangulo chapado nao tem materia. Uma linha clara no alto e escura
        embaixo diz que o objeto tem espessura e que a luz vem de cima — a mesma
        fonte unica do Ambiente, so que dentro do botao.
      */}
        <View
          pointerEvents="none"
          style={[estilos.aresta, { opacity: tom === 'primario' ? 0.22 : 0.1 }]}
        />
        <Text
          style={[
            tipografia.interface,
            { color: texto, letterSpacing: tom === 'primario' ? 0.8 : 0.4 },
          ]}
        >
          {children}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Item de lista de jogador.
 * Morto nunca sai da lista — pilar B: morrer muda o seu jogo, não encerra.
 */
export function ItemJogador({
  nome,
  detalhe,
  morto,
  selecionado,
  onPress,
  corDoPonto,
  direita,
  desabilitado,
}: {
  nome: string;
  detalhe?: string | undefined;
  morto?: boolean | undefined;
  selecionado?: boolean | undefined;
  onPress?: (() => void) | undefined;
  corDoPonto?: string | undefined;
  direita?: ReactNode | undefined;
  /**
   * Toque recusado, mas a linha continua legível.
   *
   * Diferente de `morto`, que é estado do jogador: isto é estado da ESCOLHA. O
   * primeiro caso foi o Aldeão Teimoso, cujo voto trava depois de declarado —
   * esconder as outras opções seria pior, porque ele precisa ver o que deixou
   * de poder fazer.
   */
  desabilitado?: boolean | undefined;
}) {
  const clicavel = !!onPress && !desabilitado;

  /**
   * A linha de jogador é o alvo mais tocado do jogo — escolher quem morre,
   * quem é curado, em quem votar — e era o único que não respondia ao dedo.
   * Só `opacity: 0.75`, que no escuro quase não se vê.
   *
   * A mola é menor que a do botão (0.985 contra 0.97): numa LISTA, uma escala
   * forte faz as linhas vizinhas parecerem pular junto.
   */
  const { escala, aoApertar, aoSoltar } = useMolejo(clicavel);

  return (
    <Pressable onPress={onPress} disabled={!clicavel} onPressIn={aoApertar} onPressOut={aoSoltar}>
      <Animated.View
        style={[
          estilos.item,
          { transform: [{ scale: escala }] },
          selecionado && { borderColor: cores.garanca, backgroundColor: '#241A17' },
          morto && { opacity: 0.5 },
          desabilitado && !selecionado && { opacity: 0.4 },
        ]}
      >
        {/*
        O marcador de estado e um losango, nao um circulo.
        Circulo e vocabulario de aplicativo; losango e o motivo da regiao, o
        mesmo da marca e das barras bordadas. Custa uma rotacao e amarra a lista
        ao resto do jogo.
      */}
        <View
          style={[
            estilos.ponto,
            {
              width: 15,
              height: 15,
              backgroundColor: morto ? cores.sangueSeco : (corDoPonto ?? cores.ferrugem),
              borderColor: cores.linhoCru,
              borderWidth: 0.25,
            },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[tipografia.corpo, { color: cores.folhaDeOuro }]}>{nome}</Text>
          {detalhe ? <Pequeno cor={cores.linhoCru}>{detalhe}</Pequeno> : null}
        </View>
        {/* Nunca cor sozinha: o estado sempre vem com ícone ou texto. */}
        {morto ? <Text style={{ color: cores.sangueSecoTexto, fontSize: 16 }}>✝</Text> : null}
        {direita}
      </Animated.View>
    </Pressable>
  );
}

export function Separador() {
  return <View style={estilos.separador} />;
}

export function Rolagem({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.md, paddingBottom: espaco.xl }}
    >
      {children}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  // Sem backgroundColor: quem pinta o fundo e o Ambiente, por baixo.
  telaOperacao: {
    flex: 1,
  },
  botao: {
    minHeight: alvoMinimo,
    borderRadius: raio.padrao,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
    // O fio de luz da aresta e absoluto: sem isto ele escapa pela quina.
    overflow: 'hidden',
  },
  item: {
    minHeight: alvoMinimo,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    backgroundColor: '#1D1814',
    borderColor: '#2E2721',
    borderWidth: 1,
    borderRadius: raio.padrao,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.sm,
  },
  ponto: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
  },
  aresta: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: cores.linhoCru,
  },
  separador: {
    height: 1,
    backgroundColor: '#2E2721',
    marginVertical: espaco.md,
  },
});
