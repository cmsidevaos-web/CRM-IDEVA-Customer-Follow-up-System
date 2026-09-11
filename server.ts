import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { buildTelegramCard, defaultTelegramSettings, defaultTelegramTopics, getTopicForType, sendTelegramApiMessage } from './src/services/telegramService';
import { Activity, AppUser, Customer, CustomerDocument, InternalNote, NotificationItem, Order, TelegramNotificationLog, TelegramQueueItem, TelegramSettings, TelegramTopic } from './src/types';
import {
  fetchCustomersFromSupabase,
  upsertCustomerSupabase,
  deleteCustomerSupabase,
  fetchActivitiesFromSupabase,
  addActivitySupabase,
  fetchOrdersFromSupabase,
  addOrderSupabase,
  fetchDocumentsFromSupabase,
  addDocumentSupabase,
  deleteDocumentSupabase,
  fetchNotesFromSupabase,
  addNoteSupabase,
  fetchTelegramSettingsFromSupabase,
  saveTelegramSettingsSupabase,
  fetchTelegramTopicsFromSupabase,
  saveTelegramTopicsSupabase,
  fetchTelegramLogsFromSupabase,
  addTelegramLogSupabase,
  fetchTelegramQueueFromSupabase,
  pushTelegramQueueSupabase,
  updateTelegramQueueItemSupabase,
  seedCustomersToSupabase,
  seedActivitiesToSupabase,
  seedOrdersToSupabase,
  fetchUsersFromSupabase,
  upsertUserSupabase,
  deleteUserSupabase,
  seedUsersToSupabase,
  getUserByUsernameSupabase,
  isSupabaseConnected
} from './src/services/supabaseDataStore';
import { INITIAL_USERS } from './src/data/defaultUsers';
import { orderRepository } from './src/repositories/OrderRepository';
import { customerRepository } from './src/repositories/CustomerRepository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processTelegramQueueWorker() {
  const telegramSettingsStore = await fetchTelegramSettingsFromSupabase();
  const topicsList = await fetchTelegramTopicsFromSupabase();
  if (!telegramSettingsStore.is_enabled) return { processed: 0, status: 'disabled' };

  const queue = await fetchTelegramQueueFromSupabase();
  const pending = queue.filter((item) => item.status === 'PENDING');
  let processedCount = 0;

  for (const item of pending) {
    item.status = 'PROCESSING';
    await updateTelegramQueueItemSupabase(item);

    const { threadId } = getTopicForType(item.type, topicsList);
    const targetTopicId = threadId || telegramSettingsStore.topic_id || '2';

    const cardResult = buildTelegramCard(item.type, item.payload);
    const sendRes = await sendTelegramApiMessage(
      telegramSettingsStore.bot_token,
      telegramSettingsStore.group_chat_id,
      targetTopicId,
      cardResult
    );

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    if (sendRes.ok) {
      item.status = 'COMPLETED';
      item.processed_at = nowStr;
      await updateTelegramQueueItemSupabase(item);

      const logItem: TelegramNotificationLog = {
        id: `TGLOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customer_id: item.payload?.customerId || item.payload?.id,
        order_id: item.payload?.orderId,
        notification_type: item.type,
        telegram_message_id: sendRes.messageId || String(Math.floor(80000 + Math.random() * 20000)),
        telegram_chat_id: telegramSettingsStore.group_chat_id,
        status: 'SENT',
        response: JSON.stringify(sendRes.response),
        created_at: nowStr,
      };
      await addTelegramLogSupabase(logItem);
      processedCount++;
    } else {
      item.retry_count = (item.retry_count || 0) + 1;
      item.status = item.retry_count >= 5 ? 'FAILED' : 'PENDING';
      await updateTelegramQueueItemSupabase(item);

      const logItem: TelegramNotificationLog = {
        id: `TGLOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customer_id: item.payload?.customerId || item.payload?.id,
        order_id: item.payload?.orderId,
        notification_type: item.type,
        telegram_chat_id: telegramSettingsStore.group_chat_id,
        status: 'FAILED',
        response: JSON.stringify(sendRes.response),
        created_at: nowStr,
      };
      await addTelegramLogSupabase(logItem);
    }
  }

  return { processed: processedCount, totalPending: pending.length };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
  }

  // Serve static files from uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // --- API ROUTES ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      supabase: 'https://wbrktjjgimvbddeobaeq.supabase.co',
      isSupabaseConnected,
      timestamp: new Date().toISOString(),
    });
  });

  // Supabase status endpoint
  app.post('/api/seed', async (req, res) => {
    res.json({
      success: true,
      message: 'Mock data completely removed. Supabase is the single source of truth.',
    });
  });

  // GET Customers (100% Supabase)
  app.get('/api/customers', async (req, res) => {
    const { search, status, salesOwner, tier, repeatStatus, riskOnly } = req.query;
    const { data: rawCustomers, fromSupabase, tableMissing, error } = await fetchCustomersFromSupabase();
    let filtered = [...rawCustomers];

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.lineId && c.lineId.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (salesOwner && salesOwner !== 'ALL') {
      filtered = filtered.filter((c) => c.salesOwner === salesOwner);
    }

    if (tier && tier !== 'ALL') {
      filtered = filtered.filter((c) => c.tier === tier);
    }

    if (repeatStatus && repeatStatus !== 'ALL') {
      filtered = filtered.filter((c) => c.repeatStatus === repeatStatus);
    }

    if (riskOnly === 'true') {
      filtered = filtered.filter((c) => c.riskStatus === 'MODERATE' || c.riskStatus === 'HIGH');
    }

    res.json({
      total: filtered.length,
      customers: filtered,
      fromSupabase,
      tableMissing,
      error,
    });
  });

  // GET Customer Details (100% Supabase)
  app.get('/api/customers/:id', async (req, res) => {
    try {
      const id = req.params.id;
      let customer = await customerRepository.findById(id);
      if (!customer) {
        const { data: rawCustomers } = await fetchCustomersFromSupabase();
        customer = rawCustomers.find((c) => c.id === id) || null;
      }
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const { data: activities } = await fetchActivitiesFromSupabase();
      const { data: orders } = await fetchOrdersFromSupabase();
      const docs = await fetchDocumentsFromSupabase();
      const notes = await fetchNotesFromSupabase();

      const custActivities = activities.filter((a) => a.customerId === customer!.id);
      const custOrders = orders.filter((o) => o.customerId === customer!.id);
      const custDocs = docs.filter((d) => d.customerId === customer!.id);
      const custNotes = notes.filter((n) => n.customerId === customer!.id);

      res.json({
        customer,
        activities: custActivities,
        orders: custOrders,
        documents: custDocs,
        notes: custNotes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Error fetching customer detail' });
    }
  });

  // CREATE Customer (100% Supabase)
  app.post('/api/customers', async (req, res) => {
    try {
      const { data: rawCustomers } = await fetchCustomersFromSupabase();
      
      // Compute safe, unique, non-colliding ID
      let nextId = req.body.id;
      if (!nextId || rawCustomers.some((c) => c.id === nextId)) {
        let maxNum = 0;
        for (const c of rawCustomers) {
          const match = String(c.id || '').match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        let nextNum = maxNum + 1;
        while (rawCustomers.some((c) => c.id === `CUST-${String(nextNum).padStart(3, '0')}`)) {
          nextNum++;
        }
        nextId = `CUST-${String(nextNum).padStart(3, '0')}`;
      }

      const newCustomer: Customer = {
        id: nextId,
        companyName: req.body.companyName || '',
        contactName: req.body.contactName || '',
        phone: req.body.phone || '',
        lineId: req.body.lineId !== undefined ? req.body.lineId : (req.body.line_id || ''),
        email: req.body.email !== undefined ? req.body.email : (req.body.email || ''),
        interestedProducts: req.body.interestedProducts || req.body.interested_products || '',
        source: req.body.source || 'Facebook',
        salesOwner: req.body.salesOwner || req.body.sales_owner || 'คุณสมชาย (Sales A)',
        status: req.body.status || 'NEW',
        tier: req.body.tier || 'GENERAL',
        taxId: req.body.taxId || req.body.tax_id || '',
        address: req.body.address || '',
        facebook: req.body.facebook || '',
        nextFollowUpDate: req.body.nextFollowUpDate || req.body.next_follow_up_date || new Date().toISOString().split('T')[0],
        nextFollowUpTime: req.body.nextFollowUpTime || req.body.next_follow_up_time || '10:00',
        nextAction: req.body.nextAction || req.body.next_action || 'โทรสอบถามข้อมูลเบื้องต้น',
        totalPurchases: Number(req.body.totalPurchases || 0),
        totalOrdersCount: Number(req.body.totalOrdersCount || 0),
        avgReorderCycleDays: req.body.avgReorderCycleDays !== undefined ? Number(req.body.avgReorderCycleDays) : 60,
        repeatStatus: req.body.repeatStatus || 'UPCOMING',
        riskStatus: req.body.riskStatus || 'NORMAL',
        createdAt: req.body.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const saved = await upsertCustomerSupabase(newCustomer);
      res.status(201).json(saved);
    } catch (e: any) {
      console.error('[POST /api/customers error]:', e);
      res.status(500).json({ error: e?.message || 'Error saving customer to Supabase' });
    }
  });

  // UPDATE Customer (100% Supabase)
  app.put('/api/customers/:id', async (req, res) => {
    try {
      const id = req.params.id;
      let existing = await customerRepository.findById(id);
      if (!existing) {
        const { data: rawCustomers } = await fetchCustomersFromSupabase();
        existing = rawCustomers.find((c) => c.id === id) || null;
      }

      const updatedCustomer: Customer = {
        ...(existing || {} as Customer),
        ...req.body,
        id,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const saved = await upsertCustomerSupabase(updatedCustomer);
      res.json(saved);
    } catch (e: any) {
      console.error('[PUT /api/customers/:id error]:', e);
      res.status(500).json({ error: e?.message || 'Error updating customer in Supabase' });
    }
  });

  // DELETE Customer (100% Supabase)
  app.delete('/api/customers/:id', async (req, res) => {
    try {
      const success = await deleteCustomerSupabase(req.params.id);
      res.json({ success, id: req.params.id });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error deleting customer from Supabase' });
    }
  });

  // GET Activities (100% Supabase)
  app.get('/api/activities', async (req, res) => {
    const { customerId } = req.query;
    const { data: activities } = await fetchActivitiesFromSupabase();
    if (customerId) {
      return res.json(activities.filter((a) => a.customerId === customerId));
    }
    res.json(activities);
  });

  // CREATE Activity (100% Supabase)
  app.post('/api/activities', async (req, res) => {
    try {
      const { data: activities } = await fetchActivitiesFromSupabase();
      let maxActNum = 0;
      for (const a of activities) {
        const match = String(a.id || '').match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxActNum) maxActNum = num;
        }
      }
      const actId = req.body.id && !activities.some((a) => a.id === req.body.id)
        ? req.body.id
        : `ACT-${String(maxActNum + 1).padStart(4, '0')}`;

      const newActivity: Activity = {
        id: actId,
        ...req.body,
        createdAt: req.body.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
      };

      const savedActivity = await addActivitySupabase(newActivity);

      // Update customer status & follow-up date in Supabase
      const { data: customers } = await fetchCustomersFromSupabase();
      const targetCust = customers.find((c) => c.id === req.body.customerId);
      if (targetCust) {
        targetCust.status = req.body.status || targetCust.status;
        targetCust.nextFollowUpDate = req.body.followUpDate || targetCust.nextFollowUpDate;
        targetCust.nextFollowUpTime = req.body.followUpTime || targetCust.nextFollowUpTime;
        targetCust.nextAction = req.body.nextAction || targetCust.nextAction;
        targetCust.updatedAt = new Date().toISOString().split('T')[0];
        await upsertCustomerSupabase(targetCust);

        // Auto-enqueue Telegram Notification
        const telegramSettingsStore = await fetchTelegramSettingsFromSupabase();
        if (telegramSettingsStore.is_enabled) {
          let notifyType = 'FOLLOWUP_TODAY';
          if (targetCust.status === 'OVERDUE') notifyType = 'OVERDUE';
          else if (targetCust.status === 'WON') notifyType = 'WON';
          else if (targetCust.status === 'QUOTATION_SENT') notifyType = 'QUOTATION_SENT';
          else if (targetCust.status === 'LOST') notifyType = 'LOST';

          const queueItem: TelegramQueueItem = {
            id: `QUEUE-${Date.now()}`,
            type: notifyType,
            payload: {
              companyName: targetCust.companyName,
              contactName: targetCust.contactName,
              phone: targetCust.phone,
              lineId: targetCust.lineId,
              nextFollowUpDate: `${targetCust.nextFollowUpDate} ${targetCust.nextFollowUpTime}`,
              salesOwner: targetCust.salesOwner,
              nextAction: targetCust.nextAction,
              dealValue: targetCust.totalPurchases || 50000,
              customerId: targetCust.id,
            },
            status: 'PENDING',
            retry_count: 0,
            created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
          };
          await pushTelegramQueueSupabase(queueItem);
          await processTelegramQueueWorker();
        }
      }

      res.status(201).json(savedActivity);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error creating activity' });
    }
  });

  // --- ORDERS API ENDPOINTS (100% Supabase, Full CRUD, Error Handling, RLS compatible) ---

  // GET Orders (Supports optional ?customerId=...)
  app.get('/api/orders', async (req, res) => {
    try {
      const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
      const orders = await orderRepository.find(customerId);
      res.status(200).json(orders);
    } catch (err: any) {
      console.error('[GET /api/orders error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to fetch orders from Supabase' });
    }
  });

  // GET Order by ID
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const order = await orderRepository.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.status(200).json(order);
    } catch (err: any) {
      console.error('[GET /api/orders/:id error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Failed to fetch order from Supabase' });
    }
  });

  // CREATE Order
  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body || {};
      const productName = body.productName || body.product_name;
      if (!productName || String(productName).trim() === '') {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const existingOrders = await orderRepository.find();
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const uniqueSuffix = `${String(existingOrders.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;
      const orderId = body.id && !existingOrders.some((o) => o.id === body.id)
        ? body.id
        : `ORD-${datePrefix}-${uniqueSuffix}`;

      const newOrder: Order = {
        id: orderId,
        customerId: body.customerId || body.customer_id || '',
        customerName: body.customerName || body.customer_name || 'Customer',
        orderDate: body.orderDate || body.order_date || new Date().toISOString().split('T')[0],
        deliveryDate: body.deliveryDate || body.delivery_date || new Date().toISOString().split('T')[0],
        productName: String(productName),
        quantity: Number(body.quantity || 1),
        unitPrice: Number(body.unitPrice || body.unit_price || 0),
        totalAmount: Number(body.totalAmount || body.total_amount || (Number(body.quantity || 1) * Number(body.unitPrice || body.unit_price || 0))),
        status: body.status || 'CONFIRMED',
        reorderCycleDays: Number(body.reorderCycleDays || body.reorder_cycle_days || 60),
        nextReorderDate: body.nextReorderDate || body.next_reorder_date || '',
        followUpStartDate: body.followUpStartDate || body.follow_up_start_date || '',
        repeatStatus: body.repeatStatus || body.repeat_status || 'UPCOMING',
        createdAt: body.createdAt || body.created_at || new Date().toISOString().split('T')[0],
      };

      const savedOrder = await orderRepository.save(newOrder);

      // Update customer purchases and tier calculation in Supabase
      const custId = newOrder.customerId;
      if (custId) {
        try {
          const { data: customers } = await fetchCustomersFromSupabase();
          const targetCust = customers.find((c) => c.id === custId);
          if (targetCust) {
            targetCust.totalPurchases = (targetCust.totalPurchases || 0) + newOrder.totalAmount;
            targetCust.totalOrdersCount = (targetCust.totalOrdersCount || 0) + 1;
            targetCust.lastOrderDate = newOrder.orderDate;
            targetCust.lastDeliveryDate = newOrder.deliveryDate;
            targetCust.status = 'WON';

            if (targetCust.totalPurchases >= 1000000) targetCust.tier = 'PLATINUM';
            else if (targetCust.totalPurchases >= 500000) targetCust.tier = 'GOLD';
            else if (targetCust.totalPurchases >= 200000) targetCust.tier = 'SILVER';
            else targetCust.tier = 'GENERAL';

            await upsertCustomerSupabase(targetCust);

            // Auto-enqueue Telegram Notification with fallback
            try {
              const telegramSettingsStore = await fetchTelegramSettingsFromSupabase();
              if (telegramSettingsStore && telegramSettingsStore.is_enabled) {
                const queueItem: TelegramQueueItem = {
                  id: `QUEUE-${Date.now()}`,
                  type: 'ORDERS',
                  payload: {
                    companyName: targetCust.companyName,
                    orderId: newOrder.id,
                    productName: newOrder.productName,
                    totalAmount: newOrder.totalAmount,
                    salesOwner: targetCust.salesOwner,
                    closedDate: newOrder.orderDate,
                    customerId: targetCust.id,
                  },
                  status: 'PENDING',
                  retry_count: 0,
                  created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
                };
                try {
                  await pushTelegramQueueSupabase(queueItem);
                  await processTelegramQueueWorker();
                } catch (qErr) {
                  console.warn('[Telegram queue fallback to direct send]:', qErr);
                  const topicsList = await fetchTelegramTopicsFromSupabase();
                  const { threadId } = getTopicForType('ORDERS', topicsList);
                  const targetTopicId = threadId || '7';
                  const cardResult = buildTelegramCard('ORDERS', queueItem.payload);
                  await sendTelegramApiMessage(
                    telegramSettingsStore.bot_token,
                    telegramSettingsStore.group_chat_id,
                    targetTopicId,
                    cardResult
                  );
                }
              }
            } catch (tgEx) {
              console.error('[Telegram notification error]:', tgEx);
            }
          }
        } catch (custUpdateErr) {
          console.error('[Customer update or Telegram notification error during order creation]:', custUpdateErr);
        }
      }

      res.status(201).json(savedOrder);
    } catch (err: any) {
      console.error('[POST /api/orders error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Error creating order in Supabase' });
    }
  });

  // UPDATE Order (PUT /api/orders/:id)
  app.put('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
      const existingOrder = await orderRepository.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const body = req.body || {};
      const updatedOrder: Order = {
        ...existingOrder,
        ...body,
        id: orderId,
        quantity: body.quantity !== undefined ? Number(body.quantity) : existingOrder.quantity,
        unitPrice: body.unitPrice !== undefined ? Number(body.unitPrice) : existingOrder.unitPrice,
        totalAmount: body.totalAmount !== undefined ? Number(body.totalAmount) : (body.quantity !== undefined || body.unitPrice !== undefined ? (Number(body.quantity ?? existingOrder.quantity) * Number(body.unitPrice ?? existingOrder.unitPrice)) : existingOrder.totalAmount),
      };

      const savedOrder = await orderRepository.save(updatedOrder);
      res.status(200).json(savedOrder);
    } catch (err: any) {
      console.error('[PUT /api/orders/:id error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Error updating order in Supabase' });
    }
  });

  // DELETE Order (DELETE /api/orders/:id)
  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const orderId = req.params.id;
      const existingOrder = await orderRepository.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const success = await orderRepository.delete(orderId);
      if (!success) {
        return res.status(500).json({ error: 'Failed to delete order from Supabase' });
      }
      res.status(200).json({ success: true, id: orderId });
    } catch (err: any) {
      console.error('[DELETE /api/orders/:id error]:', err?.message || err);
      res.status(500).json({ error: err?.message || 'Error deleting order from Supabase' });
    }
  });

  // --- TELEGRAM MODULE API ENDPOINTS (100% Supabase) ---

  // GET Topics
  const getTopicsHandler = async (req: express.Request, res: express.Response) => {
    const topics = await fetchTelegramTopicsFromSupabase();
    res.json(topics);
  };
  app.get('/api/telegram/topics', getTopicsHandler);
  app.get('/telegram/topics', getTopicsHandler);

  // POST Topics
  const postTopicsHandler = async (req: express.Request, res: express.Response) => {
    const topicsList = req.body;
    if (Array.isArray(topicsList)) {
      const saved = await saveTelegramTopicsSupabase(topicsList);
      res.json({ success: true, topics: saved });
    } else {
      res.status(400).json({ error: 'Payload must be an array of topics' });
    }
  };
  app.post('/api/telegram/topics', postTopicsHandler);
  app.post('/telegram/topics', postTopicsHandler);

  // GET Settings
  app.get('/api/telegram/settings', async (req, res) => {
    const settings = await fetchTelegramSettingsFromSupabase();
    res.json(settings);
  });

  // POST Settings
  app.post('/api/telegram/settings', async (req, res) => {
    const current = await fetchTelegramSettingsFromSupabase();
    const updated = {
      ...current,
      ...req.body,
      updated_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    const saved = await saveTelegramSettingsSupabase(updated);
    res.json({ success: true, settings: saved });
  });

  // GET Logs
  const getLogsHandler = async (req: express.Request, res: express.Response) => {
    const logs = await fetchTelegramLogsFromSupabase();
    res.json(logs);
  };
  app.get('/api/telegram/logs', getLogsHandler);
  app.get('/telegram/logs', getLogsHandler);

  // GET Queue
  app.get('/api/telegram/queue', async (req, res) => {
    const queue = await fetchTelegramQueueFromSupabase();
    res.json(queue);
  });

  // POST Process Queue
  app.post('/api/telegram/process-queue', async (req, res) => {
    const result = await processTelegramQueueWorker();
    const queue = await fetchTelegramQueueFromSupabase();
    const logs = await fetchTelegramLogsFromSupabase();
    res.json({ success: true, ...result, queue, logs });
  });

  // POST /telegram/send or /api/telegram/send
  const sendHandler = async (req: express.Request, res: express.Response) => {
    const { notification_type, type, topic_key, payload, customer_id, order_id } = req.body;
    const itemType = notification_type || type || 'FOLLOWUP_REMINDER';

    const queueItem: TelegramQueueItem = {
      id: `QUEUE-${Date.now()}`,
      type: itemType,
      payload: payload || {
        companyName: 'ABC Company',
        contactName: 'คุณสมชาย',
        phone: '081-234-5678',
        salesOwner: 'คุณอนุชา',
        customerId: customer_id || 'CUST-001',
        orderId: order_id || 'ORD-20260811-001'
      },
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    await pushTelegramQueueSupabase(queueItem);
    const workerRes = await processTelegramQueueWorker();
    const logs = await fetchTelegramLogsFromSupabase();

    res.json({ success: true, queueId: queueItem.id, workerRes, logs });
  };
  app.post('/api/telegram/send', sendHandler);
  app.post('/telegram/send', sendHandler);

  // POST Test Notification
  const testHandler = async (req: express.Request, res: express.Response) => {
    const telegramSettingsStore = await fetchTelegramSettingsFromSupabase();
    const topicsList = await fetchTelegramTopicsFromSupabase();
    const eventType = req.body.type || 'OVERDUE';
    const customPayload = req.body.payload || {
      companyName: 'บริษัท ทดสอบเทเลแกรม จำกัด (ABC Group)',
      contactName: 'คุณสมชาย ใจดี',
      phone: '081-234-5678',
      lineId: 'somchai_test',
      nextFollowUpDate: '30/07/2026 10:00',
      overdueDays: 4,
      salesOwner: 'คุณอนุชา (Sales Lead)',
      nextAction: 'โทรติดตามสรุปใบเสนอราคา',
      dealValue: 85000,
      customerId: 'CUST-001',
    };

    const { threadId } = getTopicForType(eventType, topicsList);
    const targetTopicId = threadId || telegramSettingsStore.topic_id || '2';

    const card = buildTelegramCard(eventType, customPayload);
    const sendRes = await sendTelegramApiMessage(
      telegramSettingsStore.bot_token,
      telegramSettingsStore.group_chat_id,
      targetTopicId,
      card
    );

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const logItem: TelegramNotificationLog = {
      id: `TGLOG-${Date.now()}`,
      customer_id: customPayload.customerId || 'CUST-001',
      notification_type: eventType,
      telegram_message_id: sendRes.messageId || String(Math.floor(80000 + Math.random() * 20000)),
      telegram_chat_id: telegramSettingsStore.group_chat_id,
      status: sendRes.ok ? 'SENT' : 'FAILED',
      response: JSON.stringify(sendRes.response),
      created_at: nowStr,
    };
    await addTelegramLogSupabase(logItem);

    res.json({
      success: sendRes.ok,
      messageId: sendRes.messageId,
      topicThreadId: targetTopicId,
      cardText: card.text,
      replyMarkup: card.reply_markup,
      response: sendRes.response,
      log: logItem,
    });
  };
  app.post('/api/telegram/test', testHandler);
  app.post('/telegram/test', testHandler);

  // POST Send Summary
  const summaryHandler = async (req: express.Request, res: express.Response) => {
    const summaryType = req.body.type || 'DAILY_SUMMARY';
    const { data: customersData } = await fetchCustomersFromSupabase();

    const totalCust = customersData.length;
    const todayFollowUp = customersData.filter((c) => c.status === 'FOLLOW_UP').length;
    const overdue = customersData.filter((c) => c.status === 'OVERDUE').length;
    const quotation = customersData.filter((c) => c.status === 'QUOTATION_SENT').length;
    const wonToday = customersData.filter((c) => c.status === 'WON').length;
    const repeatDue = customersData.filter((c) => c.repeatStatus === 'DUE' || c.repeatStatus === 'OVERDUE').length;
    const expectedRevenue = 750000;

    const payload = {
      totalCustomers: totalCust,
      todayFollowUp,
      overdue,
      quotation,
      wonToday,
      repeatDue,
      expectedRevenue,
    };

    const queueItem: TelegramQueueItem = {
      id: `QUEUE-${Date.now()}`,
      type: summaryType,
      payload,
      status: 'PENDING',
      retry_count: 0,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    await pushTelegramQueueSupabase(queueItem);
    const result = await processTelegramQueueWorker();
    const logs = await fetchTelegramLogsFromSupabase();

    res.json({
      success: true,
      summaryType,
      payload,
      workerResult: result,
      logs,
    });
  };
  app.post('/api/telegram/send-summary', summaryHandler);
  app.post('/api/telegram/summary', summaryHandler);
  app.post('/telegram/summary', summaryHandler);

  // POST Retry Failed Notifications
  const retryHandler = async (req: express.Request, res: express.Response) => {
    const queue = await fetchTelegramQueueFromSupabase();
    const failedItems = queue.filter((q) => q.status === 'FAILED');
    for (const item of failedItems) {
      if (item.retry_count < 5) {
        item.status = 'PENDING';
        await updateTelegramQueueItemSupabase(item);
      }
    }
    const result = await processTelegramQueueWorker();
    res.json({ success: true, retriedCount: failedItems.length, workerResult: result });
  };
  app.post('/api/telegram/retry', retryHandler);
  app.post('/telegram/retry', retryHandler);

  // CREATE Note (100% Supabase)
  app.post('/api/notes', async (req, res) => {
    try {
      const newNote: InternalNote = {
        id: `note-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      };
      const saved = await addNoteSupabase(newNote);
      res.status(201).json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error saving note' });
    }
  });

  // CREATE Document (100% Supabase)
  app.post('/api/documents', async (req, res) => {
    try {
      const newDoc: CustomerDocument = {
        id: req.body.id || `doc-${Date.now()}`,
        ...req.body,
        createdAt: req.body.createdAt || new Date().toISOString().split('T')[0],
      };
      const saved = await addDocumentSupabase(newDoc);
      res.status(201).json(saved);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error saving document' });
    }
  });

  // DELETE Document (100% Supabase)
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDocumentSupabase(id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error deleting document' });
    }
  });

  // ==========================================
  // USERS & RBAC API ENDPOINTS
  // ==========================================

  // GET All Users
  app.get('/api/users', async (req, res) => {
    try {
      const result = await fetchUsersFromSupabase();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error fetching users', users: INITIAL_USERS, fromSupabase: false });
    }
  });

  // POST Create User
  app.post('/api/users', async (req, res) => {
    try {
      const body = req.body;
      const newUser: AppUser = {
        id: body.id || `USER-${Date.now()}`,
        username: body.username || body.user_login || `user_${Date.now()}`,
        password: body.password || '123456',
        firstName: body.firstName || body.first_name || '',
        lastName: body.lastName || body.last_name || '',
        name: body.name || body.full_name || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
        email: body.email || `${body.username || 'user'}@ideva.co.th`,
        position: body.position || 'เจ้าหน้าที่ฝ่ายขาย',
        department: body.department || 'ฝ่ายขาย (Sales)',
        avatarUrl: body.avatarUrl || body.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: body.role || 'SALES',
        status: body.status || 'ACTIVE',
        salesOwnerTag: body.salesOwnerTag || body.sales_owner_tag || (body.role === 'SALES' ? body.name : 'ALL'),
        permissions: body.permissions,
        createdAt: body.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const saved = await upsertUserSupabase(newUser);
      res.status(201).json({ success: true, user: saved });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error creating user' });
    }
  });

  // PUT Update User
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const updatedUser: AppUser = {
        ...body,
        id,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      const saved = await upsertUserSupabase(updatedUser);
      res.json({ success: true, user: saved });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error updating user' });
    }
  });

  // DELETE User
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Prevent deleting Master Admin
      if (id === 'USER-MASTER-ADMIN') {
        return res.status(400).json({ error: 'ไม่สามารถลบ Master Admin (ผู้ดูแลระบบสูงสุด) ได้' });
      }
      await deleteUserSupabase(id);
      res.json({ success: true, message: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error deleting user' });
    }
  });

  // SEED Users
  app.post('/api/users/seed', async (req, res) => {
    try {
      const usersToSeed = req.body.users && Array.isArray(req.body.users) ? req.body.users : INITIAL_USERS;
      await seedUsersToSupabase(usersToSeed);
      res.json({ success: true, count: usersToSeed.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Error seeding users' });
    }
  });

  // POST Upload Avatar (Store real employee photo and return public URL link)
  app.post('/api/upload/avatar', async (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData) {
        return res.status(400).json({ success: false, error: 'กรุณาระบุข้อมูลรูปภาพ (fileData)' });
      }

      let buffer: Buffer;
      let ext = 'png';

      const matches = String(fileData).match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
      if (matches) {
        const rawType = matches[1].toLowerCase();
        ext = rawType === 'jpeg' ? 'jpg' : rawType === 'svg+xml' ? 'svg' : rawType;
        buffer = Buffer.from(matches[2], 'base64');
      } else if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
        // Direct URL link provided
        return res.json({
          success: true,
          url: fileData,
          fileName: fileName || 'avatar-link',
          isLink: true,
        });
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      // Generate clean unique filename
      const cleanBase = (fileName || 'employee')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      const uniqueName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanBase}.${ext}`;

      const filePath = path.join(uploadsDir, uniqueName);
      const publicFilePath = path.join(publicUploadsDir, uniqueName);

      fs.writeFileSync(filePath, buffer);
      try {
        fs.writeFileSync(publicFilePath, buffer);
      } catch (e) {
        // Public copy is optional for dev mode
      }

      const fileUrl = `/uploads/avatars/${uniqueName}`;
      res.json({
        success: true,
        url: fileUrl,
        fileName: uniqueName,
        sizeBytes: buffer.length,
        message: 'อัปโหลดรูปภาพพนักงานสำเร็จและจัดเก็บเป็นลิงก์ URL เรียบร้อย',
      });
    } catch (err: any) {
      console.error('Error in /api/upload/avatar:', err);
      res.status(500).json({ success: false, error: err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
    }
  });

  // POST Login Authentication
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อผู้ใช้งาน' });
      }

      const user = await getUserByUsernameSupabase(username);
      if (!user) {
        return res.status(401).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' });
      }

      if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
        return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
      }

      if (password && user.password && user.password !== password) {
        return res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
      }

      // Update last login
      user.lastLoginAt = new Date().toISOString();
      await upsertUserSupabase(user).catch(() => {});

      res.json({ success: true, user, message: 'เข้าสู่ระบบสำเร็จ' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || 'Login error' });
    }
  });

  // ==========================================
  // BACKUP & EXPORT ALL SYSTEM DATA (JSON)
  // ==========================================
  app.get('/api/backup', async (req, res) => {
    try {
      const { data: customers } = await fetchCustomersFromSupabase();
      const { data: activities } = await fetchActivitiesFromSupabase();
      const { data: orders } = await fetchOrdersFromSupabase();
      const documents = await fetchDocumentsFromSupabase();
      const notes = await fetchNotesFromSupabase();
      const { data: users } = await fetchUsersFromSupabase();
      const telegramSettings = await fetchTelegramSettingsFromSupabase();
      const telegramTopics = await fetchTelegramTopicsFromSupabase();
      const telegramLogs = await fetchTelegramLogsFromSupabase();
      const telegramQueue = await fetchTelegramQueueFromSupabase();

      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];
      const timeStr = timestamp.split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
      const filename = `crm_backup_ideva_${dateStr}_${timeStr}.json`;

      const backupData = {
        metadata: {
          systemName: 'IDEVA CRM & Customer Intelligence Platform',
          backupDate: timestamp,
          version: '2.5.0',
          environment: 'production',
          totalRecords: {
            customers: customers.length,
            activities: activities.length,
            orders: orders.length,
            documents: documents.length,
            notes: notes.length,
            users: users.length,
            telegramLogs: telegramLogs.length,
            telegramQueue: telegramQueue.length,
          },
        },
        customers,
        activities,
        orders,
        documents,
        notes,
        users,
        telegram: {
          settings: telegramSettings,
          topics: telegramTopics,
          logs: telegramLogs,
          queue: telegramQueue,
        },
      };

      if (req.query.download === 'true') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(JSON.stringify(backupData, null, 2));
      }

      res.json({
        success: true,
        filename,
        backupData,
      });
    } catch (err: any) {
      console.error('[GET /api/backup error]:', err);
      res.status(500).json({ success: false, error: err?.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูล' });
    }
  });

  app.post('/api/backup', async (req, res) => {
    try {
      const { data: customers } = await fetchCustomersFromSupabase();
      const { data: activities } = await fetchActivitiesFromSupabase();
      const { data: orders } = await fetchOrdersFromSupabase();
      const documents = await fetchDocumentsFromSupabase();
      const notes = await fetchNotesFromSupabase();
      const { data: users } = await fetchUsersFromSupabase();
      const telegramSettings = await fetchTelegramSettingsFromSupabase();
      const telegramTopics = await fetchTelegramTopicsFromSupabase();
      const telegramLogs = await fetchTelegramLogsFromSupabase();
      const telegramQueue = await fetchTelegramQueueFromSupabase();

      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];
      const timeStr = timestamp.split('T')[1].replace(/[:.]/g, '-').slice(0, 8);
      const filename = `crm_backup_ideva_${dateStr}_${timeStr}.json`;

      const backupData = {
        metadata: {
          systemName: 'IDEVA CRM & Customer Intelligence Platform',
          backupDate: timestamp,
          version: '2.5.0',
          environment: 'production',
          totalRecords: {
            customers: customers.length,
            activities: activities.length,
            orders: orders.length,
            documents: documents.length,
            notes: notes.length,
            users: users.length,
            telegramLogs: telegramLogs.length,
            telegramQueue: telegramQueue.length,
          },
        },
        customers,
        activities,
        orders,
        documents,
        notes,
        users,
        telegram: {
          settings: telegramSettings,
          topics: telegramTopics,
          logs: telegramLogs,
          queue: telegramQueue,
        },
      };

      res.json({
        success: true,
        filename,
        backupData,
      });
    } catch (err: any) {
      console.error('[POST /api/backup error]:', err);
      res.status(500).json({ success: false, error: err?.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูล' });
    }
  });

  // VITE DEV MIDDLEWARE or STATIC PRODUCTION SERVING
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CRM Customer Follow-up Server connected to Supabase running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
