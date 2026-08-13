import { supabase } from '../services/supabaseClient';
import { noteFromDb, noteToDb } from '../services/supabaseDataStore';
import { InternalNote } from '../types';

export class NoteRepository {
  async find(customerId?: string): Promise<InternalNote[]> {
    try {
      let query = supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) return [];
      return (data || []).map(noteFromDb);
    } catch (err) {
      return [];
    }
  }

  async save(note: InternalNote): Promise<InternalNote> {
    const dbRow = noteToDb(note);
    const { data, error } = await supabase.from('notes').upsert(dbRow).select().single();
    if (error) {
      console.error('[NoteRepository.save error]:', error.message);
      throw new Error(`Failed to save note: ${error.message}`);
    }
    return noteFromDb(data || dbRow);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      return !error;
    } catch (err) {
      return false;
    }
  }
}

export const noteRepository = new NoteRepository();
