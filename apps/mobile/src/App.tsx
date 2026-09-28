import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { RootNavigator } from './navigation/RootNavigator';
import { useJogo } from './store/jogo';
import { cores, FONTES_A_CARREGAR } from './theme';

export function App() {
  /**
   * PT Serif/PT Sans, nas quatro faces (Regular/Bold/Italic/BoldItalic).
   * Sem isto o app inteiro caía na fonte de sistema — a identidade pede
   * explicitamente estas duas famílias, com suporte a cirílico.
   *
   * Nada de tela de carregamento separada: o fundo já é Fuligem por baixo
   * (mesma cor do `backgroundColor` do `app.json`), então a espera é
   * invisível — a tela só "acende" quando o texto já tem a fonte certa.
   */
  const [fontesProntas] = useFonts(FONTES_A_CARREGAR);

  /**
   * O setup da última mesa volta do disco.
   *
   * Roda uma vez, na abertura, e antes da primeira tela aparecer. Digitar dez
   * nomes e marcar as cartas é o trabalho que dói perder quando o Android mata
   * o app no meio de uma partida — e ele mata, porque a tela fica acesa horas.
   *
   * O que NÃO volta é a partida em andamento: ver `store/persistencia.ts`.
   */
  const restaurar = useJogo((s) => s.restaurar);
  const carregada = useJogo((s) => s.carregada);
  useEffect(() => {
    void restaurar();
  }, [restaurar]);

  /*
   * A espera é invisível: o fundo já é Fuligem, a mesma cor do `app.json`. A
   * tela só "acende" quando as fontes chegaram E o disco respondeu — pintar o
   * setup com os nomes de fábrica e trocá-los um quadro depois seria pior do
   * que esperar.
   */
  if (!fontesProntas || !carregada) {
    return <View style={{ flex: 1, backgroundColor: cores.fuligem }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cores.fuligem }}>
      <SafeAreaProvider>
        {/* Barra clara feriria o olho adaptado ao escuro. */}
        <StatusBar style="light" backgroundColor={cores.fuligem} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
