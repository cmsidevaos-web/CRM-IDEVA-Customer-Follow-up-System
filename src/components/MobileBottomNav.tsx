import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Grid,
  Headphones,
  LayoutDashboard,
  MoveLeft,
  MoveRight,
  Repeat,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Users,
  UserPlus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ViewTab } from '../types';

interface MenuItemConfig {
  id: ViewTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  gradient: string;
  badge?: number;
  badgeColor?: string;
}

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  customerCount?: number;
  activitiesCount?: number;
  ordersCount?: number;
  leadsCount?: number;
  calendarCount?: number;
  afterSalesCount?: number;
  todayCount?: number;
  overdueCount?: number;
  dueRepeatCount?: number;
  reportsCount?: number;
  manualCount?: number;
  usersCount?: number;
  settingsCount?: number;
  onOpenCreateActivity?: () => void;
}

const DEFAULT_BOTTOM_TABS: ViewTab[] = ['DASHBOARD', 'CUSTOMERS', 'ACTIVITIES', 'REPEAT_ORDERS'];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  customerCount = 0,
  activitiesCount = 0,
  ordersCount = 0,
  leadsCount = 0,
  calendarCount = 0,
  afterSalesCount = 0,
  todayCount = 0,
  overdueCount = 0,
  dueRepeatCount = 0,
  reportsCount = 4,
  manualCount = 6,
  usersCount = 0,
  settingsCount,
}) => {
  const [pinnedTabs, setPinnedTabs] = useState<ViewTab[]>(() => {
    try {
      const saved = localStorage.getItem('ideva_mobile_bottom_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load bottom tabs from localStorage', e);
    }
    return DEFAULT_BOTTOM_TABS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Save pinned tabs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ideva_mobile_bottom_tabs', JSON.stringify(pinnedTabs));
    } catch (e) {
      console.error('Failed to save bottom tabs', e);
    }
  }, [pinnedTabs]);

  const allMenuItems: MenuItemConfig[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      shortLabel: 'แดชบอร์ด',
      icon: LayoutDashboard,
      gradient: 'from-blue-600 to-indigo-600',
      badge: todayCount > 0 ? todayCount : (overdueCount > 0 ? overdueCount : undefined),
      badgeColor: overdueCount > 0 ? 'bg-rose-500' : 'bg-blue-500',
    },
    {
      id: 'CUSTOMERS',
      label: 'Customers (ลูกค้า)',
      shortLabel: 'ลูกค้า',
      icon: Users,
      gradient: 'from-indigo-600 to-blue-700',
      badge: customerCount,
      badgeColor: 'bg-indigo-600',
    },
    {
      id: 'ACTIVITIES',
      label: 'Activities (ติดตามงาน)',
      shortLabel: 'ติดตามงาน',
      icon: Clock,
      gradient: 'from-rose-500 to-red-600',
      badge: activitiesCount,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'CALENDAR',
      label: 'Calendar (ปฏิทิน)',
      shortLabel: 'ปฏิทิน',
      icon: Calendar,
      gradient: 'from-purple-600 to-indigo-600',
      badge: calendarCount,
      badgeColor: 'bg-purple-600',
    },
    {
      id: 'LEADS',
      label: 'Leads (ผู้มุ่งหวัง)',
      shortLabel: 'ผู้มุ่งหวัง',
      icon: UserPlus,
      gradient: 'from-emerald-500 to-teal-600',
      badge: leadsCount,
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'ORDERS',
      label: 'Orders (คำสั่งซื้อ)',
      shortLabel: 'คำสั่งซื้อ',
      icon: ShoppingBag,
      gradient: 'from-amber-500 to-orange-600',
      badge: ordersCount,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'AFTER_SALES',
      label: 'After Sales (หลังการขาย)',
      shortLabel: 'หลังการขาย',
      icon: Headphones,
      gradient: 'from-cyan-500 to-blue-600',
      badge: afterSalesCount,
      badgeColor: 'bg-cyan-600',
    },
    {
      id: 'REPEAT_ORDERS',
      label: 'Repeat Orders (ซื้อซ้ำ)',
      shortLabel: 'ซื้อซ้ำ',
      icon: Repeat,
      gradient: 'from-amber-500 to-yellow-600',
      badge: dueRepeatCount,
      badgeColor: dueRepeatCount > 0 ? 'bg-orange-500' : 'bg-amber-600',
    },
    {
      id: 'USERS',
      label: 'จัดการผู้ใช้งาน (Users)',
      shortLabel: 'ผู้ใช้',
      icon: ShieldCheck,
      gradient: 'from-amber-600 to-orange-600',
      badge: usersCount,
      badgeColor: 'bg-amber-600',
    },
    {
      id: 'REPORTS',
      label: 'Reports (รายงาน)',
      shortLabel: 'รายงาน',
      icon: BarChart3,
      gradient: 'from-violet-600 to-purple-700',
      badge: reportsCount,
      badgeColor: 'bg-violet-600',
    },
    {
      id: 'USER_MANUAL',
      label: 'คู่มือการใช้งาน',
      shortLabel: 'คู่มือ',
      icon: BookOpen,
      gradient: 'from-slate-600 to-slate-800',
      badge: manualCount,
      badgeColor: 'bg-slate-600',
    },
    {
      id: 'SETTINGS',
      label: 'Settings (ตั้งค่า)',
      shortLabel: 'ตั้งค่า',
      icon: Settings,
      gradient: 'from-zinc-600 to-slate-700',
      badge: settingsCount,
      badgeColor: 'bg-zinc-600',
    },
  ];

  const getMenuConfig = (id: ViewTab): MenuItemConfig => {
    return (
      allMenuItems.find((m) => m.id === id) || {
        id,
        label: id,
        shortLabel: id,
        icon: LayoutDashboard,
        gradient: 'from-blue-600 to-indigo-600',
      }
    );
  };

  const moveTab = (index: number, direction: 'LEFT' | 'RIGHT') => {
    const newTabs = [...pinnedTabs];
    const targetIdx = direction === 'LEFT' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newTabs.length) return;
    const temp = newTabs[index];
    newTabs[index] = newTabs[targetIdx];
    newTabs[targetIdx] = temp;
    setPinnedTabs(newTabs);
  };

  const replacePinnedTab = (pinnedIndex: number, newTabId: ViewTab) => {
    // If newTabId is already in pinnedTabs, swap their positions
    const existingIndex = pinnedTabs.indexOf(newTabId);
    const newTabs = [...pinnedTabs];
    if (existingIndex !== -1) {
      const temp = newTabs[pinnedIndex];
      newTabs[pinnedIndex] = newTabId;
      newTabs[existingIndex] = temp;
    } else {
      newTabs[pinnedIndex] = newTabId;
    }
    setPinnedTabs(newTabs);
  };

  const resetToDefault = () => {
    setPinnedTabs(DEFAULT_BOTTOM_TABS);
  };

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
        <div className="grid grid-cols-5 h-15 items-center px-1 max-w-md mx-auto">
          {pinnedTabs.map((tabId, idx) => {
            const config = getMenuConfig(tabId);
            const Icon = config.icon;
            const isActive = currentTab === tabId || (currentTab === 'CUSTOMER_PROFILE' && tabId === 'CUSTOMERS');

            return (
              <button
                key={`${tabId}-${idx}`}
                onClick={() => onSelectTab(tabId)}
                className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-xs" />
                )}

                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-transform duration-200 ${
                      isActive ? 'scale-110 text-blue-600 font-bold' : 'text-slate-500'
                    }`}
                  />
                  {config.badge !== undefined && config.badge > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] font-extrabold text-white px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs ${config.badgeColor || 'bg-rose-500'}`}
                    >
                      {config.badge > 99 ? '99+' : config.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-1 truncate max-w-[64px] text-center ${
                    isActive ? 'font-bold text-blue-700' : 'font-medium text-slate-500'
                  }`}
                >
                  {config.shortLabel}
                </span>
              </button>
            );
          })}

          {/* 5th Button: Apps / More Grid View */}
          <button
            onClick={() => onSelectTab('APP_GRID')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              currentTab === 'APP_GRID' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {currentTab === 'APP_GRID' && (
              <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full shadow-xs" />
            )}

            <div className="relative">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  currentTab === 'APP_GRID'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Grid size={15} />
              </div>
            </div>

            <span
              className={`text-[10px] tracking-tight mt-1 truncate font-medium ${
                currentTab === 'APP_GRID' ? 'font-bold text-blue-700' : 'text-slate-500'
              }`}
            >
              เมนูทั้งหมด
            </span>
          </button>
        </div>
      </div>

      {/* Customize Bottom Bar Drawer Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/80 flex items-center justify-center">
                  <SlidersHorizontal size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">จัดเรียง 4 เมนูบาร์ด้านล่าง</h3>
                  <p className="text-xs text-blue-200">เลือก & เลื่อนเปลี่ยนตำแหน่งเมนูโปรดของคุณ</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-5 text-slate-800">
              {/* Current Pinned 4 Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-500" /> ตำแหน่งเมนูด้านล่างปัจจุบัน (4 ช่อง)
                  </span>
                  <button
                    onClick={resetToDefault}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    รีเซ็ตเป็นค่าเริ่มต้น
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {pinnedTabs.map((tabId, idx) => {
                    const cfg = getMenuConfig(tabId);
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={`pinned-${tabId}-${idx}`}
                        className="bg-white p-2 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center justify-between text-center relative group"
                      >
                        <span className="absolute top-1 left-1 bg-blue-100 text-blue-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                          #{idx + 1}
                        </span>

                        <div className={`w-9 h-9 mt-3 rounded-xl bg-gradient-to-br ${cfg.gradient} text-white flex items-center justify-center shadow-xs`}>
                          <Icon size={18} />
                        </div>

                        <span className="text-[11px] font-bold text-slate-800 mt-1.5 truncate w-full">
                          {cfg.shortLabel}
                        </span>

                        {/* Move Left / Right Controls */}
                        <div className="flex items-center justify-center gap-1 mt-2 w-full pt-1 border-t border-slate-100">
                          <button
                            disabled={idx === 0}
                            onClick={() => moveTab(idx, 'LEFT')}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-600 disabled:hover:bg-transparent"
                            title="ย้ายไปซ้าย"
                          >
                            <MoveLeft size={13} />
                          </button>
                          <button
                            disabled={idx === 3}
                            onClick={() => moveTab(idx, 'RIGHT')}
                            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-20 text-slate-600 disabled:hover:bg-transparent"
                            title="ย้ายไปขวา"
                          >
                            <MoveRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Select Other Apps to Swap */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  แตะเมนูด้านล่างเพื่อแทนที่ช่องเมนูหลัก:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allMenuItems.map((item) => {
                    const isPinned = pinnedTabs.includes(item.id);
                    const pinnedIndex = pinnedTabs.indexOf(item.id);
                    const Icon = item.icon;

                    return (
                      <button
                        key={`select-${item.id}`}
                        onClick={() => {
                          if (!isPinned) {
                            replacePinnedTab(0, item.id);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 text-left transition-all ${
                          isPinned
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate">{item.shortLabel}</div>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {isPinned ? `แสดงอยู่ที่ตำแหน่ง #${pinnedIndex + 1}` : 'แตะเพื่อเปลี่ยนเข้าบาร์'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all"
              >
                บันทึก & ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
