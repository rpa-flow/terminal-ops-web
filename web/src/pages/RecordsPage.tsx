import { useCallback, useEffect, useState } from "react";
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
  const firstRecord = total === 0 ? 0 : (filters.page - 1) * filters.perPage + 1;
  const lastRecord = Math.min(filters.page * filters.perPage, total);

  const loadRecords = useCallback(async (activeFilters: RecordFilters) => {
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
  }, [token]);

  useEffect(() => {
    void loadRecords(initialFilters);
  }, [loadRecords]);

  return (
    <main className="app-with-sidebar min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <AppNavigation current="records" />
            <div>
              <h1 className="text-[22px] font-medium text-on-surface">Painel de Registros RPA</h1>
              <p className="text-sm text-on-surface-variant">Operador: {user?.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Ações da página">
            <button className="btn-muted" onClick={() => void loadRecords(filters)} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
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
          disabled={loading}
        />

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
            <p>{error}</p>
            <button className="btn-muted" onClick={() => void loadRecords(filters)} disabled={loading}>Tentar novamente</button>
          </div>
        )}
        <RecordsTable items={items} loading={loading} />

        <nav className="surface-card px-4 py-3 text-sm text-on-surface-variant" aria-label="Paginação dos registros">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-on-surface">{total === 0 ? "Nenhum registro" : `${firstRecord}–${lastRecord} de ${total} registros`}</p>
              <p className="mt-0.5 text-xs">Resultados por página: {filters.perPage}</p>
            </div>
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
              <span className="rounded-lg bg-surface-container-low px-3 py-1.5 text-on-surface-variant" aria-current="page">Página {filters.page}</span>
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
        </nav>
      </section>

      {showCsvModal && (
        <CsvUploadModal
          destination="TBJC"
          onClose={() => setShowCsvModal(false)}
          onSuccess={() => void loadRecords(initialFilters)}
        />
      )}
    </main>
  );
};
