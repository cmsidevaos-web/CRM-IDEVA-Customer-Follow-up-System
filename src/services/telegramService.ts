import { TelegramNotificationLog, TelegramQueueItem, TelegramRules, TelegramSettings, TelegramTopic } from '../types';

export const defaultTelegramRules: TelegramRules = {
  notifyFollowUpToday: true,
  notifyFollowUp1Day: true,
  notifyFollowUp3Days: true,
  notifyOverdue: true,
  notifyStatusChanged: true,
  notifyQuotationSent: true,
  notifyQuotationOpened: true,
  notifyWon: true,
  notifyLost: true,
  notifyOrderCreated: true,
  notifyShipped: true,
  notifyRepeatUpcoming: true,
  notifyRepeatDue: true,
  notifyRepeatOverdue: true,
  notifyCustomerAtRisk: true,
  notifyManagerApproval: true,
  notifySaleAssignment: true,
  notifyDailySummary: true,
  notifyWeeklySummary: true,
};

export const defaultTelegramTopics: TelegramTopic[] = [
  { id: 'topic-1', topic_key: 'follow_up', topic_name: 'Follow-up Notifications', thread_id: '2', is_enabled: true },
  { id: 'topic-2', topic_key: 'quotation', topic_name: 'Quotation Alerts', thread_id: '4', is_enabled: true },
  { id: 'topic-3', topic_key: 'orders', topic_name: 'New Orders & Delivery', thread_id: '7', is_enabled: true },
  { id: 'topic-4', topic_key: 'repeat_orders', topic_name: 'Repeat Order CRM', thread_id: '8', is_enabled: true },
  { id: 'topic-5', topic_key: 'overdue', topic_name: 'Overdue Follow-ups', thread_id: '9', is_enabled: true },
  { id: 'topic-6', topic_key: 'won_deals', topic_name: 'Won Deals & Achievements', thread_id: '10', is_enabled: true },
];

export const defaultTelegramSettings: TelegramSettings = {
  id: 'tg-set-001',
  bot_token: '7891234560:AAFx9831aB_crm_bot_token_secret',
  group_chat_id: '-1004422388519',
  topic_id: '2',
  webhook_secret: 'wh_secret_crm_2026_xyz',
  is_enabled: true,
  rules: defaultTelegramRules,
  created_at: '2026-07-01 08:00',
  updated_at: '2026-08-10 10:00',
};

export function getTopicForType(type: string, topics = defaultTelegramTopics): { topicKey: string; threadId: string } {
  const upper = type.toUpperCase();
  let key = 'follow_up';

  if (upper.includes('OVERDUE')) {
    key = 'overdue';
  } else if (upper.includes('ORDER') || upper.includes('ORDERS') || upper.includes('ORDER_CREATED') || upper.includes('ORDER_PAID') || upper.includes('ORDER_DELIVERED') || upper.includes('NEW_ORDER')) {
    key = 'orders';
  } else if (upper.includes('WON') && !upper.includes('ORDER')) {
    key = 'won_deals';
  } else if (upper.includes('QUOTATION')) {
    key = 'quotation';
  } else if (upper.includes('ORDER_CREATED') || upper.includes('ORDER_PAID') || upper.includes('ORDER_DELIVERED') || upper.includes('NEW_ORDER')) {
    key = 'orders';
  } else if (upper.includes('REPEAT')) {
    key = 'repeat_orders';
  } else if (upper.includes('FOLLOW')) {
    key = 'follow_up';
  }

  const found = topics.find((t) => t.topic_key === key && t.is_enabled);
  if (found) {
    return { topicKey: found.topic_key, threadId: String(found.thread_id) };
  }

  const envTopicMap: Record<string, string | undefined> = {
    follow_up: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_FOLLOWUP : undefined,
    quotation: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_QUOTATION : undefined,
    orders: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_ORDERS : undefined,
    repeat_orders: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_REPEAT_ORDERS : undefined,
    overdue: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_OVERDUE : undefined,
    won_deals: typeof process !== 'undefined' ? process.env?.TELEGRAM_TOPIC_WON_DEALS : undefined,
  };

  const envVal = envTopicMap[key];
  if (envVal) {
    return { topicKey: key, threadId: envVal };
  }

  const defaultTopicMap: Record<string, string> = {
    follow_up: '2',
    quotation: '4',
    orders: '7',
    repeat_orders: '8',
    overdue: '9',
    won_deals: '10',
  };

  return { topicKey: key, threadId: defaultTopicMap[key] || '2' };
}

