import { supabase } from '../services/supabaseClient';
import { activityFromDb, activityToDb } from '../services/supabaseDataStore';
import { Activity } from '../types';

export class ActivityRepository {
  async find(customerId?: string): Promise<Activity[]> {
    try {
      let query = supabase.from('activities').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[ActivityRepository.find error]:', error.message);
        return [];
      }
      return (data || []).map(activityFromDb);
    } catch (err) {
      console.error('[ActivityRepository.find exception]:', err);
      return [];
    }
  }

  async findById(id: string): Promise<Activity | null> {
    try {
      const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
      if (error || !data) return null;
      return activityFromDb(data);
    } catch (err) {
      return null;
    }
  }

  async save(activity: Activity): Promise<Activity> {
    const dbRow = activityToDb(activity);
    const { data, error } = await supabase.from('activities').upsert(dbRow).select().single();
    if (error) {
      console.error('[ActivityRepository.save error]:', error.message);
      throw new Error(`Failed to save activity: ${error.message}`);
    }
    return activityFromDb(data || dbRow);
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      return !error;
    } catch (err) {
      return false;
    }
  }

  async seedBatch(activities: Activity[]): Promise<void> {
    const dbRows = activities.map(activityToDb);
    for (let i = 0; i < dbRows.length; i += 50) {
      const chunk = dbRows.slice(i, i + 50);
      await supabase.from('activities').upsert(chunk);
    }
  }
}

export const activityRepository = new ActivityRepository();
