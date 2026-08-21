import { cores } from './colors';

/**
 * Sistema de motivos (seção 7 da identidade visual).
 *
 * Os ícones NÃO são desenhos de objetos: são motivos de bordado, geométricos e
 * planos, tirados do repertório do leste europeu. Isso mantém o sistema coerente
 * e barato — e é o que permite funcionar a 48px sem arquivo de imagem nenhum.
 */
export const motivos = {
  vila: '✢', // árvore da vida
  lobos: '▼', // dente / losango invertido
  solitario: '◇', // losango vazado
  fantasma: '☉', // roda solar
  dia: '☉', // roda solar
  noite: '☽', // lua
  morte: '✝', // cruz
  losango: '◆',
} as const;

export function motivoDaFaccao(faccao: 'vila' | 'lobos' | 'solitario') {
  return {
    vila: { simbolo: motivos.vila, cor: cores.horezu, nome: 'Vila' },
    lobos: { simbolo: motivos.lobos, cor: cores.garanca, nome: 'Lobos' },
    solitario: { simbolo: motivos.solitario, cor: cores.cera, nome: 'Solitário' },
  }[faccao];
}
