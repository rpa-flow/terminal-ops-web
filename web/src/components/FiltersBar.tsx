import type { RecordFilters } from "../types/api";
import { BrazilianDateInput } from "./BrazilianDateInput";

type Props = {
  filters: RecordFilters;
  onChange: (filters: RecordFilters) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export const FiltersBar = ({ filters, onChange, onApply, onClear, disabled = false }: Props) => {
  const set = (key: keyof RecordFilters, value: string) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <section className="surface-card p-4 sm:p-5" aria-labelledby="records-filters-title">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id="records-filters-title" className="text-base font-semibold text-on-surface">Filtrar registros</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Refine a consulta por período, situação ou identificação operacional.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Data inicial
          <BrazilianDateInput label="Data inicial" className="input" value={filters.startDate ?? ""} onChange={(value) => set("startDate", value)} disabled={disabled} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Data final
          <BrazilianDateInput label="Data final" className="input" value={filters.endDate ?? ""} onChange={(value) => set("endDate", value)} disabled={disabled} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Status
          <input className="input" placeholder="Ex.: recebido" value={filters.status ?? ""} onChange={(e) => set("status", e.target.value)} disabled={disabled} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Motorista
          <input className="input" placeholder="Nome do motorista" value={filters.motorista ?? ""} onChange={(e) => set("motorista", e.target.value)} disabled={disabled} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Placa
          <input className="input" placeholder="ABC-1234" value={filters.placa ?? ""} onChange={(e) => set("placa", e.target.value.toUpperCase())} disabled={disabled} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-on-surface-variant">
          Terminal
          <input className="input" placeholder="Ex.: TBJC" value={filters.terminal ?? ""} onChange={(e) => set("terminal", e.target.value)} disabled={disabled} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-container-high pt-4">
        <button type="button" className="btn-primary" onClick={onApply} disabled={disabled}>{disabled ? "Filtrando..." : "Aplicar filtros"}</button>
        <button type="button" className="btn-muted" onClick={onClear} disabled={disabled}>Limpar</button>
      </div>
    </section>
  );
};
