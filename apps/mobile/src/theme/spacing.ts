export const espaco = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;

export const raio = { padrao: 4 } as const;

/** Ninguém acerta um botão pequeno no escuro, com pressa e com gente olhando. */
export const alvoMinimo = 48;

/** Transição máxima. Ninguém quer esperar animação com sete pessoas olhando. */
export const duracaoMaximaMs = 250;

/**
 * As três velocidades do app, e nada além delas.
 *
 * Números soltos espalhados pelos componentes (250 aqui, 420 ali, 140 acolá)
 * são a origem do desconforto que ninguém consegue nomear: duas coisas que
 * começam juntas terminam em momentos diferentes, e a tela parece frouxa.
 *
 * - `toque` — resposta ao dedo. Termina antes de a pessoa pensar nela.
 * - `transicao` — entrada de conteúdo e troca de tela. O teto da identidade.
 * - `momento` — revelação de carta, amanhecer, fim. Aqui a espera É o efeito,
 *   e ainda assim é curta: com sete pessoas olhando, meio segundo é muito.
 */
export const tempos = {
  toque: 120,
  transicao: duracaoMaximaMs,
  momento: 420,
} as const;
