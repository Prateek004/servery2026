"use client";
import { useState, useRef } from "react";
import { useApp } from "@/lib/store/AppContext";
import { useRouter } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import { Upload, Loader2, Check, Trash2, X } from "lucide-react";
import { toP } from "@/lib/utils";
import type { MenuItem } from "@/lib/types";

interface ExtractedItem { name: string; price: number; category?: string; isVeg?: boolean; }

export default function OCRPage() {
  const { upsertMenuItem, state, showToast } = useApp();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.products || []);
    } catch (e: any) {
      showToast(e.message || "OCR failed", "error");
    } finally { setLoading(false); }
  };

  const updateItem = (i: number, field: keyof ExtractedItem, val: any) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const saveAll = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    for (const item of items) {
      const mi: MenuItem = {
        id: crypto.randomUUID(), name: item.name.trim(),
        pricePaise: toP(item.price || 0), isVeg: item.isVeg ?? true,
        isAvailable: true, addOns: [],
        createdAt: now, updatedAt: now,
      };
      await upsertMenuItem(mi);
    }
    showToast(`${items.length} items imported ✓`);
    router.push('/menu');
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 pt-12 lg:pt-5 pb-3 shadow-sm">
          <h1 className="text-xl font-black text-gray-900">OCR Menu Import</h1>
          <p className="text-sm text-gray-400">Upload a photo or PDF of your menu to extract items</p>
        </div>

        <div className="p-4 space-y-4">
          <div onClick={() => fileRef.current?.click()}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-300 transition-colors">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="text-primary-500 animate-spin" />
                <p className="font-bold text-gray-600">Scanning menu...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={32} />
                <p className="font-bold">Tap to upload menu image</p>
                <p className="text-xs">PNG, JPG, PDF supported</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />

          {items.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="font-black text-gray-900">{items.length} items extracted — review before saving</p>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2">
                    <button onClick={() => updateItem(i, 'isVeg', !item.isVeg)}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 text-xs font-black press ${item.isVeg ? 'border-green-600 bg-green-500 text-white' : 'border-red-600 bg-red-500 text-white'}`}>
                      {item.isVeg ? 'V' : 'N'}
                    </button>
                    <input className="bm-input flex-1 text-sm" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">₹</span>
                      <input className="bm-input w-20 text-sm font-black" type="number" step="0.01" value={item.price} onChange={e => updateItem(i, 'price', parseFloat(e.target.value))} />
                    </div>
                    <button onClick={() => removeItem(i)} className="text-red-400 press p-1"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button onClick={saveAll} disabled={saving}
                className="w-full h-12 bg-primary-500 text-white rounded-xl font-black press shadow-md shadow-primary-200 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : `Save ${items.length} Items to Menu`}
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
