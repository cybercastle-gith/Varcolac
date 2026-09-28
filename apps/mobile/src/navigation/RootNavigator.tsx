import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { cores, duracaoMaximaMs, fonte } from '../theme';

import { HomeScreen } from '../screens/setup/HomeScreen';
import { BibliotecaScreen } from '../screens/setup/BibliotecaScreen';
import { ComoJogarScreen } from '../screens/setup/ComoJogarScreen';
import { JogadoresScreen } from '../screens/setup/JogadoresScreen';
import { ModoScreen } from '../screens/setup/ModoScreen';
import { BaralhoScreen } from '../screens/setup/BaralhoScreen';
import { SistemasScreen } from '../screens/setup/SistemasScreen';
import { RevisaoScreen } from '../screens/setup/RevisaoScreen';
import { PassagemScreen } from '../screens/night/PassagemScreen';
import { EventoScreen } from '../screens/day/EventoScreen';
import { AmanhecerScreen } from '../screens/day/AmanhecerScreen';
import { DiscussaoScreen } from '../screens/day/DiscussaoScreen';
import { VotacaoScreen } from '../screens/day/VotacaoScreen';
import { ExecucaoScreen } from '../screens/day/ExecucaoScreen';
import { FimScreen } from '../screens/end/FimScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Tema escuro de verdade: nada de branco puro, que fere o olho no escuro. */
const tema: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: cores.fuligem,
    card: cores.fuligem,
    text: cores.linhoCru,
    border: '#2E2721',
    primary: cores.garanca,
  },
};

/**
 * Telas de MOMENTO não têm cabeçalho: nada deve competir com a frase que a mesa
 * vai ouvir. Telas de operação têm, porque voltar precisa ser óbvio.
 */
export function RootNavigator() {
  return (
    <NavigationContainer theme={tema}>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: cores.fuligem },
          headerStyle: { backgroundColor: cores.fuligem },
          headerTintColor: cores.ferrugem,
          headerTitleStyle: { fontFamily: fonte.sans, fontSize: 15, color: cores.linhoCru },
          headerShadowVisible: false,
          animationDuration: duracaoMaximaMs,
          /**
           * As telas DESLIZAM, e não aparecem cortadas.
           *
           * O padrão do `native-stack` no Android é `slide_from_right`, mas na
           * web ele cai em `default`, que troca sem transição nenhuma — e é na
           * web que este app é testado o tempo todo. Declarar explicitamente
           * dá a mesma leitura nos dois lugares: a mesa vê para onde o app
           * está indo, o que é metade do que faz um fluxo parecer fluido.
           */
          animation: 'slide_from_right',
          /*
           * O gesto de voltar fica LIGADO no setup e a tela de jogo o desliga
           * (ver `Passagem`, `Votacao` e `Execucao`): arrastar a borda no meio
           * de uma passagem voltaria para a revisão com a partida em curso.
           */
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Biblioteca"
          component={BibliotecaScreen}
          options={{ title: 'Funções' }}
        />
        <Stack.Screen
          name="ComoJogar"
          component={ComoJogarScreen}
          options={{ title: 'Como jogar' }}
        />

        <Stack.Screen name="Jogadores" component={JogadoresScreen} options={{ title: 'Mesa' }} />
        <Stack.Screen name="Modo" component={ModoScreen} options={{ title: 'Modo' }} />
        <Stack.Screen name="Baralho" component={BaralhoScreen} options={{ title: 'Baralho' }} />
        <Stack.Screen name="Sistemas" component={SistemasScreen} options={{ title: 'Sistemas' }} />
        <Stack.Screen name="Revisao" component={RevisaoScreen} options={{ title: 'Revisão' }} />

        <Stack.Screen
          name="Passagem"
          component={PassagemScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Evento"
          component={EventoScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Amanhecer"
          component={AmanhecerScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Discussao"
          component={DiscussaoScreen}
          options={{ gestureEnabled: false, title: 'Discussão' }}
        />
        <Stack.Screen
          name="Votacao"
          component={VotacaoScreen}
          options={{ gestureEnabled: false, title: 'Votação' }}
        />
        <Stack.Screen
          name="Execucao"
          component={ExecucaoScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Fim"
          component={FimScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
