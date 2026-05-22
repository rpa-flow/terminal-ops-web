import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createPurchaseOrderRuleRequest, deactivatePurchaseOrderRuleRequest, listPurchaseOrderRulesRequest, updatePurchaseOrderRuleRequest, type PurchaseOrderRule } from "../services/purchase-order-rules.service";

const initialForm = { materialId: "", supplierId: "", purchaseOrderType: "", purchaseOrderCode: "", description: "", lot: "", minimumQuantity: "", costCenter: "", paymentCondition: "", isActive: true };

export const PurchaseOrderRulesPage = () => {
  const { token } = useAuth();
  const [form, setForm] = useState<any>(initialForm); const [items, setItems] = useState<PurchaseOrderRule[]>([]); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ materialId: "", supplierId: "", isActive: "" });
  const load = async (p=page) => { if(!token) return; setLoading(true); const r=await listPurchaseOrderRulesRequest(token,{ page:p, perPage:20, ...filters, isActive: filters.isActive || undefined}); setItems(r.items); setTotal(r.total); setPage(r.page); setLoading(false); };
  useEffect(()=>{ void load(1); },[]);
  const save = async () => { if(!token) return; const payload={...form, minimumQuantity: form.minimumQuantity? Number(form.minimumQuantity): undefined}; if(editId){ await updatePurchaseOrderRuleRequest(token, editId, payload);} else { await createPurchaseOrderRuleRequest(token,payload);} setForm(initialForm); setEditId(null); void load(1); };
  return <main className="min-h-screen bg-slate-50 p-4"><div className="mx-auto grid max-w-7xl gap-4">
    <h1 className="text-xl font-semibold">Configuração de Ordem de Compra</h1>
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">{Object.entries(initialForm).map(([k])=> k==="isActive" ? <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/>Ativo</label> : <input key={k} className="input" placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>) }
    <div className="col-span-full flex gap-2"><button className="btn-primary" onClick={()=>void save()}>Salvar</button><button className="btn-muted" onClick={()=>setForm(initialForm)}>Limpar</button></div></section>
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4"><input className="input" placeholder="Busca material" value={filters.materialId} onChange={e=>setFilters({...filters,materialId:e.target.value})}/><input className="input" placeholder="Busca fornecedor" value={filters.supplierId} onChange={e=>setFilters({...filters,supplierId:e.target.value})}/><select className="input" value={filters.isActive} onChange={e=>setFilters({...filters,isActive:e.target.value})}><option value="">Todos</option><option value="true">Ativo</option><option value="false">Inativo</option></select><button className="btn-primary" onClick={()=>void load(1)}>Filtrar</button></section>
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3">Material</th><th>Fornecedor</th><th>OC</th><th>Tipo</th><th>Descrição</th><th>Status</th><th>Ações</th></tr></thead><tbody>{items.map(i=><tr key={i.id} className="border-t"><td className="px-4 py-3">{i.materialId}</td><td>{i.supplierId}</td><td>{i.purchaseOrderCode}</td><td>{i.purchaseOrderType}</td><td>{i.description}</td><td>{i.isActive?"Ativo":"Inativo"}</td><td className="space-x-2"><button className="btn-muted" onClick={()=>{setEditId(i.id); setForm({...i, minimumQuantity: i.minimumQuantity ?? ""});}}>Editar</button><button className="btn-muted" onClick={()=>token && deactivatePurchaseOrderRuleRequest(token,i.id).then(()=>load(page))}>Inativar</button></td></tr>)}</tbody></table></div>
    <div className="flex justify-between"><span>Total: {total}</span><div className="space-x-2"><button className="btn-muted" disabled={page<=1||loading} onClick={()=>void load(page-1)}>Anterior</button><button className="btn-muted" disabled={loading||items.length<20} onClick={()=>void load(page+1)}>Próxima</button></div></div>
    <p className="text-sm text-slate-500">Todas as alterações ficam registradas com data, hora e usuário.</p>
  </div></main>
}
