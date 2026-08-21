import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './navigation/RootNavigator';
import { cores } from './theme';

export function App() {
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
