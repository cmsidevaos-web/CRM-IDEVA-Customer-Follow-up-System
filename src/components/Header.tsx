import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Filter,
  Plus,
  RefreshCw,
  Search,
  User,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { NotificationItem, UserProfile, ViewTab } from '../types';

interface HeaderProps {
  currentTab?: ViewTab;
  setCurrentTab?: (tab: ViewTab) => void;
  notifications?: NotificationItem[];
  onMarkNotificationsRead?: () => void;
  currentUser?: UserProfile;
  user?: UserProfile;
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
  const activeNotifications = notifications || [];
  const unreadCount = activeNotifications.filter((n) => !n.isRead).length;
  const activeUser = currentUser || user || { name: 'คุณสมชาย ใจดี', role: 'SALES', avatar: '', salesOwnerTag: '' };

  const tabTitles: Record<ViewTab, string> = {
    DASHBOARD: 'Dashboard - ภาพรวมระบบติดตามลูกค้า',
    CUSTOMERS: 'Customer List - รายชื่อลูกค้าทั้งหมด',
    CUSTOMER_PROFILE: selectedCustomerName ? `Customer Profile - ${selectedCustomerName}` : 'Customer Profile - ข้อมูลลูกค้า',
    ACTIVITIES: 'Activities - ประวัติกิจกรรมและการติดต่อ',
    CALENDAR: 'Calendar - ปฏิทินงานและกำหนดการติดตาม',
    LEADS: 'Leads Pipeline - ขั้นตอนการบริหารโอกาสขาย',
    ORDERS: 'Orders - ประวัติการสั่งซื้อและจัดส่ง',
    AFTER_SALES: 'After Sales - บริการหลังการขายและติดตามความพึงพอใจ',
    REPEAT_ORDERS: 'Repeat Order CRM - ระบบติดตามการซื้อซ้ำ',
    REPORTS: 'Reports - รายงานและสถิติต่างๆ',
    USER_MANUAL: 'User Manual - คู่มือการใช้งานระบบแบบละเอียด',
    SETTINGS: 'Settings - ตั้งค่าระบบและสิทธิ์การใช้งาน',
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Breadcrumb */}
      <div className="flex items-center space-x-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {tabTitles[currentTab] || 'CRM - IDEVA OS'}
          </h2>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Top Controls & Actions */}
      <div className="flex items-center space-x-3">
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
            <option value="THIS_MONTH">เดือนนี้ (กรกฎาคม 2026)</option>
            <option value="ALL">ทั้งหมด</option>
          </select>
        </div>

        {/* Sales Owner Filter */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedSalesOwner}
            onChange={(e) => setSelectedSalesOwner(e.target.value)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">ผู้รับผิดชอบ: ทั้งหมด</option>
            <option value="คุณสมชาย (Sales A)">คุณสมชาย (Sales A)</option>
            <option value="คุณนภา (Sales B)">คุณนภา (Sales B)</option>
            <option value="คุณวิชัย (Manager)">คุณวิชัย (Manager)</option>
          </select>
        </div>

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

        {/* Current User Profile */}
        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {activeUser.name ? activeUser.name.charAt(2) || 'S' : 'S'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{activeUser.name}</div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded-md inline-block">
              {activeUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
