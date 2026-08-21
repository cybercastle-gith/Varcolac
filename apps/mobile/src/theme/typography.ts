import { Platform } from 'react-native';

/**
 * PT Serif para títulos e nomes de role (nomes em itálico).
 * PT Sans para interface. Nunca light no escuro.
 *
 * Regra dura da identidade: jamais tipografia gótica ou "medieval decorativa" —
 * é o marcador nº1 de fantasia genérica e destrói a autenticidade numa tela.
 *
 * Enquanto as fontes PT não estiverem em assets/fonts, caímos na serifada e na
 * sem-serifa do sistema. A hierarquia se mantém; só a personalidade espera.
 */
export const fonte = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' })!,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' })!,
} as const;

export const tipografia = {
  titulo: { fontFamily: fonte.serif, fontSize: 30, letterSpacing: 0.2 },
  subtitulo: { fontFamily: fonte.serif, fontSize: 22 },
  nomeDeRole: { fontFamily: fonte.serif, fontSize: 26, fontStyle: 'italic' as const },
  corpo: { fontFamily: fonte.sans, fontSize: 16, lineHeight: 24 },
  corpoSerif: { fontFamily: fonte.serif, fontSize: 17, lineHeight: 26 },
  interface: { fontFamily: fonte.sans, fontSize: 16, fontWeight: '600' as const },
  rotulo: {
    fontFamily: fonte.sans,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.54,
    textTransform: 'uppercase' as const,
  },
  // Numeral tabular: em placar, coluna que dança é ilegível de longe.
  numero: {
    fontFamily: fonte.sans,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
    fontSize: 48,
  },
  pequeno: { fontFamily: fonte.sans, fontSize: 13, lineHeight: 19 },
} as const;
