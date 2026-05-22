import { useEffect, useState } from "react";
import { listMaterialsRequest, listSuppliersRequest, type CatalogItem } from "../services/catalog.service";

import { AppHeader, HeaderLinkButton } from "../components/AppHeader";
import { useAuth } from "../hooks/useAuth";
import {
  createPurchaseOrderRuleRequest,
  deactivatePurchaseOrderRuleRequest,
  listPurchaseOrderRulesRequest,
  updatePurchaseOrderRuleRequest,
  type PurchaseOrderRule
} from "../services/purchase-order-rules.service";

type PurchaseOrderRuleForm = {
  materialId: string;
  supplierId: string;
  purchaseOrderCode: string;
  isActive: boolean;
};

const initialForm: PurchaseOrderRuleForm = {
  materialId: "",
  supplierId: "",
  purchaseOrderCode: "",
  isActive: true
};

export const PurchaseOrderRulesPage = () => {
  const { token, user, logout } = useAuth();
  const [form, setForm] = useState<PurchaseOrderRuleForm>(initialForm);
  const [items, setItems] = useState<PurchaseOrderRule[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ materialId: "", supplierId: "", isActive: "" });
  const [materials, setMaterials] = useState<CatalogItem[]>([]);
  const [suppliers, setSuppliers] = useState<CatalogItem[]>([]);

  const load = async (nextPage = page) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await listPurchaseOrderRulesRequest(token, {
        page: nextPage,
        perPage: 20,
        ...filters,
        isActive: filters.isActive || undefined
      });
      setItems(response.items);
      setTotal(response.total);
      setPage(response.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    if (token) {
      void listMaterialsRequest(token, { page: 1, perPage: 100, isActive: "true" }).then((r) => setMaterials(r.items));
      void listSuppliersRequest(token, { page: 1, perPage: 100, isActive: "true" }).then((r) => setSuppliers(r.items));
    }
  }, [token]);

  const save = async () => {
    if (!token) return;

    const payload = {
      materialId: form.materialId,
      supplierId: form.supplierId,
      purchaseOrderCode: form.purchaseOrderCode,
      purchaseOrderType: "PADRAO",
      isActive: form.isActive
    };

    if (editId) {
      await updatePurchaseOrderRuleRequest(token, editId, payload);
    } else {
      await createPurchaseOrderRuleRequest(token, payload);
    }

    setForm(initialForm);
    setEditId(null);
    void load(1);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <AppHeader
        title="Configuração de Ordem de Compra"
        subtitle={`Operador: ${user?.email ?? ""}`}
        actions={
          <>
            <HeaderLinkButton to="/">Voltar ao Painel</HeaderLinkButton>
            <HeaderLinkButton to="/catalog">Gerir Catálogos</HeaderLinkButton>
            <button className="btn-muted" onClick={logout}>Sair</button>
          </>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6">
        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
          <select className="input" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}><option value="">Material</option>{materials.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">Fornecedor</option>{suppliers.map((s)=> <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <input className="input md:col-span-2" placeholder="Ordem" value={form.purchaseOrderCode} onChange={(e) => setForm({ ...form, purchaseOrderCode: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />Ativo</label>
          <div className="col-span-full flex gap-2">
            <button className="btn-primary" onClick={() => void save()}>Salvar</button>
            <button className="btn-muted" onClick={() => { setForm(initialForm); setEditId(null); }}>Limpar</button>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <input className="input" placeholder="Busca material" value={filters.materialId} onChange={(e) => setFilters({ ...filters, materialId: e.target.value })} />
          <input className="input" placeholder="Busca fornecedor" value={filters.supplierId} onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })} />
          <select className="input" value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}>
            <option value="">Todos</option><option value="true">Ativo</option><option value="false">Inativo</option>
          </select>
          <button className="btn-primary" onClick={() => void load(1)}>Filtrar</button>
        </section>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50"><tr><th className="px-4 py-3">Material</th><th>Fornecedor</th><th>OC</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">{item.materialId}</td><td>{item.supplierId}</td><td>{item.purchaseOrderCode}</td><td>{item.purchaseOrderType}</td><td>{item.description}</td><td>{item.isActive ? "Ativo" : "Inativo"}</td>
                  <td className="space-x-2">
                    <button className="btn-muted" onClick={() => { setEditId(item.id); setForm({ materialId: item.materialId, supplierId: item.supplierId, purchaseOrderCode: item.purchaseOrderCode, isActive: item.isActive }); }}>Editar</button>
                    <button className="btn-muted" onClick={() => token && deactivatePurchaseOrderRuleRequest(token, item.id).then(() => load(page))}>Inativar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between"><span>Total: {total}</span><div className="space-x-2"><button className="btn-muted" disabled={page <= 1 || loading} onClick={() => void load(page - 1)}>Anterior</button><button className="btn-muted" disabled={loading || items.length < 20} onClick={() => void load(page + 1)}>Próxima</button></div></div>
        <p className="text-sm text-slate-500">Todas as alterações ficam registradas com data, hora e usuário.</p>
      </section>
    </main>
  );
};
