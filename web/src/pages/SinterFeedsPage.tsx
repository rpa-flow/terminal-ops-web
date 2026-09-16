import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "../components/AppHeader";
import { ConfigurationNavigation } from "../components/ConfigurationNavigation";
import { useAuth } from "../hooks/useAuth";
import { createBlendRequest, createIssuerSinterFeedMappingRequest, createSinterFeedRequest, deactivateIssuerSinterFeedMappingRequest, listBlendsRequest, listIssuerSinterFeedMappingsRequest, listIssuersRequest, listSinterFeedsRequest, updateBlendRequest, updateSinterFeedRequest, type Blend, type Issuer, type IssuerSinterFeedMapping, type SinterFeed } from "../services/sinter-feeds.service";

type CatalogForm = { code: string; description: string };
type MappingForm = { issuerId: string; sinterFeedId: string; blendId: string; startsAt: string };
type CatalogEditing = { kind: "feed" | "blend"; item: SinterFeed | Blend };
const emptyCatalogForm: CatalogForm = { code: "", description: "" };
const emptyMappingForm: MappingForm = { issuerId: "", sinterFeedId: "", blendId: "", startsAt: "" };
const apiError = (error: unknown, fallback: string) => { if (!(error instanceof Error)) return fallback; try { return (JSON.parse(error.message) as { message?: string }).message ?? fallback; } catch { return fallback; } };
const formatCnpj = (cnpj: string) => cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));

