import { useCallback, useEffect, useMemo, useState } from "react";

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
const formatPercent = (value: number): string => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const formatDate = (value: string): string => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const MetricCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
  </article>
);

const BreakdownBars = ({ title, items, tone }: { title: string; items: ReportBreakdownItem[]; tone: "sky" | "emerald" }) => {
  const max = Math.max(...items.map((item) => item.total), 1);
  const barColor = tone === "sky" ? "bg-sky-600" : "bg-emerald-600";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.length === 0 && <p className="text-sm text-slate-500">Sem dados no periodo.</p>}
        {items.map((item) => (
          <div key={item.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{formatNumber(item.total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(4, (item.total / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const DailyVolumeChart = ({ items }: { items: DailyVolumeItem[] }) => {
  const width = 760;
  const height = 260;
  const padding = 34;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const max = Math.max(...items.flatMap((item) => [item.emittedNotes, item.weighedRecords]), 1);
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;
  const barWidth = Math.max(4, Math.min(14, step / 3));
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Evolucao diaria</h2>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-600" />Notas emitidas</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Pesagens</span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg className="min-w-[680px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolucao diaria de notas e pesagens">
          <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#cbd5e1" />
          <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#cbd5e1" />
          {[0, 0.5, 1].map((tick) => {
            const y = height - padding - tick * chartHeight;
            return (
              <g key={tick}>
                <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" />
                <text x={padding - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                  {Math.round(max * tick)}
                </text>
              </g>
            );
          })}
          {items.map((item, index) => {
            const x = padding + index * step + step / 2;
            const emittedHeight = (item.emittedNotes / max) * chartHeight;
            const weighedHeight = (item.weighedRecords / max) * chartHeight;
            const baseline = height - padding;

            return (
              <g key={item.date}>
                <rect x={x - barWidth - 1} y={baseline - emittedHeight} width={barWidth} height={emittedHeight} rx="2" fill="#0284c7" />
                <rect x={x + 1} y={baseline - weighedHeight} width={barWidth} height={weighedHeight} rx="2" fill="#059669" />
                {index % labelEvery === 0 && (
                  <text x={x} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[10px]">
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

const ReconciliationPanel = ({ report }: { report: ReportOverviewResponse }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="text-base font-semibold text-slate-900">Conciliação Bemisa x pesagem</h2>
    <div className="mt-4 grid gap-4">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Notas com pesagem encontrada</span>
          <span className="text-slate-500">{formatPercent(report.summary.reconciliationRate)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-600" style={{ width: `${report.summary.reconciliationRate}%` }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Cobertura pesagens/notas</span>
          <span className="text-slate-500">{formatPercent(report.summary.weighingCoverageRate)}</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, report.summary.weighingCoverageRate)}%` }} />
        </div>
      </div>
      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <span>Conciliadas: <strong className="text-slate-900">{formatNumber(report.summary.matchedNotes)}</strong></span>
        <span>Duplicidade NF: <strong className="text-slate-900">{formatNumber(report.summary.duplicateNotaGroups)}</strong></span>
        <span>Duplicidade pesagem: <strong className="text-slate-900">{formatNumber(report.summary.duplicatePesagemGroups)}</strong></span>
      </div>
    </div>
  </section>
);

export const ReportsPage = () => {
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Relatórios operacionais</h1>
            <p className="text-sm text-slate-500">Operador: {user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppNavigation current="reports" />
            <button className="btn-muted" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1.2fr_auto_auto]">
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

        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {report && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Notas emitidas Bemisa" value={formatNumber(report.summary.emittedNotes)} accent="text-sky-700" />
              <MetricCard label="Pesagens lançadas" value={formatNumber(report.summary.weighedRecords)} accent="text-emerald-700" />
              <MetricCard label="Notas pendentes" value={formatNumber(report.summary.pendingNotes)} accent="text-amber-700" />
              <MetricCard label="Pendentes +24h" value={formatNumber(report.summary.pendingOver24h)} accent="text-rose-700" />
              <MetricCard label="Taxa de conciliação" value={formatPercent(report.summary.reconciliationRate)} accent="text-slate-900" />
              <MetricCard label="Tempo médio" value={report.summary.averageReconciliationHours === null ? "-" : `${report.summary.averageReconciliationHours}h`} accent="text-slate-900" />
              <MetricCard label="Sem ID pesagem" value={formatNumber(report.summary.recordsWithoutPesagemId)} accent="text-slate-900" />
              <MetricCard label="Inconsistências" value={formatNumber(report.summary.duplicateNotaGroups + report.summary.duplicatePesagemGroups)} accent="text-slate-900" />
            </section>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
              <DailyVolumeChart items={report.dailyVolumes} />
              <ReconciliationPanel report={report} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownBars title="Notas por status" items={report.breakdowns.notesByStatus} tone="sky" />
              <BreakdownBars title="Pesagens por status" items={report.breakdowns.recordsByStatus} tone="emerald" />
              <BreakdownBars title="Notas por terminal" items={report.breakdowns.notesByTerminal} tone="sky" />
              <BreakdownBars title="Pesagens por terminal" items={report.breakdowns.recordsByTerminal} tone="emerald" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <h2 className="text-base font-semibold text-slate-900">Notas pendentes mais antigas</h2>
                <span className="text-sm text-slate-500">{formatNumber(report.pendingOldest.length)} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
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
                      <tr key={note.codigo} className="border-t border-slate-100">
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
                        <td className="px-4 py-4 text-slate-500" colSpan={6}>Nenhuma pendencia no periodo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
};
