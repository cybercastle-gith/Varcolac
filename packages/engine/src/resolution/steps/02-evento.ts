import type { StepFn } from '../night-pipeline';
import { pendente } from './_helpers';

/**
 * Etapa 2 — evento da noite, sorteado ou por gatilho.
 * É a única etapa que pode cancelar etapas inteiras: preenche `etapasCanceladas`
 * do contexto (Sono Pesado, Chuva de Sangue, Noite Sem Lua).
 */
export const evento: StepFn = (ctx) => {
  if (ctx.estado.config.frequenciaEventos === 'desligado') {
    ctx.log.ignorar('evento', 'Eventos desligados no setup.');
    return ctx;
  }
  return pendente(ctx, 'evento', 'sorteio de evento e mapa de etapas canceladas');
};
