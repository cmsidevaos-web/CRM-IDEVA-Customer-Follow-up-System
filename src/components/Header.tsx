import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Filter,
  Grid,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  User,
  UserCheck,
  Users,
  X,
  LogOut,
  Crown
} from 'lucide-react';
import React, { useState } from 'react';
import { AppUser, NotificationItem, UserProfile, ViewTab } from '../types';

export const AVAILABLE_USERS: UserProfile[] = [
  {
    id: 'USER-SALES-A',
    name: 'คุณสมชาย ใจดี (Sales A)',
    role: 'SALES',
    email: 'somchai@ideva.co.th',
    salesOwnerTag: 'คุณสมชาย (Sales A)',
  },
  {
    id: 'USER-SALES-B',
    name: 'คุณนภา รัตนโชติ (Sales B)',
    role: 'SALES',
    email: 'napha@ideva.co.th',
    salesOwnerTag: 'คุณนภา (Sales B)',
  },
  {
    id: 'USER-MANAGER',
    name: 'คุณวิชัย เจริญผล (Manager)',
    role: 'MANAGER',
    email: 'wichai@ideva.co.th',
    salesOwnerTag: 'คุณวิชัย (Manager)',
  },
  {
    id: 'USER-ADMIN',
    name: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
    role: 'ADMIN',
    email: 'admin@ideva.co.th',
    salesOwnerTag: 'ALL',
  },
];

