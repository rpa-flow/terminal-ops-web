import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppNavigation } from "../components/AppNavigation";
import { useAuth } from "../hooks/useAuth";
import { createShipmentRequest, deleteShipmentRequest, listShipmentsRequest } from "../services/shipments.service";
import type { ShipmentsResponse } from "../types/api";

const number = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);

export const ShipmentsPage = () => {
  const { area } = useParams();
  const { token, user, logout } = useAuth();
  const [data, setData] = useState<ShipmentsResponse | null>(null);
  const [form, setForm] = useState({ shippedAt: new Date().toISOString().slice(0, 10), volume: "", destination: "", document: "", notes: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const terminal = area?.toUpperCase() as "TBJC" | "TCS";
  const load = useCallback(async () => token && setData(await listShipmentsRequest(token, terminal)), [token, terminal]);
  useEffect(() => {
    if (token) {
      void listShipmentsRequest(token, terminal).then(setData);
    }
  }, [token, terminal]);
  if (terminal !== "TBJC" && terminal !== "TCS") return <Navigate to="/embarques/tbjc" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setMessage(null);
    try {
      await createShipmentRequest(token, {
        terminal, shippedAt: `${form.shippedAt}T12:00:00.000Z`, volume: Number(form.volume.replace(",", ".")),
        ...(form.destination.trim() ? { destination: form.destination.trim() } : {}),
        ...(form.document.trim() ? { document: form.document.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
      });
      setForm((current) => ({ ...current, volume: "", destination: "", document: "", notes: "" }));
      setMessage("Embarque registrado com sucesso.");
      await load();
    } catch { setMessage("Não foi possível registrar o embarque."); }
  };

  const remove = async (id: string) => {
    if (!token || !window.confirm("Tem certeza de que deseja excluir este embarque?")) return;
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
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded border border-outline-variant bg-surface-container-lowest p-4"><p className="text-xs uppercase text-on-surface-variant">Volume recebido</p><strong className="text-2xl">{number(data?.summary.receivedVolume ?? 0)}</strong></article>
        <article className="rounded border border-outline-variant bg-surface-container-lowest p-4"><p className="text-xs uppercase text-on-surface-variant">Volume embarcado</p><strong className="text-2xl">{number(data?.summary.shippedVolume ?? 0)}</strong></article>
        <article className="rounded border border-outline-variant bg-surface-container-lowest p-4"><p className="text-xs uppercase text-on-surface-variant">Saldo disponível</p><strong className="text-2xl text-primary">{number(data?.summary.availableVolume ?? 0)}</strong></article>
      </div>
      <form onSubmit={submit} className="grid gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4 md:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-semibold md:col-span-2 lg:col-span-3">Novo embarque</h2>
        <label className="text-sm">Data<input required type="date" className="input mt-1 w-full" value={form.shippedAt} onChange={(e) => setForm({ ...form, shippedAt: e.target.value })} /></label>
        <label className="text-sm">Volume<input required inputMode="decimal" className="input mt-1 w-full" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} /></label>
        <label className="text-sm">Destino<input className="input mt-1 w-full" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></label>
        <label className="text-sm">Documento<input className="input mt-1 w-full" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} /></label>
        <label className="text-sm md:col-span-2">Observações<input className="input mt-1 w-full" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <div><button className="btn-primary" type="submit">Registrar embarque</button></div>{message && <p className="text-sm">{message}</p>}
      </form>
      <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-lowest"><table className="min-w-full text-left text-sm"><thead className="bg-surface"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Volume</th><th className="px-4 py-3">Destino</th><th className="px-4 py-3">Documento</th><th className="px-4 py-3">Observações</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody>{data?.items.map((item) => <tr key={item.id} className="border-t border-surface-container-high"><td className="px-4 py-3">{new Date(item.shippedAt).toLocaleDateString("pt-BR")}</td><td className="px-4 py-3">{number(item.volume)}</td><td className="px-4 py-3">{item.destination ?? "-"}</td><td className="px-4 py-3">{item.document ?? "-"}</td><td className="px-4 py-3">{item.notes ?? "-"}</td><td className="px-4 py-3 text-right"><button type="button" className="btn-muted text-error" disabled={deletingId !== null} onClick={() => void remove(item.id)}>{deletingId === item.id ? "Excluindo..." : "Excluir"}</button></td></tr>)}</tbody></table></div>
    </section>
  </main>;
};