export const initialTelegramLogs: TelegramNotificationLog[] = [
  {
    id: 'TGLOG-1001',
    customer_id: 'CUST-002',
    notification_type: 'OVERDUE',
    telegram_message_id: '89101',
    telegram_chat_id: '-1002345678901',
    status: 'SENT',
    response: '{"ok":true,"result":{"message_id":89101,"chat":{"id":-1002345678901,"title":"CRM Sales Alerts Group"}}}',
    created_at: '2026-08-10 09:30',
  },
  {
    id: 'TGLOG-1002',
    customer_id: 'CUST-001',
    order_id: 'ORD-20260730-001',
    notification_type: 'WON',
    telegram_message_id: '89102',
    telegram_chat_id: '-1002345678901',
    status: 'SENT',
    response: '{"ok":true,"result":{"message_id":89102,"chat":{"id":-1002345678901,"title":"CRM Sales Alerts Group"}}}',
    created_at: '2026-08-10 10:15',
  },
  {
    id: 'TGLOG-1003',
    customer_id: 'CUST-004',
    notification_type: 'REPEAT_DUE',
    telegram_message_id: '89103',
    telegram_chat_id: '-1002345678901',
    status: 'SENT',
    response: '{"ok":true,"result":{"message_id":89103,"chat":{"id":-1002345678901,"title":"CRM Sales Alerts Group"}}}',
    created_at: '2026-08-10 11:00',
  },
  {
    id: 'TGLOG-1004',
    notification_type: 'DAILY_SUMMARY',
    telegram_message_id: '89104',
    telegram_chat_id: '-1002345678901',
    status: 'SENT',
    response: '{"ok":true,"result":{"message_id":89104,"chat":{"id":-1002345678901,"title":"CRM Sales Alerts Group"}}}',
    created_at: '2026-08-10 18:00',
  },
];

export const initialTelegramQueue: TelegramQueueItem[] = [
  {
    id: 'QUEUE-2001',
    type: 'REPEAT_DUE',
    payload: {
      companyName: 'บริษัท บิวตี้อินโนเวชั่น จำกัด',
      contactName: 'คุณณิชา',
      phone: '089-876-5432',
      productName: 'ครีมกันแดด SPF50+ (1,000 ชิ้น)',
      reorderCycleDays: 60,
      expectedRevenue: 85000,
      salesOwner: 'คุณอนุชา',
      customerId: 'CUST-004',
    },
    status: 'COMPLETED',
    retry_count: 0,
    processed_at: '2026-08-10 11:00',
    created_at: '2026-08-10 10:59',
  },
  {
    id: 'QUEUE-2002',
    type: 'CUSTOMER_AT_RISK',
    payload: {
      companyName: 'บริษัท ไทยคอสเมติกส์ โปรดักส์ จำกัด',
      contactName: 'คุณวิชัย',
      phone: '081-999-8888',
      riskStatus: 'HIGH',
      daysSinceLastOrder: 95,
      expectedLostRevenue: 120000,
      salesOwner: 'คุณสมชาย',
      customerId: 'CUST-008',
    },
    status: 'PENDING',
    retry_count: 0,
    created_at: '2026-08-10 17:45',
  },
];

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramCardResult {
  text: string;
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
  headerColor: string;
  badgeEmoji: string;
}

