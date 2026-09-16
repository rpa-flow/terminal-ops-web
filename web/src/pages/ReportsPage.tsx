import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import { AppNavigation } from "../components/AppNavigation";
import { useAuth } from "../hooks/useAuth";
import { getReportOverviewRequest } from "../services/reports.service";
import type { BlendBalanceItem, DailyReceivedWeightItem, DailySinterFeedWeightItem, DailyVolumeItem, PileBalanceItem, ReportBreakdownItem, ReportOverviewResponse } from "../types/api";

const formatInputDate = (date: Date): string => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

const getDefaultFilters = (terminal: "TBJC" | "TCS") => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: formatInputDate(startDate),
    endDate: formatInputDate(endDate),
    terminal
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
  const max = Math.max(...items.map((item) => area === "tbjc" ? item.receivedRecords : item.emittedNotes), 1);
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;
  const barWidth = Math.max(4, Math.min(14, step / 3));
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));

  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-on-surface">{area === "tcs" ? "Notas recebidas por dia" : "Registros recebidos por dia"}</h2>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant">
          {area === "tcs" && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Notas emitidas</span>}
          {area === "tbjc" && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" />Recebimentos</span>}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg className="min-w-[680px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução diária de registros">
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
            const value = area === "tbjc" ? item.receivedRecords : item.emittedNotes;
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

const DailyWeightChart = ({ items }: { items: DailyReceivedWeightItem[] }) => {
  const width = 760;
  const height = 260;
  const padding = 34;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const max = Math.max(...items.map((item) => item.totalWeight), 1);
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;
  const barWidth = Math.max(4, Math.min(14, step / 3));
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));

  return (
    <section className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
      <h2 className="text-base font-semibold text-on-surface">Quantidade recebida por dia</h2>
      <div className="mt-4 overflow-x-auto">
        <svg className="min-w-[680px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Quantidade recebida por dia">
          <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#c3c7cf" />
          <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#c3c7cf" />
          {[0, 0.5, 1].map((tick) => {
            const y = height - padding - tick * chartHeight;
            return <g key={tick}><line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5edff" /><text x={padding - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">{formatNumber(Math.round(max * tick))}</text></g>;
          })}
          {items.map((item, index) => {
            const x = padding + index * step + step / 2;
            const barHeight = (item.totalWeight / max) * chartHeight;
            return <g key={item.date}><rect x={x - barWidth / 2} y={height - padding - barHeight} width={barWidth} height={barHeight} rx="2" fill="#23a18e" />{index % labelEvery === 0 && <text x={x} y={height - 10} textAnchor="middle" className="fill-on-surface-variant text-[10px]">{formatDate(item.date)}</text>}</g>;
          })}
        </svg>
      </div>
    </section>
  );
};

