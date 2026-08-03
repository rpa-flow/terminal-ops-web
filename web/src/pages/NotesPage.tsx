import { useEffect, useState } from "react";

import { AppNavigation } from "../components/AppNavigation";
import { useAuth } from "../hooks/useAuth";
import { listNotesRequest } from "../services/notes.service";
import type { NoteItem } from "../types/api";

export const NotesPage = () => {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState<NoteItem[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPending = async (nextPage = page) => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await listNotesRequest(token, nextPage, perPage);
      setItems(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch {
      setError("Não foi possível carregar as notas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending(1);
  }, []);

  return (
    <main className="app-with-sidebar min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <AppNavigation current="notes" />
            <div>
              <h1 className="text-[22px] font-medium text-on-surface">Painel de Notas RPA</h1>
              <p className="text-sm text-on-surface-variant">Operador: {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-muted" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
        <div className="rounded border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-medium">Total de notas: {total}</span>
              <p className="mt-1 text-xs">Todas as notas recebidas pelo aplicativo.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-muted"
                onClick={() => void loadPending(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
              >
                Anterior
              </button>
              <span className="rounded-lg bg-surface-container-low px-2 py-1 text-on-surface-variant">Página {page}</span>
              <button
                className="btn-muted"
                onClick={() => void loadPending(page + 1)}
                disabled={loading || items.length < perPage}
              >
                Próxima
              </button>
            </div>
          </div>
        </div>

        {error && <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-lowest shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-left text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Terminal</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Colaborador</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Pátio</th>
                <th className="px-4 py-3">Recebimento</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-surface-container-high">
                  <td className="whitespace-nowrap px-4 py-3">{item.dataHora ? new Date(item.dataHora).toLocaleString("pt-BR") : "-"}</td>
                  <td className="px-4 py-3">{item.numero ?? "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.codigo}</td>
                  <td className="px-4 py-3">{item.terminal}</td>
                  <td className="px-4 py-3">{item.emitenteCnpj ?? "-"}</td>
                  <td className="px-4 py-3">{item.emitenteFornecedor ?? "-"}</td>
                  <td className="px-4 py-3">{item.placa ?? "-"}</td>
                  <td className="px-4 py-3">{item.recebimentoColaborador ?? "-"}</td>
                  <td className="px-4 py-3">{item.recebimentoPeso ?? "-"}</td>
                  <td className="px-4 py-3">{item.recebimentoPatioDescarga ?? "-"}</td>
                  <td className="px-4 py-3">{item.recebimentoData ?? "-"}</td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td className="px-4 py-4 text-on-surface-variant" colSpan={11}>
                    Nenhuma nota encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};
