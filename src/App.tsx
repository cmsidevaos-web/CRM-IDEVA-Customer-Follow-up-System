import React, { useEffect, useMemo, useState } from 'react';
import { AfterSalesView } from './components/AfterSalesView';
import { ActivitiesView } from './components/ActivitiesView';
import { CalendarView } from './components/CalendarView';
import { CreateActivityModal } from './components/CreateActivityModal';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { CreateOrderModal } from './components/CreateOrderModal';
import { EditCustomerModal } from './components/EditCustomerModal';
import { CustomerListView } from './components/CustomerListView';
import { CustomerProfileView } from './components/CustomerProfileView';
import { DashboardView } from './components/DashboardView';
import { ExportModal } from './components/ExportModal';
import { AVAILABLE_USERS, Header } from './components/Header';
import { LeadsKanbanView } from './components/LeadsKanbanView';
import { MobileAppGrid } from './components/MobileAppGrid';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OrdersView } from './components/OrdersView';
import { RepeatOrderView } from './components/RepeatOrderView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { UserManualView } from './components/UserManualView';
import { UserManagementView } from './components/UserManagementView';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { WorkflowBanner } from './components/WorkflowBanner';
import { realtimeService } from './services/RealtimeService';
import { apiClient } from './services/apiClient';
import { INITIAL_USERS } from './data/defaultUsers';
import {
  getStoredTabReadState,
  markTabItemsRead,
  computeUnreadCountForItems,
  computeUnreadCountForCategory,
  TabReadState,
} from './utils/unreadTracker';

