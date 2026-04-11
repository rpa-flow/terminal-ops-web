import { useEffect, useState } from "react";

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
      setError("Nao foi possivel carregar os registros.");
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
            <button className="btn-muted" onClick={() => setShowCsvModal(true)}>
              Importar CSV
            </button>
            <button className="btn-muted" onClick={logout}>Sair</button>
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

        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Total: {total}</span>
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
            <span>Pagina {filters.page}</span>
            <button
              className="btn-muted"
              onClick={() => {
                const next = { ...filters, page: filters.page + 1 };
                setFilters(next);
                void loadRecords(next);
              }}
              disabled={loading || items.length < filters.perPage}
            >
              Proxima
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
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

