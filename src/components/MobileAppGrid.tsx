import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Headphones,
  LayoutDashboard,
  Plus,
  Repeat,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Users,
  UserPlus,
} from 'lucide-react';
import { ViewTab } from '../types';

interface MobileAppGridProps {
  onSelectTab: (tab: ViewTab) => void;
  onOpenCreateCustomer?: () => void;
  onOpenCreateActivity?: () => void;
  onOpenCreateOrder?: () => void;
  customerCount?: number;
  todayCount?: number;
  overdueCount?: number;
  dueRepeatCount?: number;
  onOpenCustomizeBottomNav?: () => void;
}

export const MobileAppGrid: React.FC<MobileAppGridProps> = ({
  onSelectTab,
  onOpenCreateCustomer = () => {},
  onOpenCreateActivity = () => {},
  onOpenCreateOrder = () => {},
  customerCount = 0,
  todayCount = 0,
  overdueCount = 0,
  dueRepeatCount = 0,
  onOpenCustomizeBottomNav,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const appGridItems = [
    {
      id: 'DASHBOARD' as ViewTab,
      title: 'Dashboard',
      subtitle: 'ภาพรวมระบบ',
      icon: LayoutDashboard,
      gradient: 'from-blue-600 via-blue-500 to-indigo-600',
      badge: todayCount > 0 ? todayCount : undefined,
      badgeColor: 'bg-blue-500',
    },
    {
      id: 'CUSTOMERS' as ViewTab,
      title: 'ลูกค้า',
      subtitle: 'รายชื่อทั้งหมด',
      icon: Users,
      gradient: 'from-indigo-600 via-indigo-500 to-blue-700',
      badge: customerCount > 0 ? customerCount : undefined,
      badgeColor: 'bg-indigo-600',
    },
    {
      id: 'ACTIVITIES' as ViewTab,
      title: 'ติดตามงาน',
      subtitle: 'ประวัติกิจกรรม',
      icon: Clock,
      gradient: 'from-rose-500 via-rose-600 to-red-600',
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'CALENDAR' as ViewTab,
      title: 'ปฏิทินงาน',
      subtitle: 'กำหนดการนัดหมาย',
      icon: Calendar,
      gradient: 'from-purple-600 via-purple-500 to-indigo-600',
    },
    {
      id: 'LEADS' as ViewTab,
      title: 'ผู้มุ่งหวัง',
      subtitle: 'Leads Pipeline',
      icon: UserPlus,
      gradient: 'from-emerald-500 via-teal-500 to-emerald-700',
    },
    {
      id: 'ORDERS' as ViewTab,
      title: 'คำสั่งซื้อ',
      subtitle: 'ประวัติการสั่งซื้อ',
      icon: ShoppingBag,
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
    },
    {
      id: 'AFTER_SALES' as ViewTab,
      title: 'หลังการขาย',
      subtitle: 'ดูแลความพึงพอใจ',
      icon: Headphones,
      gradient: 'from-cyan-500 via-teal-500 to-blue-600',
    },
    {
      id: 'REPEAT_ORDERS' as ViewTab,
      title: 'ซื้อซ้ำ',
      subtitle: 'Repeat Order CRM',
      icon: Repeat,
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      badge: dueRepeatCount > 0 ? dueRepeatCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'REPORTS' as ViewTab,
      title: 'รายงาน',
      subtitle: 'สถิติและวิเคราะห์',
      icon: BarChart3,
      gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    },
    {
      id: 'USER_MANUAL' as ViewTab,
      title: 'คู่มือใช้งาน',
      subtitle: 'วิธีใช้งานระบบ',
      icon: BookOpen,
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
    },
    {
      id: 'SETTINGS' as ViewTab,
      title: 'ตั้งค่าระบบ',
      subtitle: 'สิทธิ์ & Supabase',
      icon: Settings,
      gradient: 'from-zinc-600 via-slate-700 to-zinc-800',
    },
  ];

  const filteredApps = appGridItems.filter(
    (app) =>
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Mobile Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
        {/* Background Decorative Glow */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center font-bold text-white text-xl shadow-lg border border-white/20">
              CRM
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight leading-tight text-white flex items-center gap-1.5">
                IDEVA OS <span className="text-[10px] bg-blue-500/80 text-white px-2 py-0.5 rounded-full font-bold">MOBILE</span>
              </h1>
              <p className="text-xs text-blue-200 opacity-90 mt-0.5">Follow-up & Repeat Order System</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ออนไลน์
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาเมนูหรือฟังก์ชันการทำงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-blue-200/60 focus:placeholder:text-slate-400 text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-white/15 focus:border-blue-500 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-500" /> การดำเนินการด่วน (Quick Actions)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onOpenCreateActivity}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all active:scale-95"
          >
            <Plus size={18} className="text-blue-600 mb-1" />
            <span className="text-[11px] font-bold">บันทึก Activity</span>
          </button>

          <button
            onClick={onOpenCreateCustomer}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all active:scale-95"
          >
            <Plus size={18} className="text-indigo-600 mb-1" />
            <span className="text-[11px] font-bold">เพิ่มลูกค้าใหม่</span>
          </button>

          <button
            onClick={onOpenCreateOrder}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 p-2.5 rounded-xl flex flex-col items-center justify-center text-center transition-all active:scale-95"
          >
            <Plus size={18} className="text-amber-600 mb-1" />
            <span className="text-[11px] font-bold">สร้างคำสั่งซื้อ</span>
          </button>
        </div>
      </div>

      {/* Main Apps Icon Grid Section - Arranged strictly in 4 Columns */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            📱 ศูนย์รวมแอปพลิเคชัน (All Apps Grid)
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">เรียง 4 คอลัมน์</span>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => onSelectTab(app.id)}
                className="flex flex-col items-center group focus:outline-none transition-transform active:scale-90"
              >
                {/* Square App Icon with Glass Gradient */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br shadow-md hover:shadow-lg flex items-center justify-center text-white border border-white/20 transition-all duration-200 group-hover:-translate-y-1 overflow-visible">
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${app.gradient} opacity-95`} />

                  {/* Top Shine Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-2xl sm:rounded-t-3xl pointer-events-none" />

                  {/* Icon */}
                  <Icon size={26} className="relative z-10 text-white drop-shadow-sm" />

                  {/* Notification Badge */}
                  {app.badge !== undefined && app.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 z-20 text-[10px] font-extrabold text-white bg-rose-500 border-2 border-white px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-md animate-bounce">
                      {app.badge > 99 ? '99+' : app.badge}
                    </span>
                  )}
                </div>

                {/* App Label */}
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 text-center leading-tight mt-1.5 group-hover:text-blue-600 line-clamp-1 max-w-full">
                  {app.title}
                </span>
                <span className="text-[9px] text-slate-400 text-center truncate max-w-full hidden sm:block">
                  {app.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Bar Customization Card */}
      {onOpenCustomizeBottomNav && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-800">ปรับแต่งเมนูบาร์ด้านล่าง</h3>
              <p className="text-[11px] text-slate-500">เลือก & จัดเรียง 4 เมนูโปรดให้ตรงใจคุณ</p>
            </div>
          </div>

          <button
            onClick={onOpenCustomizeBottomNav}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex-shrink-0"
          >
            ตั้งค่าตำแหน่ง
          </button>
        </div>
      )}
    </div>
  );
};
