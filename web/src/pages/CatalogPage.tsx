import { useEffect, useState } from "react";
import { AppHeader, HeaderLinkButton } from "../components/AppHeader";
import { useAuth } from "../hooks/useAuth";
import { createMaterialRequest, createSupplierRequest, deactivateMaterialRequest, deactivateSupplierRequest, listMaterialsRequest, listSuppliersRequest, type CatalogItem } from "../services/catalog.service";

export const CatalogPage = () => {
  const { token, user, logout } = useAuth();
  const [materialName, setMaterialName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [materials, setMaterials] = useState<CatalogItem[]>([]);
  const [suppliers, setSuppliers] = useState<CatalogItem[]>([]);

  const load = async () => {
    if (!token) return;
    const [m, s] = await Promise.all([
      listMaterialsRequest(token, { page: 1, perPage: 50, isActive: "true" }),
      listSuppliersRequest(token, { page: 1, perPage: 50, isActive: "true" })
    ]);
    setMaterials(m.items);
    setSuppliers(s.items);
  };
  useEffect(() => { void load(); }, []);

  return <main className="min-h-screen bg-slate-50">
    <AppHeader title="Materiais e Fornecedores" subtitle={`Operador: ${user?.email ?? ""}`} actions={<><HeaderLinkButton to="/purchase-order-rules">Config. OC</HeaderLinkButton><button className="btn-muted" onClick={logout}>Sair</button></>} />
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Materiais</h2>
        <div className="flex gap-2"><input className="input" placeholder="Novo material" value={materialName} onChange={(e)=>setMaterialName(e.target.value)} /><button className="btn-primary" onClick={()=>token&&createMaterialRequest(token, materialName).then(()=>{setMaterialName("");load();})}>Adicionar</button></div>
        <ul className="mt-4 space-y-2">{materials.map(m=><li key={m.id} className="flex items-center justify-between rounded border border-slate-200 p-2"><span>{m.name}</span><button className="btn-muted" onClick={()=>token&&deactivateMaterialRequest(token,m.id).then(load)}>Inativar</button></li>)}</ul>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Fornecedores</h2>
        <div className="flex gap-2"><input className="input" placeholder="Novo fornecedor" value={supplierName} onChange={(e)=>setSupplierName(e.target.value)} /><button className="btn-primary" onClick={()=>token&&createSupplierRequest(token, supplierName).then(()=>{setSupplierName("");load();})}>Adicionar</button></div>
        <ul className="mt-4 space-y-2">{suppliers.map(s=><li key={s.id} className="flex items-center justify-between rounded border border-slate-200 p-2"><span>{s.name}</span><button className="btn-muted" onClick={()=>token&&deactivateSupplierRequest(token,s.id).then(load)}>Inativar</button></li>)}</ul>
      </section>
    </section>
  </main>
}
