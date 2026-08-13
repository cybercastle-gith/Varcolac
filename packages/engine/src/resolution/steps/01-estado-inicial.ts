import type { StepFn } from '../night-pipeline';

/**
 * Etapa 1 — Amantes, Coringa, Ladrão.
 * Os vínculos e a troca já foram resolvidos em `criarPartida`, antes da primeira
 * passagem do celular. Aqui só se registra o ponto de partida da noite.
 */
export const estadoInicial: StepFn = (ctx) => {
  const vivos = ctx.estado.players.filter((p) => p.status === 'vivo').length;
  ctx.log.registrar('estado-inicial', {
    mensagem: `Noite ${ctx.estado.rodada} começa com ${vivos} jogadores vivos.`,
    motivo: 'Vínculos e trocas foram resolvidos na atribuição de roles.',
  });
  return ctx;
};
