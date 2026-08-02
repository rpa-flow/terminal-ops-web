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
    <main className="app-with-sidebar min-h-screen bg-surface">
      <header className="border-b border-primary-container bg-surface-container-lowest/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <AppNavigation current="notes" />
            <div>
              <h1 className="text-[22px] font-medium text-primary">Gestão de Notas (somente visualização)</h1>
              <p className="text-sm text-on-surface-variant">Operador: {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-muted" onClick={logout}>Sair</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        <article className="rounded border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-on-surface">Notas pendentes</h2>
            <span className="text-sm text-on-surface-variant">Total pendente: {total}</span>
          </div>

          <p className="mb-3 text-sm text-on-surface-variant">
            Esta tela e apenas de consulta. Insercao e atualizacao de status devem ser feitas via API.
          </p>

          {error && <p className="mb-3 text-sm text-error">{error}</p>}

          <div className="overflow-auto rounded-lg border border-outline-variant">
            <table className="min-w-full text-sm">
              <thead className="bg-surface text-left text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2">Codigo</th>
                  <th className="px-3 py-2">Terminal</th>
                  <th className="px-3 py-2">Placa</th>
                  <th className="px-3 py-2">Motorista</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Inserido em</th>
                  <th className="px-3 py-2">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-surface-container-high">
                    <td className="px-3 py-2 font-mono text-xs">{item.codigo}</td>
                    <td className="px-3 py-2">{item.terminal}</td>
                    <td className="px-3 py-2">{item.placa ?? "-"}</td>
                    <td className="px-3 py-2">{item.motoristaNome ?? "-"}</td>
                    <td className="px-3 py-2">{item.motoristaTelefone ?? "-"}</td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{new Date(item.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
                {items.length === 0 && !loading && (
                  <tr>
                    <td className="px-3 py-4 text-on-surface-variant" colSpan={8}>
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
            <span className="text-sm text-on-surface-variant">Pagina {page}</span>
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
