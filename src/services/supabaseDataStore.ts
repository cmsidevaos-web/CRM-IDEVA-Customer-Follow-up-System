import { defaultTelegramSettings, defaultTelegramTopics } from './telegramService';
import { supabase } from './supabaseClient';
import {
  Activity,
  Customer,
  CustomerDocument,
  InternalNote,
  NotificationItem,
  Order,
  TelegramNotificationLog,
  TelegramQueueItem,
  TelegramSettings,
  TelegramTopic,
} from '../types';
import { customerRepository } from '../repositories/CustomerRepository';
import { activityRepository } from '../repositories/ActivityRepository';
import { orderRepository } from '../repositories/OrderRepository';
import { documentRepository } from '../repositories/DocumentRepository';
import { noteRepository } from '../repositories/NoteRepository';
import { notificationRepository } from '../repositories/NotificationRepository';
import { telegramRepository } from '../repositories/TelegramRepository';

export let isSupabaseConnected = true;

// ==========================================
// MAPPERS (CamelCase <-> SnakeCase)
// ==========================================

export function customerToDb(c: Customer) {
  return {
    id: c.id,
    company_name: c.companyName,
    contact_name: c.contactName,
    phone: c.phone,
    line_id: c.lineId,
    email: c.email,
    interested_products: c.interestedProducts,
    source: c.source,
    sales_owner: c.salesOwner,
    status: c.status,
    tier: c.tier,
    tax_id: c.taxId || null,
    address: c.address || null,
    facebook: c.facebook || null,
    next_follow_up_date: c.nextFollowUpDate,
    next_follow_up_time: c.nextFollowUpTime,
    next_action: c.nextAction,
    total_purchases: c.totalPurchases || 0,
    total_orders_count: c.totalOrdersCount || 0,
    last_order_date: c.lastOrderDate || null,
    last_delivery_date: c.lastDeliveryDate || null,
    avg_reorder_cycle_days: c.avgReorderCycleDays || 60,
    next_reorder_date: c.nextReorderDate || null,
    follow_up_start_date: c.followUpStartDate || null,
    repeat_status: c.repeatStatus || 'UPCOMING',
    risk_status: c.riskStatus || 'NORMAL',
    days_since_last_order: c.daysSinceLastOrder || 0,
    expected_lost_revenue: c.expectedLostRevenue || 0,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export function customerFromDb(row: any): Customer {
  return {
    id: row.id,
    companyName: row.company_name || row.companyName || '',
    contactName: row.contact_name || row.contactName || '',
    phone: row.phone || '',
    lineId: row.line_id || row.lineId || '',
    email: row.email || '',
    interestedProducts: row.interested_products || row.interestedProducts || '',
    source: row.source || 'Direct',
    salesOwner: row.sales_owner || row.salesOwner || '',
    status: row.status || 'NEW',
    tier: row.tier || 'GENERAL',
    taxId: row.tax_id || row.taxId,
    address: row.address,
    facebook: row.facebook,
    nextFollowUpDate: row.next_follow_up_date || row.nextFollowUpDate || '',
    nextFollowUpTime: row.next_follow_up_time || row.nextFollowUpTime || '',
    nextAction: row.next_action || row.nextAction || '',
    totalPurchases: Number(row.total_purchases || row.totalPurchases || 0),
    totalOrdersCount: Number(row.total_orders_count || row.totalOrdersCount || 0),
    lastOrderDate: row.last_order_date || row.lastOrderDate,
    lastDeliveryDate: row.last_delivery_date || row.lastDeliveryDate,
    avgReorderCycleDays: Number(row.avg_reorder_cycle_days || row.avgReorderCycleDays || 60),
    nextReorderDate: row.next_reorder_date || row.nextReorderDate,
    followUpStartDate: row.follow_up_start_date || row.followUpStartDate,
    repeatStatus: row.repeat_status || row.repeatStatus || 'UPCOMING',
    riskStatus: row.risk_status || row.riskStatus || 'NORMAL',
    daysSinceLastOrder: Number(row.days_since_last_order || row.daysSinceLastOrder || 0),
    expectedLostRevenue: Number(row.expected_lost_revenue || row.expectedLostRevenue || 0),
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString().split('T')[0],
  };
}

export function activityToDb(a: Activity) {
  return {
    id: a.id,
    customer_id: a.customerId,
    customer_name: a.customerName,
    type: a.type,
    summary: a.summary,
    detail: a.detail,
    result: a.result,
    next_action: a.nextAction,
    follow_up_date: a.followUpDate,
    follow_up_time: a.followUpTime,
    sales_owner: a.salesOwner,
    status: a.status,
    attachments: a.attachments || [],
    created_at: a.createdAt,
  };
}

export function activityFromDb(row: any): Activity {
  return {
    id: row.id,
    customerId: row.customer_id || row.customerId,
    customerName: row.customer_name || row.customerName || '',
    type: row.type || 'CALL',
    summary: row.summary || '',
    detail: row.detail || '',
    result: row.result || '',
    nextAction: row.next_action || row.nextAction || '',
    followUpDate: row.follow_up_date || row.followUpDate || '',
    followUpTime: row.follow_up_time || row.followUpTime || '',
    salesOwner: row.sales_owner || row.salesOwner || '',
    status: row.status || 'NEW',
    attachments: row.attachments || [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
}

export function orderToDb(o: Order) {
  return {
    id: o.id,
    customer_id: o.customerId,
    customer_name: o.customerName,
    order_date: o.orderDate,
    delivery_date: o.deliveryDate,
    product_name: o.productName,
    quantity: o.quantity,
    unit_price: o.unitPrice,
    total_amount: o.totalAmount,
    status: o.status,
    reorder_cycle_days: o.reorderCycleDays,
    next_reorder_date: o.nextReorderDate,
    follow_up_start_date: o.followUpStartDate,
    repeat_status: o.repeatStatus,
    created_at: o.createdAt,
  };
}

export function orderFromDb(row: any): Order {
  return {
    id: row.id,
    customerId: row.customer_id || row.customerId,
    customerName: row.customer_name || row.customerName || '',
    orderDate: row.order_date || row.orderDate || '',
    deliveryDate: row.delivery_date || row.deliveryDate || '',
    productName: row.product_name || row.productName || '',
    quantity: Number(row.quantity || 1),
    unitPrice: Number(row.unit_price || row.unitPrice || 0),
    totalAmount: Number(row.total_amount || row.totalAmount || 0),
    status: row.status || 'CONFIRMED',
    reorderCycleDays: Number(row.reorder_cycle_days || row.reorderCycleDays || 60),
    nextReorderDate: row.next_reorder_date || row.nextReorderDate || '',
    followUpStartDate: row.follow_up_start_date || row.followUpStartDate || '',
    repeatStatus: row.repeat_status || row.repeatStatus || 'UPCOMING',
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
  };
}

export function documentToDb(d: CustomerDocument) {
  return {
    id: d.id,
    customer_id: d.customerId,
    name: d.name,
    type: d.type,
    file_url: d.fileUrl,
    file_size: d.fileSize,
    uploaded_by: d.uploadedBy,
    created_at: d.createdAt,
  };
}

export function documentFromDb(row: any): CustomerDocument {
  return {
    id: row.id,
    customerId: row.customer_id || row.customerId,
    name: row.name || '',
    type: row.type || 'QUOTATION',
    fileUrl: row.file_url || row.fileUrl || '',
    fileSize: row.file_size || row.fileSize || '1.0 MB',
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
    uploadedBy: row.uploaded_by || row.uploadedBy || 'System',
  };
}

export function noteToDb(n: InternalNote) {
  return {
    id: n.id,
    customer_id: n.customerId,
    content: n.content,
    is_pinned: n.isPinned,
    author: n.author,
    created_at: n.createdAt,
  };
}

export function noteFromDb(row: any): InternalNote {
  return {
    id: row.id,
    customerId: row.customer_id || row.customerId,
    content: row.content || '',
    isPinned: Boolean(row.is_pinned ?? row.isPinned ?? false),
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
    author: row.author || 'Sale Lead',
  };
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || error.details || '';
  const code = error.code || '';
  return code === 'PGRST205' || code === 'PGRST125' || msg.includes('Could not find the table') || msg.includes('Invalid path') || msg.includes('404');
}

// ==========================================
// CUSTOMERS SUPABASE API
// ==========================================

export async function fetchCustomersFromSupabase(): Promise<{ data: Customer[]; fromSupabase: boolean; tableMissing?: boolean; error?: string }> {
  try {
    const res = await customerRepository.find();
    if (!res.error) {
      isSupabaseConnected = true;
      return { data: res.customers, fromSupabase: true };
    } else {
      if (isTableMissingError(res.error)) {
        return { data: [], fromSupabase: false, tableMissing: true, error: res.error };
      }
      return { data: [], fromSupabase: false, error: res.error };
    }
  } catch (err: any) {
    return { data: [], fromSupabase: false, error: err?.message };
  }
}

export async function upsertCustomerSupabase(customer: Customer): Promise<Customer> {
  const saved = await customerRepository.save(customer);
  isSupabaseConnected = true;
  return saved;
}

export async function deleteCustomerSupabase(id: string): Promise<boolean> {
  const ok = await customerRepository.delete(id);
  if (ok) isSupabaseConnected = true;
  return ok;
}

export async function seedCustomersToSupabase(items: Customer[]) {
  await customerRepository.seedBatch(items);
  isSupabaseConnected = true;
}

// ==========================================
// ACTIVITIES SUPABASE API
// ==========================================

export async function fetchActivitiesFromSupabase(): Promise<{ data: Activity[]; fromSupabase: boolean }> {
  try {
    const list = await activityRepository.find();
    isSupabaseConnected = true;
    return { data: list, fromSupabase: true };
  } catch (e) {
    return { data: [], fromSupabase: false };
  }
}

export async function addActivitySupabase(act: Activity): Promise<Activity> {
  const saved = await activityRepository.save(act);
  isSupabaseConnected = true;
  return saved;
}

export async function seedActivitiesToSupabase(items: Activity[]) {
  await activityRepository.seedBatch(items);
}

// ==========================================
// ORDERS SUPABASE API
// ==========================================

export async function fetchOrdersFromSupabase(): Promise<{ data: Order[]; fromSupabase: boolean }> {
  try {
    const list = await orderRepository.find();
    isSupabaseConnected = true;
    return { data: list, fromSupabase: true };
  } catch (e) {
    return { data: [], fromSupabase: false };
  }
}

export async function addOrderSupabase(ord: Order): Promise<Order> {
  const saved = await orderRepository.save(ord);
  isSupabaseConnected = true;
  return saved;
}

export async function seedOrdersToSupabase(items: Order[]) {
  await orderRepository.seedBatch(items);
}

// ==========================================
// DOCUMENTS & NOTES SUPABASE API
// ==========================================

export async function fetchDocumentsFromSupabase(): Promise<CustomerDocument[]> {
  return await documentRepository.find();
}

export async function addDocumentSupabase(doc: CustomerDocument): Promise<CustomerDocument> {
  return await documentRepository.save(doc);
}

export async function deleteDocumentSupabase(id: string): Promise<boolean> {
  return await documentRepository.delete(id);
}

export async function fetchNotesFromSupabase(): Promise<InternalNote[]> {
  return await noteRepository.find();
}

export async function addNoteSupabase(note: InternalNote): Promise<InternalNote> {
  return await noteRepository.save(note);
}

// ==========================================
// TELEGRAM SETTINGS & LOGS SUPABASE API
// ==========================================

export async function fetchTelegramSettingsFromSupabase(): Promise<TelegramSettings> {
  return await telegramRepository.getSettings();
}

export async function saveTelegramSettingsSupabase(settings: TelegramSettings): Promise<TelegramSettings> {
  return await telegramRepository.saveSettings(settings);
}

export async function fetchTelegramLogsFromSupabase(): Promise<TelegramNotificationLog[]> {
  return await telegramRepository.getLogs();
}

export async function addTelegramLogSupabase(log: TelegramNotificationLog) {
  return await telegramRepository.addLog(log);
}

export async function fetchTelegramQueueFromSupabase(): Promise<TelegramQueueItem[]> {
  return await telegramRepository.getQueue();
}

export async function pushTelegramQueueSupabase(item: TelegramQueueItem) {
  return await telegramRepository.pushQueue(item);
}

export async function updateTelegramQueueItemSupabase(item: TelegramQueueItem) {
  return await telegramRepository.updateQueue(item);
}

export async function fetchTelegramTopicsFromSupabase(): Promise<TelegramTopic[]> {
  return await telegramRepository.getTopics();
}

export async function saveTelegramTopicsSupabase(topicsList: TelegramTopic[]): Promise<TelegramTopic[]> {
  return await telegramRepository.saveTopics(topicsList);
}
