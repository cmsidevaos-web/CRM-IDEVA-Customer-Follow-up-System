import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  LayoutDashboard,
  Repeat,
  RotateCcw,
  Settings,
  ShoppingBag,
  Users,
  UserPlus
} from 'lucide-react';
import React from 'react';
import { ViewTab } from '../types';

interface SidebarProps {
  currentTab?: ViewTab;
  activeTab?: ViewTab;
  setCurrentTab?: (tab: ViewTab) => void;
  setActiveTab?: (tab: ViewTab) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  customerCount?: number;
  overdueCount?: number;
  todayCount?: number;
  repeatDueCount?: number;
  dueRepeatCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  collapsed = false,
  setCollapsed = (_c: boolean) => {},
  customerCount,
  overdueCount = 0,
  todayCount = 0,
  repeatDueCount = 0,
  dueRepeatCount,
}) => {
  const selectedTab = activeTab || currentTab || 'DASHBOARD';
  const handleSelectTab = setActiveTab || setCurrentTab || ((_tab: ViewTab) => {});
  const activeRepeatCount = dueRepeatCount !== undefined ? dueRepeatCount : repeatDueCount;

  const menuItems = [
    { id: 'DASHBOARD' as ViewTab, label: 'Dashboard', icon: LayoutDashboard, badge: todayCount > 0 ? todayCount : undefined, badgeColor: 'bg-blue-500' },
    { id: 'CUSTOMERS' as ViewTab, label: 'Customers (ลูกค้า)', icon: Users, badge: customerCount && customerCount > 0 ? customerCount : undefined, badgeColor: 'bg-blue-600' },
    { id: 'ACTIVITIES' as ViewTab, label: 'Activities (กิจกรรม)', icon: Clock, badge: overdueCount > 0 ? overdueCount : undefined, badgeColor: 'bg-rose-500' },
    { id: 'CALENDAR' as ViewTab, label: 'Calendar (ปฏิทิน)', icon: Calendar },
    { id: 'LEADS' as ViewTab, label: 'Leads (ผู้มุ่งหวัง)', icon: UserPlus },
    { id: 'ORDERS' as ViewTab, label: 'Orders (คำสั่งซื้อ)', icon: ShoppingBag },
    { id: 'AFTER_SALES' as ViewTab, label: 'After Sales (หลังการขาย)', icon: Headphones },
    { id: 'REPEAT_ORDERS' as ViewTab, label: 'Repeat Orders (ซื้อซ้ำ)', icon: Repeat, badge: activeRepeatCount > 0 ? activeRepeatCount : undefined, badgeColor: 'bg-amber-500', isHighlight: true },
    { id: 'REPORTS' as ViewTab, label: 'Reports (รายงาน)', icon: BarChart3 },
    { id: 'USER_MANUAL' as ViewTab, label: 'คู่มือการใช้งาน', icon: BookOpen },
    { id: 'SETTINGS' as ViewTab, label: 'Settings (ตั้งค่า)', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex bg-[#0B3B8C] text-white flex-col transition-all duration-300 relative z-20 min-h-screen ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-blue-900/50 bg-[#082d6b]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-md">
              CRM
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide leading-tight text-white">
                IDEVA OS
              </h1>
              <p className="text-[10px] text-blue-200 opacity-80">Follow-up & Repeat Order</p>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center font-bold text-white shadow-md">
            CRM
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-blue-800/60 transition-colors"
          title={collapsed ? 'ขยายเมนู' : 'พับเมนู'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Menu Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedTab === item.id || (selectedTab === 'CUSTOMER_PROFILE' && item.id === 'CUSTOMERS');

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md font-semibold'
                  : item.isHighlight
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-200 hover:bg-amber-500/30 hover:text-white'
                  : 'text-blue-100/80 hover:bg-blue-800/50 hover:text-white'
              }`}
            >
              <Icon
                size={20}
                className={`flex-shrink-0 ${
                  isActive ? 'text-white' : item.isHighlight ? 'text-amber-400' : 'text-blue-300 group-hover:text-white'
                }`}
              />
              {!collapsed && (
                <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== undefined && (
                <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${item.badgeColor}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      {!collapsed && (
        <div className="p-4 border-t border-blue-900/50 bg-[#082d6b]/50 text-xs text-blue-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-white">ระบบออนไลน์</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-blue-300/80">เวอร์ชัน 2.5 Production Ready</p>
        </div>
      )}
    </aside>
  );
};
