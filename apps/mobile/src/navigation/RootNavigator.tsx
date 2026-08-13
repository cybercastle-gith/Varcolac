import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/setup/HomeScreen';
import { cores } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** TODO: registrar as demais telas (setup, noite, dia, fim) conforme forem criadas. */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fuligem },
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
