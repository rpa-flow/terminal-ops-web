import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppNavigation } from "../components/AppNavigation";
import { BrazilianDateInput } from "../components/BrazilianDateInput";
import { useAuth } from "../hooks/useAuth";
import { createShipmentRequest, deleteShipmentRequest, listShipmentsRequest } from "../services/shipments.service";
import { listBlendsRequest, type Blend } from "../services/sinter-feeds.service";
import type { ShipmentsResponse } from "../types/api";

const number = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

export const ShipmentsPage = () => {
  const { area } = useParams();
  const { token, user, logout } = useAuth();
  const [data, setData] = useState<ShipmentsResponse | null>(null);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [form, setForm] = useState({ shippedAt: new Date().toISOString().slice(0, 10), volume: "", blendId: "", pile: "", destination: "", document: "", notes: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const terminal = area?.toUpperCase() as "TBJC" | "TCS";
  const load = useCallback(async () => { if (!token) return; setLoading(true); setError(null); try { const [shipments, availableBlends] = await Promise.all([listShipmentsRequest(token, terminal), listBlendsRequest(token)]); setData(shipments); setBlends(availableBlends.filter((item) => item.isActive)); } catch { setError("Não foi possível carregar os embarques."); } finally { setLoading(false); } }, [token, terminal]);
  useEffect(() => {
    if (token) {
      void load();
    }
  }, [token, load]);
  if (terminal !== "TBJC" && terminal !== "TCS") return <Navigate to="/embarques/tbjc" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      await createShipmentRequest(token, {
        terminal, shippedAt: `${form.shippedAt}T12:00:00.000Z`, volume: Number(form.volume.replace(",", ".")),
        ...(terminal === "TBJC" ? { blendId: form.blendId } : {}),
        ...(terminal === "TCS" ? { pile: form.pile.trim() } : {}),
        ...(form.destination.trim() ? { destination: form.destination.trim() } : {}),
        ...(form.document.trim() ? { document: form.document.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
      });
      setForm((current) => ({ ...current, volume: "", blendId: "", pile: "", destination: "", document: "", notes: "" }));
      setMessage("Embarque registrado com sucesso.");
      await load();
    } catch { setMessage("Não foi possível registrar o embarque."); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm("Excluir este embarque? Os saldos serão recalculados.")) return;
    setMessage(null);
    setDeletingId(id);
    try {
      await deleteShipmentRequest(token, id);
      setMessage("Embarque excluído com sucesso.");
      await load();
    } catch {
      setMessage("Não foi possível excluir o embarque.");
    } finally {
      setDeletingId(null);
    }
  };

  return <main className="app-with-sidebar min-h-screen bg-surface">
    <header className="border-b border-outline-variant bg-surface-container-lowest"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4"><div className="flex items-center gap-4"><AppNavigation current="shipments" reportArea={area as "tbjc" | "tcs"} /><div><h1 className="text-[22px] font-medium">Embarques — {terminal}</h1><p className="text-sm text-on-surface-variant">Lançamento manual • {user?.email}</p></div></div><button className="btn-muted" onClick={logout}>Sair</button></div></header>
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-error"><span>{error}</span><button className="btn-muted" onClick={() => void load()} disabled={loading}>Tentar novamente</button></div>}
      <div className="grid gap-4 sm:grid-cols-3" aria-busy={loading}>
        {[['Volume recebido', data?.summary.receivedVolume ?? 0, ''], ['Volume embarcado', data?.summary.shippedVolume ?? 0, ''], ['Saldo disponível', data?.summary.availableVolume ?? 0, 'text-primary']].map(([label, value, accent]) => <article key={String(label)} className="surface-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p><strong className={`mt-2 block text-2xl ${accent}`}>{loading || (error && !data) ? '—' : `${number(Number(value))} t`}</strong></article>)}
      </div>
      <form onSubmit={submit} className="surface-card grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3"><h2 className="font-semibold text-on-surface">Novo embarque</h2><p className="mt-1 text-sm text-on-surface-variant">Data, volume e Blend são obrigatórios para TBJC.</p></div>
        <label className="text-sm">Data<BrazilianDateInput required label="Data do embarque" className="input mt-1 w-full" value={form.shippedAt} onChange={(shippedAt) => setForm({ ...form, shippedAt })} /></label>
        <label className="text-sm">Volume<input required inputMode="decimal" className="input mt-1 w-full" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} /></label>
        {terminal === "TBJC" && <label className="text-sm">Blend<select required className="input mt-1 w-full" value={form.blendId} onChange={(e) => setForm({ ...form, blendId: e.target.value })}><option value="">Selecione</option>{blends.map((blend) => <option key={blend.id} value={blend.id}>{blend.code}</option>)}</select></label>}
        {terminal === "TCS" && <label className="text-sm">Pilha<input required className="input mt-1 w-full" placeholder="Pilha de origem" value={form.pile} onChange={(e) => setForm({ ...form, pile: e.target.value })} /></label>}
        <label className="text-sm">Destino<input className="input mt-1 w-full" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></label>
        <label className="text-sm">Documento<input className="input mt-1 w-full" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></label>
        <label className="text-sm md:col-span-2">Observações<textarea className="input mt-1 min-h-20 w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <div><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Registrando...' : 'Registrar embarque'}</button></div>{message && <p className="text-sm" role="status">{message}</p>}
      </form>
      <section className="surface-card overflow-hidden"><div className="border-b border-surface-container-high px-4 py-3"><h2 className="font-semibold text-on-surface">Embarques recentes</h2><p className="text-sm text-on-surface-variant md:hidden">Deslize a tabela para consultar todas as colunas.</p></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-surface"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Volume</th>{terminal === "TBJC" && <th className="px-4 py-3">Blend</th>}{terminal === "TCS" && <th className="px-4 py-3">Pilha</th>}<th className="px-4 py-3">Destino</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Observações</th><th className="px-4 py-3"><span className="sr-only">Ações</span></th></tr></thead><tbody>{data?.items.map((item) => <tr key={item.id} className="border-t border-surface-container-high hover:bg-surface-container-low"><td className="px-4 py-3">{new Date(item.shippedAt).toLocaleDateString("pt-BR")}</td><td className="px-4 py-3">{number(item.volume)} t</td>{terminal === "TBJC" && <td className="px-4 py-3">{item.blend?.code ?? "Não classificado"}</td>}{terminal === "TCS" && <td className="px-4 py-3">{item.pile ?? "Não informada"}</td>}<td className="px-4 py-3">{item.destination ?? "-"}</td><td className="px-4 py-3">{item.document ?? "-"}</td><td className="px-4 py-3">{item.notes ?? "-"}</td><td className="px-4 py-3 text-right"><button type="button" className="text-sm text-error hover:underline disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void remove(item.id)} disabled={deletingId === item.id}>{deletingId === item.id ? "Excluindo..." : "Excluir"}</button></td></tr>)}{!loading && data?.items.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-on-surface-variant">Nenhum embarque registrado para este terminal.</td></tr>}</tbody></table></div></section>
    </section>
  </main>;
};
