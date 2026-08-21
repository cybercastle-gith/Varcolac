import { ORDEM_DAS_ETAPAS, ordemDaEtapa } from '@jogo/engine';
import { useLabStore } from '../store/lab-store';
import { Botao, Etiqueta, Secao } from '../components/ui';

/**
 * O log das 12 etapas, com o botão de próxima etapa.
 *
 * Cada linha traz a mensagem E o motivo. É como se depura "o Feiticeiro
 * perfurou, mas o Padre cancelou" — sem o motivo, o log só diz que nada
 * aconteceu, e a pergunta continua de pé.
 */
export function ResolutionPanel() {
  const { estado, ctx, proximaEtapa, entradas, passo, noiteInteira, resolverODia } = useLabStore();

  if (!estado) {
    return <p className="text-neutral-600 text-xs">Nenhuma partida. Comece pelo painel Setup.</p>;
  }

  const emNoite = ctx !== null;
  const acabou = estado.fase === 'fim';

  return (
    <div className="grid grid-cols-[16rem_1fr] gap-8 max-w-6xl">
      <div>
        <Secao titulo="Precedência">
          <ol className="space-y-0.5">
            {ORDEM_DAS_ETAPAS.map((etapa) => {
              const feita = emNoite && ORDEM_DAS_ETAPAS.indexOf(etapa) < (proximaEtapa ? ORDEM_DAS_ETAPAS.indexOf(proximaEtapa) : 12);
              const agora = etapa === proximaEtapa;
              return (
                <li
                  key={etapa}
                  className={`text-xs flex gap-2 px-2 py-0.5 rounded ${
                    agora ? 'bg-amber-900/40 text-amber-200' : feita ? 'text-neutral-400' : 'text-neutral-700'
                  }`}
                >
                  <span className="tabular-nums w-4 text-right">{ordemDaEtapa(etapa)}</span>
                  <span>{etapa}</span>
                </li>
              );
            })}
          </ol>
        </Secao>

        <div className="flex flex-col gap-2">
          <Botao onClick={passo} disabled={acabou || (!emNoite && estado.fase !== 'noite')} tom="forte">
            {emNoite ? `Próxima etapa: ${proximaEtapa}` : 'Começar a noite'}
          </Botao>
          <Botao onClick={noiteInteira} disabled={acabou || estado.fase === 'amanhecer'}>
            Noite inteira
          </Botao>
          <Botao onClick={resolverODia} disabled={acabou || emNoite || estado.fase === 'noite'}>
            Resolver o dia
          </Botao>
        </div>

        {acabou && (
          <p className="mt-4 text-xs text-emerald-400">
            Partida encerrada na rodada {estado.rodada}.
          </p>
        )}
      </div>

      <Secao titulo={`Log de resolução — ${entradas.length} entradas`}>
        {entradas.length === 0 ? (
          <p className="text-neutral-700 text-xs">Nada ainda. Avance uma etapa.</p>
        ) : (
          <ol className="space-y-1">
            {entradas.map((e, i) => (
              <li
                key={i}
                className={`text-xs border-l-2 pl-3 py-0.5 ${
                  e.ignorada ? 'border-neutral-800 text-neutral-600' : 'border-amber-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600 tabular-nums">
                    n{e.rodada}
                    {e.fase === 'noite' ? `·${String(e.ordem).padStart(2, '0')}` : '·dia'}
                  </span>
                  <span className="text-neutral-500">{e.fase === 'noite' ? e.etapa : 'votação'}</span>
                  {e.ignorada && <Etiqueta tom="neutro">ignorada</Etiqueta>}
                </div>
                <div className={e.ignorada ? '' : 'text-neutral-200'}>{e.mensagem}</div>
                {e.motivo && <div className="text-neutral-600">{e.motivo}</div>}
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </div>
  );
}
