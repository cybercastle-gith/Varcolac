import { MISSOES_POR_ID, role, type Player } from '@jogo/engine';
import { useLabStore } from '../store/lab-store';
import { Etiqueta, Secao } from '../components/ui';

/** As marcas voláteis, em ordem de leitura. Vazio = nada marcado. */
function Flags({ p }: { p: Player }) {
  const ativas = (
    [
      ['protegido', 'prot'],
      ['bloqueado', 'bloq'],
      ['perfurado', 'perf'],
      ['preso', 'preso'],
      ['imuneInvestigacao', 'imune'],
      ['assombrado', 'assomb'],
      ['embriagado', 'bêbado'],
      ['estertorPendente', 'estertor'],
    ] as const
  ).filter(([k]) => p.flags[k]);

  if (ativas.length === 0) return <span className="text-neutral-700 text-[10px]">—</span>;
  return (
    <span className="flex gap-1 flex-wrap">
      {ativas.map(([k, rotulo]) => (
        <Etiqueta key={k} tom="alerta">{rotulo}</Etiqueta>
      ))}
    </span>
  );
}

/**
 * Estado interno completo. Tudo que no app é invisível por design aparece
 * aqui — é a razão de o laboratório existir.
 */
export function StatePanel() {
  const { estado, entradas } = useLabStore();

  if (!estado) {
    return <p className="text-neutral-600 text-xs">Nenhuma partida. Comece pelo painel Setup.</p>;
  }

  const efeitosFuturos = estado.efeitos.filter((e) => e.naRodada >= estado.rodada);

  return (
    <div className="max-w-6xl">
      <div className="flex gap-6 mb-4 text-xs">
        <span>rodada <b className="tabular-nums">{estado.rodada}</b></span>
        <span>fase <b>{estado.fase}</b></span>
        <span>evento <b>{estado.eventoDaNoite ?? '—'}</b></span>
        <span>semente <b>{estado.config.semente}</b></span>
        <span className="text-neutral-600">rng passo {estado.rng.passo}</span>
        {estado.vencedores && (
          <Etiqueta tom="vila">venceram: {estado.vencedores.length} jogador(es)</Etiqueta>
        )}
      </div>

      <Secao titulo="Jogadores">
        <table className="w-full text-xs">
          <thead className="text-neutral-600 text-[10px] uppercase tracking-wider">
            <tr className="text-left">
              <th className="py-1">jogador</th>
              <th>role</th>
              <th>facção</th>
              <th>estado</th>
              <th>usos</th>
              <th>voto</th>
              <th>marcas</th>
              <th>segredo</th>
            </tr>
          </thead>
          <tbody>
            {estado.players.map((p) => {
              const r = role(p.roleId);
              const morto = p.status === 'morto';
              const segredo = estado.objetivosSecretos[p.id];
              return (
                <tr
                  key={p.id}
                  className={`border-t border-neutral-900 ${morto ? 'opacity-50' : ''}`}
                >
                  <td className="py-1">
                    {p.nome}
                    {p.amanteDe && <span className="text-pink-500 ml-1">♥</span>}
                  </td>
                  <td>
                    {r.nome}
                    {p.varianteId && (
                      <span className="text-neutral-600"> · {p.varianteId}</span>
                    )}
                  </td>
                  <td>
                    <Etiqueta tom={r.faccao === 'vila' ? 'vila' : r.faccao === 'lobos' ? 'lobos' : 'solitario'}>
                      {r.faccao}
                    </Etiqueta>
                  </td>
                  <td>
                    {morto ? (
                      <Etiqueta tom="morto">
                        morto n{p.mortoNaRodada} · {p.causaMorte}
                      </Etiqueta>
                    ) : (
                      <span className="text-emerald-500">vivo</span>
                    )}
                  </td>
                  <td className="tabular-nums text-neutral-500">
                    {p.usosRestantes === Infinity ? '∞' : p.usosRestantes}
                  </td>
                  <td className="text-neutral-500">
                    {p.semVoto ? 'sem voto' : p.silenciado ? 'calado' : '—'}
                  </td>
                  <td><Flags p={p} /></td>
                  <td className="text-neutral-600 text-[10px]">
                    {segredo
                      ? (MISSOES_POR_ID.get(segredo)?.texto ?? segredo)
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Secao>

      <div className="grid grid-cols-3 gap-6">
        <Secao titulo="Efeitos engatilhados">
          {efeitosFuturos.length === 0 ? (
            <p className="text-neutral-700 text-xs">Nada pendente.</p>
          ) : (
            <ul className="text-xs space-y-1">
              {efeitosFuturos.map((e, i) => (
                <li key={i} className="text-neutral-400">
                  <span className="text-neutral-600">n{e.naRodada}</span> {e.kind}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Informação privada">
          {estado.informacoes.length === 0 ? (
            <p className="text-neutral-700 text-xs">Ninguém soube de nada ainda.</p>
          ) : (
            <ul className="text-xs space-y-1">
              {estado.informacoes.map((i, k) => (
                <li key={k}>
                  <span className="text-neutral-600">n{i.rodada}</span>{' '}
                  <span className="text-neutral-500">→ {estado.players.find((p) => p.id === i.paraId)?.nome}:</span>{' '}
                  {i.texto}{' '}
                  {!i.verdadeira && <Etiqueta tom="lobos">falsa</Etiqueta>}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Contadores de gatilho">
          <ul className="text-xs space-y-1 text-neutral-400">
            <li>inocentes seguidos: {estado.contadores.inocentesLinchadosSeguidos}</li>
            <li>inocentes no total: {estado.contadores.inocentesLinchadosTotal}</li>
            <li>noites sem matar: {estado.contadores.noitesSemMatar}</li>
            <li>mortos no total: {estado.contadores.mortosNoTotal}</li>
            <li>eventos usados: {estado.eventosUsados.join(', ') || '—'}</li>
          </ul>
        </Secao>
      </div>

      <Secao titulo="Anúncios (o que a mesa ouviu)">
        {estado.anuncios.length === 0 ? (
          <p className="text-neutral-700 text-xs">Silêncio.</p>
        ) : (
          <ul className="text-xs space-y-1">
            {estado.anuncios.map((a, i) => (
              <li key={i} className="text-amber-200">
                <span className="text-neutral-600">n{a.rodada} [{a.origem}]</span> {a.texto}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <p className="text-[10px] text-neutral-700">{entradas.length} entradas no log de resolução.</p>
    </div>
  );
}
