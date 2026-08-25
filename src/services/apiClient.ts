import {
  fetchCustomersFromSupabase,
  upsertCustomerSupabase,
  deleteCustomerSupabase,
  fetchActivitiesFromSupabase,
  addActivitySupabase,
  fetchOrdersFromSupabase,
  addOrderSupabase,
  fetchDocumentsFromSupabase,
  addDocumentSupabase,
  deleteDocumentSupabase,
  fetchNotesFromSupabase,
  addNoteSupabase,
  fetchTelegramSettingsFromSupabase,
  saveTelegramSettingsSupabase,
  fetchTelegramLogsFromSupabase,
  fetchTelegramQueueFromSupabase,
  fetchTelegramTopicsFromSupabase,
  saveTelegramTopicsSupabase,
} from './supabaseDataStore';
import { Activity, Customer, CustomerDocument, InternalNote, Order, TelegramSettings, TelegramTopic } from '../types';

/**
 * Safely tries server API endpoint first; if API server is unreachable (e.g. static host like Netlify),
 * seamlessly falls back to direct Supabase JS client operations.
 */
export async function safeFetchJson<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[apiClient] API fetch to ${url} unavailable, using direct Supabase fallback`);
  }

  if (fallbackFn) {
    return await fallbackFn();
  }

  throw new Error(`API Endpoint ${url} unavailable and no fallback configured.`);
}

export const apiClient = {
  async getCustomers(): Promise<{ customers: Customer[]; fromSupabase: boolean; tableMissing?: boolean }> {
    return safeFetchJson(
      '/api/customers',
      undefined,
      async () => {
        const res = await fetchCustomersFromSupabase();
        return { customers: res.data, fromSupabase: res.fromSupabase, tableMissing: res.tableMissing };
      }
    );
  },

  async createCustomer(customer: Customer): Promise<Customer> {
    return safeFetchJson(
      '/api/customers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer),
      },
      async () => await upsertCustomerSupabase(customer)
    );
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    return safeFetchJson(
      `/api/customers/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      },
      async () => {
        const { data: rawCustomers } = await fetchCustomersFromSupabase();
        const found = rawCustomers.find((c) => c.id === id);
        const updated: Customer = {
          ...(found || {} as Customer),
          ...updates,
          id,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        return await upsertCustomerSupabase(updated);
      }
    );
  },

  async deleteCustomer(id: string): Promise<boolean> {
    return safeFetchJson(
      `/api/customers/${id}`,
      { method: 'DELETE' },
      async () => await deleteCustomerSupabase(id)
    );
  },

  async getActivities(): Promise<Activity[]> {
    return safeFetchJson(
      '/api/activities',
      undefined,
      async () => {
        const res = await fetchActivitiesFromSupabase();
        return res.data;
      }
    );
  },

  async createActivity(activity: Activity): Promise<Activity> {
    return safeFetchJson(
      '/api/activities',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      },
      async () => await addActivitySupabase(activity)
    );
  },

  async getOrders(): Promise<Order[]> {
    return safeFetchJson(
      '/api/orders',
      undefined,
      async () => {
        const res = await fetchOrdersFromSupabase();
        return res.data;
      }
    );
  },

  async createOrder(order: Order): Promise<Order> {
    return safeFetchJson(
      '/api/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      },
      async () => await addOrderSupabase(order)
    );
  },

  async getNotes(): Promise<InternalNote[]> {
    return safeFetchJson('/api/notes', undefined, async () => await fetchNotesFromSupabase());
  },

  async createNote(note: InternalNote): Promise<InternalNote> {
    return safeFetchJson(
      '/api/notes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      },
      async () => await addNoteSupabase(note)
    );
  },

  async getDocuments(): Promise<CustomerDocument[]> {
    return safeFetchJson('/api/documents', undefined, async () => await fetchDocumentsFromSupabase());
  },

  async createDocument(doc: CustomerDocument): Promise<CustomerDocument> {
    return safeFetchJson(
      '/api/documents',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      },
      async () => await addDocumentSupabase(doc)
    );
  },

  async deleteDocument(id: string): Promise<boolean> {
    return safeFetchJson(
      `/api/documents/${id}`,
      { method: 'DELETE' },
      async () => await deleteDocumentSupabase(id)
    );
  },

  async getTelegramSettings(): Promise<TelegramSettings> {
    return safeFetchJson(
      '/api/telegram/settings',
      undefined,
      async () => await fetchTelegramSettingsFromSupabase()
    );
  },

  async saveTelegramSettings(settings: TelegramSettings): Promise<TelegramSettings> {
    return safeFetchJson(
      '/api/telegram/settings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      },
      async () => await saveTelegramSettingsSupabase(settings)
    );
  },

  async getTelegramLogs() {
    return safeFetchJson(
      '/api/telegram/logs',
      undefined,
      async () => await fetchTelegramLogsFromSupabase()
    );
  },

  async getTelegramQueue() {
    return safeFetchJson(
      '/api/telegram/queue',
      undefined,
      async () => await fetchTelegramQueueFromSupabase()
    );
  },

  async getTelegramTopics(): Promise<TelegramTopic[]> {
    return safeFetchJson(
      '/api/telegram/topics',
      undefined,
      async () => await fetchTelegramTopicsFromSupabase()
    );
  },

  async saveTelegramTopics(topics: TelegramTopic[]): Promise<TelegramTopic[]> {
    return safeFetchJson(
      '/api/telegram/topics',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topics),
      },
      async () => await saveTelegramTopicsSupabase(topics)
    );
  },
};
