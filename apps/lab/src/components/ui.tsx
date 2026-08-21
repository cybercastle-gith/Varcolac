import type { ReactNode } from 'react';

/**
 * Peças cruas de interface. O laboratório não precisa ser bonito — precisa
 * mostrar tudo, e mostrar rápido. Tailwind direto, sem sistema de design.
 */

export function Secao({ titulo, children, acao }: {
  titulo: string;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <section className="mb-6">
      <header className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{titulo}</h2>
        {acao}
      </header>
      {children}
    </section>
  );
}

export function Botao({ children, onClick, disabled, tom = 'normal' }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tom?: 'normal' | 'forte' | 'perigo';
}) {
  const cores =
    tom === 'forte'
      ? 'bg-amber-700 hover:bg-amber-600 text-neutral-100'
      : tom === 'perigo'
        ? 'bg-red-900 hover:bg-red-800 text-neutral-100'
        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded text-xs ${cores} disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1">
      <span className="text-neutral-400 text-xs">{rotulo}</span>
      {children}
    </label>
  );
}

export function Select<T extends string>({ value, onChange, options }: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs min-w-[10rem]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Interruptor({ ligado, onChange }: {
  ligado: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={ligado}
      onChange={(e) => onChange(e.target.checked)}
      className="accent-amber-600 w-4 h-4"
    />
  );
}

export function Etiqueta({ children, tom = 'neutro' }: {
  children: ReactNode;
  tom?: 'neutro' | 'vila' | 'lobos' | 'solitario' | 'morto' | 'alerta';
}) {
  const cores = {
    neutro: 'bg-neutral-800 text-neutral-400',
    vila: 'bg-emerald-950 text-emerald-400',
    lobos: 'bg-red-950 text-red-400',
    solitario: 'bg-amber-950 text-amber-400',
    morto: 'bg-neutral-900 text-neutral-600',
    alerta: 'bg-amber-900 text-amber-200',
  }[tom];
  return <span className={`px-1.5 py-0.5 rounded text-[10px] ${cores}`}>{children}</span>;
}

/** Barra do índice de equilíbrio: centro marcado, extremos em vermelho. */
export function BarraDeEquilibrio({ ie, min, max }: { ie: number; min: number; max: number }) {
  // −10..+10 cobre a faixa útil; fora disso o baralho já está condenado.
  const pos = Math.max(0, Math.min(100, ((ie + 10) / 20) * 100));
  const dentro = ie >= min && ie <= max;
  return (
    <div className="relative h-6 bg-neutral-900 rounded border border-neutral-800">
      <div
        className="absolute inset-y-0 bg-neutral-800/60"
        style={{ left: `${((min + 10) / 20) * 100}%`, right: `${100 - ((max + 10) / 20) * 100}%` }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px bg-neutral-600" />
      <div
        className={`absolute top-1 bottom-1 w-1 rounded ${dentro ? 'bg-emerald-500' : 'bg-red-600'}`}
        style={{ left: `calc(${pos}% - 2px)` }}
      />
    </div>
  );
}
