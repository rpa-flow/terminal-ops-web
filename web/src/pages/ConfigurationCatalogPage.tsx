import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "../components/AppHeader";
import { ConfigurationNavigation } from "../components/ConfigurationNavigation";
import { useAuth } from "../hooks/useAuth";
import { createBlendRequest, createSinterFeedRequest, listBlendsRequest, listSinterFeedsRequest, updateBlendRequest, updateSinterFeedRequest, type Blend, type SinterFeed } from "../services/sinter-feeds.service";

type CatalogKind = "feed" | "blend";
type CatalogItem = SinterFeed | Blend;
type CatalogForm = { code: string; description: string };

const emptyForm: CatalogForm = { code: "", description: "" };
const details: Record<CatalogKind, { title: string; singular: string; hint: string; maxLength: number }> = {
  feed: { title: "Sinter Feed", singular: "Sinter Feed", hint: "Códigos recebidos no carregamento e usados para classificar fornecedores.", maxLength: 120 },
  blend: { title: "Blends", singular: "blend", hint: "Classificações reutilizáveis para recebimentos e embarques.", maxLength: 32 }
};

const apiError = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  try { return (JSON.parse(error.message) as { message?: string }).message ?? fallback; } catch { return fallback; }
};

export const ConfigurationCatalogPage = ({ kind }: { kind: CatalogKind }) => {
  const { token, user, logout } = useAuth();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState<CatalogForm>(emptyForm);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const content = details[kind];

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try { setItems(kind === "feed" ? await listSinterFeedsRequest(token) : await listBlendsRequest(token)); }
    catch (cause) { setError(apiError(cause, `Não foi possível carregar ${content.title}.`)); }
    finally { setLoading(false); }
  }, [content.title, kind, token]);

  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);
    try { await action(); }
    catch (cause) { setError(apiError(cause, "Não foi possível salvar a configuração.")); }
    finally { setSaving(false); }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !form.code.trim()) return;
    void run(async () => {
      const input = { code: form.code.trim(), description: form.description.trim() || null };
      if (kind === "feed") await createSinterFeedRequest(token, input);
      else await createBlendRequest(token, input);
      setForm(emptyForm);
      await load();
    });
  };

  const toggle = (item: CatalogItem) => {
    if (!token) return;
    void run(async () => {
      if (kind === "feed") await updateSinterFeedRequest(token, item.id, { description: item.description, isActive: !item.isActive });
      else await updateBlendRequest(token, item.id, { description: item.description, isActive: !item.isActive });
      await load();
    });
  };

  const saveDescription = () => {
    if (!token || !editing) return;
    void run(async () => {
      const input = { description: description.trim() || null, isActive: editing.isActive };
      if (kind === "feed") await updateSinterFeedRequest(token, editing.id, input);
      else await updateBlendRequest(token, editing.id, input);
      setEditing(null);
      await load();
    });
  };

  return <main className="min-h-screen bg-surface">
    <AppHeader title={content.title} subtitle={`${content.hint} · Operador: ${user?.email ?? ""}`} actions={<><ConfigurationNavigation /><button className="btn-muted" onClick={logout}>Sair</button></>} />
    <section className="mx-auto grid max-w-5xl gap-5 px-4 py-6">
      <section className="surface-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Catálogo</p>
        <h2 className="mt-1 text-xl font-semibold text-on-surface">Novo {content.singular}</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-medium text-on-surface-variant">Código<input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} maxLength={content.maxLength} required /></label>
          <label className="grid gap-1 text-sm font-medium text-on-surface-variant">Descrição <span className="font-normal">(opcional)</span><input className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={255} /></label>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : `Adicionar ${content.singular}`}</button>
        </form>
      </section>
      {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      <section className="overflow-hidden surface-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4"><div><h2 className="text-lg font-semibold">Itens cadastrados</h2><p className="text-sm text-on-surface-variant">Ative somente os itens disponíveis para novas classificações.</p></div><button className="btn-muted" onClick={() => void load()} disabled={loading}>Atualizar</button></div>
        <ul className="divide-y divide-outline-variant/70">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-medium text-on-surface">{item.code}</p><p className="text-sm text-on-surface-variant">{item.description || "Sem descrição"}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"}`}>{item.isActive ? "Ativo" : "Inativo"}</span><button className="btn-muted" onClick={() => { setEditing(item); setDescription(item.description ?? ""); }} disabled={saving}>Editar</button><button className="btn-muted" onClick={() => toggle(item)} disabled={saving}>{item.isActive ? "Inativar" : "Ativar"}</button></div></li>)}{!loading && items.length === 0 && <li className="px-5 py-10 text-center text-sm text-on-surface-variant">Nenhum item cadastrado.</li>}{loading && <li className="px-5 py-10 text-center text-sm text-on-surface-variant">Carregando…</li>}</ul>
      </section>
    </section>
    {editing && <div className="fixed inset-0 z-40 grid place-items-center bg-primary/35 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title" className="w-full max-w-lg rounded-lg bg-surface-container-lowest p-5 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{content.title} · {editing.code}</p><h2 id="catalog-dialog-title" className="mt-1 text-xl font-semibold">Editar descrição</h2><label className="mt-4 grid gap-1 text-sm font-medium text-on-surface-variant" htmlFor="catalog-description">Descrição<input id="catalog-description" className="input" autoFocus value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} /></label><div className="mt-5 flex flex-wrap justify-end gap-2"><button className="btn-muted" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button><button className="btn-primary" onClick={saveDescription} disabled={saving}>{saving ? "Salvando…" : "Salvar descrição"}</button></div></section></div>}
  </main>;
};