import {
  Activity,
  AppUser,
  Customer,
  CustomerDocument,
  CustomerStatus,
  InternalNote,
  NotificationItem,
  Order,
  UserProfile,
  ViewTab
} from './types';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ViewTab>('DASHBOARD');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // App Data State (Initialized empty - 100% loaded from Supabase)
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedSalesOwner, setSelectedSalesOwner] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(true);
  const [tableMissing, setTableMissing] = useState<boolean>(false);

  // Users and Auth State
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const saved = localStorage.getItem('ideva_crm_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS[0];
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('ideva_crm_current_user'));
  });

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role === 'SALES' && user.salesOwnerTag) {
      setSelectedSalesOwner(user.salesOwnerTag);
    } else {
      setSelectedSalesOwner('ALL');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ideva_crm_current_user');
    setIsAuthenticated(false);
  };

  const handleSwitchUser = (newUser: any) => {
    setCurrentUser(newUser);
    localStorage.setItem('ideva_crm_current_user', JSON.stringify(newUser));
    if (newUser.role === 'SALES' && newUser.salesOwnerTag) {
      setSelectedSalesOwner(newUser.salesOwnerTag);
    } else {
      setSelectedSalesOwner('ALL');
    }
  };

  // Modal Control States
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [exportModal, setExportModal] = useState<{ isOpen: boolean; type: 'EXCEL' | 'PDF' }>({
    isOpen: false,
    type: 'EXCEL',
  });

  const loadUsers = async () => {
    try {
      const uRes = await apiClient.getUsers();
      const userList = Array.isArray(uRes?.users)
        ? uRes.users
        : Array.isArray((uRes as any)?.data)
        ? (uRes as any).data
        : Array.isArray(uRes)
        ? (uRes as any)
        : [];
      if (userList.length > 0) {
        setUsers(userList);
        if (currentUser) {
          const freshCurrent = userList.find(
            (u) => u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase()
          );
          if (freshCurrent) {
            setCurrentUser(freshCurrent);
          }
        }
      }
      return userList;
    } catch (e) {
      console.error('Error fetching users:', e);
      return [];
    }
  };

  // Fetch initial data from server / Supabase
  const loadSupabaseData = async () => {
    try {
      setLoading(true);

      const [custData, actData, ordData, userData] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getActivities(),
        apiClient.getOrders(),
        apiClient.getUsers(),
      ]);

      if (custData && Array.isArray(custData.customers)) {
        setCustomers(custData.customers);
        if (custData.fromSupabase) setSupabaseConnected(true);
        if (custData.tableMissing) setTableMissing(true);
      }

      if (Array.isArray(actData)) {
        setActivities(actData);
      }

      if (Array.isArray(ordData)) {
        setOrders(ordData);
      }

      if (userData) {
        const userList = Array.isArray(userData.users)
          ? userData.users
          : Array.isArray((userData as any).data)
          ? (userData as any).data
          : Array.isArray(userData)
          ? (userData as any)
          : [];
        if (userList.length > 0) {
          setUsers(userList);
        }
      }
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();

    // Subscribe to Supabase Realtime changes
    realtimeService.subscribeToChanges((table) => {
      console.log('[App] Realtime update from Supabase for table:', table);
      loadSupabaseData();
    });

    return () => {
      realtimeService.unsubscribe();
    };
  }, []);

  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
  };

  // Handler: Select Customer to view Profile
  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('CUSTOMER_PROFILE');

    // Fetch detail if available
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      if (res.ok) {
        const detail = await res.json();
        if (detail.customer) setSelectedCustomer(detail.customer);
        if (Array.isArray(detail.activities)) {
          setActivities((prev) => {
            const others = prev.filter((a) => a.customerId !== customer.id);
            return [...detail.activities, ...others];
          });
        }
        if (Array.isArray(detail.orders)) {
          setOrders((prev) => {
            const others = prev.filter((o) => o.customerId !== customer.id);
            return [...detail.orders, ...others];
          });
        }
        if (Array.isArray(detail.documents)) {
          setDocuments((prev) => {
            const others = prev.filter((d) => d.customerId !== customer.id);
            return [...detail.documents, ...others];
          });
        }
        if (Array.isArray(detail.notes)) {
          setNotes((prev) => {
            const others = prev.filter((n) => n.customerId !== customer.id);
            return [...detail.notes, ...others];
          });
        }
      }
    } catch (e) {}
  };

  // Handler: Create Customer (Direct to Supabase)
  const handleCreateCustomer = async (data: any) => {
    // 1. Calculate a guaranteed unique ID based on max existing ID
    let maxNum = 0;
    for (const c of customers) {
      const match = String(c.id || '').match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    let nextNum = maxNum + 1;
    while (customers.some((c) => c.id === `CUST-${String(nextNum).padStart(3, '0')}`)) {
      nextNum++;
    }
    const newId = `CUST-${String(nextNum).padStart(3, '0')}`;

    const newCust: Customer = {
      totalPurchases: 0,
      totalOrdersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      repeatStatus: data.repeatStatus || 'UPCOMING',
      ...data,
      id: newId,
    };

    setCustomers((prev) => [newCust, ...prev]);

    try {
      const saved = await apiClient.createCustomer(newCust);
      if (saved && saved.id) {
        setCustomers((prev) => prev.map((c) => (c.id === newCust.id || c.id === saved.id ? saved : c)));
      }
    } catch (e) {
      console.error('Error saving customer to Supabase:', e);
    }
  };

  // Handler: Edit / Update Customer
  const handleEditCustomer = async (updatedCustomer: Customer) => {
    // 1. Immediate optimistic update
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c))
    );
    if (selectedCustomer && selectedCustomer.id === updatedCustomer.id) {
      setSelectedCustomer(updatedCustomer);
    }
    // 2. Persist to Supabase
    try {
      const saved = await apiClient.updateCustomer(updatedCustomer.id, updatedCustomer);
      if (saved) {
        setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? saved : c)));
        if (selectedCustomer && selectedCustomer.id === updatedCustomer.id) {
          setSelectedCustomer(saved);
        }
      }
    } catch (e) {
      console.error('Error updating customer in Supabase:', e);
    }
  };

  // Handler: Delete Customer (Direct from Supabase)
  const handleDeleteCustomer = async (id: string) => {
    const isMasterOrAdmin = currentUser.role === 'MASTER_ADMIN' || currentUser.role === 'ADMIN';
    if (!isMasterOrAdmin && !currentUser.permissions?.canDeleteCustomers) {
      alert('⚠️ คุณไม่มีสิทธิ์ในการลบข้อมูลลูกค้า (ต้องการสิทธิ์ canDeleteCustomers หรือ Master Admin)');
      return;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
      setActiveTab('CUSTOMERS');
    }
    try {
      await apiClient.deleteCustomer(id);
    } catch (e) {}
  };

  // Handler: Create Activity (Direct to Supabase)
  const handleCreateActivity = async (data: any) => {
    const newAct: Activity = {
      id: `ACT-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ...data,
    };

    setActivities((prev) => [newAct, ...prev]);

    // Update customer status & next action
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === data.customerId) {
          return {
            ...c,
            status: data.status || c.status,
            nextFollowUpDate: data.followUpDate || c.nextFollowUpDate,
            nextFollowUpTime: data.followUpTime || c.nextFollowUpTime,
            nextAction: data.nextAction || c.nextAction,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return c;
      })
    );

    if (selectedCustomer && selectedCustomer.id === data.customerId) {
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              status: data.status || prev.status,
              nextFollowUpDate: data.followUpDate || prev.nextFollowUpDate,
              nextFollowUpTime: data.followUpTime || prev.nextFollowUpTime,
              nextAction: data.nextAction || prev.nextAction,
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : null
      );
    }

    try {
      const saved = await apiClient.createActivity(newAct);
      if (saved && saved.id) {
        setActivities((prev) => prev.map((a) => (a.id === newAct.id ? { ...a, ...saved } : a)));
      }
    } catch (e) {
      console.error('Error saving activity to Supabase:', e);
    }
  };

  // Handler: Create Order (Direct to Supabase)
  const handleCreateOrder = async (data: any) => {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newOrd: Order = {
      id: `ORD-${datePrefix}-${String(orders.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`,
      ...data,
    };

    setOrders((prev) => [newOrd, ...prev]);

    const isTester = data.orderType === 'TESTER' || (data.productName && data.productName.includes('เทสเตอร์'));

    // Update customer purchases and repeat order status
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === data.customerId) {
          const newTotal = (c.totalPurchases || 0) + data.totalAmount;
          const newOrdersCount = (c.totalOrdersCount || 0) + 1;
          const newTier =
            newTotal >= 1000000
              ? 'PLATINUM'
              : newTotal >= 500000
              ? 'GOLD'
              : newTotal >= 200000
              ? 'SILVER'
              : 'GENERAL';

          return {
            ...c,
            status: 'WON',
            tier: newTier,
            totalPurchases: newTotal,
            totalOrdersCount: newOrdersCount,
            lastOrderDate: data.orderDate,
            lastDeliveryDate: data.deliveryDate,
            nextReorderDate: isTester ? c.nextReorderDate : data.nextReorderDate,
            nextFollowUpDate: isTester ? data.testerFollowUpDate || c.nextFollowUpDate : c.nextFollowUpDate,
            nextAction: isTester ? '🧪 ติดตามผลหลังทดลองใช้เทสเตอร์ เพื่อชวนสั่งผลิตแบรนด์' : c.nextAction,
            followUpStartDate: data.followUpStartDate,
            repeatStatus: isTester ? c.repeatStatus : 'UPCOMING',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return c;
      })
    );

    if (selectedCustomer && selectedCustomer.id === data.customerId) {
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              status: 'WON',
              lastOrderDate: data.orderDate,
              lastDeliveryDate: data.deliveryDate,
              nextReorderDate: isTester ? prev.nextReorderDate : data.nextReorderDate,
              nextFollowUpDate: isTester ? data.testerFollowUpDate || prev.nextFollowUpDate : prev.nextFollowUpDate,
              nextAction: isTester ? '🧪 ติดตามผลหลังทดลองใช้เทสเตอร์ เพื่อชวนสั่งผลิตแบรนด์' : prev.nextAction,
              followUpStartDate: data.followUpStartDate,
              repeatStatus: isTester ? prev.repeatStatus : 'UPCOMING',
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : null
      );
    }

    try {
      const saved = await apiClient.createOrder(newOrd);
      if (saved && saved.id) {
        setOrders((prev) => prev.map((o) => (o.id === newOrd.id ? { ...o, ...saved } : o)));
      }
    } catch (e) {
      console.error('[Create Order Error]:', e);
    }
  };

  // Handler: Update Customer Status (Direct to Supabase)
  const handleUpdateCustomerStatus = async (newStatus: CustomerStatus) => {
    if (!selectedCustomer) return;
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? { ...c, status: newStatus } : c))
    );
    setSelectedCustomer((prev) => (prev ? { ...prev, status: newStatus } : null));

    try {
      await apiClient.updateCustomer(selectedCustomer.id, { status: newStatus });
    } catch (e) {}
  };

  // Handler: Add Internal Note (Direct to Supabase)
  const handleAddNote = async (content: string, isPinned: boolean) => {
    if (!selectedCustomer) return;
    const newNote: InternalNote = {
      id: `NOTE-${Date.now()}`,
      customerId: selectedCustomer.id,
      author: currentUser.name,
      content,
      isPinned,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };
    setNotes((prev) => [newNote, ...prev]);

    try {
      await apiClient.createNote(newNote);
    } catch (e) {}
  };

  // Handler: Add Document (Direct to Supabase)
  const handleAddDocument = async (docData: { name: string; type: 'QUOTATION' | 'PROPOSAL' | 'INVOICE' | 'CONTRACT' | 'OTHER'; fileSize: string; fileUrl: string }) => {
    if (!selectedCustomer) return;
    const newDoc: CustomerDocument = {
      id: `DOC-${Date.now()}`,
      customerId: selectedCustomer.id,
      name: docData.name,
      type: docData.type,
      fileSize: docData.fileSize,
      fileUrl: docData.fileUrl,
      createdAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser.name || 'ผู้ดูแลระบบ',
    };

    setDocuments((prev) => [newDoc, ...prev]);

    try {
      const saved = await apiClient.createDocument(newDoc);
      if (saved) {
        setDocuments((prev) => prev.map((d) => (d.id === newDoc.id ? saved : d)));
      }
    } catch (e) {
      console.error('Failed to save document:', e);
    }
  };

  // Handler: Delete Document (Direct from Supabase)
  const handleDeleteDocument = async (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    try {
      await apiClient.deleteDocument(docId);
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  // Handler: Filter Customer List by Status clicked on Dashboard
  const handleFilterCustomerStatus = (status: CustomerStatus | 'ALL') => {
    setStatusFilter(status);
    setActiveTab('CUSTOMERS');
  };

  // Handler: Re-seed Supabase Data
  const handleReseedData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await loadSupabaseData();
        alert('ซิงค์และบันทึกชุดข้อมูลไปยัง Supabase เรียบร้อยแล้ว!');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลไปยัง Supabase');
      }
    } catch (e) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Calculate effective sales owner filter based on role and permissions
  const isMasterOrAdmin = currentUser.role === 'MASTER_ADMIN' || currentUser.role === 'ADMIN';
  const isRestrictedToOwn = !isMasterOrAdmin && (currentUser.permissions?.dataScope === 'OWN_ONLY' || currentUser.role === 'SALES');

  const effectiveSalesOwner = isRestrictedToOwn
    ? currentUser.salesOwnerTag || currentUser.name
    : selectedSalesOwner;

  const filteredCustomers = useMemo(() => {
    if (effectiveSalesOwner === 'ALL') return customers || [];
    return (customers || []).filter(
      (c) =>
        c.salesOwner === effectiveSalesOwner ||
        (c.salesOwner && c.salesOwner.includes(effectiveSalesOwner))
    );
  }, [customers, effectiveSalesOwner]);

  const filteredActivities = useMemo(() => {
    if (effectiveSalesOwner === 'ALL') return activities || [];
    return (activities || []).filter(
      (a) =>
        a.salesOwner === effectiveSalesOwner ||
        (a.salesOwner && a.salesOwner.includes(effectiveSalesOwner))
    );
  }, [activities, effectiveSalesOwner]);

  const filteredOrders = useMemo(() => {
    if (effectiveSalesOwner === 'ALL') return orders || [];
    const validCustomerIds = new Set(filteredCustomers.map((c) => c.id));
    return (orders || []).filter((o) => validCustomerIds.has(o.customerId));
  }, [orders, filteredCustomers, effectiveSalesOwner]);

  // Filter activities and documents for selected customer
  const customerActivities = selectedCustomer
    ? (activities || []).filter((a) => a.customerId === selectedCustomer.id)
    : [];
  const customerOrders = selectedCustomer
    ? (orders || []).filter((o) => o.customerId === selectedCustomer.id)
    : [];
  const customerDocuments = selectedCustomer
    ? (documents || []).filter((d) => d.customerId === selectedCustomer.id)
    : [];
  const customerNotes = selectedCustomer
    ? (notes || []).filter((n) => n.customerId === selectedCustomer.id)
    : [];

  // Tab Read & Unread Status Tracking (Persistent across sessions)
  const [tabReadState, setTabReadState] = useState<Record<string, TabReadState>>(() =>
    getStoredTabReadState()
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // When activeTab changes or underlying items update while on that tab, mark current items as read
  useEffect(() => {
    if (activeTab === 'APP_GRID') return;

    let currentIds: string[] = [];
    if (activeTab === 'CUSTOMERS' || activeTab === 'CUSTOMER_PROFILE') {
      currentIds = (filteredCustomers || []).map((c) => c.id);
    } else if (activeTab === 'ACTIVITIES') {
      currentIds = (filteredActivities || []).map((a) => a.id);
    } else if (activeTab === 'ORDERS') {
      currentIds = (filteredOrders || []).map((o) => o.id);
    } else if (activeTab === 'LEADS') {
      currentIds = (filteredCustomers || [])
        .filter((c) => ['NEW_LEAD', 'CONTACTED', 'QUOTATION', 'PROPOSAL', 'NEGOTIATION'].includes(c.status))
        .map((c) => c.id);
    } else if (activeTab === 'CALENDAR') {
      currentIds = (filteredCustomers || []).filter((c) => Boolean(c.nextFollowUpDate)).map((c) => c.id);
    } else if (activeTab === 'AFTER_SALES') {
      currentIds = (filteredCustomers || [])
        .filter((c) => c.status === 'WON' || Number(c.totalPurchases || 0) > 0 || Number(c.totalOrdersCount || 0) > 0)
        .map((c) => c.id);
    } else if (activeTab === 'REPEAT_ORDERS') {
      currentIds = (filteredCustomers || [])
        .filter((c) => c.repeatStatus === 'DUE' || c.repeatStatus === 'OVERDUE')
        .map((c) => c.id);
    } else if (activeTab === 'DASHBOARD') {
      currentIds = (filteredCustomers || [])
        .filter(
          (c) =>
            c.status === 'OVERDUE' ||
            c.nextFollowUpDate === todayStr ||
            c.status === 'FOLLOW_UP' ||
            (Boolean(c.nextFollowUpDate) && (c.nextFollowUpDate || '') < todayStr)
        )
        .map((c) => c.id);
    } else if (activeTab === 'USERS') {
      currentIds = (users || []).map((u) => u.id);
    } else if (activeTab === 'REPORTS') {
      currentIds = ['report-1', 'report-2', 'report-3', 'report-4'];
    } else if (activeTab === 'USER_MANUAL') {
      currentIds = ['manual-1', 'manual-2', 'manual-3', 'manual-4', 'manual-5', 'manual-6'];
    } else if (activeTab === 'SETTINGS') {
      currentIds = ['settings-main'];
    }

    const updated = markTabItemsRead(activeTab, currentIds);
    setTabReadState(updated);
  }, [activeTab, filteredCustomers, filteredActivities, filteredOrders, users, todayStr]);

  // Unread badge counts (displays only new / unread items that haven't been inspected)
  const customerCount = useMemo(
    () => computeUnreadCountForItems('CUSTOMERS', (filteredCustomers || []).map((c) => c.id), tabReadState),
    [filteredCustomers, tabReadState]
  );
  const activitiesCount = useMemo(
    () => computeUnreadCountForItems('ACTIVITIES', (filteredActivities || []).map((a) => a.id), tabReadState),
    [filteredActivities, tabReadState]
  );
  const ordersCount = useMemo(
    () => computeUnreadCountForItems('ORDERS', (filteredOrders || []).map((o) => o.id), tabReadState),
    [filteredOrders, tabReadState]
  );
  const leadsCount = useMemo(
    () =>
      computeUnreadCountForItems(
        'LEADS',
        (filteredCustomers || [])
          .filter((c) => ['NEW_LEAD', 'CONTACTED', 'QUOTATION', 'PROPOSAL', 'NEGOTIATION'].includes(c.status))
          .map((c) => c.id),
        tabReadState
      ),
    [filteredCustomers, tabReadState]
  );
  const calendarCount = useMemo(
    () =>
      computeUnreadCountForItems(
        'CALENDAR',
        (filteredCustomers || []).filter((c) => Boolean(c.nextFollowUpDate)).map((c) => c.id),
        tabReadState
      ),
    [filteredCustomers, tabReadState]
  );
  const afterSalesCount = useMemo(
    () =>
      computeUnreadCountForItems(
        'AFTER_SALES',
        (filteredCustomers || [])
          .filter((c) => c.status === 'WON' || Number(c.totalPurchases || 0) > 0 || Number(c.totalOrdersCount || 0) > 0)
          .map((c) => c.id),
        tabReadState
      ),
    [filteredCustomers, tabReadState]
  );

  const dashboardTasks = useMemo(() => {
    return (filteredCustomers || [])
      .filter(
        (c) =>
          c.status === 'OVERDUE' ||
          c.nextFollowUpDate === todayStr ||
          c.status === 'FOLLOW_UP' ||
          (Boolean(c.nextFollowUpDate) && (c.nextFollowUpDate || '') < todayStr && c.status !== 'WON' && c.status !== 'LOST')
      )
      .map((c) => c.id);
  }, [filteredCustomers, todayStr]);

  const dashboardUnreadCount = useMemo(
    () => computeUnreadCountForItems('DASHBOARD', dashboardTasks, tabReadState),
    [dashboardTasks, tabReadState]
  );

  const overdueCount = dashboardUnreadCount;
  const todayCount = dashboardUnreadCount;

  const dueRepeatCount = useMemo(
    () =>
      computeUnreadCountForItems(
        'REPEAT_ORDERS',
        (filteredCustomers || []).filter((c) => c.repeatStatus === 'DUE' || c.repeatStatus === 'OVERDUE').map((c) => c.id),
        tabReadState
      ),
    [filteredCustomers, tabReadState]
  );
  const reportsCount = useMemo(() => computeUnreadCountForCategory('REPORTS', 4, tabReadState), [tabReadState]);
  const manualCount = useMemo(() => computeUnreadCountForCategory('USER_MANUAL', 6, tabReadState), [tabReadState]);
  const usersCount = useMemo(
    () => computeUnreadCountForItems('USERS', (users || []).map((u) => u.id), tabReadState),
    [users, tabReadState]
  );

  // If user is not authenticated, show LoginPage
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        availableUsers={users}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        customerCount={customerCount}
        activitiesCount={activitiesCount}
        ordersCount={ordersCount}
        leadsCount={leadsCount}
        calendarCount={calendarCount}
        afterSalesCount={afterSalesCount}
        todayCount={todayCount}
        overdueCount={overdueCount}
        dueRepeatCount={dueRepeatCount}
        repeatDueCount={dueRepeatCount}
        reportsCount={reportsCount}
        manualCount={manualCount}
        usersCount={usersCount}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Sticky Header */}
        <Header
          currentTab={activeTab}
          setCurrentTab={setActiveTab}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          currentUser={currentUser}
          user={currentUser}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          availableUsers={users}
          selectedSalesOwner={selectedSalesOwner}
          setSelectedSalesOwner={setSelectedSalesOwner}
          dateRange={dateRange}
          setDateRange={setDateRange}
          customers={filteredCustomers}
          onSelectCustomer={handleSelectCustomer}
          onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
          onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
          onReseedData={handleReseedData}
          selectedCustomerName={selectedCustomer?.companyName}
        />

        {/* Dynamic Main Dashboard / View Body */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-6 max-w-[1600px] w-full mx-auto pb-20 md:pb-6">
          {/* Table Setup Banner if Supabase table is not yet created in schema cache */}
          {tableMissing && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  ⚡
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    แจ้งเตือน Supabase Database: ตารางยังไม่ถูกสร้างใน Schema Cache
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ระบบกำลังทำงานบน In-Memory Dataset เพื่อใช้งานได้อย่างราบรื่น ท่านสามารถคัดลอก SQL Script ไปรันใน Supabase SQL Editor เพื่อเปิดใช้ Cloud Persistence ได้ทันที
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('SETTINGS')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex-shrink-0 shadow-xs transition-all"
              >
                ดู & คัดลอก SQL Script (Settings)
              </button>
            </div>
          )}

          {/* Mobile App Grid View (Center Hub on Mobile) */}
          {activeTab === 'APP_GRID' && (
            <MobileAppGrid
              onSelectTab={setActiveTab}
              onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              customerCount={customerCount}
              activitiesCount={activitiesCount}
              ordersCount={ordersCount}
              leadsCount={leadsCount}
              calendarCount={calendarCount}
              afterSalesCount={afterSalesCount}
              todayCount={todayCount}
              overdueCount={overdueCount}
              dueRepeatCount={dueRepeatCount}
              reportsCount={reportsCount}
              manualCount={manualCount}
              usersCount={usersCount}
            />
          )}

          {/* Visual Workflow Diagram Banner (Always accessible on Dashboard & Customers view) */}
          {(activeTab === 'DASHBOARD' || activeTab === 'CUSTOMERS') && (
            <WorkflowBanner onNavigateTab={setActiveTab} />
          )}

          {/* 1. Dashboard View */}
          {activeTab === 'DASHBOARD' && (
            <DashboardView
              customers={filteredCustomers}
              activities={filteredActivities}
              orders={filteredOrders}
              onSelectCustomer={handleSelectCustomer}
              onFilterStatus={handleFilterCustomerStatus}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
            />
          )}

          {/* 2. Customer List View */}
          {activeTab === 'CUSTOMERS' && (
            <CustomerListView
              customers={filteredCustomers}
              users={users}
              initialStatusFilter={statusFilter}
              onSelectCustomer={handleSelectCustomer}
              onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onOpenCreateOrder={(c) => {
                setSelectedCustomer(c);
                setIsCreateOrderOpen(true);
              }}
              onEditCustomer={(c) => setEditingCustomer(c)}
              onDeleteCustomer={(c) => handleDeleteCustomer(c.id)}
            />
          )}

          {/* 3. Customer Profile View */}
          {activeTab === 'CUSTOMER_PROFILE' && selectedCustomer && (
            <CustomerProfileView
              customer={selectedCustomer}
              activities={customerActivities}
              orders={customerOrders}
              documents={customerDocuments}
              notes={customerNotes}
              onBack={() => setActiveTab('CUSTOMERS')}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onUpdateCustomerStatus={handleUpdateCustomerStatus}
              onAddNote={handleAddNote}
              onEditCustomer={(c) => setEditingCustomer(c)}
              onDeleteCustomer={() => handleDeleteCustomer(selectedCustomer.id)}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {/* 4. Activities Log View */}
          {activeTab === 'ACTIVITIES' && (
            <ActivitiesView
              activities={filteredActivities}
              customers={filteredCustomers}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {/* 5. Calendar View */}
          {activeTab === 'CALENDAR' && (
            <CalendarView
              customers={filteredCustomers}
              activities={filteredActivities}
              onSelectCustomer={handleSelectCustomer}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
            />
          )}

          {/* 6. Leads Kanban View */}
          {activeTab === 'LEADS' && (
            <LeadsKanbanView
              customers={filteredCustomers}
              onSelectCustomer={handleSelectCustomer}
              onUpdateStatus={async (cust, newSt) => {
                setCustomers((prev) =>
                  prev.map((c) => (c.id === cust.id ? { ...c, status: newSt } : c))
                );
                try {
                  await fetch(`/api/customers/${cust.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newSt }),
                  });
                } catch (e) {}
              }}
              onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
            />
          )}

          {/* 7. Orders & Delivery View */}
          {activeTab === 'ORDERS' && (
            <OrdersView
              orders={filteredOrders}
              customers={filteredCustomers}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {/* 8. After Sales View */}
          {activeTab === 'AFTER_SALES' && (
            <AfterSalesView
              customers={filteredCustomers}
              onSelectCustomer={handleSelectCustomer}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
            />
          )}

          {/* 9. Repeat Order CRM View */}
          {activeTab === 'REPEAT_ORDERS' && (
            <RepeatOrderView
              customers={filteredCustomers}
              onSelectCustomer={handleSelectCustomer}
              onOpenCreateOrder={(c) => {
                setSelectedCustomer(c);
                setIsCreateOrderOpen(true);
              }}
            />
          )}

          {/* 10. Reports View */}
          {activeTab === 'REPORTS' && (
            <ReportsView
              customers={filteredCustomers}
              onExportData={(type) => setExportModal({ isOpen: true, type })}
            />
          )}

          {/* 11. User Manual View */}
          {activeTab === 'USER_MANUAL' && (
            <UserManualView onNavigate={(tab) => setActiveTab(tab)} />
          )}

          {/* 12. User Management View */}
          {activeTab === 'USERS' && (
            <UserManagementView
              currentUser={currentUser}
              users={users}
              onUsersUpdated={loadUsers}
            />
          )}

          {/* 13. Settings View */}
          {activeTab === 'SETTINGS' && (
            <SettingsView currentUser={currentUser} onReseedData={handleReseedData} />
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onSubmit={handleCreateCustomer}
        users={users}
        currentUser={currentUser}
      />

      <EditCustomerModal
        isOpen={Boolean(editingCustomer)}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleEditCustomer}
        onDelete={(id) => handleDeleteCustomer(id)}
        users={users}
      />

      <CreateActivityModal
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSubmit={handleCreateActivity}
      />

      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        customers={customers}
        selectedCustomer={selectedCustomer}
        onSubmit={handleCreateOrder}
      />

      <ExportModal
        isOpen={exportModal.isOpen}
        type={exportModal.type}
        onClose={() => setExportModal({ isOpen: false, type: 'EXCEL' })}
        onConfirm={() => {
          alert(`กำลังเตรียมดาวน์โหลดไฟล์รายงาน ${exportModal.type}...`);
          setExportModal({ isOpen: false, type: 'EXCEL' });
        }}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        customerCount={customerCount}
        activitiesCount={activitiesCount}
        ordersCount={ordersCount}
        leadsCount={leadsCount}
        calendarCount={calendarCount}
        afterSalesCount={afterSalesCount}
        todayCount={todayCount}
        overdueCount={overdueCount}
        dueRepeatCount={dueRepeatCount}
        reportsCount={reportsCount}
        manualCount={manualCount}
        usersCount={usersCount}
        onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
      />
    </div>
  );
}
