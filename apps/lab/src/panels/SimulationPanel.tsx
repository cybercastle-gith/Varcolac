import { taxas } from '@jogo/engine';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLabStore } from '../store/lab-store';
import { BarraDeEquilibrio, Botao, Etiqueta, Secao } from '../components/ui';

/**
 * Simulação em massa. É assim que a calculadora de peso é calibrada de verdade:
 * o IE é uma previsão, e isto é a medição.
 *
 * A comparação lado a lado no topo é o ponto do painel — quando os dois
 * discordam, quem está errado é o modelo, não a mesa.
 */
export function SimulationPanel() {
  const { stats, simulando, simular, equilibrio, deck, jogadores, config } = useLabStore();

  const t = stats ? taxas(stats) : null;
  const dados = stats
    ? Object.entries(stats.distribuicaoDeNoites)
        .map(([noites, n]) => ({ noites: Number(noites), partidas: n }))
        .sort((a, b) => a.noites - b.noites)
    : [];

  return (
    <div className="max-w-5xl">
      <Secao titulo="Rodar">
        <div className="flex items-center gap-2 flex-wrap">
          {[100, 1000, 10000].map((n) => (
            <Botao key={n} onClick={() => simular(n)} disabled={simulando} tom={n === 1000 ? 'forte' : 'normal'}>
              {n.toLocaleString('pt-BR')} partidas
            </Botao>
          ))}
          <span className="text-[11px] text-neutral-600 ml-2">
            {deck.nome} · {jogadores} jogadores · semente {config.semente}
          </span>
        </div>
        {simulando && <p className="text-xs text-amber-400 mt-2">Rodando…</p>}
      </Secao>

      {!stats ? (
        <p className="text-neutral-600 text-xs">
          Nenhuma simulação ainda. Mil partidas levam menos de um segundo.
        </p>
      ) : (
        <>
          <Secao titulo="Previsto × medido">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[11px] text-neutral-500 mb-1">
                  Previsão da calculadora (IE {equilibrio.ie} — {equilibrio.leitura})
                </p>
                <BarraDeEquilibrio
                  ie={equilibrio.ie}
                  min={equilibrio.tolerancia.min}
                  max={equilibrio.tolerancia.max}
                />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 mb-1">Medição em {stats.partidas} partidas</p>
                <div className="flex h-6 rounded overflow-hidden border border-neutral-800 text-[10px]">
                  <div className="bg-emerald-800 flex items-center justify-center" style={{ width: `${t!.vila}%` }}>
                    {t!.vila > 8 && `vila ${t!.vila}%`}
                  </div>
                  <div className="bg-red-900 flex items-center justify-center" style={{ width: `${t!.lobos}%` }}>
                    {t!.lobos > 8 && `lobos ${t!.lobos}%`}
                  </div>
                  <div className="bg-amber-800 flex items-center justify-center" style={{ width: `${t!.solitario}%` }}>
                    {t!.solitario > 8 && `sol ${t!.solitario}%`}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-neutral-600 mt-2">
              Os bots votam ao acaso, de propósito: isso mede a força ESTRUTURAL da composição,
              não a qualidade do bot. Trate o resultado como piso da vila, não como verdade da mesa.
            </p>
          </Secao>

          <div className="grid grid-cols-[1fr_16rem] gap-6">
            <Secao titulo="Distribuição de duração">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dados}>
                    <CartesianGrid stroke="#262626" vertical={false} />
                    <XAxis dataKey="noites" stroke="#666" fontSize={11} />
                    <YAxis stroke="#666" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#171717', border: '1px solid #333', fontSize: 11 }}
                      labelFormatter={(v) => `${v} noite(s)`}
                    />
                    <Bar dataKey="partidas" fill="#a16207" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Secao>

            <Secao titulo="Números">
              <ul className="text-xs space-y-1 text-neutral-400">
                <li>partidas: <b className="tabular-nums">{stats.partidas}</b></li>
                <li>noites (média): <b className="tabular-nums">{stats.noitesMedia.toFixed(2)}</b></li>
                <li>noites (mediana): <b className="tabular-nums">{stats.noitesMediana}</b></li>
                <li>
                  abortadas:{' '}
                  {stats.abortadas === 0 ? (
                    <Etiqueta tom="vila">0</Etiqueta>
                  ) : (
                    <Etiqueta tom="alerta">{stats.abortadas}</Etiqueta>
                  )}
                </li>
                <li>tempo: <b className="tabular-nums">{stats.duracaoMs} ms</b></li>
              </ul>
              <p className="text-[10px] text-neutral-700 mt-3">
                Cada partida tem semente própria (<code>{config.semente}#i</code>). Qualquer linha
                pode ser reaberta e reproduzida exatamente.
              </p>
            </Secao>
          </div>
        </>
      )}
    </div>
  );
}
