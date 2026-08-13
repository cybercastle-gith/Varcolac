/**
 * PT Serif para títulos e nomes de role (nomes em itálico).
 * PT Sans para interface. Nunca light no escuro.
 * Regra dura: jamais tipografia gótica ou "medieval decorativa".
 * TODO: carregar as fontes de assets/fonts com expo-font.
 */
export const tipografia = {
  titulo: { fontFamily: 'PTSerif-Regular', fontSize: 28 },
  nomeDeRole: { fontFamily: 'PTSerif-Italic', fontSize: 22 },
  corpo: { fontFamily: 'PTSans-Regular', fontSize: 16 },
  interface: { fontFamily: 'PTSans-Bold', fontSize: 16 },
  rotulo: {
    fontFamily: 'PTSans-Bold',
    fontSize: 11,
    letterSpacing: 1.54, // 0.14em
    textTransform: 'uppercase',
  },
  numero: { fontFamily: 'PTSans-Regular', fontVariant: ['tabular-nums'] },
} as const;
