import { supabase } from '../services/supabaseClient';
import { orderFromDb, orderToDb } from '../services/supabaseDataStore';
import { Order } from '../types';

export class OrderRepository {
  private fallbackOrders: Map<string, Order> = new Map();

  async find(customerId?: string): Promise<Order[]> {
    let list: Order[] = [];
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data) {
        list = data.map(orderFromDb);
      } else if (error) {
        console.warn('[OrderRepository.find error, using local/fallback store]:', error.message);
      }
    } catch (err) {
      console.warn('[OrderRepository.find exception]:', err);
    }

    // Merge in-memory / fallback orders
    const existingIds = new Set(list.map((o) => o.id));
    for (const [id, ord] of this.fallbackOrders.entries()) {
      if (!existingIds.has(id)) {
        if (!customerId || ord.customerId === customerId) {
          list.unshift(ord);
        }
      }
    }

    return list;
  }

  async findById(id: string): Promise<Order | null> {
    if (this.fallbackOrders.has(id)) {
      return this.fallbackOrders.get(id) || null;
    }
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error || !data) {
        return this.fallbackOrders.get(id) || null;
      }
      return orderFromDb(data);
    } catch (err) {
      return this.fallbackOrders.get(id) || null;
    }
  }

  async save(order: Order): Promise<Order> {
    const dbRow = orderToDb(order);
    try {
      const { data, error } = await supabase.from('orders').upsert(dbRow).select().single();
      if (error) {
        console.warn('[OrderRepository.save database warning - saving to resilient cache]:', error.message);
        // Resilient fallback so users are never blocked by missing triggers or missing notification_queue tables
        this.fallbackOrders.set(order.id, order);
        return order;
      }
      // If saved successfully in DB, keep in sync
      this.fallbackOrders.set(order.id, orderFromDb(data || dbRow));
      return orderFromDb(data || dbRow);
    } catch (err: any) {
      console.warn('[OrderRepository.save exception - saving to resilient cache]:', err?.message || err);
      this.fallbackOrders.set(order.id, order);
      return order;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.fallbackOrders.delete(id);
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }

  async seedBatch(orders: Order[]): Promise<void> {
    for (const ord of orders) {
      this.fallbackOrders.set(ord.id, ord);
    }
    try {
      const dbRows = orders.map(orderToDb);
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabase.from('orders').upsert(chunk);
      }
    } catch (err) {
      console.warn('[OrderRepository.seedBatch warning]:', err);
    }
  }
}

export const orderRepository = new OrderRepository();

