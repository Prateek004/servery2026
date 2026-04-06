'use client';

import { dbGetPendingSyncItems, dbMarkSynced, dbClearSyncedItems } from '@/lib/db';
import { supabase } from '@/lib/supabase/client';

export async function syncToSupabase(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  try {
    const pending = await dbGetPendingSyncItems();
    
    for (const item of pending) {
      try {
        if (item.operation === 'insert') {
          await supabase.from(item.tableName).insert(item.data);
        } else if (item.operation === 'update') {
          await supabase.from(item.tableName).update(item.data).eq('id', item.data.id);
        } else if (item.operation === 'delete') {
          await supabase.from(item.tableName).delete().eq('id', item.data.id);
        }
        
        await dbMarkSynced(item.id);
      } catch (error) {
        console.error('Sync failed for item:', item.id, error);
      }
    }
    
    // Clean up synced items older than 7 days
    await dbClearSyncedItems();
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Auto-sync on page load and when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncToSupabase);
  window.addEventListener('load', syncToSupabase);
  
  // Periodic sync every 30 seconds
  setInterval(syncToSupabase, 30000);
}
