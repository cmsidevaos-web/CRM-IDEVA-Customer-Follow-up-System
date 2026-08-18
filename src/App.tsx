import React, { useEffect, useMemo, useState } from 'react';
import { AfterSalesView } from './components/AfterSalesView';
import { ActivitiesView } from './components/ActivitiesView';
import { CalendarView } from './components/CalendarView';
import { CreateActivityModal } from './components/CreateActivityModal';
import { CreateCustomerModal } from './components/CreateCustomerModal';
import { CreateOrderModal } from './components/CreateOrderModal';
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
import { Sidebar } from './components/Sidebar';
import { WorkflowBanner } from './components/WorkflowBanner';
import { realtimeService } from './services/RealtimeService';
import { apiClient } from './services/apiClient';

import {
  Activity,
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

  // User Profile State (Starts with Sales A by default or customizable)
  const [currentUser, setCurrentUser] = useState<UserProfile>(AVAILABLE_USERS[0]);

  const handleSwitchUser = (newUser: UserProfile) => {
    setCurrentUser(newUser);
    if (newUser.role === 'SALES' && newUser.salesOwnerTag) {
      setSelectedSalesOwner(newUser.salesOwnerTag);
    } else {
      setSelectedSalesOwner('ALL');
    }
  };

  // Modal Control States
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [exportModal, setExportModal] = useState<{ isOpen: boolean; type: 'EXCEL' | 'PDF' }>({
    isOpen: false,
    type: 'EXCEL',
  });

  // Fetch initial data from server / Supabase
  const loadSupabaseData = async () => {
    try {
      setLoading(true);

      const [custData, actData, ordData] = await Promise.all([
        apiClient.getCustomers(),
        apiClient.getActivities(),
        apiClient.getOrders(),
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
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: newId,
      ...data,
      totalPurchases: 0,
      totalOrdersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      repeatStatus: 'UPCOMING',
    };

    setCustomers((prev) => [newCust, ...prev]);

    try {
      const saved = await apiClient.createCustomer(newCust);
      if (saved) {
        setCustomers((prev) => prev.map((c) => (c.id === newCust.id ? saved : c)));
      }
    } catch (e) {
      console.error('Saved to local state fallback');
    }
  };

  // Handler: Delete Customer (Direct from Supabase)
  const handleDeleteCustomer = async (id: string) => {
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
      await apiClient.createActivity(newAct);
    } catch (e) {}
  };

  // Handler: Create Order (Direct to Supabase)
  const handleCreateOrder = async (data: any) => {
    const newOrd: Order = {
      id: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(orders.length + 1).padStart(3, '0')}`,
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
      await apiClient.createOrder(newOrd);
    } catch (e) {}
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

  // Calculate effective sales owner filter
  const effectiveSalesOwner =
    currentUser.role === 'SALES'
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

  const todayCount = (filteredCustomers || []).filter(
    (c) => c.nextFollowUpDate === '2026-07-30' || c.status === 'FOLLOW_UP'
  ).length;
  const overdueCount = (filteredCustomers || []).filter(
    (c) => c.status === 'OVERDUE' || (c.nextFollowUpDate < '2026-07-30' && c.status !== 'WON' && c.status !== 'LOST')
  ).length;
  const dueRepeatCount = (filteredCustomers || []).filter(
    (c) => c.repeatStatus === 'DUE' || c.repeatStatus === 'OVERDUE'
  ).length;

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
        customerCount={(filteredCustomers || []).length}
        todayCount={todayCount}
        overdueCount={overdueCount}
        dueRepeatCount={dueRepeatCount}
        repeatDueCount={dueRepeatCount}
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
              customerCount={(filteredCustomers || []).length}
              todayCount={todayCount}
              overdueCount={overdueCount}
              dueRepeatCount={dueRepeatCount}
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
              initialStatusFilter={statusFilter}
              onSelectCustomer={handleSelectCustomer}
              onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onOpenCreateOrder={(c) => {
                setSelectedCustomer(c);
                setIsCreateOrderOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
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

          {/* 12. Settings View */}
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
        customerCount={(customers || []).length}
        todayCount={todayCount}
        overdueCount={overdueCount}
        dueRepeatCount={dueRepeatCount}
        onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
      />
    </div>
  );
}
