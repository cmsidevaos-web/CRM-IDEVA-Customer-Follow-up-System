import { supabase } from '../services/supabaseClient';
import { documentFromDb, documentToDb } from '../services/supabaseDataStore';
import { CustomerDocument } from '../types';

export class DocumentRepository {
  async find(customerId?: string): Promise<CustomerDocument[]> {
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map(documentFromDb);
    } catch (err) {
      return [];
    }
  }

  async save(doc: CustomerDocument): Promise<CustomerDocument> {
    const dbRow = documentToDb(doc);
    const { data, error } = await supabase.from('documents').upsert(dbRow).select().single();
    if (error) {
      console.error('[DocumentRepository.save error]:', error.message);
      throw new Error(`Failed to save document: ${error.message}`);
    }
    return documentFromDb(data || dbRow);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      return !error;
    } catch (err) {
      return false;
    }
  }
}

export const documentRepository = new DocumentRepository();
