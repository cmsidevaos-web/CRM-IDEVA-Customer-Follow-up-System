import { orderRepository } from '../repositories/OrderRepository';
import { Order } from '../types';

export class OrderService {
  async getOrders(customerId?: string): Promise<Order[]> {
    return await orderRepository.find(customerId);
  }

  async saveOrder(order: Order): Promise<Order> {
    if (!order.productName || order.productName.trim() === '') {
      throw new Error('Product name is required');
    }
    return await orderRepository.save(order);
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await orderRepository.delete(id);
  }
}

export const orderService = new OrderService();
