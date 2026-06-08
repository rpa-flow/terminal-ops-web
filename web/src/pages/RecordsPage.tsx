import { useEffect, useState } from "react";
import { HeaderLinkButton } from "../components/AppHeader";
import { AppNavigation } from "../components/AppNavigation";
import { CsvUploadModal } from "../components/CsvUploadModal";
import { FiltersBar } from "../components/FiltersBar";
import { RecordsTable } from "../components/RecordsTable";
import { useAuth } from "../hooks/useAuth";
import { listRecordsRequest } from "../services/records.service";
import type { RecordFilters, RecordItem } from "../types/api";

const initialFilters: RecordFilters = {
  page: 1,
  perPage: 20,
};

export const RecordsPage = () => {
  const { token, user, logout } = useAuth();
  const [filters, setFilters] = useState<RecordFilters>(initialFilters);
  const [items, setItems] = useState<RecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const loadRecords = async (activeFilters: RecordFilters) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await listRecordsRequest(token, activeFilters);
      setItems(response.items);
      setTotal(response.total);
      setFilters((current) => ({ ...current, page: response.page, perPage: response.perPage }));
    } catch {
      setError("Não foi possível carregar os registros.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords(filters);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Painel de Registros RPA</h1>
            <p className="text-sm text-slate-500">Operador: {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <AppNavigation current="records" />
            <button className="btn-muted" onClick={() => setShowCsvModal(true)}>
              Importar CSV
            </button>
            <HeaderLinkButton to="/purchase-order-rules">Config. OC</HeaderLinkButton>
            <button className="btn-muted" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
        <FiltersBar
          filters={filters}
          onChange={setFilters}
          onApply={() => void loadRecords(filters)}
          onClear={() => {
            const next = { ...initialFilters };
            setFilters(next);
            void loadRecords(next);
          }}
        />

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-medium">Total de registros: {total}</span>
            <div className="flex items-center gap-2">
              <button
                className="btn-muted"
                onClick={() => {
                  const next = { ...filters, page: Math.max(1, filters.page - 1) };
                  setFilters(next);
                  void loadRecords(next);
                }}
                disabled={filters.page <= 1 || loading}
              >
                Anterior
              </button>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">Página {filters.page}</span>
              <button
                className="btn-muted"
                onClick={() => {
                  const next = { ...filters, page: filters.page + 1 };
                  setFilters(next);
                  void loadRecords(next);
                }}
                disabled={loading || items.length < filters.perPage}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <RecordsTable items={items} />
      </section>

      {showCsvModal && (
        <CsvUploadModal
          onClose={() => setShowCsvModal(false)}
          onSuccess={() => void loadRecords(initialFilters)}
        />
      )}
    </main>
  );
};
