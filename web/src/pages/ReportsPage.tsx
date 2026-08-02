import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { AppNavigation } from "../components/AppNavigation";
import { useAuth } from "../hooks/useAuth";
import { getReportOverviewRequest } from "../services/reports.service";
import type { DailyVolumeItem, ReportBreakdownItem, ReportOverviewResponse } from "../types/api";

const formatInputDate = (date: Date): string => date.toISOString().slice(0, 10);

const getDefaultFilters = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: formatInputDate(startDate),
    endDate: formatInputDate(endDate),
    terminal: ""
  };
};

const formatNumber = (value: number): string => new Intl.NumberFormat("pt-BR").format(value);
const formatDate = (value: string): string => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const MetricCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <article className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
    <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
  </article>
);

const BreakdownBars = ({ title, items, tone }: { title: string; items: ReportBreakdownItem[]; tone: "primary" | "secondary" }) => {
  const max = Math.max(...items.map((item) => item.total), 1);
  const barColor = tone === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.length === 0 && <p className="text-sm text-on-surface-variant">Sem dados no periodo.</p>}
        {items.map((item) => (
          <div key={item.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-on-surface-variant">{item.label}</span>
              <span className="text-on-surface-variant">{formatNumber(item.total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-low">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(4, (item.total / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DailyVolumeChart = ({ items, area }: { items: DailyVolumeItem[]; area: "tbjc" | "tcs" }) => {
  const width = 760;
  const height = 260;
  const padding = 34;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const max = Math.max(...items.map((item) => area === "tbjc" ? item.weighedRecords : item.emittedNotes), 1);
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;
  const barWidth = Math.max(4, Math.min(14, step / 3));
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));

  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-on-surface">Evolução diária</h2>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          {area === "tcs" && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Notas emitidas</span>}
          {area === "tbjc" && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" />Pesagens</span>}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg className="min-w-[680px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolucao diaria de notas e pesagens">
          <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#c3c7cf" />
          <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#c3c7cf" />
          {[0, 0.5, 1].map((tick) => {
            const y = height - padding - tick * chartHeight;
            return (
              <g key={tick}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5edff" />
                <text x={padding - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">
                  {Math.round(max * tick)}
                </text>
              </g>
            );
          })}
          {items.map((item, index) => {
            const x = padding + index * step + step / 2;
            const value = area === "tbjc" ? item.weighedRecords : item.emittedNotes;
            const barHeight = (value / max) * chartHeight;
            const baseline = height - padding;

            return (
              <g key={item.date}>
                <rect x={x - barWidth / 2} y={baseline - barHeight} width={barWidth} height={barHeight} rx="2" fill={area === "tbjc" ? "#23a18e" : "#2b3a7e"} />
                {index % labelEvery === 0 && (
                  <text x={x} y={height - 10} textAnchor="middle" className="fill-on-surface-variant text-[10px]">
                    {formatDate(item.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};

export const ReportsPage = () => {
  const { area } = useParams();
  const { token, user, logout } = useAuth();
  const defaults = useMemo(() => getDefaultFilters(), []);
  const [filters, setFilters] = useState(defaults);
  const [report, setReport] = useState<ReportOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (activeFilters: typeof filters) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getReportOverviewRequest(token, activeFilters);
      setReport(response);
    } catch {
      setError("Nao foi possivel carregar os relatorios.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReport(defaults);
  }, [defaults, loadReport]);

  if (area !== "tbjc" && area !== "tcs") {
    return <Navigate to="/relatorios/tbjc" replace />;
  }

  const isTbjc = area === "tbjc";
  const areaLabel = isTbjc ? "TBJC — Registros" : "TCS — Notas";

  return (
    <main className="app-with-sidebar min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <AppNavigation current="reports" reportArea={area} />
            <div>
              <h1 className="text-[22px] font-medium text-on-surface">Relatórios {areaLabel}</h1>
              <p className="text-sm text-on-surface-variant">Operador: {user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-muted" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
        <section className="grid gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:grid-cols-[1fr_1fr_1.2fr_auto_auto]">
          <input
            aria-label="Data inicial"
            className="input"
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
          />
          <input
            aria-label="Data final"
            className="input"
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
          />
          <input
            aria-label="Terminal"
            className="input"
            placeholder="Terminal"
            value={filters.terminal}
            onChange={(event) => setFilters((current) => ({ ...current, terminal: event.target.value }))}
          />
          <button className="btn-primary" onClick={() => void loadReport(filters)} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </button>
          <button
            className="btn-muted"
            onClick={() => {
              setFilters(defaults);
              void loadReport(defaults);
            }}
            disabled={loading}
          >
            Limpar
          </button>
        </section>

        {error && <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        {report && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isTbjc ? (
                <>
                  <MetricCard label="Pesagens lançadas" value={formatNumber(report.summary.weighedRecords)} accent="text-on-secondary-container" />
                  <MetricCard label="Sem ID pesagem" value={formatNumber(report.summary.recordsWithoutPesagemId)} accent="text-warning" />
                  <MetricCard label="Duplicidades de pesagem" value={formatNumber(report.summary.duplicatePesagemGroups)} accent="text-error" />
                </>
              ) : (
                <>
                  <MetricCard label="Notas emitidas Bemisa" value={formatNumber(report.summary.emittedNotes)} accent="text-primary" />
                  <MetricCard label="Notas pendentes" value={formatNumber(report.summary.pendingNotes)} accent="text-warning" />
                  <MetricCard label="Pendentes +24h" value={formatNumber(report.summary.pendingOver24h)} accent="text-error" />
                </>
              )}
            </section>

            <DailyVolumeChart items={report.dailyVolumes} area={area} />

            <div className="grid gap-4 lg:grid-cols-2">
              {isTbjc ? (
                <>
                  <BreakdownBars title="Pesagens por status" items={report.breakdowns.recordsByStatus} tone="secondary" />
                  <BreakdownBars title="Pesagens por terminal" items={report.breakdowns.recordsByTerminal} tone="secondary" />
                </>
              ) : (
                <>
                  <BreakdownBars title="Notas por status" items={report.breakdowns.notesByStatus} tone="primary" />
                  <BreakdownBars title="Notas por terminal" items={report.breakdowns.notesByTerminal} tone="primary" />
                </>
              )}
            </div>

            {!isTbjc && <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-surface-container-high px-4 py-3">
                <h2 className="text-base font-semibold text-on-surface">Notas pendentes mais antigas</h2>
                <span className="text-sm text-on-surface-variant">{formatNumber(report.pendingOldest.length)} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3">Codigo</th>
                      <th className="px-4 py-3">Terminal</th>
                      <th className="px-4 py-3">Placa</th>
                      <th className="px-4 py-3">Motorista</th>
                      <th className="px-4 py-3">Idade</th>
                      <th className="px-4 py-3">Criada em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.pendingOldest.map((note) => (
                      <tr key={note.codigo} className="border-t border-surface-container-high">
                        <td className="px-4 py-3 font-mono text-xs">{note.codigo}</td>
                        <td className="px-4 py-3">{note.terminal}</td>
                        <td className="px-4 py-3">{note.placa ?? "-"}</td>
                        <td className="px-4 py-3">{note.motoristaNome ?? "-"}</td>
                        <td className="px-4 py-3">{note.ageHours}h</td>
                        <td className="px-4 py-3">{new Date(note.createdAt).toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                    {report.pendingOldest.length === 0 && (
                      <tr>
                        <td className="px-4 py-4 text-on-surface-variant" colSpan={6}>Nenhuma pendencia no periodo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>}
          </>
        )}
      </section>
    </main>
  );
};
