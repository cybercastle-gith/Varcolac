import { Platform } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

/**
 * Mantém a tela acesa durante a partida — ninguém quer o aparelho apagando no
 * meio da passagem, no escuro, com sete pessoas esperando.
 *
 * Na web o `useKeepAwake` usa a API WakeLock, que REJEITA quando a aba não está
 * visível e derruba uma promessa não tratada no console. Como a web só existe
 * aqui para desenvolvimento, o gancho é ligado apenas no aparelho.
 */
export function useTelaAcesa(): void {
  const naWeb = Platform.OS === 'web';
  // O gancho precisa ser chamado sempre, na mesma ordem: quem decide é a tag.
  useKeepAwake(naWeb ? 'desligado-na-web' : 'partida', { suppressDeactivateWarnings: true });
}