interface HeaderProps {
  currentTab?: ViewTab;
  setCurrentTab?: (tab: ViewTab) => void;
  notifications?: NotificationItem[];
  onMarkNotificationsRead?: () => void;
  currentUser?: UserProfile | AppUser;
  user?: UserProfile | AppUser;
  onSwitchUser?: (user: any) => void;
  onLogout?: () => void;
  availableUsers?: AppUser[];
  selectedSalesOwner?: string;
  setSelectedSalesOwner?: (sales: string) => void;
  dateRange?: string;
  setDateRange?: (range: string) => void;
  onOpenCreateCustomer?: () => void;
  onOpenCreateActivity?: () => void;
  onReseedData?: () => void;
  selectedCustomerName?: string;
  customers?: any[];
  onSelectCustomer?: (customer: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'DASHBOARD',
  setCurrentTab = (_tab: ViewTab) => {},
  notifications = [],
  onMarkNotificationsRead = () => {},
  currentUser,
  user,
  onSwitchUser = (_u: any) => {},
  onLogout,
  availableUsers,
  selectedSalesOwner = 'ALL',
  setSelectedSalesOwner = (_sales: string) => {},
  dateRange = 'ALL',
  setDateRange = (_range: string) => {},
  onOpenCreateCustomer = () => {},
  onOpenCreateActivity = () => {},
  onReseedData = () => {},
  selectedCustomerName,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const activeNotifications = notifications || [];
  const unreadCount = activeNotifications.filter((n) => !n.isRead).length;
  const activeUser = currentUser || user || AVAILABLE_USERS[0];

  const tabTitles: Record<ViewTab, string> = {
    APP_GRID: 'IDEVA OS - ศูนย์รวมแอปพลิเคชัน',
    DASHBOARD: 'Dashboard - ภาพรวมระบบติดตามลูกค้า',
    CUSTOMERS: 'Customer List - รายชื่อลูกค้าทั้งหมด',
    CUSTOMER_PROFILE: selectedCustomerName ? `Customer Profile - ${selectedCustomerName}` : 'Customer Profile - ข้อมูลลูกค้า',
    ACTIVITIES: 'Activities - ประวัติกิจกรรมและการติดต่อ',
    CALENDAR: 'Calendar - ปฏิทินงานและกำหนดการติดตาม (วันนี้)',
    LEADS: 'Leads Pipeline - ขั้นตอนการบริหารโอกาสขาย',
    ORDERS: 'Orders - ประวัติการสั่งซื้อและจัดส่ง',
    AFTER_SALES: 'After Sales - บริการหลังการขายและติดตามความพึงพอใจ',
    REPEAT_ORDERS: 'Repeat Order CRM - ระบบติดตามการซื้อซ้ำ',
    REPORTS: 'Reports - รายงานและสถิติต่างๆ',
    USERS: 'User Management - จัดการผู้ใช้งานและสิทธิ์การเข้าถึง (RBAC)',
    USER_MANUAL: 'User Manual - คู่มือการใช้งานระบบแบบละเอียด',
    SETTINGS: 'Settings - ตั้งค่าระบบและสิทธิ์การใช้งาน',
  };

  const isAdminOrManager = activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER';

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Mobile Launcher Toggle */}
      <div className="flex items-center space-x-2.5 min-w-0">
        <button
          onClick={() => setCurrentTab('APP_GRID')}
          className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors flex-shrink-0"
          title="ศูนย์รวมแอปพลิเคชัน"
        >
          <Grid size={18} />
        </button>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-1.5 truncate">
            {tabTitles[currentTab] || 'CRM - IDEVA OS'}
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {!isAdminOrManager && (
              <span className="ml-2 font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                📌 มุมมองงานส่วนตัว: {activeUser.salesOwnerTag || activeUser.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Top Controls & Actions */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Date Range Selector */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
          <CalendarIcon size={14} className="text-slate-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="TODAY">วันนี้ ({new Date().toLocaleDateString('th-TH')})</option>
            <option value="THIS_WEEK">สัปดาห์นี้</option>
            <option value="THIS_MONTH">เดือนนี้</option>
            <option value="ALL">ทั้งหมด</option>
          </select>
        </div>

        {/* Sales Owner Filter (Accessible for Admin / Manager, or displayed locked for Sales) */}
        {isAdminOrManager ? (
          <div className="hidden md:flex items-center space-x-1.5 bg-blue-50/60 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-900">
            <Filter size={14} className="text-blue-500" />
            <select
              value={selectedSalesOwner}
              onChange={(e) => setSelectedSalesOwner(e.target.value)}
              className="bg-transparent font-bold focus:outline-none cursor-pointer text-blue-900"
            >
              <option value="ALL">👑 แอดมิน: ดูเซลล์ทั้งหมด (All Sales)</option>
              <option value="คุณสมชาย (Sales A)">คุณสมชาย (Sales A)</option>
              <option value="คุณนภา (Sales B)">คุณนภา (Sales B)</option>
              <option value="คุณวิชัย (Manager)">คุณวิชัย (Manager)</option>
            </select>
          </div>
        ) : (
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs text-slate-600">
            <Lock size={12} className="text-slate-400" />
            <span className="font-semibold text-[11px] truncate max-w-[140px]">
              {activeUser.salesOwnerTag || activeUser.name}
            </span>
          </div>
        )}

        {/* Quick Action Button */}
        <button
          onClick={onOpenCreateActivity}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">+ บันทึก Activity</span>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (unreadCount > 0) onMarkNotificationsRead();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
            title="การแจ้งเตือน"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popup Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Bell size={16} className="text-blue-600" /> การแจ้งเตือนทั้งหมด
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {activeNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">ไม่มีการแจ้งเตือนใหม่</div>
                ) : (
                  activeNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !item.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => {
                        setCurrentTab('CUSTOMER_PROFILE');
                        setShowNotifications(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          {item.type === 'OVERDUE' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                          {item.type === 'REPEAT_DUE' && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                          {item.type === 'FOLLOWUP_TODAY' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.createdAt?.slice(11, 16) || ''}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">{item.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600">
                <button
                  onClick={onMarkNotificationsRead}
                  className="hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 size={13} /> ทำชำระเป็นอ่านแล้วทั้งหมด
                </button>
                <button
                  onClick={onReseedData}
                  className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  title="รีเซ็ตข้อมูลตัวอย่าง 200 รายชื่อ"
                >
                  <RefreshCw size={12} /> รีเซ็ตข้อมูล
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current User Profile & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity text-left"
            title="คลิกเพื่อสลับบัญชีผู้ใช้งาน / ผู้รับผิดชอบ (Role Switcher)"
          >
            {activeUser.avatarUrl ? (
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.name}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0 ${
                  activeUser.role === 'ADMIN'
                    ? 'bg-rose-700'
                    : activeUser.role === 'MANAGER'
                    ? 'bg-indigo-700'
                    : 'bg-blue-800'
                }`}
              >
                {activeUser.name ? activeUser.name.charAt(0) || 'S' : 'S'}
              </div>
            )}
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {activeUser.name}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block ${
                    activeUser.role === 'ADMIN'
                      ? 'bg-rose-100 text-rose-800'
                      : activeUser.role === 'MANAGER'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activeUser.role}
                </span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            </div>
          </button>

          {/* User Switcher Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Users size={15} className="text-blue-600" /> สลับผู้ใช้งาน (Switch User)
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    ทดสอบการเข้าถึงตามบทบาทและสิทธิ์ (RBAC)
                  </p>
                </div>
              </div>

              <div className="py-1 divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {(availableUsers && availableUsers.length > 0 ? availableUsers : AVAILABLE_USERS).map((usr: any) => {
                  const isCurrent = usr.id === activeUser.id;
                  const isMaster = usr.role === 'MASTER_ADMIN';
                  const isAdmin = usr.role === 'ADMIN';

                  return (
                    <div
                      key={usr.id}
                      onClick={() => {
                        onSwitchUser(usr);
                        setShowUserMenu(false);
                      }}
                      className={`px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between ${
                        isCurrent ? 'bg-blue-50/60 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={usr.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={usr.name}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                            {usr.name}
                            {isMaster && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                            {isAdmin && <Shield size={11} className="text-rose-600" />}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {usr.position || usr.role} {usr.salesOwnerTag ? `• ${usr.salesOwnerTag}` : ''}
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                          ใช้งานอยู่
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Logout Action */}
              {onLogout && (
                <div className="pt-2 px-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} /> ออกจากระบบ (Sign Out)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
