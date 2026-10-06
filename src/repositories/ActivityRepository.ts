import { supabase } from '../services/supabaseClient';
import { activityFromDb, activityToDb } from '../services/supabaseDataStore';
import { Activity } from '../types';
import { INITIAL_ACTIVITIES } from '../data/defaultData';
import { isNetworkOrFetchError, isTableMissingError } from '../utils/errorUtils';

const ACTIVITIES_CACHE_KEY = 'ideva_crm_activities_cache';

function getStoredActivities(): Activity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(ACTIVITIES_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_ACTIVITIES];
}

function persistStoredActivities(activities: Activity[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(activities));
    } catch (e) {}
  }
}

export class ActivityRepository {
  private inMemoryActivities: Activity[] = getStoredActivities();

  async find(customerId?: string): Promise<Activity[]> {
    let list: Activity[] = [];
    try {
      let query = supabase.from('activities').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        list = data.map(activityFromDb);
        if (!customerId) {
          this.inMemoryActivities = list;
          persistStoredActivities(list);
        }
        return list;
      }
    } catch (err) {
      // Graceful fallback to local cache
    }

    if (customerId) {
      return this.inMemoryActivities.filter((a) => a.customerId === customerId);
    }
    return this.inMemoryActivities;
  }

  async findById(id: string): Promise<Activity | null> {
    try {
      const { data, error } = await supabase.from('activities').select('*').eq('id', id).single();
      if (!error && data) {
        return activityFromDb(data);
      }
    } catch (err) {}

    return this.inMemoryActivities.find((a) => a.id === id) || null;
  }

  async save(activity: Activity): Promise<Activity> {
    const existingIdx = this.inMemoryActivities.findIndex((a) => a.id === activity.id);
    if (existingIdx >= 0) {
      this.inMemoryActivities[existingIdx] = { ...this.inMemoryActivities[existingIdx], ...activity };
    } else {
      this.inMemoryActivities.unshift(activity);
    }
    persistStoredActivities(this.inMemoryActivities);

    const dbRow = activityToDb(activity);
    try {
      const { data, error } = await supabase.from('activities').upsert(dbRow).select().single();
      if (!error && data) {
        return activityFromDb(data);
      }
    } catch (err: any) {}

    return activity;
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryActivities = this.inMemoryActivities.filter((a) => a.id !== id);
    persistStoredActivities(this.inMemoryActivities);

    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);
      return !error;
    } catch (err) {
      return true;
    }
  }

  async seedBatch(activities: Activity[]): Promise<void> {
    for (const act of activities) {
      if (!this.inMemoryActivities.some((a) => a.id === act.id)) {
        this.inMemoryActivities.push(act);
      }
    }
    persistStoredActivities(this.inMemoryActivities);

    try {
      const dbRows = activities.map(activityToDb);
      for (let i = 0; i < dbRows.length; i += 50) {
        const chunk = dbRows.slice(i, i + 50);
        await supabase.from('activities').upsert(chunk);
      }
    } catch (err) {}
  }
}

export const activityRepository = new ActivityRepository();
