import type { RecordFilters } from "../types/api";

type Props = {
  filters: RecordFilters;
  onChange: (filters: RecordFilters) => void;
  onApply: () => void;
  onClear: () => void;
};

export const FiltersBar = ({ filters, onChange, onApply, onClear }: Props) => {
  const set = (key: keyof RecordFilters, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <input className="input" type="datetime-local" value={filters.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
      <input className="input" type="datetime-local" value={filters.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} />
      <input className="input" placeholder="Status" value={filters.status ?? ""} onChange={(e) => set("status", e.target.value)} />
      <input className="input" placeholder="Motorista" value={filters.motorista ?? ""} onChange={(e) => set("motorista", e.target.value)} />
      <input className="input" placeholder="Placa" value={filters.placa ?? ""} onChange={(e) => set("placa", e.target.value.toUpperCase())} />
      <input className="input" placeholder="Terminal" value={filters.terminal ?? ""} onChange={(e) => set("terminal", e.target.value)} />
      <div className="col-span-full flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onApply}>Filtrar</button>
        <button className="btn-muted" onClick={onClear}>Limpar</button>
      </div>
    </section>
  );
};
