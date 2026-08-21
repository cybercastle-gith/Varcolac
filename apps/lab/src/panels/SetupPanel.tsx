import {
  ESTILOS,
  MODULOS_DE_FANTASMA,
  MODOS,
  ROLES,
  role,
  sementeAleatoria,
  type DeckStyle,
  type EventFrequency,
  type GameMode,
  type GhostModuleId,
  type RoleId,
  type WolfCountVisibility,
} from '@jogo/engine';
import { useLabStore } from '../store/lab-store';
import { BarraDeEquilibrio, Botao, Campo, Etiqueta, Interruptor, Secao, Select } from '../components/ui';

const faccaoTom = { vila: 'vila', lobos: 'lobos', solitario: 'solitario' } as const;

/**
 * Montar a partida: jogadores, baralho, modo e os sete sistemas do setup.
 * Mostra o índice de equilíbrio antes de começar, que é o que a mesa vê.
 */
export function SetupPanel() {
  const s = useLabStore();

  return (
    <div className="grid grid-cols-2 gap-8 max-w-6xl">
      <div>
        <Secao titulo="Mesa">
          <Campo rotulo="Jogadores">
            <input
              type="number"
              min={5}
              max={16}
              value={s.jogadores}
              onChange={(e) => s.setJogadores(Number(e.target.value))}
              className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 w-20 text-xs"
            />
          </Campo>
          <Campo rotulo="Semente">
            <div className="flex gap-2">
              <input
                value={s.config.semente}
                onChange={(e) => s.setConfig({ semente: e.target.value })}
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 w-40 text-xs"
              />
              <Botao onClick={() => s.setConfig({ semente: sementeAleatoria() })}>sortear</Botao>
            </div>
          </Campo>
        </Secao>

        <Secao
          titulo="Baralho"
          acao={<Botao onClick={s.baralhoSurpresa}>Baralho Surpresa</Botao>}
        >
          <Select<DeckStyle>
            value={s.estilo}
            onChange={s.setEstilo}
            options={ESTILOS.map((e) => ({ value: e.id, label: `${e.nome} — ${e.frase}` }))}
          />
          <ul className="mt-3 space-y-1">
            {s.deck.roleIds.map((id, i) => {
              const r = role(id);
              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-neutral-600 w-6 text-right text-[10px]">{i + 1}</span>
                  <select
                    value={id}
                    onChange={(e) => s.trocarRole(i, e.target.value as RoleId)}
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs flex-1"
                  >
                    {ROLES.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nome} ({x.peso})
                      </option>
                    ))}
                  </select>
                  <Etiqueta tom={faccaoTom[r.faccao]}>{r.faccao}</Etiqueta>
                </li>
              );
            })}
          </ul>
        </Secao>
      </div>

      <div>
        <Secao titulo="Sistemas do setup">
          <Campo rotulo="Modo de jogo">
            <Select<GameMode>
              value={s.config.modo}
              onChange={(modo) => s.setConfig({ modo })}
              options={Object.values(MODOS).map((m) => ({ value: m.id, label: m.nome }))}
            />
          </Campo>
          <p className="text-[11px] text-neutral-600 mb-2">{MODOS[s.config.modo].descricao}</p>

          <Campo rotulo="Revelar role ao morrer">
            <Interruptor
              ligado={s.config.revelarRoleAoMorrer}
              onChange={(revelarRoleAoMorrer) => s.setConfig({ revelarRoleAoMorrer })}
            />
          </Campo>
          <Campo rotulo="Contagem de lobos">
            <Select<WolfCountVisibility>
              value={s.config.contagemDeLobos}
              onChange={(contagemDeLobos) => s.setConfig({ contagemDeLobos })}
              options={[
                { value: 'publica', label: 'Pública' },
                { value: 'oculta', label: 'Oculta' },
                { value: 'faixa', label: 'Faixa aproximada' },
              ]}
            />
          </Campo>
          <Campo rotulo="Eventos">
            <Select<EventFrequency>
              value={s.config.frequenciaEventos}
              onChange={(frequenciaEventos) => s.setConfig({ frequenciaEventos })}
              options={[
                { value: 'desligado', label: 'Desligado' },
                { value: 'raro', label: 'Raro' },
                { value: 'frequente', label: 'Frequente' },
                { value: 'caotico', label: 'Caótico' },
              ]}
            />
          </Campo>
          <Campo rotulo="Votação">
            <Select
              value={s.config.votacao}
              onChange={(votacao) => s.setConfig({ votacao })}
              options={[
                { value: 'simultanea', label: 'Simultânea' },
                { value: 'secreta', label: 'Secreta' },
              ]}
            />
          </Campo>
        </Secao>

        <Secao titulo="Módulos de fantasma">
          {MODULOS_DE_FANTASMA.map((m) => (
            <Campo key={m.id} rotulo={`${m.nome} (${m.tipo})`}>
              <Interruptor
                ligado={s.config.modulosDeFantasma.includes(m.id)}
                onChange={(on) =>
                  s.setConfig({
                    modulosDeFantasma: on
                      ? [...s.config.modulosDeFantasma, m.id]
                      : s.config.modulosDeFantasma.filter((x: GhostModuleId) => x !== m.id),
                  })
                }
              />
            </Campo>
          ))}
        </Secao>

        <Secao titulo="Índice de equilíbrio">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl tabular-nums">{s.equilibrio.ie}</span>
            <Etiqueta tom={s.equilibrio.aceitavel ? 'vila' : 'alerta'}>
              {s.equilibrio.leitura}
            </Etiqueta>
            <span className="text-[11px] text-neutral-600">
              vila {s.equilibrio.forcaVila} · matilha {s.equilibrio.forcaMatilha} × {s.equilibrio.multiplicador}
              {s.equilibrio.ajusteDeSetup > 0 && ` · setup +${s.equilibrio.ajusteDeSetup}`}
            </span>
          </div>
          <BarraDeEquilibrio
            ie={s.equilibrio.ie}
            min={s.equilibrio.tolerancia.min}
            max={s.equilibrio.tolerancia.max}
          />
          <p className="text-[11px] text-neutral-600 mt-1">
            Tolerância {s.equilibrio.tolerancia.min} a {s.equilibrio.tolerancia.max} — eventos em
            “{s.config.frequenciaEventos}” não mudam o IE, alargam o aceitável.
          </p>

          {s.equilibrio.violacoes.map((v) => (
            <p key={v} className="text-[11px] text-red-400 mt-1">✗ {v}</p>
          ))}
          {s.equilibrio.sugestoes.map((v) => (
            <p key={v} className="text-[11px] text-amber-400 mt-1">→ {v}</p>
          ))}
        </Secao>

        <div className="flex gap-2">
          <Botao tom="forte" onClick={() => s.iniciar()}>
            Iniciar partida
          </Botao>
          <Botao onClick={s.resetar}>Limpar</Botao>
        </div>
      </div>
    </div>
  );
}
