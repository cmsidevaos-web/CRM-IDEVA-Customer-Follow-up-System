import { supabase } from '../services/supabaseClient';
import { orderFromDb, orderToDb } from '../services/supabaseDataStore';
import { Order } from '../types';

export class OrderRepository {
  async find(customerId?: string): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[OrderRepository.find error]:', error.message);
        return [];
      }
      return (data || []).map(orderFromDb);
    } catch (err) {
      console.error('[OrderRepository.find exception]:', err);
      return [];
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error || !data) return null;
      return orderFromDb(data);
    } catch (err) {
      return null;
    }
  }

  async save(order: Order): Promise<Order> {
    const dbRow = orderToDb(order);
    const { data, error } = await supabase.from('orders').upsert(dbRow).select().single();
    if (error) {
      console.error('[OrderRepository.save error]:', error.message);
      if (error.message.includes('notification_queue') || error.code === '42P01') {
        throw new Error(`Supabase Setup Required: ตาราง 'notification_queue' ยังไม่ถูกสร้างใน Supabase Database ทำให้ Database Trigger ของ Orders ติดขัด กรุณาไปที่เมนู 'ตั้งค่า Telegram' -> 'Database DDL & Triggers' และคลิกปุ่ม 'คัดลอก Quick Fix SQL' เพื่อนำไปรันใน Supabase SQL Editor`);
      }
      throw new Error(`Failed to save order: ${error.message}`);
    }
    return orderFromDb(data || dbRow);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      return !error;
    } catch (err) {
      return false;
    }
  }

  async seedBatch(orders: Order[]): Promise<void> {
    const dbRows = orders.map(orderToDb);
    for (let i = 0; i < dbRows.length; i += 50) {
      const chunk = dbRows.slice(i, i + 50);
      await supabase.from('orders').upsert(chunk);
    }
  }
}

export const orderRepository = new OrderRepository();