export function buildTelegramCard(
  type: string,
  payload: any,
  baseUrl = 'https://crm.yourdomain.com'
): TelegramCardResult {
  const customerId = payload.customerId || payload.id || 'CUST-001';
  const crmUrl = `${baseUrl}?customer=${customerId}`;
  const phone = payload.phone || '081-234-5678';
  const lineId = payload.lineId || 'line_contact';
  const phoneUrl = crmUrl;
  const lineUrl = `https://line.me/ti/p/~${lineId}`;
  const orderUrl = `${baseUrl}?tab=ORDERS&customer=${customerId}`;

  switch (type) {
    case 'FOLLOW_UP':
    case 'FOLLOWUP':
    case 'OVERDUE': {
      const company = payload.companyName || 'ABC Shop Co., Ltd.';
      const contact = payload.contactName || 'คุณสมชาย';
      const date = payload.nextFollowUpDate || payload.followUpDate || '30/07/2026 10:00';
      const overdueDays = payload.overdueDays || 4;
      const salesOwner = payload.salesOwner || 'คุณอนุชา';
      const nextAction = payload.nextAction || 'โทรติดตามใบเสนอราคา';
      const dealValue = (payload.dealValue || payload.totalPurchases || 57000).toLocaleString('th-TH');

      const text = `📋 <b>FOLLOW-UP & OVERDUE NOTIFICATION</b>
━━━━━━━━━━━━━━━━━━
🏢 <b>${escapeHtml(company)}</b>
👤 คุณ${escapeHtml(contact)}
📞 <code>${escapeHtml(phone)}</code>

📅 <b>กำหนดติดตาม:</b> ${escapeHtml(date)}
⏰ <b>เกินกำหนด:</b> <code>${overdueDays} วัน</code>
👨‍💼 <b>Sale:</b> ${escapeHtml(salesOwner)}
🎯 <b>Next Action:</b> ${escapeHtml(nextAction)}
💰 <b>มูลค่าดีล:</b> <code>${dealValue} บาท</code>
━━━━━━━━━━━━━━━━━━
⚠️ <i>กรุณาติดตามลูกค้าโดยด่วน (Topic ID: 2 / 9)</i>`;

      return {
        text,
        badgeEmoji: '📋',
        headerColor: '#DC2626', // Crimson / Deep Red
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 เปิด CRM', url: crmUrl },
              { text: '📞 โทรหาลูกค้า', url: phoneUrl },
            ],
            [
              { text: '💬 LINE หาลูกค้า', url: lineUrl },
              { text: '📅 เลื่อนกำหนดติดตาม', url: `${crmUrl}&action=reschedule` },
            ],
          ],
        },
      };
    }

    case 'WON_DEALS':
    case 'WON': {
      const company = payload.companyName || 'ABC Shop Co., Ltd.';
      const orderId = payload.orderId || 'ORD-20260730-001';
      const amount = (payload.totalAmount || payload.amount || 57000).toLocaleString('th-TH');
      const salesOwner = payload.salesOwner || 'คุณอนุชา';
      const closedDate = payload.closedDate || '30/07/2026';

      const text = `🏆 <b>WON DEALS (ปิดการขายสำเร็จ)</b>
━━━━━━━━━━━━━━━━━━
🏆 <b>ปิดการขายสำเร็จ!</b>
🏢 <b>${escapeHtml(company)}</b>
💰 <b>ยอดขาย:</b> <code>${amount} บาท</code>
📦 <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
👨‍💼 <b>Sale:</b> ${escapeHtml(salesOwner)}
📅 <b>วันที่ปิดการขาย:</b> ${escapeHtml(closedDate)}
━━━━━━━━━━━━━━━━━━
🎉 <i>ขอแสดงความยินดีกับทีมขาย! (Topic ID: 10)</i>`;

      return {
        text,
        badgeEmoji: '🏆',
        headerColor: '#059669', // Emerald
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📦 ดู Order ใน CRM', url: orderUrl },
              { text: '👤 Customer Profile', url: crmUrl },
            ],
          ],
        },
      };
    }

    case 'ORDERS':
    case 'NEW_ORDER': {
      const company = payload.companyName || 'บริษัท บิวตี้อินโนเวชั่น จำกัด';
      const orderId = payload.orderId || 'ORD-20260811-001';
      const amount = (payload.totalAmount || payload.amount || 125000).toLocaleString('th-TH');
      const salesOwner = payload.salesOwner || 'คุณอนุชา';
      const product = payload.productName || 'เซรั่มบำรุงผิวหน้า 500 ขวด';

      const text = `📦 <b>ORDERS NOTIFICATION</b>
━━━━━━━━━━━━━━━━━━
📦 <b>เปิดออเดอร์ใหม่!</b>
🏢 <b>${escapeHtml(company)}</b>
🔢 <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
🛍️ <b>สินค้า:</b> ${escapeHtml(product)}
💰 <b>ยอดเงินรวม:</b> <code>${amount} บาท</code>
👨‍💼 <b>Sale:</b> ${escapeHtml(salesOwner)}
━━━━━━━━━━━━━━━━━━
🚚 <i>เตรียมจัดส่งสินค้าและดำเนินการออกใบส่งของ (Topic ID: 7)</i>`;

      return {
        text,
        badgeEmoji: '📦',
        headerColor: '#2563EB', // Royal Blue
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📦 ดู Order ใน CRM', url: orderUrl },
              { text: '👤 Customer Profile', url: crmUrl },
            ],
          ],
        },
      };
    }

    case 'REPEAT_ORDERS':
    case 'REPEAT_DUE': {
      const company = payload.companyName || 'ABC Shop Co., Ltd.';
      const product = payload.productName || 'ครีมกันแดด SPF50+';
      const cycle = payload.reorderCycleDays || 60;
      const expectedRev = (payload.expectedRevenue || 85000).toLocaleString('th-TH');
      const salesOwner = payload.salesOwner || 'คุณอนุชา';

      const text = `🔁 <b>REPEAT ORDERS NOTIFICATION</b>
━━━━━━━━━━━━━━━━━━
🏢 <b>${escapeHtml(company)}</b>
📦 <b>สินค้า:</b> ${escapeHtml(product)}
📅 <b>รอบซื้อเดิม:</b> ${cycle} วัน
🔁 <b>ควรรอบสั่งซื้อซ้ำ:</b> <code>วันนี้</code>
💰 <b>คาดว่าจะสั่งซื้อ:</b> <code>${expectedRev} บาท</code>
👨‍💼 <b>Sale:</b> ${escapeHtml(salesOwner)}
━━━━━━━━━━━━━━━━━━
📞 <i>แนะนำให้ติดต่อลูกค้าเพื่อเปิดออเดอร์ใหม่ภายในวันนี้ (Topic ID: 8)</i>`;

      return {
        text,
        badgeEmoji: '🔁',
        headerColor: '#D97706', // Amber
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛒 สร้าง Order ใหม่', url: `${crmUrl}&action=create_order` },
              { text: '📝 บันทึกการติดตาม', url: `${crmUrl}&action=add_activity` },
            ],
            [
              { text: '📞 โทรหาลูกค้า', url: phoneUrl },
              { text: '👤 ดูประวัติลูกค้า', url: crmUrl },
            ],
          ],
        },
      };
    }

    case 'QUOTATION':
    case 'QUOTATION_SENT': {
      const company = payload.companyName || 'บริษัท นวัตกรรมไทย จำกัด';
      const qNo = payload.quotationNo || 'QT-202608-042';
      const amount = (payload.amount || 145000).toLocaleString('th-TH');
      const salesOwner = payload.salesOwner || 'คุณนภา';

      const text = `💰 <b>QUOTATION NOTIFICATION</b>
━━━━━━━━━━━━━━━━━━
📄 <b>ส่งใบเสนอราคาเรียบร้อย</b>
🏢 <b>${escapeHtml(company)}</b>
🔢 <b>เลขที่:</b> <code>${escapeHtml(qNo)}</code>
💰 <b>มูลค่ารวม:</b> <code>${amount} บาท</code>
👨‍💼 <b>Sale:</b> ${escapeHtml(salesOwner)}
━━━━━━━━━━━━━━━━━━
📌 <i>ตั้งเตือนติดตามผลใน 3 วันทำการ (Topic ID: 4)</i>`;

      return {
        text,
        badgeEmoji: '💰',
        headerColor: '#EA580C', // Orange
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📄 ดูเอกสาร QUOTATION', url: `${crmUrl}&tab=DOCS` },
              { text: '📱 เปิดหน้าลูกค้า CRM', url: crmUrl },
            ],
          ],
        },
      };
    }

    case 'LOST': {
      const company = payload.companyName || 'พรีเมียม สกินไทย จำกัด';
      const reason = payload.reason || 'ราคาแพงกว่าคู่แข่ง 15%';
      const competitor = payload.competitor || 'Brand X';
      const lostValue = (payload.dealValue || 65000).toLocaleString('th-TH');

      const text = `🔴 <b>DEAL LOST</b>
━━━━━━━━━━━━━━━━━━
❌ <b>เสียโอกาสการขาย</b>
🏢 <b>${escapeHtml(company)}</b>
💰 <b>มูลค่าดีล:</b> <code>${lostValue} บาท</code>
❗ <b>สาเหตุที่หลุด:</b> ${escapeHtml(reason)}
🏬 <b>คู่แข่ง:</b> ${escapeHtml(competitor)}
━━━━━━━━━━━━━━━━━━
📊 <i>บันทึกวิเคราะห์เพื่อปรับปรุงกลยุทธ์สินค้า</i>`;

      return {
        text,
        badgeEmoji: '🔴',
        headerColor: '#DC2626', // Red
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 ดูรายงาน Lost Analysis', url: `${baseUrl}?tab=REPORTS&report=LOST` },
              { text: '👤 Customer Profile', url: crmUrl },
            ],
          ],
        },
      };
    }

    case 'CUSTOMER_AT_RISK': {
      const company = payload.companyName || 'บริษัท ไทยคอสเมติกส์ โปรดักส์ จำกัด';
      const riskLevel = payload.riskStatus || 'HIGH';
      const daysNoOrder = payload.daysSinceLastOrder || 95;
      const expectedLost = (payload.expectedLostRevenue || 120000).toLocaleString('th-TH');

      const text = `⚠️ <b>CUSTOMER AT RISK (${riskLevel})</b>
━━━━━━━━━━━━━━━━━━
🏢 <b>${escapeHtml(company)}</b>
⏳ <b>ไม่สั่งซื้อมาแล้ว:</b> <code>${daysNoOrder} วัน</code>
💰 <b>มูลค่าซื้อเฉลี่ยที่เสี่ยงสูญเสีย:</b> <code>${expectedLost} บาท</code>
━━━━━━━━━━━━━━━━━━
🛡️ <i>ผู้จัดการแนะนำให้มอบโปรโมชั่นพิเศษดึงลูกค้ากลับมา</i>`;

      return {
        text,
        badgeEmoji: '⚠️',
        headerColor: '#EAB308', // Yellow
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 เปิด CRM', url: crmUrl },
              { text: '📞 โทรเสนอโปรพิเศษ', url: phoneUrl },
            ],
          ],
        },
      };
    }

    case 'DAILY_SUMMARY': {
      const totalCust = (payload.totalCustomers || 1248).toLocaleString('th-TH');
      const todayCount = payload.todayFollowUp || 18;
      const overdueCount = payload.overdue || 7;
      const quotationCount = payload.quotation || 45;
      const wonToday = payload.wonToday || 3;
      const repeatDue = payload.repeatDue || 6;
      const expectedRev = (payload.expectedRevenue || 750000).toLocaleString('th-TH');

      const text = `📊 <b>CRM DAILY SUMMARY</b>
━━━━━━━━━━━━━━━━━━
👥 <b>ลูกค้าทั้งหมด:</b> <code>${totalCust} ราย</code>
📅 <b>ติดตามวันนี้:</b> <code>${todayCount} ราย</code>
🔴 <b>เกินกำหนด (Overdue):</b> <code>${overdueCount} ราย</code>
📄 <b>Quotation Sent:</b> <code>${quotationCount} ราย</code>
🏆 <b>Won วันนี้:</b> <code>${wonToday} ราย</code>
🔁 <b>Repeat Due:</b> <code>${repeatDue} ราย</code>
💰 <b>Expected Revenue:</b> <code>${expectedRev} บาท</code>
━━━━━━━━━━━━━━━━━━
📈 <i>สรุปภาพรวมยอดขายและการติดตามลูกค้าประจำวัน</i>`;

      return {
        text,
        badgeEmoji: '📊',
        headerColor: '#4F46E5', // Indigo
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 เปิด Dashboard CRM', url: `${baseUrl}?tab=DASHBOARD` },
              { text: '🔴 ดูรายการ Overdue', url: `${baseUrl}?tab=ACTIVITIES&status=OVERDUE` },
            ],
            [
              { text: '🔁 ดูรายการ Repeat Due', url: `${baseUrl}?tab=REPEAT_ORDERS` },
              { text: '📄 ดูรายงานสรุป', url: `${baseUrl}?tab=REPORTS` },
            ],
          ],
        },
      };
    }

    default: {
      const title = payload.title || 'CRM NOTIFICATION';
      const message = payload.message || 'มีการอัปเดตข้อมูลลูกค้าในระบบ CRM';
      const company = payload.companyName || 'ลูกค้า CRM';

      const text = `🔔 <b>${escapeHtml(title)}</b>
━━━━━━━━━━━━━━━━━━
🏢 <b>${escapeHtml(company)}</b>
ℹ️ ${escapeHtml(message)}
━━━━━━━━━━━━━━━━━━`;

      return {
        text,
        badgeEmoji: '🔔',
        headerColor: '#2563EB',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📱 เปิดดูใน CRM', url: crmUrl },
            ],
          ],
        },
      };
    }
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendTelegramApiMessage(
  botToken: string,
  chatId: string,
  topicId: string | undefined,
  cardResult: TelegramCardResult
): Promise<{ ok: boolean; response: any; messageId?: string }> {
  let cleanToken = (botToken || '').trim();
  let cleanChatId = (chatId || '').trim();

  // Fallback to process.env if token is missing or dummy secret
  if ((!cleanToken || cleanToken === '7891234560:AAFx9831aB_crm_bot_token_secret' || cleanToken.includes('secret')) && typeof process !== 'undefined' && process.env?.TELEGRAM_BOT_TOKEN) {
    cleanToken = process.env.TELEGRAM_BOT_TOKEN.trim();
  }

  // Fallback to process.env if chatId is missing
  if ((!cleanChatId || cleanChatId === '-1002345678901') && typeof process !== 'undefined' && process.env?.TELEGRAM_GROUP_ID) {
    cleanChatId = process.env.TELEGRAM_GROUP_ID.trim();
  }

  // If token is missing or dummy placeholder token, return helpful setup message
  if (!cleanToken || cleanToken === '7891234560:AAFx9831aB_crm_bot_token_secret' || cleanToken.includes('secret')) {
    return {
      ok: false,
      response: {
        ok: false,
        error: 'กรุณากรอก Telegram Bot Token จริงจาก @BotFather ในเมนู Telegram Settings หรือตั้งค่าใน .env ก่อนทดสอบส่ง',
        description: 'กรุณากรอก Telegram Bot Token จริงจาก @BotFather ในเมนู Telegram Settings หรือตั้งค่าใน .env ก่อนทดสอบส่ง',
      },
    };
  }

  if (!cleanChatId) {
    return {
      ok: false,
      response: {
        ok: false,
        error: 'กรุณากรอก Telegram Group Chat ID (เช่น -1004422388519)',
        description: 'กรุณากรอก Telegram Group Chat ID (เช่น -1004422388519)',
      },
    };
  }

  try {
    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const body: any = {
      chat_id: cleanChatId,
      text: cardResult.text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };

    if (topicId && topicId.trim() && topicId.trim() !== '0') {
      const threadNum = Number(topicId.trim());
      if (!isNaN(threadNum) && threadNum > 0) {
        body.message_thread_id = threadNum;
      }
    }

    if (cardResult.reply_markup) {
      body.reply_markup = cardResult.reply_markup;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.ok) {
      console.warn('[Telegram API Error]:', data);
      return {
        ok: false,
        response: {
          ok: false,
          error_code: data.error_code,
          description: data.description || 'เกิดข้อผิดพลาดจาก Telegram API',
          error: data.description || `HTTP ${res.status}: Telegram API Failed`,
        },
      };
    }

    return {
      ok: true,
      messageId: data.result?.message_id ? String(data.result.message_id) : undefined,
      response: data,
    };
  } catch (err: any) {
    console.error('[Telegram API Network Catch]:', err);
    return {
      ok: false,
      response: { ok: false, error: err?.message || String(err), description: err?.message || String(err) },
    };
  }
}
