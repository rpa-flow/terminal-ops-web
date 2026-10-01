import type { RecordFilters } from "../types/api";
import { BrazilianDateInput } from "./BrazilianDateInput";

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
    <section className="grid gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:grid-cols-3 lg:grid-cols-6">
      <BrazilianDateInput label="Data inicial" className="input" value={filters.startDate ?? ""} onChange={(value) => set("startDate", value)} />
      <BrazilianDateInput label="Data final" className="input" value={filters.endDate ?? ""} onChange={(value) => set("endDate", value)} />
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
