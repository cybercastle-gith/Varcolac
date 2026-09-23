/**
 * O banco de materiais: fundos, texturas e recortes.
 *
 * Os arquivos vêm das folhas de contato geradas pela IA e fatiadas por
 * `scripts/fatiar-assets.py` (ver `docs/ASSETS_A_GERAR.md`). Aqui eles ganham
 * nome de código e, principalmente, **uma opacidade de uso**.
 *
 * A opacidade é a parte que importa. O material fotográfico é realista demais
 * para aparecer inteiro: a 390pt de largura, no escuro, textura em cima vira
 * marrom indistinto e come o texto. Ele entra como GRÃO — por baixo de tudo,
 * em 6% a 14% — e o que o olho percebe não é a madeira: é que a superfície
 * deixou de ser chapada. A camada figurativa (ícones das funções) é desenhada,
 * não fotografada.
 *
 * Todo `require` é estático de propósito: o Metro precisa ver o caminho literal
 * para empacotar o arquivo. Caminho montado em variável não é empacotado, e o
 * app abre sem a imagem — sem erro nenhum, o que é pior.
 */

/** Fundo de tela inteira, um por clima do `Ambiente`. */
export const fundos = {
  noite: require('../../assets/fundos/noite.png'),
  dia: require('../../assets/fundos/dia.png'),
  morte: require('../../assets/fundos/morte.png'),
  vitoria: require('../../assets/fundos/vitoria.png'),
  neutro: require('../../assets/fundos/neutro.png'),
  terra: require('../../assets/fundos/terra.png'),
} as const;

/**
 * As rampas de luz e sombra, geradas por `scripts/gerar-gradientes.py`.
 *
 * São branco puro com canal alfa: a cor entra em tempo de execução pelo
 * `tintColor`, então o mesmo arquivo serve à chama âmbar da noite e ao Sangue
 * Seco da morte. Ver o cabeçalho do script para o porquê de não serem Views.
 */
export const gradientes = {
  halo: require('../../assets/gradientes/halo.png'),
  vinheta: require('../../assets/gradientes/vinheta.png'),
  topo: require('../../assets/gradientes/topo.png'),
} as const;

/** Texturas de superfície, para painéis e cartas. */
export const texturas = {
  linho: require('../../assets/texturas/linho-cru.png'),
  papel: require('../../assets/texturas/papel-encardido.png'),
  feltro: require('../../assets/texturas/feltro-escuro.png'),
  nogueira: require('../../assets/texturas/nogueira.png'),
  bordado: require('../../assets/texturas/bordado-vermelho.png'),
  terra: require('../../assets/texturas/terra.png'),
} as const;

export type NomeDeTextura = keyof typeof texturas;

/**
 * Opacidade de cada superfície.
 *
 * Medido na tela, no escuro, e não escolhido no olho: acima de ~15% o texto
 * Linho Cru sobre a textura cai abaixo do contraste 4.5:1 que a identidade
 * exige em tela de operação.
 */
export const opacidadeDaTextura: Record<NomeDeTextura, number> = {
  linho: 0.1,
  papel: 0.12,
  feltro: 0.14,
  nogueira: 0.09,
  bordado: 0.08,
  terra: 0.1,
};

/**
 * Os objetos recortados do banco de materiais.
 *
 * Hoje eles vestem as telas de momento e o verso da carta. Quando a folha de
 * ícones em xilogravura chegar (Bloco 4), o ícone da FUNÇÃO passa a vir de lá;
 * estes continuam sendo o mobiliário do mundo, não o símbolo da função.
 */
export const recortes = {
  anel: require('../../assets/recortes/anel.png'),
  chave: require('../../assets/recortes/chave.png'),
  colher: require('../../assets/recortes/colher.png'),
  corda: require('../../assets/recortes/corda.png'),
  cruz: require('../../assets/recortes/cruz.png'),
  dente: require('../../assets/recortes/dente.png'),
  espelho: require('../../assets/recortes/espelho.png'),
  faca: require('../../assets/recortes/faca.png'),
  ferradura: require('../../assets/recortes/ferradura.png'),
  frasco: require('../../assets/recortes/frasco.png'),
  la: require('../../assets/recortes/la.png'),
  lamparina: require('../../assets/recortes/lamparina.png'),
  machadinha: require('../../assets/recortes/machadinha.png'),
  moeda: require('../../assets/recortes/moeda.png'),
  ossos: require('../../assets/recortes/ossos.png'),
  penaTinteiro: require('../../assets/recortes/pena-tinteiro.png'),
  prego: require('../../assets/recortes/prego.png'),
  selo: require('../../assets/recortes/selo.png'),
  sino: require('../../assets/recortes/sino.png'),
  vela: require('../../assets/recortes/vela.png'),
} as const;

export type NomeDeRecorte = keyof typeof recortes;

/**
 * Os 24 ícones de função, em xilogravura (Bloco 4 de `ASSETS_A_GERAR.md`).
 *
 * Chave = id da role no engine. O desenho é da função BASE; a variante entra
 * por cima como selo geométrico (ver `complementoDe`, em `IconeDeRole.tsx`) —
 * é o que mantém a conta em pé: função nova custa um desenho, variante nova
 * custa zero.
 */
export const iconesDeRole = {
  aldeao: require('../../assets/roles/aldeao.png'),
  vidente: require('../../assets/roles/vidente.png'),
  detetive: require('../../assets/roles/detetive.png'),
  medico: require('../../assets/roles/medico.png'),
  'guarda-costas': require('../../assets/roles/guarda-costas.png'),
  xerife: require('../../assets/roles/xerife.png'),
  necromante: require('../../assets/roles/necromante.png'),
  padre: require('../../assets/roles/padre.png'),
  cacador: require('../../assets/roles/cacador.png'),
  taverneiro: require('../../assets/roles/taverneiro.png'),
  ancia: require('../../assets/roles/ancia.png'),
  lobo: require('../../assets/roles/lobo.png'),
  alfa: require('../../assets/roles/alfa.png'),
  feiticeiro: require('../../assets/roles/feiticeiro.png'),
  'lobo-carnical': require('../../assets/roles/lobo-carnical.png'),
  'lobo-sombra': require('../../assets/roles/lobo-sombra.png'),
  uivador: require('../../assets/roles/uivador.png'),
  'lobo-branco': require('../../assets/roles/lobo-branco.png'),
  bruxa: require('../../assets/roles/bruxa.png'),
  ladrao: require('../../assets/roles/ladrao.png'),
  coringa: require('../../assets/roles/coringa.png'),
  sobrevivente: require('../../assets/roles/sobrevivente.png'),
  bobo: require('../../assets/roles/bobo.png'),
  vingador: require('../../assets/roles/vingador.png'),
} as const;

export type NomeDeIconeDeRole = keyof typeof iconesDeRole;

/** A marca do jogo: a pegada de lobo do Bloco 4, na resolução cheia da folha. */
export const logo = require('../../assets/app-logo.png');
