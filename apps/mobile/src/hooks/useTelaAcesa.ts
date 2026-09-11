import { useEffect } from 'react';
import { Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TAG = 'partida';

/**
 * Mantém a tela acesa durante a partida — ninguém quer o aparelho apagando no
 * meio da passagem, no escuro, com sete pessoas esperando.
 *
 * Usa a API IMPERATIVA em vez do gancho `useKeepAwake`. O gancho precisa ser
 * chamado sempre, na mesma ordem, e por isso não dá para condicioná-lo por
 * plataforma; na web ele aciona a API WakeLock, que rejeita quando a aba não
 * está visível ou sem permissão e derruba uma promessa não tratada no console.
 * Aqui a condição fica DENTRO do efeito, que é onde ela pode existir.
 */
export function useTelaAcesa(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let ativo = true;
    // A promessa é engolida de propósito: manter a tela acesa é conforto, não
    // requisito — falhar nisso não pode derrubar a tela de jogo.
    void activateKeepAwakeAsync(TAG).catch(() => {});

    return () => {
      if (!ativo) return;
      ativo = false;
      try {
        deactivateKeepAwake(TAG);
      } catch {
        // Já desativado, ou nunca ativou. Nos dois casos não há o que fazer.
      }
    };
  }, []);
}
