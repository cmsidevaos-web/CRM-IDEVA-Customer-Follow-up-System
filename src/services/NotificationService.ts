import { notificationRepository } from '../repositories/NotificationRepository';
import { NotificationItem } from '../types';

export class NotificationService {
  async getNotifications(): Promise<NotificationItem[]> {
    return await notificationRepository.find();
  }

  async saveNotification(notification: NotificationItem): Promise<NotificationItem> {
    return await notificationRepository.save(notification);
  }

  async markAllAsRead(): Promise<boolean> {
    return await notificationRepository.markAllAsRead();
  }

  async deleteNotification(id: string): Promise<boolean> {
    return await notificationRepository.delete(id);
  }
}

export const notificationService = new NotificationService();
