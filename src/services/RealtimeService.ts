import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export class RealtimeService {
  private channel: RealtimeChannel | null = null;

  subscribeToChanges(onDataChange: (table: string, payload: any) => void) {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase
      .channel('public-crm-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('[Supabase Realtime Event]:', payload.table, payload.eventType);
          onDataChange(payload.table, payload);
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime Channel Status]:', status);
      });
  }

  unsubscribe() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

export const realtimeService = new RealtimeService();
