import Dexie, { Table } from 'dexie';
import type { Order, MenuItem, MenuCategory, Table as TableType, SyncQueueItem, RawMaterial, FinishedGood } from "@/lib/types";

export class BillmateDB extends Dexie {
  orders!: Table<Order, string>;
  menuItems!: Table<MenuItem, string>;
  categories!: Table<MenuCategory, string>;
  tables!: Table<TableType, string>;
  rawMaterials!: Table<RawMaterial, string>;
  finishedGoods!: Table<FinishedGood, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super('billmate_db_v3');
    this.version(1).stores({
      orders: 'id, orderNumber, createdAt, syncStatus',
      menuItems: 'id, businessId, categoryId, isBarItem',
      categories: 'id, businessId, sortOrder',
      tables: 'id, tableNumber, status',
      rawMaterials: 'id, name',
      finishedGoods: 'id, name',
      syncQueue: 'id, synced, createdAt',
    });
  }
}

export const db = new BillmateDB();

// ── Orders ────────────────────────────────────────────────────────────────────
export const dbSaveOrder = (o: Order) => db.orders.put(o);
export const dbGetAllOrders = () => db.orders.orderBy('createdAt').reverse().toArray();
export const dbGetTodaysOrders = async () => {
  const all = await dbGetAllOrders();
  const today = new Date().toISOString().slice(0, 10);
  return all.filter(o => o.createdAt.startsWith(today));
};
export const dbUpdateSyncStatus = (id: string, s: Order['syncStatus']) => db.orders.update(id, { syncStatus: s });
export const dbVoidOrder = (id: string, reason: string) =>
  db.orders.update(id, { status: 'void', voidReason: reason, voidedAt: new Date().toISOString() });

// ── Menu Items ─────────────────────────────────────────────────────────────────
export const dbSaveMenuItem = (i: MenuItem) => db.menuItems.put(i);
export const dbDeleteMenuItem = (id: string) => db.menuItems.delete(id);
export const dbGetAllMenuItems = () => db.menuItems.toArray();
export const dbGetAvailableMenuItems = async () => {
  const all = await db.menuItems.toArray();
  return all.filter(i => i.isAvailable !== false);
};
export const dbBulkSaveMenuItems = (items: MenuItem[]) => db.menuItems.bulkPut(items);

// ── Categories ────────────────────────────────────────────────────────────────
export const dbSaveCategory = (c: MenuCategory) => db.categories.put(c);
export const dbDeleteCategory = (id: string) => db.categories.delete(id);
export const dbGetAllCategories = () => db.categories.orderBy('sortOrder').toArray();
export const dbBulkSaveCategories = (cats: MenuCategory[]) => db.categories.bulkPut(cats);

// ── Tables ────────────────────────────────────────────────────────────────────
export const dbSaveTable = (t: TableType) => db.tables.put(t);
export const dbGetAllTables = () => db.tables.toArray();
export const dbDeleteTable = (id: string) => db.tables.delete(id);

// ── Raw Materials ─────────────────────────────────────────────────────────────
export const dbSaveRawMaterial = (r: RawMaterial) => db.rawMaterials.put(r);
export const dbDeleteRawMaterial = (id: string) => db.rawMaterials.delete(id);
export const dbGetAllRawMaterials = () => db.rawMaterials.toArray();

// ── Finished Goods ────────────────────────────────────────────────────────────
export const dbSaveFinishedGood = (f: FinishedGood) => db.finishedGoods.put(f);
export const dbDeleteFinishedGood = (id: string) => db.finishedGoods.delete(id);
export const dbGetAllFinishedGoods = () => db.finishedGoods.toArray();

// ── Sync Queue ────────────────────────────────────────────────────────────────
export const dbAddToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'createdAt'>) =>
  db.syncQueue.add({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...item } as SyncQueueItem);
export const dbGetPendingSyncItems = () => db.syncQueue.where('synced').equals(0 as any).toArray();
export const dbMarkSynced = (id: string) => db.syncQueue.update(id, { synced: true });
export const dbClearSyncedItems = () => db.syncQueue.where('synced').equals(1 as any).delete();
