import { supabase } from '../services/supabaseClient';
import { noteFromDb, noteToDb } from '../services/supabaseDataStore';
import { InternalNote } from '../types';
import { INITIAL_NOTES } from '../data/defaultData';

const NOTES_CACHE_KEY = 'ideva_crm_notes_cache';

function getStoredNotes(): InternalNote[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(NOTES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_NOTES];
}

function persistStoredNotes(notes: InternalNote[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
    } catch (e) {}
  }
}

export class NoteRepository {
  private inMemoryNotes: InternalNote[] = getStoredNotes();

  async find(customerId?: string): Promise<InternalNote[]> {
    try {
      let query = supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped = data.map(noteFromDb);
        if (!customerId) {
          this.inMemoryNotes = mapped;
          persistStoredNotes(mapped);
        }
        return mapped;
      }
    } catch (err) {}

    if (customerId) {
      return this.inMemoryNotes.filter((n) => n.customerId === customerId);
    }
    return this.inMemoryNotes;
  }

  async save(note: InternalNote): Promise<InternalNote> {
    const existingIdx = this.inMemoryNotes.findIndex((n) => n.id === note.id);
    if (existingIdx >= 0) {
      this.inMemoryNotes[existingIdx] = { ...this.inMemoryNotes[existingIdx], ...note };
    } else {
      this.inMemoryNotes.unshift(note);
    }
    persistStoredNotes(this.inMemoryNotes);

    const dbRow = noteToDb(note);
    try {
      const { data, error } = await supabase.from('notes').upsert(dbRow).select().single();
      if (!error && data) {
        return noteFromDb(data);
      }
    } catch (e) {}

    return note;
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryNotes = this.inMemoryNotes.filter((n) => n.id !== id);
    persistStoredNotes(this.inMemoryNotes);

    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }
}

export const noteRepository = new NoteRepository();