export const SinterFeedsPage = () => {
  const { token, user, logout } = useAuth();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [feeds, setFeeds] = useState<SinterFeed[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [mappings, setMappings] = useState<IssuerSinterFeedMapping[]>([]);
  const [feedForm, setFeedForm] = useState<CatalogForm>(emptyCatalogForm);
  const [blendForm, setBlendForm] = useState<CatalogForm>(emptyCatalogForm);
  const [mappingForm, setMappingForm] = useState<MappingForm>(emptyMappingForm);
  const [catalogEditing, setCatalogEditing] = useState<CatalogEditing | null>(null);
  const [catalogDescription, setCatalogDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const [nextIssuers, nextFeeds, nextBlends, nextMappings] = await Promise.all([listIssuersRequest(token), listSinterFeedsRequest(token), listBlendsRequest(token), listIssuerSinterFeedMappingsRequest(token)]);
      setIssuers(nextIssuers); setFeeds(nextFeeds); setBlends(nextBlends); setMappings(nextMappings);
    } catch (cause) { setError(apiError(cause, "Não foi possível carregar as configurações.")); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const activeFeeds = useMemo(() => feeds.filter((item) => item.isActive), [feeds]);
  const activeBlends = useMemo(() => blends.filter((item) => item.isActive), [blends]);
  const run = async (action: () => Promise<void>) => { setSaving(true); setError(null); try { await action(); } catch (cause) { setError(apiError(cause, "Não foi possível salvar a configuração.")); } finally { setSaving(false); } };
  const submitFeed = (event: React.FormEvent) => { event.preventDefault(); if (!token || !feedForm.code.trim()) return; void run(async () => { await createSinterFeedRequest(token, { code: feedForm.code.trim(), description: feedForm.description.trim() || null }); setFeedForm(emptyCatalogForm); await load(); }); };
  const submitBlend = (event: React.FormEvent) => { event.preventDefault(); if (!token || !blendForm.code.trim()) return; void run(async () => { await createBlendRequest(token, { code: blendForm.code.trim(), description: blendForm.description.trim() || null }); setBlendForm(emptyCatalogForm); await load(); }); };
  const submitMapping = (event: React.FormEvent) => { event.preventDefault(); if (!token || !mappingForm.issuerId || !mappingForm.sinterFeedId || !mappingForm.blendId) return; void run(async () => { await createIssuerSinterFeedMappingRequest(token, { ...mappingForm, startsAt: mappingForm.startsAt || undefined }); setMappingForm(emptyMappingForm); await load(); }); };
  const toggleFeed = (item: SinterFeed) => { if (token) void run(async () => { await updateSinterFeedRequest(token, item.id, { description: item.description, isActive: !item.isActive }); await load(); }); };
  const toggleBlend = (item: Blend) => { if (token) void run(async () => { await updateBlendRequest(token, item.id, { description: item.description, isActive: !item.isActive }); await load(); }); };
  const deactivateMapping = (item: IssuerSinterFeedMapping) => { if (token) void run(async () => { await deactivateIssuerSinterFeedMappingRequest(token, item.id); await load(); }); };
  const openCatalogEditor = (kind: CatalogEditing["kind"], item: SinterFeed | Blend) => { setCatalogEditing({ kind, item }); setCatalogDescription(item.description ?? ""); };
  const saveCatalogDescription = () => {
    if (!token || !catalogEditing) return;
    void run(async () => {
      const description = catalogDescription.trim() || null;
      if (catalogEditing.kind === "feed") await updateSinterFeedRequest(token, catalogEditing.item.id, { description, isActive: catalogEditing.item.isActive });
      else await updateBlendRequest(token, catalogEditing.item.id, { description, isActive: catalogEditing.item.isActive });
      setCatalogEditing(null);
      await load();
    });
  };

  return <main className="min-h-screen bg-surface">
    <AppHeader title="Sinter Feed e blends" subtitle={`Classifique novos carregamentos por emitente e vigência · Operador: ${user?.email ?? ""}`} actions={<><ConfigurationNavigation /><button className="btn-muted" onClick={logout}>Sair</button></>} />
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
      <section className="border-l-4 border-secondary bg-surface-container-low p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Fluxo de configuração</p><p className="mt-1 text-sm text-on-surface-variant">Cadastre os códigos, crie a relação emitente + feed + blend e encerre a relação anterior antes de alterar a classificação. O histórico dos carregamentos permanece preservado.</p></section>
      {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      <section className="grid gap-5 lg:grid-cols-2"><CatalogPanel title="Sinter Feeds" hint="Identificadores recebidos no carregamento" form={feedForm} setForm={setFeedForm} items={feeds} onSubmit={submitFeed} onEdit={(item) => openCatalogEditor("feed", item)} onToggle={toggleFeed} saving={saving} /><CatalogPanel title="Blends" hint="Classificações reutilizáveis" form={blendForm} setForm={setBlendForm} items={blends} onSubmit={submitBlend} onEdit={(item) => openCatalogEditor("blend", item)} onToggle={toggleBlend} saving={saving} /></section>
      <section className="surface-card p-5"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Vigência</p><h2 className="mt-1 text-xl font-semibold text-on-surface">Nova relação de classificação</h2><p className="mt-1 text-sm text-on-surface-variant">Cada emitente e Sinter Feed pode ter somente uma relação ativa no mesmo período.</p></div>{issuers.length === 0 ? <p className="mt-5 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">Ainda não há emitentes. Eles são criados automaticamente quando uma nota com chave válida é ingerida.</p> : <form className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={submitMapping}><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Emitente<select className="input" value={mappingForm.issuerId} onChange={(event) => setMappingForm({ ...mappingForm, issuerId: event.target.value })} required><option value="">Selecione</option>{issuers.map((item) => <option key={item.id} value={item.id}>{formatCnpj(item.cnpj)}{item.descricao ? ` — ${item.descricao}` : ""}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Sinter Feed<select className="input" value={mappingForm.sinterFeedId} onChange={(event) => setMappingForm({ ...mappingForm, sinterFeedId: event.target.value })} required disabled={activeFeeds.length === 0}><option value="">Selecione</option>{activeFeeds.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Blend<select className="input" value={mappingForm.blendId} onChange={(event) => setMappingForm({ ...mappingForm, blendId: event.target.value })} required disabled={activeBlends.length === 0}><option value="">Selecione</option>{activeBlends.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Início da vigência<input className="input" type="date" value={mappingForm.startsAt} onChange={(event) => setMappingForm({ ...mappingForm, startsAt: event.target.value })} /></label><div className="md:col-span-2 lg:col-span-4"><button className="btn-primary" type="submit" disabled={saving || activeFeeds.length === 0 || activeBlends.length === 0}>{saving ? "Salvando…" : "Criar relação"}</button></div></form>}</section>
      <section className="overflow-x-auto surface-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4"><div><h2 className="text-lg font-semibold">Relações cadastradas</h2><p className="text-sm text-on-surface-variant">Ativas e históricas, em ordem de criação.</p></div><button className="btn-muted" onClick={() => void load()} disabled={loading}>Atualizar</button></div><table className="min-w-full text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3">Emitente</th><th className="px-4 py-3">Feed</th><th className="px-4 py-3">Blend</th><th className="px-4 py-3">Vigência</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody>{!loading && mappings.map((item) => <tr key={item.id} className="border-t border-outline-variant/70"><td className="px-4 py-3"><p className="font-medium">{formatCnpj(item.issuer.cnpj)}</p><p className="text-xs text-on-surface-variant">{item.issuer.descricao ?? "Sem descrição"}</p></td><td className="px-4 py-3">{item.sinterFeed.code}</td><td className="px-4 py-3">{item.blend.code}</td><td className="px-4 py-3 text-on-surface-variant">{formatDate(item.startsAt)} — {item.endsAt ? formatDate(item.endsAt) : "em vigor"}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive && !item.endsAt ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"}`}>{item.isActive && !item.endsAt ? "Ativa" : "Encerrada"}</span></td><td className="px-4 py-3 text-right">{item.isActive && !item.endsAt && <button className="btn-muted" onClick={() => deactivateMapping(item)} disabled={saving}>Encerrar hoje</button>}</td></tr>)}{!loading && mappings.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Nenhuma relação cadastrada.</td></tr>}{loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Carregando relações…</td></tr>}</tbody></table></section>
    </section>
    {catalogEditing && <div className="fixed inset-0 z-40 grid place-items-center bg-primary/35 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title" className="w-full max-w-lg rounded-lg bg-surface-container-lowest p-5 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{catalogEditing.kind === "feed" ? "Sinter Feed" : "Blend"} · {catalogEditing.item.code}</p><h2 id="catalog-dialog-title" className="mt-1 text-xl font-semibold">Editar descrição</h2><label className="mt-4 grid gap-1 text-sm font-medium text-on-surface-variant" htmlFor="catalog-description">Descrição<input id="catalog-description" className="input" autoFocus value={catalogDescription} onChange={(event) => setCatalogDescription(event.target.value)} maxLength={255} /></label><div className="mt-5 flex flex-wrap justify-end gap-2"><button className="btn-muted" onClick={() => setCatalogEditing(null)} disabled={saving}>Cancelar</button><button className="btn-primary" onClick={saveCatalogDescription} disabled={saving}>{saving ? "Salvando…" : "Salvar descrição"}</button></div></section></div>}
  </main>;
};

type CatalogPanelProps<T extends SinterFeed | Blend> = { title: string; hint: string; form: CatalogForm; setForm: React.Dispatch<React.SetStateAction<CatalogForm>>; items: T[]; onSubmit: (event: React.FormEvent) => void; onEdit: (item: T) => void; onToggle: (item: T) => void; saving: boolean };
const CatalogPanel = <T extends SinterFeed | Blend>({ title, hint, form, setForm, items, onSubmit, onEdit, onToggle, saving }: CatalogPanelProps<T>) => <section className="surface-card p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Catálogo</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-on-surface-variant">{hint}</p><form className="mt-4 grid gap-3" onSubmit={onSubmit}><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Código<input className="input" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} maxLength={title === "Blends" ? 32 : 120} required /></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Descrição <span className="font-normal">(opcional)</span><input className="input" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={255} /></label><button className="btn-primary w-fit" type="submit" disabled={saving}>{saving ? "Salvando…" : `Adicionar ${title === "Blends" ? "blend" : "feed"}`}</button></form><ul className="mt-5 divide-y divide-outline-variant/70 border-y border-outline-variant/70">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium text-on-surface">{item.code}</p><p className="text-sm text-on-surface-variant">{item.description || "Sem descrição"}</p></div><div className="flex gap-2"><button className="btn-muted" onClick={() => onEdit(item)} disabled={saving}>Editar</button><button className="btn-muted" onClick={() => onToggle(item)} disabled={saving}>{item.isActive ? "Inativar" : "Ativar"}</button></div></li>)}{items.length === 0 && <li className="py-5 text-sm text-on-surface-variant">Nenhum item cadastrado.</li>}</ul></section>;
