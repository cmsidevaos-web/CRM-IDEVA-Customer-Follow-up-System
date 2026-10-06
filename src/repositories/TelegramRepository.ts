import { supabase } from '../services/supabaseClient';
import { TelegramNotificationLog, TelegramQueueItem, TelegramSettings, TelegramTopic } from '../types';
import { defaultTelegramSettings, defaultTelegramTopics } from '../services/telegramService';
import { isNetworkOrFetchError } from '../utils/errorUtils';

const SETTINGS_KEY = 'ideva_crm_telegram_settings';
const LOGS_KEY = 'ideva_crm_telegram_logs';
const TOPICS_KEY = 'ideva_crm_telegram_topics';

export class TelegramRepository {
  private inMemorySettings: TelegramSettings = defaultTelegramSettings;
  private inMemoryTopics: TelegramTopic[] = defaultTelegramTopics;
  private inMemoryLogs: TelegramNotificationLog[] = [];
  private inMemoryQueue: TelegramQueueItem[] = [];

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const s = localStorage.getItem(SETTINGS_KEY);
        if (s) this.inMemorySettings = { ...defaultTelegramSettings, ...JSON.parse(s) };
        const l = localStorage.getItem(LOGS_KEY);
        if (l) this.inMemoryLogs = JSON.parse(l);
        const t = localStorage.getItem(TOPICS_KEY);
        if (t) this.inMemoryTopics = JSON.parse(t);
      } catch (e) {}
    }
  }

  async getSettings(): Promise<TelegramSettings> {
    try {
      const { data, error } = await supabase.from('telegram_settings').select('*').eq('id', 'default').single();
      if (!error && data) {
        this.inMemorySettings = {
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
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.inMemorySettings));
        }
        return this.inMemorySettings;
      }
    } catch (e) {}
    return this.inMemorySettings;
  }

  async saveSettings(settings: TelegramSettings): Promise<TelegramSettings> {
    this.inMemorySettings = settings;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (e) {}
    }

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
    } catch (e) {}
    return settings;
  }

  async getTopics(): Promise<TelegramTopic[]> {
    try {
      const { data, error } = await supabase.from('telegram_topics').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        this.inMemoryTopics = data;
        return data;
      }
    } catch (e) {}
    return this.inMemoryTopics;
  }

  async saveTopics(topics: TelegramTopic[]): Promise<TelegramTopic[]> {
    this.inMemoryTopics = topics;
    try {
      await supabase.from('telegram_topics').upsert(topics);
    } catch (e) {}
    return topics;
  }

  async getLogs(): Promise<TelegramNotificationLog[]> {
    try {
      const { data, error } = await supabase.from('telegram_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.inMemoryLogs = data;
        return data;
      }
    } catch (e) {}
    return this.inMemoryLogs;
  }

  async addLog(log: TelegramNotificationLog): Promise<TelegramNotificationLog> {
    this.inMemoryLogs.unshift(log);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LOGS_KEY, JSON.stringify(this.inMemoryLogs.slice(0, 100)));
      } catch (e) {}
    }
    try {
      await supabase.from('telegram_logs').insert(log);
    } catch (e) {}
    return log;
  }

  async getQueue(): Promise<TelegramQueueItem[]> {
    try {
      const { data, error } = await supabase.from('telegram_queue').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
      // Fallback check notification_queue
      const { data: nData, error: nErr } = await supabase.from('notification_queue').select('*').order('created_at', { ascending: false });
      if (!nErr && nData) return nData;
    } catch (e) {}
    return this.inMemoryQueue;
  }

  async pushQueue(item: TelegramQueueItem): Promise<TelegramQueueItem> {
    this.inMemoryQueue.push(item);
    try {
      const { error } = await supabase.from('telegram_queue').insert(item);
      if (error) {
        await supabase.from('notification_queue').insert({
          id: item.id,
          notification_type: item.type,
          topic_key: item.type.toLowerCase(),
          payload: item.payload,
          status: item.status.toLowerCase(),
          retry_count: item.retry_count,
        });
      }
    } catch (e) {}
    return item;
  }

  async updateQueue(item: TelegramQueueItem): Promise<TelegramQueueItem> {
    const idx = this.inMemoryQueue.findIndex((q) => q.id === item.id);
    if (idx >= 0) this.inMemoryQueue[idx] = item;

    try {
      const { error } = await supabase.from('telegram_queue').upsert(item);
      if (error) {
        await supabase.from('notification_queue').upsert({
          id: item.id,
          payload: item.payload,
          status: item.status.toLowerCase(),
          retry_count: item.retry_count,
          processed_at: item.processed_at,
        });
      }
    } catch (e) {}
    return item;
  }
}

export const telegramRepository = new TelegramRepository();
