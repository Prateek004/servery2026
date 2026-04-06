'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { dbGetAvailableMenuItems, dbGetAllCategories, dbGetAllTables, dbSaveTable } from '@/lib/db';
import { Plus, ShoppingCart, Minus, Trash2, X, Send, UtensilsCrossed, Package } from 'lucide-react';
import type { MenuItem, MenuCategory, AddOn, Portion, BarUnit, Table } from '@/lib/types';
import { fmtRupee, QUICK_CASH } from '@/lib/utils';
import { generateKOTText, printFallback } from '@/lib/utils/print';
import CheckoutModal from '@/components/pos/CheckoutModal';
import ServiceModeSelector from '@/components/pos/ServiceModeSelector';
import AppShell from '@/components/ui/AppShell';

type PickerState = { item: MenuItem; addOns: AddOn[]; portion?: Portion; barUnit?: BarUnit } | null;

export default function POSPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selCat, setSelCat] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const [showTables, setShowTables] = useState(false);

  const { cart, addToCart, updateCartItem, removeFromCart, business, serviceMode, currentTable, setCurrentTable } = useStore();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [cats, items, tbls] = await Promise.all([dbGetAllCategories(), dbGetAvailableMenuItems(), dbGetAllTables()]);
    setCategories(cats);
    setProducts(items);
    setTables(tbls);
  };

  const barMode = business?.barModeEnabled;
  const portionsEnabled = business?.portionsEnabled;

  const filtered = selCat === 'all' ? products
    : selCat === '__bar__' ? products.filter(p => p.isBarItem)
    : products.filter(p => p.categoryId === selCat);

  const subtotal = cart.reduce((s, i) => s + i.qty * i.unitPricePaise, 0);
  const gst = business?.gstPercent ? Math.round(subtotal * business.gstPercent / 100) : 0;
  const total = subtotal + gst;
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const handleProductClick = (p: MenuItem) => {
    const hasAddOns = p.addOns?.length > 0;
    const hasPortions = portionsEnabled && p.portions?.length > 0;
    const hasBarUnits = barMode && p.isBarItem && p.barUnits;
    if (hasAddOns || hasPortions || hasBarUnits) {
      setPicker({ item: p, addOns: [], portion: undefined, barUnit: undefined });
    } else {
      addToCart(p, {});
    }
  };

  const confirmPicker = () => {
    if (!picker) return;
    addToCart(picker.item, { addOns: picker.addOns, portion: picker.portion, barUnit: picker.barUnit });
    setPicker(null);
  };

  const sendKOT = () => {
    if (!cart.length) return;
    const text = generateKOTText(cart, currentTable, 'KOT-' + Date.now().toString(36).toUpperCase());
    printFallback(text);
  };

  const handleTableSelect = async (t: Table) => {
    setCurrentTable(t.tableNumber);
    setShowTables(false);
  };

  const catTabs = [
    { id: 'all', name: 'All' },
    ...(barMode ? [{ id: '__bar__', name: '🍺 Bar' }] : []),
    ...categories,
  ];

  return (
    <AppShell>
      <div className="flex h-full">
        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black text-gray-900 truncate">{business?.name || 'BillMate POS'}</h1>
              <ServiceModeSelector />
            </div>
            <div className="flex gap-2">
              {serviceMode === 'dine-in' && (
                <button onClick={() => setShowTables(true)} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-bold press text-gray-700">
                  {currentTable ? `T-${currentTable}` : 'Table'}
                </button>
              )}
              <button onClick={sendKOT} className="p-2 rounded-lg bg-orange-100 text-orange-600 press" title="Send KOT">
                <Send size={16} />
              </button>
              <button onClick={() => setShowCart(true)} className="relative p-2 rounded-lg bg-primary-50 text-primary-600 press lg:hidden">
                <ShoppingCart size={18} />
                {count > 0 && <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="bg-white border-b overflow-x-auto no-scrollbar">
            <div className="flex gap-1 px-3 py-2 min-w-max">
              {catTabs.map(c => (
                <button key={c.id} onClick={() => setSelCat(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap press transition-colors ${selCat === c.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3 pb-28 lg:pb-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <UtensilsCrossed size={32} className="mb-2 opacity-30" />
                <p className="font-medium text-sm">No items here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {filtered.map(p => (
                  <button key={p.id} onClick={() => handleProductClick(p)}
                    className="bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-md transition-shadow press active:scale-95">
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <span className={`mt-0.5 w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${p.isVeg ? 'border-green-600 bg-green-500' : 'border-red-600 bg-red-500'}`} />
                      <span className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">{p.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-primary-600">{fmtRupee(p.pricePaise)}</span>
                      <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center flex-shrink-0">
                        <Plus size={12} strokeWidth={3} />
                      </span>
                    </div>
                    {(p.addOns?.length > 0 || (portionsEnabled && p.portions?.length > 0)) && (
                      <p className="text-[10px] text-gray-400 mt-1">+ options</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop cart sidebar ── */}
        <div className="hidden lg:flex w-80 border-l bg-white flex-col">
          <CartSidebar cart={cart} total={total} subtotal={subtotal} gst={gst} gstPct={business?.gstPercent}
            updateCartItem={updateCartItem} removeFromCart={removeFromCart}
            onCheckout={() => setShowCheckout(true)} />
        </div>
      </div>

      {/* Mobile checkout bar */}
      {count > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 px-4 py-2 bg-white border-t z-30">
          <button onClick={() => setShowCheckout(true)}
            className="w-full h-12 bg-primary-500 text-white rounded-xl font-black text-sm press shadow-md shadow-primary-200">
            Checkout · {count} items · {fmtRupee(total)}
          </button>
        </div>
      )}

      {/* Mobile cart drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowCart(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-black">Cart ({count})</h2>
              <button onClick={() => setShowCart(false)} className="p-1 press"><X size={18} /></button>
            </div>
            <CartSidebar cart={cart} total={total} subtotal={subtotal} gst={gst} gstPct={business?.gstPercent}
              updateCartItem={updateCartItem} removeFromCart={removeFromCart}
              onCheckout={() => { setShowCart(false); setShowCheckout(true); }} />
          </div>
        </div>
      )}

      {/* Table picker */}
      {showTables && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Select Table</h3>
              <button onClick={() => setShowTables(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(business?.tableCount ? Array.from({ length: business.tableCount }, (_, i) => String(i + 1)) : ['1','2','3','4','5','6','7','8']).map(tn => {
                const t = tables.find(x => x.tableNumber === tn);
                return (
                  <button key={tn} onClick={() => { setCurrentTable(tn); setShowTables(false); }}
                    className={`py-3 rounded-xl font-black text-sm press ${currentTable === tn ? 'bg-primary-500 text-white' : t?.status === 'occupied' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                    T{tn}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setCurrentTable(undefined); setShowTables(false); }}
              className="w-full py-2 border-2 border-gray-200 rounded-xl font-bold text-gray-600 text-sm press">
              Clear Table
            </button>
          </div>
        </div>
      )}

      {/* Item picker modal */}
      {picker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center lg:justify-center">
          <div className="w-full lg:max-w-sm bg-white rounded-t-2xl lg:rounded-2xl p-5 max-h-[85vh] overflow-y-auto">
            <h3 className="font-black text-gray-900 text-lg mb-4">{picker.item.name}</h3>

            {/* Bar units */}
            {barMode && picker.item.isBarItem && picker.item.barUnits && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Unit</p>
                <div className="flex gap-2">
                  {(['ml','peg','bottle'] as BarUnit[]).filter(u => picker.item.barUnits?.[u]).map(u => (
                    <button key={u} onClick={() => setPicker(p => p ? { ...p, barUnit: u } : p)}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm press ${picker.barUnit === u ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Portions */}
            {portionsEnabled && picker.item.portions?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Portion</p>
                <div className="space-y-2">
                  {picker.item.portions!.map(pt => (
                    <button key={pt.id} onClick={() => setPicker(p => p ? { ...p, portion: pt } : p)}
                      className={`w-full flex justify-between px-3 py-2.5 rounded-xl border-2 font-bold text-sm press ${picker.portion?.id === pt.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                      <span>{pt.label}</span><span className="text-primary-600">{fmtRupee(pt.pricePaise)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {picker.item.addOns?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add-ons</p>
                <div className="space-y-2">
                  {picker.item.addOns.map(ao => {
                    const checked = picker.addOns.some(a => a.id === ao.id);
                    return (
                      <button key={ao.id} onClick={() => setPicker(p => p ? { ...p, addOns: checked ? p.addOns.filter(a => a.id !== ao.id) : [...p.addOns, ao] } : p)}
                        className={`w-full flex justify-between px-3 py-2.5 rounded-xl border-2 font-bold text-sm press ${checked ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                        <span>{ao.name}</span><span className={checked ? 'text-primary-600' : 'text-gray-600'}>+{fmtRupee(ao.pricePaise)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setPicker(null)} className="flex-1 h-11 rounded-xl border-2 border-gray-200 font-bold text-gray-600 press">Cancel</button>
              <button onClick={confirmPicker} className="flex-1 h-11 rounded-xl bg-primary-500 text-white font-black press shadow-md shadow-primary-200">Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && <CheckoutModal open={showCheckout} onClose={() => setShowCheckout(false)} />}
    </AppShell>
  );
}

// ── Cart Sidebar Component ──────────────────────────────────────────────────────
function CartSidebar({ cart, total, subtotal, gst, gstPct, updateCartItem, removeFromCart, onCheckout }: any) {
  if (cart.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
      <ShoppingCart size={32} className="opacity-30" />
      <p className="text-sm font-medium">Cart is empty</p>
    </div>
  );
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.map((item: any) => (
          <div key={item.cartId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 leading-tight truncate">{item.name}</p>
              <p className="text-xs text-primary-600 font-black">{fmtRupee(item.unitPricePaise)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => updateCartItem(item.cartId, item.qty - 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center press">
                <Minus size={10} strokeWidth={3} />
              </button>
              <span className="w-5 text-center font-black text-sm">{item.qty}</span>
              <button onClick={() => updateCartItem(item.cartId, item.qty + 1)} className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center press">
                <Plus size={10} strokeWidth={3} />
              </button>
            </div>
            <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 press p-1">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="border-t p-3 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{fmtRupee(subtotal)}</span></div>
        {gst > 0 && <div className="flex justify-between text-xs text-gray-500"><span>GST ({gstPct}%)</span><span>{fmtRupee(gst)}</span></div>}
        <div className="flex justify-between font-black text-gray-900 border-t pt-1.5">
          <span>Total</span><span className="text-primary-600">{fmtRupee(total)}</span>
        </div>
        <button onClick={onCheckout} className="w-full h-11 bg-primary-500 text-white rounded-xl font-black text-sm press shadow-md shadow-primary-200 mt-1">
          Checkout
        </button>
      </div>
    </div>
  );
}
