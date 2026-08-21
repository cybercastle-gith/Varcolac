import { useState } from 'react';
import { ROLES, role, type RoleId } from '@jogo/engine';
import { useLabStore } from '../store/lab-store';
import { Botao, Etiqueta, Secao } from '../components/ui';

/**
 * Forçar cenários: atribuir roles à mão para reproduzir um caso específico sem
 * sortear até dar certo.
 *
 * O atalho que importa aqui é o segundo bloco: os conflitos documentados no
 * dossiê viram baralhos de um clique. Reproduzir "Padre × Feiticeiro" deixa de
 * ser paciência e vira um botão.
 */
const CENARIOS: readonly { nome: string; roleIds: RoleId[]; oQueTestar: string }[] = [
  {
    nome: 'Padre × Feiticeiro',
    roleIds: ['padre', 'feiticeiro', 'lobo', 'medico', 'vidente', 'aldeao'],
    oQueTestar: 'O Padre vence: ele cancela a noite inteira, o Feiticeiro só perfura o individual.',
  },
  {
    nome: 'Cadeia de estertores',
    roleIds: ['cacador', 'lobo-carnical', 'ancia', 'lobo', 'medico', 'aldeao'],
    oQueTestar: 'Caçador atira no Carniçal, que mata ao morrer, e a Anciã derruba a vila.',
  },
  {
    nome: 'Xerife prende o Médico',
    roleIds: ['xerife', 'medico', 'lobo', 'vidente', 'aldeao', 'cacador'],
    oQueTestar: 'Bloqueado não protege: a cura daquela noite é anulada.',
  },
  {
    nome: 'Preso é imune, mas perfurável',
    roleIds: ['xerife', 'feiticeiro', 'lobo', 'medico', 'vidente', 'aldeao'],
    oQueTestar: 'Quem o Xerife prende não morre — a não ser que o Feiticeiro perfure.',
  },
  {
    nome: 'Necromante e o tiro que já saiu',
    roleIds: ['necromante', 'cacador', 'lobo', 'medico', 'vidente', 'aldeao'],
    oQueTestar: 'Ressuscitar não desfaz estertor: se o Caçador atirou, o tiro vale.',
  },
  {
    nome: 'Amantes até o fim',
    roleIds: ['aldeao', 'vidente', 'lobo', 'medico', 'cacador', 'aldeao'],
    oQueTestar: 'Se os dois amantes forem os últimos vivos, eles vencem sozinhos.',
  },
  {
    nome: 'Roleta Russa',
    roleIds: ['lobo', 'bobo', 'bobo', 'bobo', 'bobo', 'bobo'],
    oQueTestar: 'Todos querem morrer; o lobo precisa impedir. O Bobo linchado encerra tudo.',
  },
];

export function ScenarioPanel() {
  const s = useLabStore();
  const [aplicado, setAplicado] = useState<string | null>(null);

  const aplicar = (nome: string, roleIds: RoleId[], amantes = false) => {
    s.setJogadores(roleIds.length);
    roleIds.forEach((id, i) => s.trocarRole(i, id));
    if (amantes) s.setConfig({});
    setAplicado(nome);
  };

  return (
    <div className="grid grid-cols-2 gap-8 max-w-6xl">
      <Secao titulo="Cenários dos conflitos documentados">
        <ul className="space-y-2">
          {CENARIOS.map((c) => (
            <li key={c.nome} className="border border-neutral-800 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{c.nome}</span>
                <Botao onClick={() => aplicar(c.nome, c.roleIds, c.nome === 'Amantes até o fim')}>
                  montar
                </Botao>
              </div>
              <p className="text-[11px] text-neutral-500">{c.oQueTestar}</p>
              <p className="text-[10px] text-neutral-700 mt-1">{c.roleIds.join(' · ')}</p>
            </li>
          ))}
        </ul>
        {aplicado && (
          <p className="text-xs text-emerald-400 mt-3">
            “{aplicado}” montado. Vá ao painel Resolução e avance etapa por etapa.
          </p>
        )}
      </Secao>

      <Secao titulo="Baralho atual — troque qualquer posição">
        <ul className="space-y-1">
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
                      {x.nome}
                    </option>
                  ))}
                </select>
                {r.variantes.length > 0 && (
                  <select
                    value={s.config.variantes[id] ?? ''}
                    onChange={(e) =>
                      s.setConfig({
                        variantes: { ...s.config.variantes, [id]: e.target.value },
                      })
                    }
                    className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[10px] w-32"
                  >
                    <option value="">base ({r.peso})</option>
                    {r.variantes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} ({v.peso})
                      </option>
                    ))}
                  </select>
                )}
                <Etiqueta tom={r.faccao === 'vila' ? 'vila' : r.faccao === 'lobos' ? 'lobos' : 'solitario'}>
                  {r.peso}
                </Etiqueta>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex gap-2">
          <Botao tom="forte" onClick={() => s.iniciar()}>Iniciar com este baralho</Botao>
        </div>
      </Secao>
    </div>
  );
}