const PileBalanceTable = ({ items }: { items: PileBalanceItem[] }) => {
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-surface-container-high bg-primary px-4 py-3 text-on-primary">
        <h2 className="text-center text-lg font-semibold uppercase tracking-wide">Saldo atualizado por pilha</h2>
        <p className="mt-1 text-center text-xs text-on-primary/75">Recebimentos e embarques no período selecionado</p>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-on-surface-variant">Nenhum recebimento com peso e pilha no período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-on-surface-variant">
              <tr><th className="px-4 py-3">Pilha</th><th className="px-4 py-3 text-right">Recebido</th><th className="px-4 py-3 text-right">Embarcado</th><th className="px-4 py-3 text-right">Saldo atual</th></tr>
            </thead>
            <tbody>
              {items.map((item) => <tr key={item.pile} className="border-t border-surface-container-high"><td className="px-4 py-3 font-medium">{item.pile}</td><td className="px-4 py-3 text-right text-on-secondary-container">{formatNumber(item.received)}</td><td className="px-4 py-3 text-right text-error">{formatNumber(item.shipped)}</td><td className="px-4 py-3 text-right font-semibold text-primary">{formatNumber(item.balance)}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const SinterFeedDailyChart = ({ items, codes }: { items: DailySinterFeedWeightItem[]; codes: string[] }) => {
  const width = 760;
  const height = 260;
  const padding = 34;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  const max = Math.max(...items.map((item) => item.totalWeight), 1);
  const step = items.length > 1 ? chartWidth / items.length : chartWidth;
  const barWidth = Math.max(4, Math.min(18, step / 2));
  const labelEvery = Math.max(1, Math.ceil(items.length / 6));
  const colors = ["#23a18e", "#2b3a7e", "#b34b00", "#7357c7", "#926f00", "#a43d75"];
  return <section className="rounded border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-semibold text-on-surface">Quantidade recebida por dia e Sinter Feed</h2><p className="text-sm text-on-surface-variant">Toneladas classificadas</p></div><div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-on-surface-variant">{codes.map((code, index) => <span className="flex items-center gap-1" key={code}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />SF {code}</span>)}</div></div><div className="mt-4 overflow-x-auto"><svg className="min-w-[680px]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Quantidade recebida por dia e Sinter Feed">{[0, 0.5, 1].map((tick) => { const y = height - padding - tick * chartHeight; return <g key={tick}><line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5edff" /><text x={padding - 8} y={y + 4} textAnchor="end" className="fill-outline text-[10px]">{formatNumber(Math.round(max * tick))}</text></g>; })}{items.map((item, index) => { const x = padding + index * step + step / 2; let offset = 0; return <g key={item.date}>{item.weights.map((weight, weightIndex) => { const valueHeight = (weight.totalWeight / max) * chartHeight; const y = height - padding - offset - valueHeight; offset += valueHeight; return <rect key={weight.code} x={x - barWidth / 2} y={y} width={barWidth} height={valueHeight} fill={colors[weightIndex % colors.length]} />; })}{index % labelEvery === 0 && <text x={x} y={height - 10} textAnchor="middle" className="fill-on-surface-variant text-[10px]">{formatDate(item.date)}</text>}</g>; })}</svg></div></section>;
};

const DailySinterFeedTable = ({ items, codes, unclassifiedCount }: { items: DailySinterFeedWeightItem[]; codes: string[]; unclassifiedCount: number }) => (
  <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high px-4 py-3">
      <div><h2 className="text-base font-semibold text-on-surface">Quantidade recebida por Sinter Feed</h2><p className="text-sm text-on-surface-variant">Toneladas por dia no período selecionado</p></div>
      <span className="rounded bg-error-container px-2 py-1 text-sm text-on-error-container">Não classificados: {formatNumber(unclassifiedCount)}</span>
    </div>
    <div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="bg-surface text-on-surface-variant"><tr><th className="px-4 py-3 text-left">Data</th>{codes.map((code) => <th className="px-4 py-3" key={code}>SF {code}</th>)}<th className="px-4 py-3">Total</th></tr></thead><tbody>{items.map((item) => <tr className="border-t border-surface-container-high" key={item.date}><td className="px-4 py-3 text-left font-medium">{formatDate(item.date)}</td>{item.weights.map((weight) => <td className="px-4 py-3" key={weight.code}>{formatNumber(weight.totalWeight)}</td>)}<td className="px-4 py-3 font-semibold text-primary">{formatNumber(item.totalWeight)}</td></tr>)}</tbody></table></div>
  </section>
);

