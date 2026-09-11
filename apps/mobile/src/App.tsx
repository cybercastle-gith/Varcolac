import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { RootNavigator } from './navigation/RootNavigator';
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

  if (!fontesProntas) {
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
