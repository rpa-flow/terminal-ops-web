import { useCallback, useEffect, useMemo, useState } from "react";

import { AppHeader } from "../components/AppHeader";
import { ConfigurationNavigation } from "../components/ConfigurationNavigation";
import { useAuth } from "../hooks/useAuth";
import { createIssuerSinterFeedMappingRequest, deactivateIssuerSinterFeedMappingRequest, listBlendsRequest, listIssuerSinterFeedMappingsRequest, listIssuersRequest, listSinterFeedsRequest, type Blend, type Issuer, type IssuerSinterFeedMapping, type SinterFeed } from "../services/sinter-feeds.service";

type MappingForm = { issuerId: string; sinterFeedId: string; blendId: string; startsAt: string };
const emptyForm: MappingForm = { issuerId: "", sinterFeedId: "", blendId: "", startsAt: "" };
const formatCnpj = (cnpj: string) => cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
const apiError = (error: unknown, fallback: string) => { if (!(error instanceof Error)) return fallback; try { return (JSON.parse(error.message) as { message?: string }).message ?? fallback; } catch { return fallback; } };

export const IssuerClassificationsPage = () => {
  const { token, user, logout } = useAuth();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [feeds, setFeeds] = useState<SinterFeed[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [mappings, setMappings] = useState<IssuerSinterFeedMapping[]>([]);
  const [form, setForm] = useState<MappingForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(null);
    try {
      const [nextIssuers, nextFeeds, nextBlends, nextMappings] = await Promise.all([listIssuersRequest(token), listSinterFeedsRequest(token), listBlendsRequest(token), listIssuerSinterFeedMappingsRequest(token)]);
      setIssuers(nextIssuers); setFeeds(nextFeeds); setBlends(nextBlends); setMappings(nextMappings);
    } catch (cause) { setError(apiError(cause, "Não foi possível carregar as classificações.")); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const activeFeeds = useMemo(() => feeds.filter((item) => item.isActive), [feeds]);
  const activeBlends = useMemo(() => blends.filter((item) => item.isActive), [blends]);
  const canCreate = issuers.length > 0 && activeFeeds.length > 0 && activeBlends.length > 0;

  const run = async (action: () => Promise<void>) => { setSaving(true); setError(null); try { await action(); } catch (cause) { setError(apiError(cause, "Não foi possível salvar a classificação.")); } finally { setSaving(false); } };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!token || !form.issuerId || !form.sinterFeedId || !form.blendId) return; void run(async () => { await createIssuerSinterFeedMappingRequest(token, { ...form, startsAt: form.startsAt || undefined }); setForm(emptyForm); setShowForm(false); await load(); }); };
  const deactivate = (item: IssuerSinterFeedMapping) => { if (token) void run(async () => { await deactivateIssuerSinterFeedMappingRequest(token, item.id); await load(); }); };

  return <main className="min-h-screen bg-surface">
    <AppHeader title="Classificações por fornecedor" subtitle={`Associe fornecedor, Sinter Feed, Blend e vigência · Operador: ${user?.email ?? ""}`} actions={<><ConfigurationNavigation /><button className="btn-muted" onClick={logout}>Sair</button></>} />
    <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
      <section className="border-l-4 border-secondary bg-surface-container-low p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Regra de vigência</p><p className="mt-1 text-sm text-on-surface-variant">Para o mesmo fornecedor e Sinter Feed, informe uma vigência que não se sobreponha às classificações existentes. O histórico dos carregamentos permanece preservado.</p></section>
      {error && <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">{error}</p>}
      <section className="surface-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">Classificação</p><h2 className="mt-1 text-xl font-semibold text-on-surface">Nova classificação por fornecedor</h2><p className="mt-1 text-sm text-on-surface-variant">Use itens ativos dos catálogos de Fornecedores, Sinter Feed e Blends.</p></div><button className="btn-primary" onClick={() => setShowForm((current) => !current)} disabled={!canCreate || saving}>{showForm ? "Cancelar" : "Nova classificação"}</button></div>
        {!canCreate && <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">{issuers.length === 0 ? "Ainda não há fornecedores. Eles são criados automaticamente após uma nota com chave válida." : activeFeeds.length === 0 ? "Cadastre e ative ao menos um Sinter Feed para criar classificações." : "Cadastre e ative ao menos um Blend para criar classificações."}</p>}
        {showForm && canCreate && <form className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={submit}><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Fornecedor<select className="input" value={form.issuerId} onChange={(event) => setForm({ ...form, issuerId: event.target.value })} required><option value="">Selecione</option>{issuers.map((item) => <option key={item.id} value={item.id}>{formatCnpj(item.cnpj)}{item.descricao ? ` — ${item.descricao}` : ""}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Sinter Feed<select className="input" value={form.sinterFeedId} onChange={(event) => setForm({ ...form, sinterFeedId: event.target.value })} required><option value="">Selecione</option>{activeFeeds.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Blend<select className="input" value={form.blendId} onChange={(event) => setForm({ ...form, blendId: event.target.value })} required><option value="">Selecione</option>{activeBlends.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><label className="grid gap-1 text-sm font-medium text-on-surface-variant">Início da vigência<input className="input" type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></label><div className="md:col-span-2 lg:col-span-4"><button className="btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar classificação"}</button></div></form>}
      </section>
      <section className="overflow-x-auto surface-card"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4"><div><h2 className="text-lg font-semibold">Classificações cadastradas</h2><p className="text-sm text-on-surface-variant">Ativas e históricas, em ordem de criação.</p></div><button className="btn-muted" onClick={() => void load()} disabled={loading}>Atualizar</button></div><table className="min-w-full text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Feed</th><th className="px-4 py-3">Blend</th><th className="px-4 py-3">Vigência</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ação</th></tr></thead><tbody>{!loading && mappings.map((item) => <tr key={item.id} className="border-t border-outline-variant/70"><td className="px-4 py-3"><p className="font-medium">{formatCnpj(item.issuer.cnpj)}</p><p className="text-xs text-on-surface-variant">{item.issuer.descricao ?? "Sem descrição"}</p></td><td className="px-4 py-3">{item.sinterFeed.code}</td><td className="px-4 py-3">{item.blend.code}</td><td className="px-4 py-3 text-on-surface-variant">{formatDate(item.startsAt)} — {item.endsAt ? formatDate(item.endsAt) : "em vigor"}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive && !item.endsAt ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface-variant"}`}>{item.isActive && !item.endsAt ? "Ativa" : "Encerrada"}</span></td><td className="px-4 py-3 text-right">{item.isActive && !item.endsAt && <button className="btn-muted" onClick={() => deactivate(item)} disabled={saving}>Encerrar hoje</button>}</td></tr>)}{!loading && mappings.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Nenhuma classificação cadastrada.</td></tr>}{loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">Carregando classificações…</td></tr>}</tbody></table></section>
    </section>
  </main>;
};
