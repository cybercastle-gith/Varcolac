import { ROLES, ROLES_LOBOS, ROLES_SOLITARIOS, ROLES_VILA, pesoEfetivo } from '@jogo/engine';
import { useLabStore } from '../store/lab-store';
import { BarraDeEquilibrio, Botao, Etiqueta, Secao } from '../components/ui';

/**
 * Editor de pesos, com recálculo do índice na hora.
 *
 * O peso alterado NÃO toca o catálogo: fica só no store, como hipótese. O
 * caminho é mexer aqui, rodar a simulação em massa, e só o que sobreviver à
 * medição vira mudança de verdade em `data/roles`.
 */
export function WeightPanel() {
  const { pesos, setPeso, equilibrio, deck, config } = useLabStore();

  const noBaralho = new Set(deck.roleIds);
  const grupos = [
    { titulo: 'Vila', roles: ROLES_VILA },
    { titulo: 'Lobos', roles: ROLES_LOBOS },
    { titulo: 'Solitários', roles: ROLES_SOLITARIOS },
  ];

  const alterados = Object.keys(pesos).length;

  return (
    <div className="grid grid-cols-[1fr_20rem] gap-8 max-w-6xl">
      <div>
        {grupos.map((g) => (
          <Secao key={g.titulo} titulo={g.titulo}>
            <ul className="space-y-0.5">
              {g.roles.map((r) => {
                const original = pesoEfetivo(r, config.variantes[r.id]);
                const atual = pesos[r.id] ?? original;
                const mudou = pesos[r.id] !== undefined && pesos[r.id] !== original;
                return (
                  <li
                    key={r.id}
                    className={`flex items-center gap-3 px-2 py-1 rounded ${
                      noBaralho.has(r.id) ? 'bg-neutral-900/60' : ''
                    }`}
                  >
                    <span className="text-xs flex-1">
                      {r.nome}
                      {noBaralho.has(r.id) && (
                        <span className="text-neutral-600 ml-2 text-[10px]">no baralho</span>
                      )}
                    </span>
                    <input
                      type="range"
                      min={-4}
                      max={6}
                      step={1}
                      value={atual}
                      onChange={(e) => setPeso(r.id, Number(e.target.value))}
                      className="w-40 accent-amber-600"
                    />
                    <span
                      className={`tabular-nums text-xs w-8 text-right ${
                        mudou ? 'text-amber-400' : 'text-neutral-500'
                      }`}
                    >
                      {atual}
                    </span>
                    {mudou && (
                      <button
                        onClick={() => setPeso(r.id, null)}
                        className="text-[10px] text-neutral-600 hover:text-neutral-300"
                        title={`voltar para ${original}`}
                      >
                        ↺
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Secao>
        ))}
      </div>

      <div>
        <Secao titulo="Índice recalculado">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl tabular-nums">{equilibrio.ie}</span>
            <Etiqueta tom={equilibrio.aceitavel ? 'vila' : 'alerta'}>{equilibrio.leitura}</Etiqueta>
          </div>
          <BarraDeEquilibrio
            ie={equilibrio.ie}
            min={equilibrio.tolerancia.min}
            max={equilibrio.tolerancia.max}
          />
          <ul className="text-[11px] text-neutral-500 mt-3 space-y-0.5">
            <li>força da vila: {equilibrio.forcaVila}</li>
            <li>força da matilha: {equilibrio.forcaMatilha}</li>
            <li>multiplicador M: {equilibrio.multiplicador}</li>
            <li>ajuste de setup: +{equilibrio.ajusteDeSetup}</li>
          </ul>

          {equilibrio.sugestoes.map((s) => (
            <p key={s} className="text-[11px] text-amber-400 mt-2">→ {s}</p>
          ))}
        </Secao>

        <Secao titulo="Pesos alterados">
          {alterados === 0 ? (
            <p className="text-neutral-700 text-xs">Nenhum. O catálogo está intacto.</p>
          ) : (
            <>
              <ul className="text-xs space-y-1">
                {Object.entries(pesos).map(([id, p]) => (
                  <li key={id} className="text-amber-400">
                    {ROLES.find((r) => r.id === id)?.nome}: {p}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <Botao onClick={() => Object.keys(pesos).forEach((id) => setPeso(id, null))}>
                  descartar tudo
                </Botao>
              </div>
              <p className="text-[10px] text-neutral-600 mt-2">
                Isto vive só na memória do laboratório. Para valer no jogo, edite
                <code className="mx-1">packages/engine/src/data/roles</code>.
              </p>
            </>
          )}
        </Secao>
      </div>
    </div>
  );
}
