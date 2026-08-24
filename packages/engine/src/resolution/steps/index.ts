import type { NightStepId } from '../../types/action';
import type { StepFn } from '../night-pipeline';
import { estadoInicial } from './01-estado-inicial';
import { evento } from './02-evento';
import { bloqueio } from './03-bloqueio';
import { interferenciaEspectral } from './04-interferencia-espectral';
import { protecao } from './05-protecao';
import { perfuracao } from './06-perfuracao';
import { ataque } from './07-ataque';
import { resolucaoMortes } from './08-resolucao-mortes';
import { estertores } from './09-estertores';
import { ressurreicao } from './10-ressurreicao';
import { informacao } from './11-informacao';

/** Uma função por etapa. O pipeline percorre este mapa na ordem de NIGHT_STEPS. */
export const ETAPAS: Readonly<Record<NightStepId, StepFn>> = {
  'estado-inicial': estadoInicial,
  evento,
  bloqueio,
  'interferencia-espectral': interferenciaEspectral,
  protecao,
  perfuracao,
  ataque,
  'resolucao-mortes': resolucaoMortes,
  estertores,
  ressurreicao,
  informacao,
};

export {
  estadoInicial,
  evento,
  bloqueio,
  interferenciaEspectral,
  protecao,
  perfuracao,
  ataque,
  resolucaoMortes,
  estertores,
  ressurreicao,
  informacao,
};
