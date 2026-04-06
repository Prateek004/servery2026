'use client';
import { create } from 'zustand';
import type { BusinessProfile, MenuItem, CartItem, UserRole, ServiceMode, AddOn, Portion, BarUnit } from '@/lib/types';

function addOnFP(addOns: AddOn[]) { return addOns.map(a => a.id).sort().join(','); }

interface AppState {
  business: BusinessProfile | null;
  setBusiness: (b: BusinessProfile | null) => void;
  userRole: UserRole;
  setUserRole: (r: UserRole) => void;
  products: MenuItem[];
  setProducts: (p: MenuItem[]) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem, opts?: { addOns?: AddOn[]; portion?: Portion; barUnit?: BarUnit }) => void;
  updateCartItem: (cartId: string, qty: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  serviceMode: ServiceMode;
  setServiceMode: (m: ServiceMode) => void;
  currentTable?: string;
  setCurrentTable: (t?: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  business: null,
  setBusiness: (business) => set({ business }),
  userRole: 'owner',
  setUserRole: (role) => set({ userRole: role }),
  products: [],
  setProducts: (products) => set({ products }),
  cart: [],
  addToCart: (item, opts = {}) => {
    const { addOns = [], portion, barUnit } = opts;
    const state = get();
    const fp = addOnFP(addOns) + (portion?.id ?? '') + (barUnit ?? '');
    const idx = state.cart.findIndex(c =>
      c.menuItemId === item.id &&
      addOnFP(c.selectedAddOns) + (c.selectedPortion?.id ?? '') + (c.barUnit ?? '') === fp
    );
    if (idx >= 0) {
      set({ cart: state.cart.map((c, i) => i === idx ? { ...c, qty: c.qty + 1 } : c) });
    } else {
      const basePrice = portion ? portion.pricePaise : item.pricePaise;
      const addOnTotal = addOns.reduce((s, a) => s + a.pricePaise, 0);
      set({
        cart: [...state.cart, {
          cartId: crypto.randomUUID(),
          menuItemId: item.id,
          name: item.name + (portion ? ` (${portion.label})` : '') + (barUnit ? ` [${barUnit}]` : ''),
          unitPricePaise: basePrice + addOnTotal,
          qty: 1,
          selectedAddOns: addOns,
          selectedPortion: portion,
          barUnit,
        }]
      });
    }
  },
  updateCartItem: (cartId, qty) => {
    const { cart } = get();
    if (qty <= 0) set({ cart: cart.filter(c => c.cartId !== cartId) });
    else set({ cart: cart.map(c => c.cartId === cartId ? { ...c, qty } : c) });
  },
  removeFromCart: (cartId) => set({ cart: get().cart.filter(c => c.cartId !== cartId) }),
  clearCart: () => set({ cart: [], currentTable: undefined }),
  serviceMode: 'dine-in',
  setServiceMode: (mode) => set({ serviceMode: mode }),
  currentTable: undefined,
  setCurrentTable: (table) => set({ currentTable: table }),
}));
