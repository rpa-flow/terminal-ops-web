import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfigurationPageHeader } from "../components/ConfigurationPageHeader";
import { useAuth } from "../hooks/useAuth";
import { listIssuersRequest, updateIssuerRequest, type Issuer } from "../services/sinter-feeds.service";

const apiError = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(error.message) as { message?: string };
    return parsed.message ?? fallback;
  } catch {
    return fallback;
  }
};

const formatCnpj = (cnpj: string) => cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

export const IssuersPage = () => {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState<Issuer[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Issuer | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await listIssuersRequest(token));
    } catch (cause) {
      setError(apiError(cause, "Não foi possível carregar os fornecedores."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return items;
    return items.filter((item) => `${item.cnpj} ${item.descricao ?? ""}`.toLocaleLowerCase("pt-BR").includes(normalized));
  }, [items, query]);

  const beginEditing = (item: Issuer) => {
    setEditing(item);
    setDescription(item.descricao ?? "");
  };

  const save = async () => {
    if (!token || !editing) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateIssuerRequest(token, editing.id, description.trim() || null);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (cause) {
      setError(apiError(cause, "Não foi possível salvar a descrição do fornecedor."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="app-with-sidebar min-h-screen bg-surface">
      <ConfigurationPageHeader current="fornecedores" title="Fornecedores identificados" subtitle={`Fornecedores são incluídos automaticamente a partir das notas importadas. Você pode complementar a descrição operacional. · Operador: ${user?.email ?? ""}`} onLogout={logout} />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
        <section className="grid gap-4 border-l-4 border-secondary bg-surface-container-low p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Origem automatizada</p>
            <h2 className="mt-1 text-lg font-semibold text-on-surface">Confirme a identificação usada nas configurações.</h2>
            <p className="mt-1 text-sm text-on-surface-variant">O CNPJ vem da chave de acesso da nota. Apenas a descrição pode ser ajustada aqui; não há criação manual.</p>
          </div>
          <button className="btn-muted" onClick={() => void load()} disabled={loading}>Atualizar lista</button>
        </section>

        <label className="grid gap-1 text-sm font-medium text-on-surface-variant" htmlFor="issuer-search">
          Localizar fornecedor
          <input id="issuer-search" className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="CNPJ ou descrição" />
        </label>

        {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}

        <div className="overflow-x-auto surface-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3">CNPJ</th><th className="px-4 py-3">Descrição operacional</th><th className="px-4 py-3 text-right">Ação</th></tr></thead>
            <tbody>
              {!loading && filteredItems.map((item) => <tr key={item.id} className="border-t border-outline-variant/70"><td className="px-4 py-3 font-medium text-on-surface">{formatCnpj(item.cnpj)}</td><td className="px-4 py-3 text-on-surface-variant">{item.descricao || <span className="italic">Sem descrição</span>}</td><td className="px-4 py-3 text-right"><button className="btn-muted" onClick={() => beginEditing(item)}>Editar descrição</button></td></tr>)}
              {!loading && filteredItems.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-on-surface-variant">Nenhum fornecedor encontrado. Eles aparecem após uma ingestão com chave de nota válida.</td></tr>}
              {loading && <tr><td colSpan={3} className="px-4 py-10 text-center text-on-surface-variant">Carregando fornecedores…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editing && <div className="fixed inset-0 z-40 grid place-items-center bg-primary/35 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="issuer-dialog-title" className="w-full max-w-lg rounded-lg bg-surface-container-lowest p-5 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{formatCnpj(editing.cnpj)}</p><h2 id="issuer-dialog-title" className="mt-1 text-xl font-semibold">Descrição do fornecedor</h2><label className="mt-4 grid gap-1 text-sm font-medium text-on-surface-variant" htmlFor="issuer-description">Descrição<input id="issuer-description" className="input" autoFocus value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} /></label><div className="mt-5 flex flex-wrap justify-end gap-2"><button className="btn-muted" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button><button className="btn-primary" onClick={() => void save()} disabled={saving}>{saving ? "Salvando…" : "Salvar descrição"}</button></div></section></div>}
    </main>
  );
};
