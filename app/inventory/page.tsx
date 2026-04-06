"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/ui/AppShell";
import { dbGetAllRawMaterials, dbSaveRawMaterial, dbDeleteRawMaterial, dbGetAllFinishedGoods, dbSaveFinishedGood, dbDeleteFinishedGood } from "@/lib/db";
import type { RawMaterial, FinishedGood } from "@/lib/types";
import { fmtRupee, toP } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Package, Layers } from "lucide-react";

type Tab = 'raw' | 'finished';

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('raw');
  const [rawMats, setRawMats] = useState<RawMaterial[]>([]);
  const [finGoods, setFinGoods] = useState<FinishedGood[]>([]);
  const [editRaw, setEditRaw] = useState<Partial<RawMaterial> | null>(null);
  const [editFin, setEditFin] = useState<Partial<FinishedGood> | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [r, f] = await Promise.all([dbGetAllRawMaterials(), dbGetAllFinishedGoods()]);
    setRawMats(r); setFinGoods(f);
  };

  const saveRaw = async () => {
    if (!editRaw?.name?.trim()) return;
    const now = new Date().toISOString();
    const item: RawMaterial = {
      id: editRaw.id || crypto.randomUUID(),
      name: editRaw.name.trim(), unit: editRaw.unit || 'piece',
      stockQty: parseFloat(String(editRaw.stockQty || 0)),
      costPerUnit: toP(parseFloat(String((editRaw as any).costPerUnit || 0))),
      reorderLevel: editRaw.reorderLevel ? parseFloat(String(editRaw.reorderLevel)) : undefined,
      createdAt: editRaw.createdAt || now, updatedAt: now,
    };
    await dbSaveRawMaterial(item); setEditRaw(null); loadAll();
  };

  const saveFin = async () => {
    if (!editFin?.name?.trim()) return;
    const now = new Date().toISOString();
    const item: FinishedGood = {
      id: editFin.id || crypto.randomUUID(), name: editFin.name.trim(),
      pricePaise: toP(parseFloat(String((editFin as any).pricePaise || 0))),
      costPricePaise: (editFin as any).costPricePaise ? toP(parseFloat(String((editFin as any).costPricePaise))) : undefined,
      stockQty: parseFloat(String(editFin.stockQty || 0)), unit: editFin.unit || '',
      createdAt: editFin.createdAt || now, updatedAt: now,
    };
    await dbSaveFinishedGood(item); setEditFin(null); loadAll();
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-12 lg:pt-5 pb-3 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900">Inventory</h1>
          <button onClick={() => tab === 'raw' ? setEditRaw({ unit: 'piece', stockQty: 0 }) : setEditFin({ stockQty: 0 })}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 text-white rounded-xl text-sm font-black press shadow-md shadow-primary-200">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="flex gap-2 px-4 py-3">
          {([['raw','Raw Materials'],['finished','Finished Goods']] as [Tab,string][]).map(([t,label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm press ${tab===t?'bg-primary-500 text-white':'bg-white text-gray-600 border border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="px-4 pb-24 space-y-2">
          {tab==='raw' && (rawMats.length===0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400"><Package size={32} className="mx-auto mb-2 opacity-30"/><p className="font-medium">No raw materials yet</p></div>
          ) : rawMats.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.stockQty} {r.unit} · Cost: {fmtRupee(r.costPerUnit)}/{r.unit}</p>
                {r.reorderLevel && r.stockQty<=r.reorderLevel && <p className="text-xs text-red-500 font-bold mt-0.5">⚠ Low stock</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditRaw({...r, costPerUnit: r.costPerUnit/100} as any)} className="p-2 press text-gray-400"><Pencil size={14}/></button>
                <button onClick={async()=>{if(!confirm('Delete?'))return;await dbDeleteRawMaterial(r.id);loadAll();}} className="p-2 press text-red-400"><Trash2 size={14}/></button>
              </div>
            </div>
          )))}
          {tab==='finished' && (finGoods.length===0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400"><Layers size={32} className="mx-auto mb-2 opacity-30"/><p className="font-medium">No finished goods yet</p></div>
          ) : finGoods.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{f.name}</p>
                <p className="text-xs text-gray-500">Price: {fmtRupee(f.pricePaise)}{f.costPricePaise?` · Cost: ${fmtRupee(f.costPricePaise)}`:''} · Stock: {f.stockQty}{f.unit?' '+f.unit:''}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditFin({...f,pricePaise:f.pricePaise/100,costPricePaise:f.costPricePaise?f.costPricePaise/100:undefined} as any)} className="p-2 press text-gray-400"><Pencil size={14}/></button>
                <button onClick={async()=>{if(!confirm('Delete?'))return;await dbDeleteFinishedGood(f.id);loadAll();}} className="p-2 press text-red-400"><Trash2 size={14}/></button>
              </div>
            </div>
          )))}
        </div>
      </div>

      {editRaw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-gray-900">{editRaw.id?'Edit':'New'} Raw Material</h3><button onClick={()=>setEditRaw(null)}><X size={18}/></button></div>
            <div className="space-y-3">
              <input className="bm-input" placeholder="Name *" value={editRaw.name||''} onChange={e=>setEditRaw(p=>p?{...p,name:e.target.value}:p)}/>
              <div className="grid grid-cols-2 gap-2">
                <input className="bm-input" placeholder="Unit (kg/litre)" value={editRaw.unit||''} onChange={e=>setEditRaw(p=>p?{...p,unit:e.target.value}:p)}/>
                <input className="bm-input" type="number" placeholder="Stock qty" value={editRaw.stockQty??''} onChange={e=>setEditRaw(p=>p?{...p,stockQty:parseFloat(e.target.value)}:p)}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="bm-input" type="number" step="0.01" placeholder="Cost/unit (₹)" value={(editRaw as any).costPerUnit||''} onChange={e=>setEditRaw(p=>p?{...p,costPerUnit:e.target.value as any}:p)}/>
                <input className="bm-input" type="number" placeholder="Reorder level" value={editRaw.reorderLevel??''} onChange={e=>setEditRaw(p=>p?{...p,reorderLevel:parseFloat(e.target.value)}:p)}/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setEditRaw(null)} className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-bold text-gray-600 press">Cancel</button>
              <button onClick={saveRaw} className="flex-1 h-11 bg-primary-500 text-white rounded-xl font-black press">Save</button>
            </div>
          </div>
        </div>
      )}

      {editFin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-gray-900">{editFin.id?'Edit':'New'} Finished Good</h3><button onClick={()=>setEditFin(null)}><X size={18}/></button></div>
            <div className="space-y-3">
              <input className="bm-input" placeholder="Name *" value={editFin.name||''} onChange={e=>setEditFin(p=>p?{...p,name:e.target.value}:p)}/>
              <div className="grid grid-cols-2 gap-2">
                <input className="bm-input" type="number" step="0.01" placeholder="Selling price (₹)" value={(editFin as any).pricePaise||''} onChange={e=>setEditFin(p=>p?{...p,pricePaise:e.target.value as any}:p)}/>
                <input className="bm-input" type="number" step="0.01" placeholder="Cost price (₹)" value={(editFin as any).costPricePaise||''} onChange={e=>setEditFin(p=>p?{...p,costPricePaise:e.target.value as any}:p)}/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="bm-input" type="number" placeholder="Stock qty" value={editFin.stockQty??''} onChange={e=>setEditFin(p=>p?{...p,stockQty:parseFloat(e.target.value)}:p)}/>
                <input className="bm-input" placeholder="Unit (opt)" value={editFin.unit||''} onChange={e=>setEditFin(p=>p?{...p,unit:e.target.value}:p)}/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setEditFin(null)} className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-bold text-gray-600 press">Cancel</button>
              <button onClick={saveFin} className="flex-1 h-11 bg-primary-500 text-white rounded-xl font-black press">Save</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
