import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameConfig } from '@jogo/engine';
import type { JogadorDaMesa } from './jogo';

/**
 * O que sobrevive a fechar o app.
 *
 * Só o SETUP, nunca a partida em andamento. A partida é um estado grande e
 * cheio de referências cruzadas, e restaurá-la pela metade — com o celular no
 * meio de uma passagem, metade das ações colhidas — é pior do que não
 * restaurar: a mesa não teria como saber em que ponto parou, e o app estaria
 * afirmando uma noite que ninguém jogou.
 *
 * O que dói de perder é o trabalho de digitar dez nomes e marcar as cartas, e
 * é exatamente isso que fica salvo.
 */
export interface MesaSalva {
  readonly jogadores: readonly JogadorDaMesa[];
  readonly selecionadas: readonly string[];
  readonly config: GameConfig;
}

const CHAVE = 'varcolac:mesa:v1';

/**
 * Grava a mesa. Erro de disco é engolido de propósito.
 *
 * Perder o autosave é um aborrecimento; derrubar o setup inteiro com uma
 * exceção porque o armazenamento está cheio é perder a partida. A escrita
 * acontece a cada mudança e ninguém está esperando por ela.
 */
export async function salvarMesa(mesa: MesaSalva): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(mesa));
  } catch {
    // Sem autosave desta vez. A mesa continua jogável.
  }
}

/**
 * Lê a mesa salva, ou `null`.
 *
 * Valida o formato à mão em vez de confiar no JSON: o que está em disco foi
 * escrito por uma VERSÃO ANTERIOR do app, e um campo que mudou de forma entra
 * aqui como um objeto qualquer. Confiar nele espalha o estrago para dentro do
 * engine, onde o erro aparece três telas depois e sem pista da origem.
 */
export async function lerMesa(): Promise<MesaSalva | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados: unknown = JSON.parse(bruto);
    if (typeof dados !== 'object' || dados === null) return null;

    const m = dados as Partial<MesaSalva>;
    const jogadoresOk =
      Array.isArray(m.jogadores) &&
      m.jogadores.length >= 1 &&
      m.jogadores.every((j) => typeof j?.nome === 'string' && typeof j?.cor === 'string');
    const selecaoOk =
      Array.isArray(m.selecionadas) && m.selecionadas.every((s) => typeof s === 'string');
    const configOk = typeof m.config === 'object' && m.config !== null;

    if (!jogadoresOk || !selecaoOk || !configOk) return null;
    return { jogadores: m.jogadores!, selecionadas: m.selecionadas!, config: m.config! };
  } catch {
    return null;
  }
}

export async function esquecerMesa(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE);
  } catch {
    // Idem: não vale derrubar nada por causa disto.
  }
}
