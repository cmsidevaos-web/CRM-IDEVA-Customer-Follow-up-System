import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export class RealtimeService {
  private channel: RealtimeChannel | null = null;

  subscribeToChanges(onDataChange: (table: string, payload: any) => void) {
    try {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }

      this.channel = supabase
        .channel('public-crm-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            onDataChange(payload.table, payload);
          }
        )
        .subscribe((status) => {
          // Status logged quietly
        });
    } catch (err) {
      // Realtime subscription offline fallback
    }
  }

  unsubscribe() {
    try {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    } catch (e) {}
  }
}

export const realtimeService = new RealtimeService();
