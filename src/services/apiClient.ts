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
  fetchUsersFromSupabase,
  upsertUserSupabase,
  deleteUserSupabase,
  seedUsersToSupabase,
  getUserByUsernameSupabase,
} from './supabaseDataStore';
import { Activity, AppUser, Customer, CustomerDocument, InternalNote, Order, TelegramSettings, TelegramTopic } from '../types';

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
    if (!res.ok) {
      console.warn(`[apiClient] HTTP ${res.status} from ${url}, attempting direct Supabase fallback...`);
    }
  } catch (err) {
    console.warn(`[apiClient] API fetch to ${url} unavailable, using direct Supabase fallback:`, err);
  }

  if (fallbackFn) {
    try {
      return await fallbackFn();
    } catch (fallbackErr: any) {
      console.error(`[apiClient] Direct Supabase fallback also encountered error for ${url}:`, fallbackErr);
      throw fallbackErr;
    }
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

  async getUsers(): Promise<{ users: AppUser[]; fromSupabase: boolean; tableMissing?: boolean }> {
    return safeFetchJson(
      '/api/users',
      undefined,
      async () => {
        const res = await fetchUsersFromSupabase();
        return { users: res.data, fromSupabase: res.fromSupabase, tableMissing: res.tableMissing };
      }
    );
  },

  async saveUser(user: AppUser): Promise<AppUser> {
    return safeFetchJson(
      '/api/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      },
      async () => await upsertUserSupabase(user)
    );
  },

  async deleteUser(id: string): Promise<boolean> {
    return safeFetchJson(
      `/api/users/${id}`,
      { method: 'DELETE' },
      async () => await deleteUserSupabase(id)
    );
  },

  async seedUsers(users: AppUser[]): Promise<boolean> {
    return safeFetchJson(
      '/api/users/seed',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      },
      async () => {
        await seedUsersToSupabase(users);
        return true;
      }
    );
  },

  async login(username: string, password?: string): Promise<{ success: boolean; user?: AppUser; message?: string }> {
    return safeFetchJson(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      },
      async () => {
        const user = await getUserByUsernameSupabase(username);
        if (!user) {
          return { success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' };
        }
        if (password && user.password && user.password !== password) {
          return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
        }
        if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
          return { success: false, message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว' };
        }
        return { success: true, user };
      }
    );
  },

  async uploadAvatar(
    fileData: string,
    fileName?: string
  ): Promise<{ success: boolean; url: string; fileName?: string; error?: string }> {
    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, fileName }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, url: '', error: errData.error || 'ไม่สามารถอัปโหลดรูปภาพได้' };
    } catch (e: any) {
      console.warn('API upload error, using direct dataUrl link fallback:', e);
      return { success: true, url: fileData, fileName: fileName || 'avatar-local' };
    }
  },

  async getBackupData(): Promise<{ success: boolean; filename: string; backupData: any }> {
    return safeFetchJson(
      '/api/backup',
      undefined,
      async () => {
        const [
          customersRes,
          activitiesRes,
          ordersRes,
          documents,
          notes,
          usersRes,
          telegramSettings,
          telegramTopics,
          telegramLogs,
          telegramQueue
        ] = await Promise.all([
          fetchCustomersFromSupabase(),
          fetchActivitiesFromSupabase(),
          fetchOrdersFromSupabase(),
          fetchDocumentsFromSupabase(),
          fetchNotesFromSupabase(),
          fetchUsersFromSupabase(),
          fetchTelegramSettingsFromSupabase(),
          fetchTelegramTopicsFromSupabase(),
          fetchTelegramLogsFromSupabase(),
          fetchTelegramQueueFromSupabase(),
        ]);

        const timestamp = new Date().toISOString();
        const dateStr = timestamp.split('T')[0];
        const timeStr = timestamp.split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
        const filename = `crm_backup_ideva_${dateStr}_${timeStr}.json`;

        const backupData = {
          metadata: {
            systemName: 'IDEVA CRM & Customer Intelligence Platform',
            backupDate: timestamp,
            version: '2.5.0',
            environment: 'production',
            totalRecords: {
              customers: customersRes.data.length,
              activities: activitiesRes.data.length,
              orders: ordersRes.data.length,
              documents: documents.length,
              notes: notes.length,
              users: usersRes.data.length,
              telegramLogs: telegramLogs.length,
              telegramQueue: telegramQueue.length,
            },
          },
          customers: customersRes.data,
          activities: activitiesRes.data,
          orders: ordersRes.data,
          documents,
          notes,
          users: usersRes.data,
          telegram: {
            settings: telegramSettings,
            topics: telegramTopics,
            logs: telegramLogs,
            queue: telegramQueue,
          },
        };

        return {
          success: true,
          filename,
          backupData,
        };
      }
    );
  },

  async downloadBackupFile(): Promise<{ success: boolean; filename: string; count: number }> {
    try {
      const res = await this.getBackupData();
      if (!res || !res.backupData) {
        throw new Error('ไม่สามารถดึงข้อมูลสำรองจากระบบได้');
      }

      const jsonStr = JSON.stringify(res.backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.filename || `crm_backup_ideva_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const total = Object.values(res.backupData.metadata?.totalRecords || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0);
      return { success: true, filename: link.download, count: Number(total) };
    } catch (err: any) {
      console.error('Download backup error:', err);
      throw err;
    }
  },
};

