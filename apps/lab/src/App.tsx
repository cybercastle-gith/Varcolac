import { useState } from 'react';
import { SetupPanel } from './panels/SetupPanel.js';
import { StatePanel } from './panels/StatePanel.js';
import { ResolutionPanel } from './panels/ResolutionPanel.js';
import { ScenarioPanel } from './panels/ScenarioPanel.js';
import { SimulationPanel } from './panels/SimulationPanel.js';
import { WeightPanel } from './panels/WeightPanel.js';

const ABAS = {
  setup: { titulo: 'Setup', Painel: SetupPanel },
  estado: { titulo: 'Estado', Painel: StatePanel },
  resolucao: { titulo: 'Resolução', Painel: ResolutionPanel },
  cenario: { titulo: 'Cenário', Painel: ScenarioPanel },
  simulacao: { titulo: 'Simulação', Painel: SimulationPanel },
  pesos: { titulo: 'Pesos', Painel: WeightPanel },
} as const;

type AbaId = keyof typeof ABAS;

export function App() {
  const [aba, setAba] = useState<AbaId>('setup');
  const { Painel } = ABAS[aba];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-mono text-sm">
      <nav className="flex gap-1 border-b border-neutral-800 px-3 py-2">
        {(Object.keys(ABAS) as AbaId[]).map((id) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-3 py-1 rounded ${
              aba === id ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-900'
            }`}
          >
            {ABAS[id].titulo}
          </button>
        ))}
      </nav>
      <main className="p-4">
        <Painel />
      </main>
    </div>
  );
}
