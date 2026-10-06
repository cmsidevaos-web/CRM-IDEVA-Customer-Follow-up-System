import { supabase } from '../services/supabaseClient';
import { customerFromDb, customerToDb } from '../services/supabaseDataStore';
import { Customer } from '../types';
import { INITIAL_CUSTOMERS } from '../data/defaultData';
import { isNetworkOrFetchError, isTableMissingError } from '../utils/errorUtils';

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

const CUSTOMERS_CACHE_KEY = 'ideva_crm_customers_cache';

function getStoredCustomers(): Customer[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(CUSTOMERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_CUSTOMERS];
}

function persistStoredCustomers(customers: Customer[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(customers));
    } catch (e) {}
  }
}

export class CustomerRepository {
  private inMemoryCustomers: Customer[] = getStoredCustomers();
  private isTableAvailable: boolean | null = null;

  resetTableState(): void {
    this.isTableAvailable = null;
  }

  getTableAvailable(): boolean | null {
    return this.isTableAvailable;
  }

  private filterInMemory(filters: CustomerQueryFilters = {}): { customers: Customer[]; totalCount: number } {
    let result = [...this.inMemoryCustomers];

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          (c.contactName && c.contactName.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.lineId && c.lineId.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.interestedProducts && c.interestedProducts.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.salesOwner && filters.salesOwner !== 'ALL') {
      result = result.filter((c) => c.salesOwner === filters.salesOwner);
    }
    if (filters.tier && filters.tier !== 'ALL') {
      result = result.filter((c) => c.tier === filters.tier);
    }
    if (filters.repeatStatus && filters.repeatStatus !== 'ALL') {
      result = result.filter((c) => c.repeatStatus === filters.repeatStatus);
    }
    if (filters.riskStatus && filters.riskStatus !== 'ALL') {
      result = result.filter((c) => c.riskStatus === filters.riskStatus);
    }

    const totalCount = result.length;

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const ascending = filters.sortOrder === 'asc';
    result.sort((a: any, b: any) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });

    // Pagination
    if (filters.page && filters.pageSize) {
      const from = (filters.page - 1) * filters.pageSize;
      result = result.slice(from, from + filters.pageSize);
    }

    return { customers: result, totalCount };
  }

  /**
   * Fetch customers with resilient fallback to in-memory/local storage
   */
  async find(filters: CustomerQueryFilters = {}): Promise<{ customers: Customer[]; totalCount: number; fromSupabase: boolean; tableMissing?: boolean; error?: string }> {
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
        const isNetworkErr = isNetworkOrFetchError(error);
        const isMissing = isTableMissingError(error);

        if (isMissing) {
          this.isTableAvailable = false;
        }

        const fallback = this.filterInMemory(filters);
        return {
          customers: fallback.customers,
          totalCount: fallback.totalCount,
          fromSupabase: false,
          tableMissing: isMissing,
          error: error.message,
        };
      }

      this.isTableAvailable = true;

      if (!data || data.length === 0) {
        if (Object.keys(filters).length === 0 || (filters.status === 'ALL' && !filters.search)) {
          // Table exists but is completely empty -> seed initial customers
          await this.seedBatch(INITIAL_CUSTOMERS).catch(() => {});
          const fallback = this.filterInMemory(filters);
          return { customers: fallback.customers, totalCount: fallback.totalCount, fromSupabase: true };
        }
      }

      const customers = (data || []).map(customerFromDb);
      
      // Update local cache with fetched results
      if (!filters.search && (!filters.status || filters.status === 'ALL')) {
        this.inMemoryCustomers = customers;
        persistStoredCustomers(customers);
      }

      return { customers, totalCount: count || customers.length, fromSupabase: true };
    } catch (err: any) {
      const isMissing = isTableMissingError(err);
      if (isMissing) this.isTableAvailable = false;
      const fallback = this.filterInMemory(filters);
      return {
        customers: fallback.customers,
        totalCount: fallback.totalCount,
        fromSupabase: false,
        tableMissing: isMissing,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Find a single customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return customerFromDb(data);
      }
    } catch (err) {}

    return this.inMemoryCustomers.find((c) => c.id === id) || null;
  }

  /**
   * Save or Update customer in Supabase and local cache
   */
  async save(customer: Customer): Promise<Customer> {
    // 1. Update in-memory & localStorage first for instant UI response
    const existingIdx = this.inMemoryCustomers.findIndex((c) => c.id === customer.id);
    if (existingIdx >= 0) {
      this.inMemoryCustomers[existingIdx] = { ...this.inMemoryCustomers[existingIdx], ...customer, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      this.inMemoryCustomers.unshift(customer);
    }
    persistStoredCustomers(this.inMemoryCustomers);

    const dbRow = customerToDb(customer);

    try {
      // 2. Try Upsert with onConflict on 'id'
      const { data, error } = await supabase
        .from('customers')
        .upsert(dbRow, { onConflict: 'id' })
        .select();

      if (!error && data && data.length > 0) {
        return customerFromDb(data[0]);
      }

      // 3. If upsert had issue, try direct Update
      const { data: updateData, error: updateError } = await supabase
        .from('customers')
        .update(dbRow)
        .eq('id', customer.id)
        .select();

      if (!updateError && updateData && updateData.length > 0) {
        return customerFromDb(updateData[0]);
      }

      // 4. Try Insert
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert(dbRow)
        .select();

      if (!insertError && insertData && insertData.length > 0) {
        return customerFromDb(insertData[0]);
      }
    } catch (dbErr) {
      // Network/offline fallback operates seamlessly
    }

    return customer;
  }

  /**
   * Soft Delete or Hard Delete customer in Supabase and local cache
   */
  async delete(id: string, softDelete = false): Promise<boolean> {
    // Delete from memory
    this.inMemoryCustomers = this.inMemoryCustomers.filter((c) => c.id !== id);
    persistStoredCustomers(this.inMemoryCustomers);

    try {
      if (softDelete) {
        const { error } = await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
        if (!error) return true;
      }
      const { error: delError } = await supabase.from('customers').delete().eq('id', id);
      return !delError;
    } catch (err) {
      return true;
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
      return true;
    }
  }

  /**
   * Seed customers batch to Supabase
   */
  async seedBatch(customers: Customer[]): Promise<void> {
    for (const c of customers) {
      if (!this.inMemoryCustomers.some((x) => x.id === c.id)) {
        this.inMemoryCustomers.push(c);
      }
    }
    persistStoredCustomers(this.inMemoryCustomers);

    try {
      const dbRows = customers.map(customerToDb);
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabase.from('customers').upsert(chunk);
      }
    } catch (err) {}
  }
}

export const customerRepository = new CustomerRepository();
