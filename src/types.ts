export type CustomerStatus = 
  | 'NEW'
  | 'EXISTING'
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
  | 'LOST_REPEAT'
  | 'NOT_APPLICABLE'; // เคสลูกค้าที่อยู่ระหว่างการดีล / ยังไม่ต้องมีข้อมูลการซื้อซ้ำ

export type CustomerTier = 
  | 'PLATINUM'
  | 'GOLD'
  | 'SILVER'
  | 'GENERAL';

export type ActivityType = 
  | 'CALL'
  | 'LINE'
  | 'FACEBOOK'
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

export type OrderType = 'TESTER' | 'BRAND_PRODUCTION';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  orderType?: OrderType; // 'TESTER' (เทสเตอร์ทดลองใช้) | 'BRAND_PRODUCTION' (สั่งผลิตสร้างแบรนด์)
  testerFollowUpDate?: string; // วันที่นัดติดตามผลทดลองใช้ สำหรับเทสเตอร์
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

export type UserRole = 'MASTER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALES' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface UserPermissions {
  canViewDashboard: boolean;
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
  canManageOrders: boolean;
  canManageActivities: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canAccessSettings: boolean;
  canManageUsers: boolean;
  dataScope: 'ALL' | 'OWN_ONLY';
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status?: UserStatus;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  avatar?: string;
  salesOwnerTag?: string;
  permissions?: UserPermissions;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppUser extends UserProfile {
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position: string;
  department: string;
  status: UserStatus;
  permissions: UserPermissions;
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
  | 'SETTINGS'
  | 'USERS';
