/**
 * Paleta "Luz de Vela". Onze cores, todas com procedência material.
 * Nenhuma foi escolhida por parecer bonita — ver documento de identidade visual.
 */
export const cores = {
  // Base
  fuligem: '#14100D', // preto de fumo de vela
  nogueira: '#856346', // viga envelhecida
  ferrugem: '#af876a', // ferro forjado oxidado
  linhoCru: '#D9CDB4', // tecido não tingido — é o texto mais claro; nunca #FFF
  // Luz
  chama: '#F0C97A',
  cera: '#E0B75C',
  folhaDeOuro: '#C9A227',
  // Acento
  garanca: '#d43c34',
  sangueSeco: '#6E1F1F',
  indigo: '#1F3550',
  horezu: '#5b907a',

  /*
   * Tons de TEXTO das cores escuras. Relatado em 2026-10-02: "as vezes nem dá
   * pra ver". Sobre a fuligem e o fundo dos cartões (#2A221C), nogueira dava
   * 2,9:1, garança 3,3:1, sangue seco e índigo 1,4:1 — o mínimo legível (WCAG
   * AA) é 4,5:1. Mesmo matiz, só mais claro: todos ficam acima de 4,8:1 nos
   * dois fundos. As cores originais continuam valendo para borda, fundo e
   * ícone; em TEXTO, use sempre estas.
   */
  nogueiraTexto: '#AF8866',
  garancaTexto: '#DF6D67',
  sangueSecoTexto: '#D77272',
  indigoTexto: '#6992C5',
} as const;

/** Uso semântico — a cor nunca aparece sozinha; sempre com ícone ou texto. */
export const semantico = {
  acaoPrincipal: cores.garanca,
  morte: cores.sangueSeco,
  reveladoOuPoder: cores.cera,
  vitoria: cores.folhaDeOuro,
  noiteEFantasmas: cores.indigo,
  protecao: cores.horezu,
  texto: cores.linhoCru,
} as const;
