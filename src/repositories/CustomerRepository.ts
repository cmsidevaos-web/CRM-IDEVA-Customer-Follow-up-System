import { supabase } from '../services/supabaseClient';
import { customerFromDb, customerToDb } from '../services/supabaseDataStore';
import { Customer } from '../types';

export interface CustomerQueryFilters {
  search?: string;
  status?: string;
  salesOwner?: string;
  tier?: string;
  repeatStatus?: string;
  riskStatus?: string;
  isDeleted?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class CustomerRepository {
  /**
   * Fetch customers from Supabase with full search, filter, sort, and pagination.
   */
  async find(filters: CustomerQueryFilters = {}): Promise<{ customers: Customer[]; totalCount: number; error?: string }> {
    try {
      let query = supabase.from('customers').select('*', { count: 'exact' });

      // Soft delete filter
      if (filters.isDeleted === true) {
        query = query.not('deleted_at', 'is', null);
      }

      // Search across company_name, contact_name, phone, line_id, email
      if (filters.search && filters.search.trim() !== '') {
        const q = filters.search.trim();
        query = query.or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,phone.ilike.%${q}%,line_id.ilike.%${q}%,email.ilike.%${q}%`);
      }

      // Filters
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters.salesOwner && filters.salesOwner !== 'ALL') {
        query = query.eq('sales_owner', filters.salesOwner);
      }
      if (filters.tier && filters.tier !== 'ALL') {
        query = query.eq('tier', filters.tier);
      }
      if (filters.repeatStatus && filters.repeatStatus !== 'ALL') {
        query = query.eq('repeat_status', filters.repeatStatus);
      }
      if (filters.riskStatus && filters.riskStatus !== 'ALL') {
        query = query.eq('risk_status', filters.riskStatus);
      }

      // Sorting
      const sortBy = filters.sortBy || 'created_at';
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Pagination
      if (filters.page && filters.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('[CustomerRepository.find error]:', error.message);
        return { customers: [], totalCount: 0, error: error.message };
      }

      const customers = (data || []).map(customerFromDb);
      return { customers, totalCount: count || customers.length };
    } catch (err: any) {
      console.error('[CustomerRepository.find exception]:', err);
      return { customers: [], totalCount: 0, error: err?.message || String(err) };
    }
  }

  /**
   * Find a single customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return customerFromDb(data);
    } catch (err) {
      console.error('[CustomerRepository.findById exception]:', err);
      return null;
    }
  }

  /**
   * Save or Update customer in Supabase
   */
  async save(customer: Customer): Promise<Customer> {
    const dbRow = customerToDb(customer);

    // 1. Try Upsert with onConflict on 'id'
    const { data, error } = await supabase
      .from('customers')
      .upsert(dbRow, { onConflict: 'id' })
      .select();

    if (!error && data && data.length > 0) {
      return customerFromDb(data[0]);
    }

    // 2. If upsert had issue or returned empty, try direct Update
    const { data: updateData, error: updateError } = await supabase
      .from('customers')
      .update(dbRow)
      .eq('id', customer.id)
      .select();

    if (!updateError && updateData && updateData.length > 0) {
      return customerFromDb(updateData[0]);
    }

    // 3. If update returned empty, try Insert
    const { data: insertData, error: insertError } = await supabase
      .from('customers')
      .insert(dbRow)
      .select();

    if (!insertError && insertData && insertData.length > 0) {
      return customerFromDb(insertData[0]);
    }

    if (error || updateError || insertError) {
      const errMsg = error?.message || updateError?.message || insertError?.message || 'Database error';
      console.error('[CustomerRepository.save error]:', errMsg, { dbRow });
      throw new Error(`Failed to save customer to Supabase: ${errMsg}`);
    }

    return customerFromDb(dbRow);
  }

  /**
   * Soft Delete or Hard Delete customer in Supabase
   */
  async delete(id: string, softDelete = false): Promise<boolean> {
    try {
      if (softDelete) {
        const { error } = await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (!error) return true;
      }
      // Hard delete
      const { error: delError } = await supabase.from('customers').delete().eq('id', id);
      if (delError) {
        console.error('[CustomerRepository.delete error]:', delError.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[CustomerRepository.delete exception]:', err);
      return false;
    }
  }

  /**
   * Restore a soft-deleted customer
   */
  async restore(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('customers').update({ deleted_at: null }).eq('id', id);
      return !error;
    } catch (err) {
      console.error('[CustomerRepository.restore exception]:', err);
      return false;
    }
  }

  /**
   * Seed customers batch to Supabase if database table is empty
   */
  async seedBatch(customers: Customer[]): Promise<void> {
    const dbRows = customers.map(customerToDb);
    for (let i = 0; i < dbRows.length; i += 50) {
      const chunk = dbRows.slice(i, i + 50);
      const { error } = await supabase.from('customers').upsert(chunk);
      if (error) {
        console.warn('[CustomerRepository.seedBatch chunk error]:', error.message);
      }
    }
  }
}

export const customerRepository = new CustomerRepository();
