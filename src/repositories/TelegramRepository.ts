import { supabase } from '../services/supabaseClient';
import { TelegramNotificationLog, TelegramQueueItem, TelegramSettings, TelegramTopic } from '../types';
import { defaultTelegramSettings, defaultTelegramTopics } from '../services/telegramService';

export class TelegramRepository {
  async getSettings(): Promise<TelegramSettings> {
    try {
      const { data, error } = await supabase.from('telegram_settings').select('*').eq('id', 'default').single();
      if (!error && data) {
        return {
          id: data.id,
          bot_token: data.bot_token,
          group_chat_id: data.group_chat_id,
          topic_id: data.topic_id || '',
          webhook_secret: data.webhook_secret || '',
          is_enabled: data.is_enabled ?? true,
          rules: data.rules || defaultTelegramSettings.rules,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      }
    } catch (e) {}
    return defaultTelegramSettings;
  }

  async saveSettings(settings: TelegramSettings): Promise<TelegramSettings> {
    try {
      await supabase.from('telegram_settings').upsert({
        id: 'default',
        bot_token: settings.bot_token,
        group_chat_id: settings.group_chat_id,
        topic_id: settings.topic_id,
        webhook_secret: settings.webhook_secret,
        is_enabled: settings.is_enabled,
        rules: settings.rules,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[TelegramRepository.saveSettings error]:', e);
    }
    return settings;
  }

  async getTopics(): Promise<TelegramTopic[]> {
    try {
      const { data, error } = await supabase.from('telegram_topics').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {}
    return defaultTelegramTopics;
  }

  async saveTopics(topics: TelegramTopic[]): Promise<TelegramTopic[]> {
    try {
      await supabase.from('telegram_topics').upsert(topics);
    } catch (e) {
      console.error('[TelegramRepository.saveTopics error]:', e);
    }
    return topics;
  }

  async getLogs(): Promise<TelegramNotificationLog[]> {
    try {
      const { data, error } = await supabase.from('telegram_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {}
    return [];
  }

  async addLog(log: TelegramNotificationLog): Promise<TelegramNotificationLog> {
    try {
      await supabase.from('telegram_logs').insert(log);
    } catch (e) {
      console.error('[TelegramRepository.addLog error]:', e);
    }
    return log;
  }

  async getQueue(): Promise<TelegramQueueItem[]> {
    try {
      const { data, error } = await supabase.from('telegram_queue').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {}
    return [];
  }

  async pushQueue(item: TelegramQueueItem): Promise<TelegramQueueItem> {
    try {
      await supabase.from('telegram_queue').insert(item);
    } catch (e) {
      console.error('[TelegramRepository.pushQueue error]:', e);
    }
    return item;
  }

  async updateQueue(item: TelegramQueueItem): Promise<TelegramQueueItem> {
    try {
      await supabase.from('telegram_queue').upsert(item);
    } catch (e) {
      console.error('[TelegramRepository.updateQueue error]:', e);
    }
    return item;
  }
}

export const telegramRepository = new TelegramRepository();
