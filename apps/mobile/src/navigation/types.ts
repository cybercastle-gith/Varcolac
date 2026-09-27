/** Mapa de telas — seção 13 do dossiê. */
export type RootStackParamList = {
  Home: undefined;
  Biblioteca: undefined;
  ComoJogar: undefined;
  // Setup
  Jogadores: undefined;
  Modo: undefined;
  Baralho: undefined;
  Sistemas: undefined;
  Revisao: undefined;
  // Noite
  Passagem: undefined;
  // Dia
  /** Só entra quando a noite teve evento NARRADO. Vem antes das mortes. */
  Evento: undefined;
  Amanhecer: undefined;
  Discussao: undefined;
  Votacao: undefined;
  Execucao: undefined;
  // Fim
  Fim: undefined;
};
