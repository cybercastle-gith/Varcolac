import { Platform } from 'react-native';

/**
 * PT Serif para títulos e nomes de role (nomes em itálico).
 * PT Sans para interface. Nunca light no escuro.
 *
 * Regra dura da identidade: jamais tipografia gótica ou "medieval decorativa" —
 * é o marcador nº1 de fantasia genérica e destrói a autenticidade numa tela.
 *
 * As quatro faces de cada família (Regular/Bold/Italic/BoldItalic) são
 * registradas por nome explícito em `App.tsx` via `expo-font`, e referenciadas
 * aqui por nome — nunca por `fontWeight`/`fontStyle` sobre uma única face.
 * O Android não sintetiza itálico nem negrito de fonte customizada de forma
 * confiável (o itálico não inclina e o negrito não engrossa); a fonte errada
 * some sem erro nenhum, só fica "normal" — por isso cada estilo aponta direto
 * para o arquivo que já é itálico ou já é negrito.
 */
export const familia = {
  serifRegular: 'PTSerif-Regular',
  serifBold: 'PTSerif-Bold',
  serifItalico: 'PTSerif-Italic',
  serifBoldItalico: 'PTSerif-BoldItalic',
  sansRegular: 'PTSans-Regular',
  sansBold: 'PTSans-Bold',
  sansItalico: 'PTSans-Italic',
} as const;

/** Nomes usados pelo `App.tsx` para registrar os arquivos com `expo-font`. */
export const FONTES_A_CARREGAR = {
  'PTSerif-Regular': require('../../assets/fonts/PTSerif-Regular.ttf'),
  'PTSerif-Bold': require('../../assets/fonts/PTSerif-Bold.ttf'),
  'PTSerif-Italic': require('../../assets/fonts/PTSerif-Italic.ttf'),
  'PTSerif-BoldItalic': require('../../assets/fonts/PTSerif-BoldItalic.ttf'),
  'PTSans-Regular': require('../../assets/fonts/PTSans-Regular.ttf'),
  'PTSans-Bold': require('../../assets/fonts/PTSans-Bold.ttf'),
  'PTSans-Italic': require('../../assets/fonts/PTSans-Italic.ttf'),
  'PTSans-BoldItalic': require('../../assets/fonts/PTSans-BoldItalic.ttf'),
} as const;

/**
 * Compat: uso simples fora de `tipografia` (ex.: cabeçalho da navegação).
 * Aponta para a face regular de cada família.
 */
export const fonte = {
  serif: familia.serifRegular,
  sans: familia.sansRegular,
} as const;

export const tipografia = {
  titulo: { fontFamily: familia.serifRegular, fontSize: 30, letterSpacing: 0.2 },
  subtitulo: { fontFamily: familia.serifRegular, fontSize: 22 },
  /** Nome de role: sempre itálico, sempre a face itálica de verdade. */
  nomeDeRole: { fontFamily: familia.serifItalico, fontSize: 26 },
  corpo: { fontFamily: familia.sansRegular, fontSize: 16, lineHeight: 24 },
  corpoSerif: { fontFamily: familia.serifRegular, fontSize: 17, lineHeight: 26 },
  /** "Semibold" da identidade não existe como face própria — a Bold cumpre o papel. */
  interface: { fontFamily: familia.sansBold, fontSize: 16 },
  rotulo: {
    fontFamily: familia.sansBold,
    fontSize: 11,
    letterSpacing: 1.54,
    textTransform: 'uppercase' as const,
  },
  // Numeral tabular: em placar, coluna que dança é ilegível de longe.
  numero: {
    fontFamily: familia.sansRegular,
    fontVariant: ['tabular-nums'] as ['tabular-nums'],
    fontSize: 48,
  },
  pequeno: { fontFamily: familia.sansRegular, fontSize: 13, lineHeight: 19 },
} as const;

/** Só para o dia em que uma tela precisar da fonte de sistema de propósito. */
export const fonteDeSistema = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' })!,
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' })!,
} as const;
