import { supabase } from '../services/supabaseClient';
import { orderFromDb, orderToDb } from '../services/supabaseDataStore';
import { Order } from '../types';
import { INITIAL_ORDERS } from '../data/defaultData';
import { isNetworkOrFetchError, isTableMissingError } from '../utils/errorUtils';

const ORDERS_CACHE_KEY = 'ideva_crm_orders_cache';

function getStoredOrders(): Order[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(ORDERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_ORDERS];
}

function persistStoredOrders(orders: Order[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
    } catch (e) {}
  }
}

export class OrderRepository {
  private inMemoryOrders: Order[] = getStoredOrders();

  async find(customerId?: string): Promise<Order[]> {
    let list: Order[] = [];
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data.map(orderFromDb);
        if (!customerId) {
          this.inMemoryOrders = list;
          persistStoredOrders(list);
        }
        return list;
      }
    } catch (err) {
      // Graceful fallback to local cache
    }

    if (customerId) {
      return this.inMemoryOrders.filter((o) => o.customerId === customerId);
    }
    return this.inMemoryOrders;
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (!error && data) {
        return orderFromDb(data);
      }
    } catch (err) {}

    return this.inMemoryOrders.find((o) => o.id === id) || null;
  }

  async save(order: Order): Promise<Order> {
    const existingIdx = this.inMemoryOrders.findIndex((o) => o.id === order.id);
    if (existingIdx >= 0) {
      this.inMemoryOrders[existingIdx] = { ...this.inMemoryOrders[existingIdx], ...order };
    } else {
      this.inMemoryOrders.unshift(order);
    }
    persistStoredOrders(this.inMemoryOrders);

    const dbRow = orderToDb(order);
    try {
      const { data, error } = await supabase.from('orders').upsert(dbRow).select().single();
      if (!error && data) {
        return orderFromDb(data);
      }
    } catch (err: any) {}

    return order;
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryOrders = this.inMemoryOrders.filter((o) => o.id !== id);
    persistStoredOrders(this.inMemoryOrders);

    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }

  async seedBatch(orders: Order[]): Promise<void> {
    for (const ord of orders) {
      if (!this.inMemoryOrders.some((o) => o.id === ord.id)) {
        this.inMemoryOrders.push(ord);
      }
    }
    persistStoredOrders(this.inMemoryOrders);

    try {
      const dbRows = orders.map(orderToDb);
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabase.from('orders').upsert(chunk);
      }
    } catch (err) {}
  }
}

export const orderRepository = new OrderRepository();
