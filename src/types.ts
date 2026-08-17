export type CustomerStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'FOLLOW_UP'
  | 'QUOTATION_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'OVERDUE';

export type RepeatOrderStatus = 
  | 'UPCOMING'
  | 'DUE'
  | 'OVERDUE'
  | 'REORDERED'
  | 'LOST_REPEAT';

export type CustomerTier = 
  | 'PLATINUM'
  | 'GOLD'
  | 'SILVER'
  | 'GENERAL';

export type ActivityType = 
  | 'CALL'
  | 'LINE'
  | 'EMAIL'
  | 'MEETING'
  | 'SITE_VISIT'
  | 'DEMO'
  | 'OTHER';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  lineId: string;
  email: string;
  interestedProducts: string;
  source: string;
  salesOwner: string;
  status: CustomerStatus;
  tier: CustomerTier;
  taxId?: string;
  address?: string;
  facebook?: string;
  nextFollowUpDate: string; // YYYY-MM-DD
  nextFollowUpTime: string; // HH:mm
  nextAction: string;
  totalPurchases: number;
  totalOrdersCount: number;
  lastOrderDate?: string;
  lastDeliveryDate?: string;
  avgReorderCycleDays: number;
  nextReorderDate?: string;
  followUpStartDate?: string;
  repeatStatus?: RepeatOrderStatus;
  riskStatus?: 'NORMAL' | 'MODERATE' | 'HIGH';
  daysSinceLastOrder?: number;
  expectedLostRevenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  customerId: string;
  customerName: string;
  type: ActivityType;
  summary: string;
  detail: string;
  result: string;
  nextAction: string;
  followUpDate: string;
  followUpTime: string;
  salesOwner: string;
  status: CustomerStatus;
  attachments?: Attachment[];
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  reorderCycleDays: number;
  nextReorderDate: string;
  followUpStartDate: string;
  repeatStatus: RepeatOrderStatus;
  createdAt: string;
}

export interface CustomerDocument {
  id: string;
  customerId: string;
  name: string;
  type: 'QUOTATION' | 'PROPOSAL' | 'INVOICE' | 'CONTRACT' | 'OTHER';
  fileUrl: string;
  fileSize: string;
  createdAt: string;
  uploadedBy: string;
}

export interface InternalNote {
  id: string;
  customerId: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'FOLLOWUP_TODAY' | 'OVERDUE' | 'REPEAT_DUE' | 'ESCALATION';
  customerId: string;
  isRead: boolean;
  createdAt: string;
}

export interface LostReasonRecord {
  id: string;
  customerId: string;
  customerName: string;
  reason: string;
  competitor?: string;
  notes?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'SALES' | 'VIEWER';
  email: string;
  avatarUrl?: string;
}

export interface TelegramTopic {
  id: string;
  topic_key: string;
  topic_name: string;
  thread_id: string | number;
  is_enabled: boolean;
  created_at?: string;
}

export interface TelegramRules {
  notifyFollowUpToday: boolean;
  notifyFollowUp1Day: boolean;
  notifyFollowUp3Days: boolean;
  notifyOverdue: boolean;
  notifyStatusChanged: boolean;
  notifyQuotationSent: boolean;
  notifyQuotationOpened: boolean;
  notifyWon: boolean;
  notifyLost: boolean;
  notifyOrderCreated: boolean;
  notifyShipped: boolean;
  notifyRepeatUpcoming: boolean;
  notifyRepeatDue: boolean;
  notifyRepeatOverdue: boolean;
  notifyCustomerAtRisk: boolean;
  notifyManagerApproval: boolean;
  notifySaleAssignment: boolean;
  notifyDailySummary: boolean;
  notifyWeeklySummary: boolean;
}

export interface TelegramSettings {
  id: string;
  bot_token: string;
  group_chat_id: string;
  topic_id: string;
  webhook_secret: string;
  is_enabled: boolean;
  rules: TelegramRules;
  created_at: string;
  updated_at: string;
}

export interface TelegramNotificationLog {
  id: string;
  customer_id?: string;
  follow_up_id?: string;
  order_id?: string;
  notification_type: string;
  telegram_message_id?: string;
  telegram_chat_id?: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  response?: string;
  created_at: string;
}

export interface TelegramQueueItem {
  id: string;
  type: string;
  payload: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  retry_count: number;
  next_retry_at?: string;
  processed_at?: string | null;
  created_at: string;
}

export type ViewTab = 
  | 'APP_GRID'
  | 'DASHBOARD'
  | 'CUSTOMERS'
  | 'CUSTOMER_PROFILE'
  | 'ACTIVITIES'
  | 'CALENDAR'
  | 'LEADS'
  | 'ORDERS'
  | 'AFTER_SALES'
  | 'REPEAT_ORDERS'
  | 'REPORTS'
  | 'USER_MANUAL'
  | 'SETTINGS';