const BlendBalancePanel = ({ items }: { items: BlendBalanceItem[] }) => {
  const max = Math.max(...items.map((item) => Math.abs(item.balance)), 1);
  const totals = items.reduce((total, item) => ({ received: total.received + item.received, shipped: total.shipped + item.shipped, balance: total.balance + item.balance }), { received: 0, shipped: 0, balance: 0 });
  return (
    <section className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-surface-container-high bg-primary px-4 py-3 text-on-primary"><h2 className="text-center text-lg font-semibold uppercase tracking-wide">Saldo atualizado por Blend</h2><p className="mt-1 text-center text-xs text-on-primary/75">Recebido menos embarcado no período selecionado</p></div>
      {items.length === 0 ? <p className="p-6 text-center text-sm text-on-surface-variant">Nenhum Blend ativo cadastrado.</p> : <div className="grid gap-5 p-4 lg:grid-cols-2"><div className="grid content-start gap-3" role="img" aria-label="Gráfico de saldo por Blend">{items.map((item) => <div key={item.blend}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-medium">{item.blend}</span><span>{formatNumber(item.balance)} t</span></div><div className="h-5 overflow-hidden rounded bg-surface-container"><div className={`h-full rounded ${item.balance < 0 ? "bg-error" : "bg-secondary"}`} style={{ width: `${Math.max(2, (Math.abs(item.balance) / max) * 100)}%` }} /></div></div>)}</div><div className="overflow-x-auto"><table className="min-w-full text-right text-sm"><thead className="bg-surface text-on-surface-variant"><tr><th className="px-3 py-2 text-left">Blend</th><th className="px-3 py-2">Recebido</th><th className="px-3 py-2">Embarcado</th><th className="px-3 py-2">Saldo</th></tr></thead><tbody>{items.map((item) => <tr className="border-t border-surface-container-high" key={item.blend}><td className="px-3 py-2 text-left font-medium">{item.blend}</td><td className="px-3 py-2">{formatNumber(item.received)}</td><td className="px-3 py-2 text-error">{formatNumber(item.shipped)}</td><td className={`px-3 py-2 font-semibold ${item.balance < 0 ? "text-error" : "text-primary"}`}>{formatNumber(item.balance)}</td></tr>)}<tr className="border-t-2 border-primary bg-surface"><td className="px-3 py-2 text-left font-semibold">Total</td><td className="px-3 py-2 font-semibold">{formatNumber(totals.received)}</td><td className="px-3 py-2 font-semibold text-error">{formatNumber(totals.shipped)}</td><td className={`px-3 py-2 font-semibold ${totals.balance < 0 ? "text-error" : "text-primary"}`}>{formatNumber(totals.balance)}</td></tr></tbody></table></div></div>}
    </section>
  );
};

export const ReportsPage = () => {
  const { area } = useParams();
  const { token, user, logout } = useAuth();
  const reportArea = area === "tcs" ? "tcs" : "tbjc";
  const defaults = useMemo(() => getDefaultFilters(reportArea.toUpperCase() as "TBJC" | "TCS"), [reportArea]);
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
            readOnly
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
                  <MetricCard label="Recebimentos registrados" value={formatNumber(report.summary.receivedRecords)} accent="text-on-secondary-container" />
                  <MetricCard label="Volume recebido" value={formatNumber(report.summary.receivedMaterialWeight)} accent="text-on-secondary-container" />
                  <MetricCard label="Volume embarcado" value={formatNumber(report.summary.shippedMaterialWeight)} accent="text-error" />
                  <MetricCard label="Saldo disponível" value={formatNumber(report.summary.availableMaterialWeight)} accent="text-primary" />
                  <MetricCard label="Não classificados" value={formatNumber(report.unclassifiedReceivedCount)} accent="text-error" />
                </>
              ) : (
                <>
                  <MetricCard label="Notas emitidas Bemisa" value={formatNumber(report.summary.emittedNotes)} accent="text-primary" />
                  <MetricCard label="Material recebido" value={formatNumber(report.summary.receivedMaterialWeight)} accent="text-on-secondary-container" />
                  <MetricCard label="Material embarcado" value={formatNumber(report.summary.shippedMaterialWeight)} accent="text-error" />
                  <MetricCard label="Saldo atual" value={formatNumber(report.summary.availableMaterialWeight)} accent="text-primary" />
                  <MetricCard label="Notas pendentes" value={formatNumber(report.summary.pendingNotes)} accent="text-warning" />
                  <MetricCard label="Pendentes +24h" value={formatNumber(report.summary.pendingOver24h)} accent="text-error" />
                </>
              )}
            </section>

            <DailyVolumeChart items={report.dailyVolumes} area={area} />

            {isTbjc ? <SinterFeedDailyChart items={report.dailySinterFeedWeights} codes={report.sinterFeedCodes} /> : <DailyWeightChart items={report.dailyReceivedWeights} />}

            {isTbjc && <>
              <DailySinterFeedTable items={report.dailySinterFeedWeights} codes={report.sinterFeedCodes} unclassifiedCount={report.unclassifiedReceivedCount} />
              <BlendBalancePanel items={report.blendBalances} />
            </>}

            {!isTbjc && <PileBalanceTable items={report.pileBalances} />}

            <div className="grid gap-4">
              {isTbjc ? (
                <BreakdownBars title="Recebimentos por terminal" items={report.breakdowns.recordsByTerminal} tone="secondary" />
              ) : (
                <BreakdownBars title="Notas por terminal" items={report.breakdowns.notesByTerminal} tone="primary" />
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
