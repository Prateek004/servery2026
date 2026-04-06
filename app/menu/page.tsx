"use client";
import { useState } from "react";
import { useApp } from "@/lib/store/AppContext";
import AppShell from "@/components/ui/AppShell";
import type { MenuItem, MenuCategory, AddOn, Portion } from "@/lib/types";
import { fmtRupee, toP } from "@/lib/utils";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderPlus, X } from "lucide-react";

type ItemForm = Partial<MenuItem> & { addOnInput?: string; addOnPrice?: string };

export default function MenuPage() {
  const { state, upsertMenuItem, deleteMenuItem, upsertCategory, deleteCategory, showToast } = useApp();
  const { menuItems, categories, business } = state;
  const barMode = business?.barModeEnabled;
  const portionsEnabled = business?.portionsEnabled;

  const [expanded, setExpanded] = useState<Set<string>>(new Set(categories.map(c => c.id)));
  const [editItem, setEditItem] = useState<ItemForm | null>(null);
  const [editCat, setEditCat] = useState<Partial<MenuCategory> | null>(null);

  const toggleCat = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openNewItem = (categoryId: string) =>
    setEditItem({ categoryId, isVeg: true, isAvailable: true, addOns: [], portions: [], pricePaise: 0 });

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem?.name?.trim()) return;
    const now = new Date().toISOString();
    const item: MenuItem = {
      id: editItem.id || crypto.randomUUID(),
      name: editItem.name.trim(),
      categoryId: editItem.categoryId,
      pricePaise: toP(parseFloat(String(editItem.pricePaise || 0)) || 0),
      costPricePaise: editItem.costPricePaise ? toP(parseFloat(String(editItem.costPricePaise)) || 0) : undefined,
      isVeg: editItem.isVeg ?? true,
      isAvailable: editItem.isAvailable ?? true,
      isBarItem: editItem.isBarItem ?? false,
      barUnits: editItem.barUnits,
      addOns: editItem.addOns || [],
      portions: portionsEnabled ? (editItem.portions || []) : [],
      hsnCode: editItem.hsnCode,
      taxRate: editItem.taxRate,
      createdAt: editItem.createdAt || now,
      updatedAt: now,
    };
    await upsertMenuItem(item);
    showToast(editItem.id ? "Item updated ✓" : "Item added ✓");
    setEditItem(null);
  };

  const handleSaveCat = async () => {
    if (!editCat?.name?.trim()) return;
    const now = new Date().toISOString();
    await upsertCategory({ id: editCat.id || crypto.randomUUID(), name: editCat.name.trim(), sortOrder: editCat.sortOrder ?? categories.length, isBarCategory: editCat.isBarCategory, createdAt: editCat.createdAt || now });
    showToast("Category saved ✓");
    setEditCat(null);
  };

  const addAddOn = () => {
    if (!editItem?.addOnInput?.trim()) return;
    const ao: AddOn = { id: crypto.randomUUID(), name: editItem.addOnInput.trim(), pricePaise: toP(parseFloat(editItem.addOnPrice || '0') || 0) };
    setEditItem(p => p ? { ...p, addOns: [...(p.addOns || []), ao], addOnInput: '', addOnPrice: '' } : p);
  };

  const addPortion = () => {
    const label = prompt('Portion label (e.g. Half, Full, 250ml):');
    if (!label) return;
    const price = prompt('Price (₹):');
    if (!price) return;
    const pt: Portion = { id: crypto.randomUUID(), label: label.trim(), pricePaise: toP(parseFloat(price) || 0) };
    setEditItem(p => p ? { ...p, portions: [...(p.portions || []), pt] } : p);
  };

  const uncategorized = menuItems.filter(i => !i.categoryId || !categories.find(c => c.id === i.categoryId));

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-12 lg:pt-5 pb-3 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900">Menu & Items</h1>
          <button onClick={() => setEditCat({ name: '', sortOrder: categories.length })}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-sm font-bold press text-gray-700">
            <FolderPlus size={14} /> Category
          </button>
        </div>

        <div className="p-4 space-y-3 pb-24">
          {[...categories, ...(uncategorized.length ? [{ id: '__none__', name: 'Uncategorised', sortOrder: 999, createdAt: '' } as MenuCategory] : [])].map(cat => {
            const items = cat.id === '__none__' ? uncategorized : menuItems.filter(i => i.categoryId === cat.id);
            const isOpen = expanded.has(cat.id);
            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <button onClick={() => toggleCat(cat.id)} className="flex items-center gap-2 flex-1">
                    {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    <span className="font-black text-gray-900">{cat.name}</span>
                    <span className="text-xs text-gray-400 font-medium">({items.length})</span>
                    {cat.isBarCategory && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Bar</span>}
                  </button>
                  <div className="flex gap-1">
                    {cat.id !== '__none__' && <>
                      <button onClick={() => setEditCat(cat)} className="p-1.5 press text-gray-400 hover:text-gray-600"><Pencil size={13} /></button>
                      <button onClick={async () => { if (!confirm('Delete category?')) return; for (const i of items) await deleteMenuItem(i.id); await deleteCategory(cat.id); showToast('Deleted'); }} className="p-1.5 press text-red-400"><Trash2 size={13} /></button>
                    </>}
                    <button onClick={() => { openNewItem(cat.id === '__none__' ? '' : cat.id); setExpanded(p => new Set([...p, cat.id])); }}
                      className="p-1.5 press text-primary-500"><Plus size={15} /></button>
                  </div>
                </div>
                {isOpen && (
                  <div>
                    {items.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">No items. Click + to add.</p>
                    ) : items.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${item.isVeg ? 'border-green-600 bg-green-500' : 'border-red-600 bg-red-500'}`} />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400">{fmtRupee(item.pricePaise)}{item.addOns?.length ? ` · ${item.addOns.length} add-ons` : ''}{item.portions?.length ? ` · ${item.portions.length} portions` : ''}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => setEditItem({ ...item, pricePaise: item.pricePaise / 100, costPricePaise: item.costPricePaise ? item.costPricePaise / 100 : undefined } as any)} className="p-1.5 press text-gray-400"><Pencil size={13} /></button>
                          <button onClick={async () => { if (!confirm('Delete item?')) return; await deleteMenuItem(item.id); showToast('Deleted'); }} className="p-1.5 press text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => openNewItem('')}
            className="w-full h-12 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl font-bold text-sm press flex items-center justify-center gap-2">
            <Plus size={16} /> Add New Item
          </button>
        </div>
      </div>

      {/* Category modal */}
      {editCat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-black text-gray-900 mb-4">{editCat.id ? 'Edit' : 'New'} Category</h3>
            <input className="bm-input mb-3" placeholder="Category name" value={editCat.name} onChange={e => setEditCat(p => p ? { ...p, name: e.target.value } : p)} />
            {barMode && (
              <label className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={!!editCat.isBarCategory} onChange={e => setEditCat(p => p ? { ...p, isBarCategory: e.target.checked } : p)} />
                Bar category
              </label>
            )}
            <div className="flex gap-3">
              <button onClick={() => setEditCat(null)} className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-bold text-gray-600 press">Cancel</button>
              <button onClick={handleSaveCat} className="flex-1 h-11 bg-primary-500 text-white rounded-xl font-black press">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Item modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-center">
          <form onSubmit={handleSaveItem} className="w-full lg:max-w-lg bg-white rounded-t-2xl lg:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">{editItem.id ? 'Edit' : 'New'} Item</h3>
              <button type="button" onClick={() => setEditItem(null)}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <input className="bm-input" placeholder="Item name *" required value={editItem.name || ''} onChange={e => setEditItem(p => p ? { ...p, name: e.target.value } : p)} />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Selling Price (₹)</label>
                  <input className="bm-input" type="number" step="0.01" placeholder="0.00" value={editItem.pricePaise || ''} onChange={e => setEditItem(p => p ? { ...p, pricePaise: e.target.value as any } : p)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Cost Price (₹)</label>
                  <input className="bm-input" type="number" step="0.01" placeholder="Optional" value={editItem.costPricePaise || ''} onChange={e => setEditItem(p => p ? { ...p, costPricePaise: e.target.value as any } : p)} />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="radio" checked={editItem.isVeg === true} onChange={() => setEditItem(p => p ? { ...p, isVeg: true } : p)} />
                  <span className="text-green-700">🟢 Veg</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="radio" checked={editItem.isVeg === false} onChange={() => setEditItem(p => p ? { ...p, isVeg: false } : p)} />
                  <span className="text-red-700">🔴 Non-veg</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={editItem.isAvailable !== false} onChange={e => setEditItem(p => p ? { ...p, isAvailable: e.target.checked } : p)} />
                Available for sale
              </label>

              {barMode && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <input type="checkbox" checked={!!editItem.isBarItem} onChange={e => setEditItem(p => p ? { ...p, isBarItem: e.target.checked } : p)} />
                    Bar item
                  </label>
                  {editItem.isBarItem && (
                    <div className="flex gap-3 ml-6">
                      {(['ml','peg','bottle'] as const).map(u => (
                        <label key={u} className="flex items-center gap-1 text-sm font-bold text-gray-600">
                          <input type="checkbox" checked={!!editItem.barUnits?.[u]} onChange={e => setEditItem(p => p ? { ...p, barUnits: { ...p.barUnits, [u]: e.target.checked } } : p)} />
                          {u}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Add-ons */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">Add-ons</p>
                {(editItem.addOns || []).map(ao => (
                  <div key={ao.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                    <span className="text-sm font-bold text-gray-800">{ao.name} — {fmtRupee(ao.pricePaise)}</span>
                    <button type="button" onClick={() => setEditItem(p => p ? { ...p, addOns: p.addOns?.filter(a => a.id !== ao.id) } : p)} className="text-red-400 press"><X size={13} /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input className="bm-input flex-1 text-sm" placeholder="Add-on name" value={editItem.addOnInput || ''} onChange={e => setEditItem(p => p ? { ...p, addOnInput: e.target.value } : p)} />
                  <input className="bm-input w-24 text-sm" type="number" placeholder="₹" value={editItem.addOnPrice || ''} onChange={e => setEditItem(p => p ? { ...p, addOnPrice: e.target.value } : p)} />
                  <button type="button" onClick={addAddOn} className="px-3 bg-gray-100 rounded-xl font-bold text-sm press">+</button>
                </div>
              </div>

              {/* Portions */}
              {portionsEnabled && (
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Portions</p>
                  {(editItem.portions || []).map(pt => (
                    <div key={pt.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                      <span className="text-sm font-bold text-gray-800">{pt.label} — {fmtRupee(pt.pricePaise)}</span>
                      <button type="button" onClick={() => setEditItem(p => p ? { ...p, portions: p.portions?.filter(x => x.id !== pt.id) } : p)} className="text-red-400 press"><X size={13} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addPortion} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-500 press">+ Add Portion</button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setEditItem(null)} className="flex-1 h-11 border-2 border-gray-200 rounded-xl font-bold text-gray-600 press">Cancel</button>
              <button type="submit" className="flex-1 h-11 bg-primary-500 text-white rounded-xl font-black press shadow-md">Save Item</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
