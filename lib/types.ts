// All money stored as INTEGER PAISE (1 ₹ = 100 paise)

export type BusinessType = "cafe" | "restaurant" | "food_truck" | "kiosk" | "bakery" | "bar" | "franchise";
export type UserRole = 'owner' | 'cashier';
export type ServiceMode = 'dine-in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'upi' | 'split';
export type BarUnit = 'ml' | 'peg' | 'bottle';

export interface AddOn {
  id: string;
  name: string;
  pricePaise: number;
}

export interface Portion {
  id: string;
  label: string; // e.g. "Half", "Full", "250ml", "500ml"
  pricePaise: number;
}

export interface MenuItem {
  id: string;
  businessId?: string;
  name: string;
  categoryId?: string;
  pricePaise: number;
  costPricePaise?: number;
  isVeg: boolean;
  isAvailable: boolean;
  isBarItem?: boolean;
  barUnits?: { ml?: boolean; peg?: boolean; bottle?: boolean };
  portions?: Portion[];
  addOns: AddOn[];
  hsnCode?: string;
  taxRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  businessId?: string;
  name: string;
  sortOrder: number;
  isBarCategory?: boolean;
  createdAt: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string; // kg, litre, piece, etc.
  stockQty: number;
  costPerUnit: number; // paise
  reorderLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinishedGood {
  id: string;
  name: string;
  pricePaise: number;
  costPricePaise?: number;
  stockQty: number;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  cartId: string;
  menuItemId: string;
  name: string;
  unitPricePaise: number;
  qty: number;
  selectedAddOns: AddOn[];
  selectedPortion?: Portion;
  barUnit?: BarUnit;
  notes?: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  label?: string;
  status: 'available' | 'occupied';
  cart: CartItem[];
  openedAt?: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  userId?: string;
  name: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  businessType: BusinessType;
  gstNumber?: string;
  gstPercent: number;
  currencySymbol: string;
  ownerPin?: string;
  barModeEnabled?: boolean;
  portionsEnabled?: boolean;
  tableCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  billNumber: string;
  businessId?: string;
  userId?: string;
  orderNumber: string;
  serviceMode: ServiceMode;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotalPaise: number;
  discountPaise: number;
  discountType: "flat" | "percent";
  discountValue: number;
  gstPercent: number;
  gstPaise: number;
  totalPaise: number;
  paymentMethod: PaymentMethod;
  cashReceivedPaise: number;
  changePaise: number;
  upiAmountPaise: number;
  status: 'completed' | 'void';
  voidReason?: string;
  voidedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: "pending" | "synced" | "failed";
}

export interface SyncQueueItem {
  id: string;
  businessId: string;
  tableName: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  synced: boolean;
  createdAt: string;
}
