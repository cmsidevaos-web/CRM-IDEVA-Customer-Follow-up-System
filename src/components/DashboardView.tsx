import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart2,
  BarChart3,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Customer, Order, ViewTab } from '../types';

interface DashboardViewProps {
  customers?: Customer[];
  activities?: Activity[];
  orders?: Order[];
  onSelectCustomer?: (customer: Customer) => void;
  setCurrentTab?: (tab: ViewTab) => void;
  onFilterStatus?: (status: any) => void;
  onOpenCreateActivity?: () => void;
  onOpenCreateCustomer?: () => void;
  onOpenCreateOrder?: () => void;
}

type ReportMode = 'DAILY' | 'MONTHLY' | 'CUSTOM' | 'ALL';

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers = [],
  activities = [],
  orders = [],
  onSelectCustomer = (_c: Customer) => {},
  setCurrentTab = (_tab: ViewTab) => {},
  onFilterStatus = (_s: any) => {},
  onOpenCreateActivity = () => {},
  onOpenCreateCustomer = () => {},
  onOpenCreateOrder = () => {},
}) => {
  const safeCustomers = customers || [];
  const safeActivities = activities || [];
  const safeOrders = orders || [];

  // Current system date & default fallback dates
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. 2026-08-21
  const currentMonthStr = todayStr.slice(0, 7); // e.g. 2026-08

  // State: Report Period Mode
  const [reportMode, setReportMode] = useState<ReportMode>('DAILY');
  // State: Selected Date for Daily Report
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  // State: Selected Month for Monthly Report (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  // State: Custom Date Range
  const [customStartDate, setCustomStartDate] = useState<string>(todayStr);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Sub-table tab inside tasks section
  const [taskTableTab, setTaskTableTab] = useState<'SCHEDULED' | 'ACTIVITIES' | 'ORDERS'>('SCHEDULED');

  // Helper: Date navigation for Daily Report
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Helper: Month navigation for Monthly Report
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yStr}-${mStr}`);
  };

  // Helper: Date format formatter (Thai)
  const formatThaiDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatThaiMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return monthStr;
    }
  };

  // =========================================================================
  // DATA FILTERING BASED ON SELECTED REPORT MODE & DATE/MONTH
  // =========================================================================

  // 1. Follow-up Tasks matching the selected date/month
  const scheduledFollowUps = useMemo(() => {
    if (reportMode === 'DAILY') {
      return safeCustomers.filter((c) => c.nextFollowUpDate === selectedDate);
    } else if (reportMode === 'MONTHLY') {
      return safeCustomers.filter((c) => c.nextFollowUpDate && c.nextFollowUpDate.startsWith(selectedMonth));
    } else if (reportMode === 'CUSTOM') {
      return safeCustomers.filter(
        (c) => c.nextFollowUpDate && c.nextFollowUpDate >= customStartDate && c.nextFollowUpDate <= customEndDate
      );
    } else {
      return safeCustomers.filter((c) => Boolean(c.nextFollowUpDate));
    }
  }, [safeCustomers, reportMode, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // 2. Activities logged matching the selected date/month
  const periodActivities = useMemo(() => {
    if (reportMode === 'DAILY') {
      return safeActivities.filter((a) => {
        const aDate = a.followUpDate || (a.createdAt ? a.createdAt.split('T')[0] : '');
        return aDate === selectedDate;
      });
    } else if (reportMode === 'MONTHLY') {
      return safeActivities.filter((a) => {
        const aDate = a.followUpDate || (a.createdAt ? a.createdAt.split('T')[0] : '');
        return aDate.startsWith(selectedMonth);
      });
    } else if (reportMode === 'CUSTOM') {
      return safeActivities.filter((a) => {
        const aDate = a.followUpDate || (a.createdAt ? a.createdAt.split('T')[0] : '');
        return aDate >= customStartDate && aDate <= customEndDate;
      });
    } else {
      return safeActivities;
    }
  }, [safeActivities, reportMode, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // 3. Orders matching the selected date/month
  const periodOrders = useMemo(() => {
    if (reportMode === 'DAILY') {
      return safeOrders.filter((o) => {
        const oDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
        return oDate === selectedDate;
      });
    } else if (reportMode === 'MONTHLY') {
      return safeOrders.filter((o) => {
        const oDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
        return oDate.startsWith(selectedMonth);
      });
    } else if (reportMode === 'CUSTOM') {
      return safeOrders.filter((o) => {
        const oDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
        return oDate >= customStartDate && oDate <= customEndDate;
      });
    } else {
      return safeOrders;
    }
  }, [safeOrders, reportMode, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // 4. New Leads / Customers acquired in this period
  const newLeadsInPeriod = useMemo(() => {
    if (reportMode === 'DAILY') {
      return safeCustomers.filter((c) => {
        const cDate = c.createdAt ? c.createdAt.split('T')[0] : '';
        return cDate === selectedDate;
      });
    } else if (reportMode === 'MONTHLY') {
      return safeCustomers.filter((c) => {
        const cDate = c.createdAt ? c.createdAt.split('T')[0] : '';
        return cDate.startsWith(selectedMonth);
      });
    } else if (reportMode === 'CUSTOM') {
      return safeCustomers.filter((c) => {
        const cDate = c.createdAt ? c.createdAt.split('T')[0] : '';
        return cDate >= customStartDate && cDate <= customEndDate;
      });
    } else {
      return safeCustomers.filter((c) => c.status === 'NEW');
    }
  }, [safeCustomers, reportMode, selectedDate, selectedMonth, customStartDate, customEndDate]);

  // 5. Overdue Tasks (Global or within period)
  const overdueTasks = useMemo(() => {
    const checkDate = reportMode === 'DAILY' ? selectedDate : todayStr;
    return safeCustomers.filter(
      (c) => c.status === 'OVERDUE' || (c.nextFollowUpDate && c.nextFollowUpDate < checkDate && c.status !== 'WON' && c.status !== 'LOST')
    );
  }, [safeCustomers, reportMode, selectedDate, todayStr]);

  // =========================================================================
  // CALCULATED METRICS
  // =========================================================================
  const totalFollowUpCount = scheduledFollowUps.length;
  const newLeadsCount = newLeadsInPeriod.length;
  const activitiesCount = periodActivities.length;
  const ordersCount = periodOrders.length;
  const totalPeriodRevenue = periodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Revenue Breakdown: Brand Production vs Tester
  const brandProductionRevenue = periodOrders
    .filter((o) => o.orderType !== 'TESTER')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const testerOrdersCount = periodOrders.filter((o) => o.orderType === 'TESTER').length;
  const testerRevenue = periodOrders
    .filter((o) => o.orderType === 'TESTER')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Pipeline stages distribution in current scope
  const pipelineData = [
    { stage: 'ลูกค้าใหม่ (NEW)', count: safeCustomers.filter((c) => c.status === 'NEW').length, fill: '#3B82F6' },
    { stage: 'ติดต่อแล้ว', count: safeCustomers.filter((c) => c.status === 'CONTACTED').length, fill: '#2563EB' },
    { stage: 'กำลังติดตาม', count: safeCustomers.filter((c) => c.status === 'FOLLOW_UP').length, fill: '#0284C7' },
    { stage: 'ส่งใบเสนอราคา', count: safeCustomers.filter((c) => c.status === 'QUOTATION_SENT').length, fill: '#9333EA' },
    { stage: 'เจรจาต่อรอง', count: safeCustomers.filter((c) => c.status === 'NEGOTIATION').length, fill: '#EA580C' },
    { stage: 'ปิดการขาย (WON)', count: safeCustomers.filter((c) => c.status === 'WON').length, fill: '#16A34A' },
    { stage: 'เสียลูกค้า (LOST)', count: safeCustomers.filter((c) => c.status === 'LOST').length, fill: '#DC2626' },
  ];

  // Activity type breakdown for period
  const activityTypeBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      CALL: 0,
      LINE: 0,
      MEETING: 0,
      EMAIL: 0,
      DEMO: 0,
      OTHER: 0,
    };
    periodActivities.forEach((a) => {
      if (map[a.type] !== undefined) {
        map[a.type]++;
      } else {
        map.OTHER++;
      }
    });

    return [
      { name: 'โทรศัพท์ (Call)', count: map.CALL, color: '#3B82F6', icon: Phone },
      { name: 'LINE Chat', count: map.LINE, color: '#10B981', icon: MessageSquare },
      { name: 'นัดพบ (Meeting)', count: map.MEETING, color: '#8B5CF6', icon: Users },
      { name: 'ส่งอีเมล (Email)', count: map.EMAIL, color: '#F59E0B', icon: Send },
      { name: 'ส่งตัวอย่าง/เทสเตอร์', count: map.DEMO, color: '#EC4899', icon: Package },
    ];
  }, [periodActivities]);

  // Monthly Daily Trend (for Monthly mode)
  const monthlyDailyTrend = useMemo(() => {
    if (reportMode !== 'MONTHLY') return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dayOrders = safeOrders.filter((o) => {
        const oDate = o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
        return oDate === dayStr;
      });
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const dayActivities = safeActivities.filter((a) => {
        const aDate = a.followUpDate || (a.createdAt ? a.createdAt.split('T')[0] : '');
        return aDate === dayStr;
      }).length;
      const dayFollowUps = safeCustomers.filter((c) => c.nextFollowUpDate === dayStr).length;

      result.push({
        day: `${day}`,
        fullDate: dayStr,
        revenue: dayRevenue,
        activities: dayActivities,
        followUps: dayFollowUps,
      });
    }

    return result;
  }, [reportMode, selectedMonth, safeOrders, safeActivities, safeCustomers]);

  // Sales Rep Performance in this period
  const salesRepPerformance = useMemo(() => {
    const owners = ['คุณสมชาย (Sales A)', 'คุณนภา (Sales B)', 'คุณวิชัย (Manager)'];
    return owners.map((owner) => {
      const ownerCusts = scheduledFollowUps.filter((c) => c.salesOwner === owner || (c.salesOwner && c.salesOwner.includes(owner)));
      const ownerActs = periodActivities.filter((a) => a.salesOwner === owner || (a.salesOwner && a.salesOwner.includes(owner)));
      const validCustIds = new Set(safeCustomers.filter((c) => c.salesOwner === owner || (c.salesOwner && c.salesOwner.includes(owner))).map((c) => c.id));
      const ownerOrders = periodOrders.filter((o) => validCustIds.has(o.customerId));
      const revenue = ownerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        name: owner,
        followUpsCount: ownerCusts.length,
        activitiesCount: ownerActs.length,
        ordersCount: ownerOrders.length,
        revenue,
      };
    });
  }, [scheduledFollowUps, periodActivities, periodOrders, safeCustomers]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* REPORT CONTROL BAR: Period Mode & Date Selector */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 soft-shadow space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Mode Switcher */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  รายงานและสถิติภาพรวมระบบติดตามลูกค้า
                </h2>
                <p className="text-xs text-slate-500">
                  {reportMode === 'DAILY' && `รายงานรายวัน: ${formatThaiDate(selectedDate)}`}
                  {reportMode === 'MONTHLY' && `รายงานรายเดือน: ${formatThaiMonth(selectedMonth)}`}
                  {reportMode === 'CUSTOM' && `รายงานช่วงวันที่: ${customStartDate} ถึง ${customEndDate}`}
                  {reportMode === 'ALL' && 'รายงานภาพรวมทั้งหมดตลอดกาล (All-Time Overview)'}
                </p>
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 gap-1">
              <button
                onClick={() => setReportMode('DAILY')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  reportMode === 'DAILY'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CalendarIcon size={14} /> รายงานรายวัน (Daily)
              </button>
              <button
                onClick={() => setReportMode('MONTHLY')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  reportMode === 'MONTHLY'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <TrendingUp size={14} /> รายงานรายเดือน (Monthly)
              </button>
              <button
                onClick={() => setReportMode('CUSTOM')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  reportMode === 'CUSTOM'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Filter size={14} /> กำหนดช่วงวัน
              </button>
              <button
                onClick={() => setReportMode('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  reportMode === 'ALL'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                ภาพรวมทั้งหมด
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onOpenCreateCustomer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus size={15} /> + เพิ่มลูกค้าใหม่
            </button>
            <button
              onClick={onOpenCreateActivity}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PhoneCall size={14} /> + บันทึกกิจกรรม
            </button>
            <button
              onClick={onOpenCreateOrder}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Package size={14} /> + ออก Order
            </button>
          </div>
        </div>

        {/* Dynamic Date Pickers & Navigation Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {reportMode === 'DAILY' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Clock size={14} className="text-blue-600" /> เลือกวันที่ดูรายงาน:
              </span>

              {/* Prev / Next Day buttons */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                <button
                  onClick={handlePrevDay}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="วันก่อนหน้า"
                >
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-0 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
                <button
                  onClick={handleNextDay}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="วันถัดไป"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Date shortcut pills */}
              <button
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  selectedDate === todayStr
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                วันนี้
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                เมื่อวาน
              </button>
              <button
                onClick={() => setSelectedDate('2026-07-30')}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  selectedDate === '2026-07-30'
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                30 ก.ค. 2569 (วันทดสอบ)
              </button>
            </div>
          )}

          {reportMode === 'MONTHLY' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CalendarIcon size={14} className="text-blue-600" /> เลือกเดือนที่ดูรายงาน:
              </span>

              {/* Prev / Next Month buttons */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-0 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                  title="เดือนถัดไป"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Month Shortcuts */}
              <button
                onClick={() => setSelectedMonth(currentMonthStr)}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  selectedMonth === currentMonthStr
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                เดือนปัจจุบัน
              </button>
              <button
                onClick={() => setSelectedMonth('2026-07')}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  selectedMonth === '2026-07'
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ก.ค. 2569
              </button>
              <button
                onClick={() => setSelectedMonth('2026-08')}
                className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                  selectedMonth === '2026-08'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ส.ค. 2569
              </button>
            </div>
          )}

          {reportMode === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700">ตั้งแต่:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
              />
              <span className="font-bold text-slate-700">ถึง:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          )}

          <div className="text-[11px] text-slate-400 font-medium ml-auto">
            ⚡ อัปเดตข้อมูลแบบ Real-time ตามช่วงเวลาที่เลือก
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC KPI SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: งานติดตามในรอบนี้ */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1">
            <span className="font-semibold">
              {reportMode === 'DAILY' ? 'งานติดตามวันนี้' : 'งานติดตามในรอบนี้'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-700 tracking-tight">
              {totalFollowUpCount}
            </div>
            <span className="text-[11px] text-blue-500 font-medium">รายการที่ต้องติดตาม</span>
          </div>
        </div>

        {/* Card 2: กิจกรรมที่บันทึกจริง */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
            <span className="font-semibold">กิจกรรมติดต่อจริง</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <PhoneCall size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {activitiesCount}
            </div>
            <span className="text-[11px] text-emerald-500 font-medium">ครั้ง (Call/LINE/Meet)</span>
          </div>
        </div>

        {/* Card 3: ลูกค้าใหม่ (New Leads) */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-indigo-50/40 to-white">
          <div className="flex items-center justify-between text-indigo-700 text-xs mb-1">
            <span className="font-semibold">ลูกค้าใหม่ (New Leads)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
              {newLeadsCount}
            </div>
            <span className="text-[11px] text-indigo-500 font-medium">ราย</span>
          </div>
        </div>

        {/* Card 4: งานเกินกำหนด (Overdue) */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-rose-50/40 to-white">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
            <span className="font-semibold">งานเกินกำหนด</span>
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {overdueTasks.length}
            </div>
            <span className="text-[11px] text-rose-500 font-medium">รายที่ต้องเร่งตาม</span>
          </div>
        </div>

        {/* Card 5: จำนวน Orders */}
        <div className="bg-white rounded-2xl p-4 border border-purple-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-purple-50/40 to-white">
          <div className="flex items-center justify-between text-purple-700 text-xs mb-1">
            <span className="font-semibold">คำสั่งซื้อในรอบนี้</span>
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Package size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
              {ordersCount}
            </div>
            <span className="text-[11px] text-purple-500 font-medium">
              บิล ({testerOrdersCount} เทสเตอร์)
            </span>
          </div>
        </div>

        {/* Card 6: ยอดขายรวมรอบนี้ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
            <span className="font-semibold text-slate-700">ยอดขายในรอบนี้</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              ฿{totalPeriodRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">
              ผลิตแบรนด์ ฿{brandProductionRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MONTHLY DAILY TREND CHART (Only shown in Monthly mode) */}
      {/* ========================================================================= */}
      {reportMode === 'MONTHLY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                แนวโน้มยอดขายและกิจกรรมรายวัน ประจำเดือน {formatThaiMonth(selectedMonth)}
              </h3>
              <p className="text-xs text-slate-500">
                กราฟแสดงการกระจายตัวของยอดขายและจำนวนการติดต่อลูกค้าในแต่ละวันตลอดทั้งเดือน
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 bg-blue-600 rounded-xs inline-block" /> ยอดขาย (฿)
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block" /> กิจกรรม (ครั้ง)
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDailyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'revenue' ? `฿${val.toLocaleString()}` : `${val} รายการ`,
                    name === 'revenue' ? 'ยอดขาย' : 'กิจกรรมการติดต่อ',
                  ]}
                  labelFormatter={(label) => `วันที่ ${label} ${formatThaiMonth(selectedMonth)}`}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar yAxisId="right" dataKey="activities" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MIDDLE SECTION: DETAIL TABLES (Scheduled Tasks vs Activities vs Orders) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Table Column (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Tab switchers */}
            <div className="flex items-center space-x-1.5 text-xs font-bold">
              <button
                onClick={() => setTaskTableTab('SCHEDULED')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  taskTableTab === 'SCHEDULED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock size={14} /> นัดติดตาม ({scheduledFollowUps.length})
              </button>
              <button
                onClick={() => setTaskTableTab('ACTIVITIES')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  taskTableTab === 'ACTIVITIES'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PhoneCall size={14} /> กิจกรรมที่ทำ ({periodActivities.length})
              </button>
              <button
                onClick={() => setTaskTableTab('ORDERS')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  taskTableTab === 'ORDERS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package size={14} /> ออเดอร์ ({periodOrders.length})
              </button>
            </div>

            <span className="text-[11px] font-semibold text-slate-500">
              {reportMode === 'DAILY' ? formatThaiDate(selectedDate) : formatThaiMonth(selectedMonth)}
            </span>
          </div>

          {/* TAB 1: Scheduled Follow-ups */}
          {taskTableTab === 'SCHEDULED' && (
            <div className="overflow-x-auto">
              {scheduledFollowUps.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                  <Clock size={32} className="mx-auto text-slate-300" />
                  <p>ไม่มีรายการนัดติดตามในวันที่/ช่วงเวลาที่เลือก</p>
                  <button
                    onClick={onOpenCreateActivity}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    + เพิ่มนัดหมายติดตามใหม่
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">เวลา / วันที่</th>
                      <th className="py-2.5 px-3">ลูกค้า / บริษัท</th>
                      <th className="py-2.5 px-3">กิจกรรมที่ต้องทำ</th>
                      <th className="py-2.5 px-3">ผู้รับผิดชอบ</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduledFollowUps.map((c, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-3 font-semibold text-blue-700 whitespace-nowrap">
                          {c.nextFollowUpTime || '10:00'}
                          {reportMode !== 'DAILY' && (
                            <span className="block text-[10px] text-slate-400 font-normal">{c.nextFollowUpDate}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          <div>{c.companyName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{c.contactName} ({c.phone})</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate" title={c.nextAction}>
                          {c.nextAction || 'โทรติดตามความคืบหน้า'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{c.salesOwner}</td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectCustomer(c)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-lg text-[11px] shadow-xs"
                          >
                            ติดตาม
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: Actual Activities Logged */}
          {taskTableTab === 'ACTIVITIES' && (
            <div className="overflow-x-auto">
              {periodActivities.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                  <PhoneCall size={32} className="mx-auto text-slate-300" />
                  <p>ไม่มีประวัติกิจกรรมที่บันทึกในช่วงเวลาที่เลือก</p>
                  <button
                    onClick={onOpenCreateActivity}
                    className="text-emerald-600 font-bold hover:underline"
                  >
                    + บันทึกกิจกรรมการติดต่อ
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">ประเภท</th>
                      <th className="py-2.5 px-3">ลูกค้า</th>
                      <th className="py-2.5 px-3">รายละเอียดกิจกรรม</th>
                      <th className="py-2.5 px-3">ผลลัพธ์</th>
                      <th className="py-2.5 px-3">ผู้บันทึก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodActivities.map((a, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3 px-3">
                          <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                            {a.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">{a.customerName}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={a.summary || a.detail}>
                          {a.summary || a.detail}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">{a.result || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{a.salesOwner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: Orders in Period */}
          {taskTableTab === 'ORDERS' && (
            <div className="overflow-x-auto">
              {periodOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                  <Package size={32} className="mx-auto text-slate-300" />
                  <p>ไม่มีคำสั่งซื้อที่เกิดขึ้นในช่วงเวลาที่เลือก</p>
                  <button
                    onClick={onOpenCreateOrder}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    + สร้างคำสั่งซื้อใหม่
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">เลขที่ / ประเภท</th>
                      <th className="py-2.5 px-3">ลูกค้า</th>
                      <th className="py-2.5 px-3">สินค้า</th>
                      <th className="py-2.5 px-3 text-right">ยอดรวม (฿)</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodOrders.map((o, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-purple-700">{o.id}</div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              o.orderType === 'TESTER'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {o.orderType === 'TESTER' ? '🧪 เทสเตอร์' : '🏷️ ผลิตแบรนด์'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">{o.customerName}</td>
                        <td className="py-3 px-3 text-slate-600">
                          {o.productName} ({o.quantity} ชิ้น)
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          ฿{o.totalAmount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Overdue Tasks & Activity Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          {/* Overdue Tasks Widget */}
          <div className="bg-white rounded-2xl border border-rose-200 p-5 soft-shadow bg-gradient-to-b from-rose-50/20 to-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-rose-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-600" />
                งานเกินกำหนด (Overdue)
              </h3>
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                {overdueTasks.length} รายการ
              </span>
            </div>

            <div className="overflow-x-auto">
              {overdueTasks.length === 0 ? (
                <div className="text-center py-6 text-emerald-600 text-xs flex flex-col items-center gap-1">
                  <CheckCircle2 size={24} />
                  <span className="font-bold">ยอดเยี่ยม! ไม่มีงานค้างเกินกำหนด</span>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-rose-100 text-slate-500 font-semibold">
                      <th className="py-2 px-2">วันที่</th>
                      <th className="py-2 px-2">ลูกค้า</th>
                      <th className="py-2 px-2">กิจกรรม</th>
                      <th className="py-2 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100/60">
                    {overdueTasks.slice(0, 5).map((c, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/60 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-rose-600 whitespace-nowrap">
                          {c.nextFollowUpDate?.slice(5) || 'Overdue'}
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-slate-800 truncate max-w-[100px]" title={c.companyName}>
                          {c.companyName}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 truncate max-w-[90px]" title={c.nextAction}>
                          {c.nextAction || 'ติดตาม'}
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <button
                            onClick={() => onSelectCustomer(c)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] px-2 py-0.5 rounded-md"
                          >
                            ตาม
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Activity Breakdown Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <PhoneCall size={16} className="text-emerald-600" />
              ช่องทางกิจกรรมติดต่อในรอบนี้
            </h3>

            <div className="space-y-2">
              {activityTypeBreakdown.map((item, idx) => {
                const Icon = item.icon;
                const pct = activitiesCount > 0 ? Math.round((item.count / activitiesCount) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px]"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon size={13} />
                      </div>
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.count} ครั้ง</span>
                      <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: SALES REP PERFORMANCE & PIPELINE DISTRIBUTION */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Sales Rep Performance Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserCheck size={18} className="text-blue-600" />
                สรุปผลงานรายเซลล์ (Sales Performance Breakdown)
              </h3>
              <p className="text-xs text-slate-500">
                เปรียบเทียบจำนวนการติดตาม กิจกรรม และยอดขายที่เกิดขึ้นในรอบเวลาที่เลือก
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">พนักงานขาย (Sales)</th>
                  <th className="py-2.5 px-3 text-center">นัดติดตาม</th>
                  <th className="py-2.5 px-3 text-center">กิจกรรมจริง</th>
                  <th className="py-2.5 px-3 text-center">ออเดอร์</th>
                  <th className="py-2.5 px-3 text-right">ยอดขายที่ปิดได้ (฿)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesRepPerformance.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {rep.name.slice(3, 5)}
                      </div>
                      <div>{rep.name}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-700">{rep.followUpsCount}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">{rep.activitiesCount}</td>
                    <td className="py-3 px-3 text-center font-bold text-purple-700">{rep.ordersCount}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      ฿{rep.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 cols: Pipeline Stages Horizontal Bar Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" />
                Pipeline ลูกค้าทั้งหมด
              </h3>
              <p className="text-xs text-slate-500">จำนวนลูกค้าในแต่ละขั้นตอนการขาย</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
              รวม {safeCustomers.length} ราย
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={pipelineData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip
                  formatter={(value: any) => [`${value} ราย`, 'จำนวนลูกค้า']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
