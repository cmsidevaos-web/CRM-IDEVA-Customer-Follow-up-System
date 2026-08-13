import { supabase } from '../services/supabaseClient';
import { NotificationItem } from '../types';

export function notificationFromDb(row: any): NotificationItem {
  return {
    id: row.id,
    title: row.title || '',
    message: row.message || '',
    type: row.type || 'FOLLOWUP_TODAY',
    customerId: row.customer_id || row.customerId || '',
    isRead: Boolean(row.is_read ?? row.isRead ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export function notificationToDb(n: NotificationItem) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    customer_id: n.customerId,
    is_read: n.isRead,
    created_at: n.createdAt,
  };
}

export class NotificationRepository {
  async find(): Promise<NotificationItem[]> {
    try {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map(notificationFromDb);
    } catch (err) {
      return [];
    }
  }

  async save(notification: NotificationItem): Promise<NotificationItem> {
    const dbRow = notificationToDb(notification);
    const { data, error } = await supabase.from('notifications').upsert(dbRow).select().single();
    if (error) {
      console.error('[NotificationRepository.save error]:', error.message);
      throw new Error(`Failed to save notification: ${error.message}`);
    }
    return notificationFromDb(data || dbRow);
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      return !error;
    } catch (err) {
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      return !error;
    } catch (err) {
      return false;
    }
  }
}

export const notificationRepository = new NotificationRepository();
