import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cores, espaco, raio, alvoMinimo, tipografia } from '../theme';

/**
 * O kit de operação (item 4 da ordem de produção da identidade).
 *
 * A separação rígida do documento: TEXTURA em telas de momento, LIMPEZA em
 * telas de operação. Durante a partida as pessoas estão no escuro, com pressa,
 * passando o aparelho — textura em tela de operação custa legibilidade num
 * momento em que ela vale mais que beleza.
 */

/** Tela de OPERAÇÃO: fundo Fuligem liso, zero textura, contraste alto. */
export function TelaOperacao({ children, style }: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  return <View style={[estilos.telaOperacao, style]}>{children}</View>;
}

/**
 * Tela de MOMENTO: emoção e teatro.
 * A luz de vela obedece à física de uma chama — uma fonte só, queda rápida,
 * sombra quente. Aqui isso vira um halo radial curto sobre o Fuligem, nunca um
 * degradê suave e longo.
 */
export function TelaMomento({ children, luz = cores.chama }: {
  children?: ReactNode;
  luz?: string | undefined;
}) {
  return (
    <View style={estilos.telaMomento}>
      <View style={[estilos.halo, { backgroundColor: luz, opacity: 0.06 }]} />
      <View style={[estilos.haloInterno, { backgroundColor: luz, opacity: 0.05 }]} />
      <View style={estilos.conteudoMomento}>{children}</View>
    </View>
  );
}

export function Rotulo({ children, cor = cores.ferrugem }: {
  children: ReactNode;
  cor?: string | undefined;
}) {
  return <Text style={[tipografia.rotulo, { color: cor }]}>{children}</Text>;
}

export function Titulo({ children, cor = cores.linhoCru }: {
  children: ReactNode;
  cor?: string | undefined;
}) {
  return <Text style={[tipografia.titulo, { color: cor }]}>{children}</Text>;
}

export function Corpo({ children, cor = cores.linhoCru, serif = false }: {
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

export function Pequeno({ children, cor = cores.ferrugem }: {
  children: ReactNode;
  cor?: string | undefined;
}) {
  return <Text style={[tipografia.pequeno, { color: cor }]}>{children}</Text>;
}

export type TomDeBotao = 'primario' | 'secundario' | 'destrutivo';

/** Altura 48px, raio 4px, semibold — especificação da seção 9. */
export function Botao({ children, onPress, tom = 'primario', desabilitado, style }: {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  tom?: TomDeBotao | undefined;
  desabilitado?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}) {
  const fundo =
    tom === 'primario' ? cores.garanca : tom === 'destrutivo' ? cores.sangueSeco : 'transparent';
  const borda = tom === 'secundario' ? '#3E362E' : 'transparent';
  const texto = tom === 'secundario' ? cores.ferrugem : cores.linhoCru;

  return (
    <Pressable
      onPress={desabilitado ? undefined : onPress}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, borderColor: borda, borderWidth: tom === 'secundario' ? 1 : 0 },
        pressed && !desabilitado && { opacity: 0.8 },
        desabilitado && { opacity: 0.35 },
        style,
      ]}
    >
      <Text style={[tipografia.interface, { color: texto }]}>{children}</Text>
    </Pressable>
  );
}

/**
 * Item de lista de jogador.
 * Morto nunca sai da lista — pilar B: morrer muda o seu jogo, não encerra.
 */
export function ItemJogador({ nome, detalhe, morto, selecionado, onPress, corDoPonto, direita }: {
  nome: string;
  detalhe?: string | undefined;
  morto?: boolean | undefined;
  selecionado?: boolean | undefined;
  onPress?: (() => void) | undefined;
  corDoPonto?: string | undefined;
  direita?: ReactNode | undefined;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        estilos.item,
        selecionado && { borderColor: cores.garanca, backgroundColor: '#241A17' },
        pressed && onPress && { opacity: 0.75 },
        morto && { opacity: 0.5 },
      ]}
    >
      <View
        style={[
          estilos.ponto,
          { backgroundColor: morto ? cores.sangueSeco : (corDoPonto ?? cores.ferrugem) },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>{nome}</Text>
        {detalhe ? <Pequeno>{detalhe}</Pequeno> : null}
      </View>
      {/* Nunca cor sozinha: o estado sempre vem com ícone ou texto. */}
      {morto ? <Text style={{ color: cores.sangueSeco, fontSize: 16 }}>✝</Text> : null}
      {direita}
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
  telaOperacao: {
    flex: 1,
    backgroundColor: cores.fuligem,
  },
  telaMomento: {
    flex: 1,
    backgroundColor: cores.fuligem,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Queda rápida: o centro é claro e a borda é preta em poucos centímetros.
  halo: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
  },
  haloInterno: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  conteudoMomento: {
    alignItems: 'center',
    paddingHorizontal: espaco.xl,
    gap: espaco.md,
  },
  botao: {
    minHeight: alvoMinimo,
    borderRadius: raio.padrao,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
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
    borderRadius: 4,
  },
  separador: {
    height: 1,
    backgroundColor: '#2E2721',
    marginVertical: espaco.md,
  },
});
