import { useEffect, useState } from "react";

import { AppNavigation } from "../components/AppNavigation";
import { useAuth } from "../hooks/useAuth";
import { listPendingNotesRequest } from "../services/notes.service";
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
      const response = await listPendingNotesRequest(token, nextPage, perPage);
      setItems(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch {
      setError("Nao foi possivel carregar as notas pendentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending(1);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50">
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-indigo-900">Gestao de Notas (somente visualizacao)</h1>
            <p className="text-sm text-slate-600">Operador: {user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <AppNavigation current="notes" />
            <button className="btn-muted" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Notas pendentes</h2>
            <span className="text-sm text-slate-600">Total pendente: {total}</span>
          </div>

          <p className="mb-3 text-sm text-slate-500">
            Esta tela e apenas de consulta. Insercao e atualizacao de status devem ser feitas via API.
          </p>

          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Codigo</th>
                  <th className="px-3 py-2">Terminal</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Inserido em</th>
                  <th className="px-3 py-2">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{item.codigo}</td>
                    <td className="px-3 py-2">{item.terminal}</td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      Nenhuma nota pendente encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              className="btn-muted"
              onClick={() => void loadPending(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
            >
              Anterior
            </button>
            <span className="text-sm text-slate-600">Pagina {page}</span>
            <button
              className="btn-muted"
              onClick={() => void loadPending(page + 1)}
              disabled={loading || items.length < perPage}
            >
              Proxima
            </button>
          </div>
        </article>
      </section>
    </main>
  );
};
