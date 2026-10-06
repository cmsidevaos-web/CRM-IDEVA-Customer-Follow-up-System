import { supabase } from '../services/supabaseClient';
import { documentFromDb, documentToDb } from '../services/supabaseDataStore';
import { CustomerDocument } from '../types';
import { INITIAL_DOCUMENTS } from '../data/defaultData';

const DOCUMENTS_CACHE_KEY = 'ideva_crm_documents_cache';

function getStoredDocuments(): CustomerDocument[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(DOCUMENTS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_DOCUMENTS];
}

function persistStoredDocuments(docs: CustomerDocument[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(DOCUMENTS_CACHE_KEY, JSON.stringify(docs));
    } catch (e) {}
  }
}

export class DocumentRepository {
  private inMemoryDocs: CustomerDocument[] = getStoredDocuments();

  async find(customerId?: string): Promise<CustomerDocument[]> {
    try {
      let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = data.map(documentFromDb);
        if (!customerId) {
          this.inMemoryDocs = mapped;
          persistStoredDocuments(mapped);
        }
        return mapped;
      }
    } catch (err) {}

    if (customerId) {
      return this.inMemoryDocs.filter((d) => d.customerId === customerId);
    }
    return this.inMemoryDocs;
  }

  async save(doc: CustomerDocument): Promise<CustomerDocument> {
    const existingIdx = this.inMemoryDocs.findIndex((d) => d.id === doc.id);
    if (existingIdx >= 0) {
      this.inMemoryDocs[existingIdx] = { ...this.inMemoryDocs[existingIdx], ...doc };
    } else {
      this.inMemoryDocs.unshift(doc);
    }
    persistStoredDocuments(this.inMemoryDocs);

    const dbRow = documentToDb(doc);
    try {
      const { data, error } = await supabase.from('documents').upsert(dbRow).select().single();
      if (!error && data) {
        return documentFromDb(data);
      }
    } catch (e) {}

    return doc;
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryDocs = this.inMemoryDocs.filter((d) => d.id !== id);
    persistStoredDocuments(this.inMemoryDocs);

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }
}

export const documentRepository = new DocumentRepository();
