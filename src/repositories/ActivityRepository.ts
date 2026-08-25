import { supabase } from '../services/supabaseClient';
import { activityFromDb, activityToDb } from '../services/supabaseDataStore';
import { Activity } from '../types';

export class ActivityRepository {
  private fallbackActivities: Map<string, Activity> = new Map();

  async find(customerId?: string): Promise<Activity[]> {
    let list: Activity[] = [];
    try {
      let query = supabase.from('activities').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data) {
        list = (data || []).map(activityFromDb);
      } else if (error) {
        console.warn('[ActivityRepository.find error, using fallback]:', error.message);
      }
    } catch (err) {
      console.warn('[ActivityRepository.find exception]:', err);
    }

    const existingIds = new Set(list.map((a) => a.id));
    for (const [id, act] of this.fallbackActivities.entries()) {
      if (!existingIds.has(id)) {
        if (!customerId || act.customerId === customerId) {
          list.unshift(act);
        }
      }
    }

    return list;
  }

  async findById(id: string): Promise<Activity | null> {
    if (this.fallbackActivities.has(id)) {
      return this.fallbackActivities.get(id) || null;
    }
    try {
      const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
      if (error || !data) return this.fallbackActivities.get(id) || null;
      return activityFromDb(data);
    } catch (err) {
      return this.fallbackActivities.get(id) || null;
    }
  }

  async save(activity: Activity): Promise<Activity> {
    const dbRow = activityToDb(activity);
    try {
      const { data, error } = await supabase.from('activities').upsert(dbRow).select().single();
      if (error) {
        console.warn('[ActivityRepository.save database warning - saving to resilient cache]:', error.message);
        this.fallbackActivities.set(activity.id, activity);
        return activity;
      }
      this.fallbackActivities.set(activity.id, activityFromDb(data || dbRow));
      return activityFromDb(data || dbRow);
    } catch (err: any) {
      console.warn('[ActivityRepository.save exception - saving to resilient cache]:', err?.message || err);
      this.fallbackActivities.set(activity.id, activity);
      return activity;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.fallbackActivities.delete(id);
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }

  async seedBatch(activities: Activity[]): Promise<void> {
    for (const act of activities) {
      this.fallbackActivities.set(act.id, act);
    }
    try {
      const dbRows = activities.map(activityToDb);
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabase.from('activities').upsert(chunk);
      }
    } catch (err) {
      console.warn('[ActivityRepository.seedBatch warning]:', err);
    }
  }
}

export const activityRepository = new ActivityRepository();

