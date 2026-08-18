import { activityRepository } from '../repositories/ActivityRepository';
import { Activity } from '../types';

export class ActivityService {
  async getActivities(customerId?: string): Promise<Activity[]> {
    return await activityRepository.find(customerId);
  }

  async saveActivity(activity: Activity): Promise<Activity> {
    if (!activity.summary || activity.summary.trim() === '') {
      activity.summary = activity.detail?.slice(0, 60) || activity.nextAction || `${activity.type || 'Activity'} - ติดต่อลูกค้า`;
    }
    return await activityRepository.save(activity);
  }

  async deleteActivity(id: string): Promise<boolean> {
    return await activityRepository.delete(id);
  }
}

export const activityService = new ActivityService();
