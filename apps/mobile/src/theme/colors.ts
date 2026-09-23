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
