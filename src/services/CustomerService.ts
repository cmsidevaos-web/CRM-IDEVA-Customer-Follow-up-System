import { customerRepository, CustomerQueryFilters } from '../repositories/CustomerRepository';
import { Customer } from '../types';

export class CustomerService {
  async getAll(filters: CustomerQueryFilters = {}): Promise<{ customers: Customer[]; totalCount: number; fromSupabase: boolean; error?: string }> {
    const res = await customerRepository.find(filters);
    return { customers: res.customers, totalCount: res.totalCount, fromSupabase: !res.error, error: res.error };
  }

  async getById(id: string): Promise<Customer | null> {
    return await customerRepository.findById(id);
  }

  async saveCustomer(customer: Customer): Promise<Customer> {
    if (!customer.companyName || customer.companyName.trim() === '') {
      throw new Error('Company name is required');
    }
    const updatedCustomer = {
      ...customer,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    return await customerRepository.save(updatedCustomer);
  }

  async deleteCustomer(id: string, softDelete = true): Promise<boolean> {
    return await customerRepository.delete(id, softDelete);
  }

  async restoreCustomer(id: string): Promise<boolean> {
    return await customerRepository.restore(id);
  }
}

export const customerService = new CustomerService();
