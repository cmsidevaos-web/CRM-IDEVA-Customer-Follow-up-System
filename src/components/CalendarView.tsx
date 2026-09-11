import {
  AlertCircle,
  ArrowRight,
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  List,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  User,
  Users
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Activity, Customer } from '../types';

interface CalendarViewProps {
  customers?: Customer[];
  activities?: Activity[];
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateActivity?: () => void;
}

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  customers = [],
  activities = [],
  onSelectCustomer = (_c: Customer) => {},
  onOpenCreateActivity = () => {},
}) => {
  // Real-time current date
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [now]);

  // Calendar Navigation State (Default to current month and year)
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(now.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterOwner, setFilterOwner] = useState<string>('ALL');

  const safeCustomers = customers || [];
  const safeActivities = activities || [];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const freshNow = new Date();
    setCurrentYear(freshNow.getFullYear());
    setCurrentMonthIndex(freshNow.getMonth());
    const y = freshNow.getFullYear();
    const m = String(freshNow.getMonth() + 1).padStart(2, '0');
    const d = String(freshNow.getDate()).padStart(2, '0');
    const tStr = `${y}-${m}-${d}`;
    setSelectedDateStr(tStr);
  };

  // Month string (e.g. "สิงหาคม 2026 (2569)")
  const thaiMonthName = THAI_MONTHS[currentMonthIndex];
  const thaiYear = currentYear + 543;
  const currentMonthDisplay = `${thaiMonthName} ${currentYear} (${thaiYear})`;
  const currentMonthKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;

  // Unique sales owners for filtering
  const salesOwners = useMemo(() => {
    const owners = new Set<string>();
    safeCustomers.forEach((c) => {
      if (c.salesOwner) owners.add(c.salesOwner);
    });
    return Array.from(owners);
  }, [safeCustomers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return safeCustomers.filter((c) => {
      if (filterOwner !== 'ALL' && c.salesOwner !== filterOwner) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.companyName || '').toLowerCase().includes(q);
        const matchContact = (c.contactName || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').includes(q);
        const matchAction = (c.nextAction || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchAction) return false;
      }
      return true;
    });
  }, [safeCustomers, filterOwner, searchQuery]);

  // Key Metrics
  const todayTasks = useMemo(() => {
    return safeCustomers.filter((c) => c.nextFollowUpDate === todayStr);
  }, [safeCustomers, todayStr]);

  const overdueTasks = useMemo(() => {
    return safeCustomers.filter(
      (c) =>
        c.status === 'OVERDUE' ||
        (Boolean(c.nextFollowUpDate) &&
          (c.nextFollowUpDate || '') < todayStr &&
          c.status !== 'WON' &&
          c.status !== 'LOST')
    );
  }, [safeCustomers, todayStr]);

  const thisMonthTasks = useMemo(() => {
    return safeCustomers.filter((c) => (c.nextFollowUpDate || '').startsWith(currentMonthKey));
  }, [safeCustomers, currentMonthKey]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const prevMonthDaysCount = new Date(currentYear, currentMonthIndex, 0).getDate();

    const daysList = [];

    // 1. Previous Month Leading Days (Disabled/Greyed)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevMonth = currentMonthIndex === 0 ? 12 : currentMonthIndex;
      const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const tasks = filteredCustomers.filter((c) => c.nextFollowUpDate === dateStr);
      daysList.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        tasks,
      });
    }

    // 2. Current Month Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tasks = filteredCustomers.filter((c) => c.nextFollowUpDate === dateStr);
      daysList.push({
        dayNum: d,
        dateStr,
        isCurrentMonth: true,
        tasks,
      });
    }

    // 3. Next Month Trailing Days to complete 35 or 42 grid cells
    const remainingCells = (7 - (daysList.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nextMonth = currentMonthIndex === 11 ? 1 : currentMonthIndex + 2;
      const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const tasks = filteredCustomers.filter((c) => c.nextFollowUpDate === dateStr);
      daysList.push({
        dayNum: n,
        dateStr,
        isCurrentMonth: false,
        tasks,
      });
    }

    return daysList;
  }, [currentYear, currentMonthIndex, filteredCustomers]);

  // Selected Day Tasks
  const selectedDayData = useMemo(() => {
    if (!selectedDateStr) return null;
    const tasks = safeCustomers.filter((c) => c.nextFollowUpDate === selectedDateStr);
    const dayActivities = safeActivities.filter((a) => (a.createdAt || '').startsWith(selectedDateStr));

    // Format readable Thai date
    try {
      const parts = selectedDateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        const dayOfWeek = THAI_DAYS[dateObj.getDay()];
        const thaiDateLabel = `วัน${dayOfWeek}ที่ ${d} ${THAI_MONTHS[m]} พ.ศ. ${y + 543}`;
        return { dateStr: selectedDateStr, thaiDateLabel, tasks, activities: dayActivities };
      }
    } catch (e) {}

    return { dateStr: selectedDateStr, thaiDateLabel: selectedDateStr, tasks, activities: dayActivities };
  }, [selectedDateStr, safeCustomers, safeActivities]);

  // List of upcoming follow-ups sorted by date
  const upcomingList = useMemo(() => {
    return safeCustomers
      .filter((c) => Boolean(c.nextFollowUpDate))
      .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [safeCustomers]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header & KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Tasks */}
        <div
          onClick={() => {
            handleGoToday();
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedDateStr === todayStr
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${selectedDateStr === todayStr ? 'text-blue-100' : 'text-slate-500'}`}>
              นัดหมายวันนี้ (Today)
            </span>
            <span
              className={`p-1.5 rounded-xl ${
                selectedDateStr === todayStr ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <CalendarIcon size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black">{todayTasks.length}</span>
            <span className={`text-[11px] font-medium ${selectedDateStr === todayStr ? 'text-blue-100' : 'text-blue-600'}`}>
              {todayStr}
            </span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div
          onClick={() => {
            if (overdueTasks.length > 0 && overdueTasks[0].nextFollowUpDate) {
              setSelectedDateStr(overdueTasks[0].nextFollowUpDate);
            }
          }}
          className="bg-white p-4 rounded-2xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">เกินกำหนดติดตาม (Overdue)</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">{overdueTasks.length}</span>
            <span className="text-[11px] text-rose-500 font-medium">ต้องรีบติดต่อ</span>
          </div>
        </div>

        {/* This Month's Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">นัดหมายเดือนนี้</span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{thisMonthTasks.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">{thaiMonthName}</span>
          </div>
        </div>

        {/* Total Customers with schedule */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ลูกค้าที่มีกำหนดการ</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{upcomingList.length}</span>
            <span className="text-[11px] text-emerald-600 font-medium">มีแผนติดตาม</span>
          </div>
        </div>
      </div>

      {/* 2. Main Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
        {/* Calendar Controls & Navigation Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Month / Year & Prev-Next Navigation */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                title="เดือนก่อนหน้า"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:shadow-2xs transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNextMonth}
                title="เดือนถัดไป"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:shadow-2xs transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight pl-1">
              {currentMonthDisplay}
            </h2>

            {/* Jump to Today Button */}
            <button
              onClick={handleGoToday}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
            >
              <Clock size={13} />
              <span>วันนี้</span>
            </button>
          </div>

          {/* Right Tools: View Mode & Search & Create */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาลูกค้า, นัดหมาย..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>

            {/* Sales Owner Filter */}
            {salesOwners.length > 1 && (
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">ผู้ดูแลทั้งหมด</option>
                {salesOwners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                  viewMode === 'GRID' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarIcon size={14} />
                <span className="hidden sm:inline">ตาราง</span>
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                  viewMode === 'LIST' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List size={14} />
                <span className="hidden sm:inline">รายการ</span>
              </button>
            </div>

            {/* Add Appointment Button */}
            <button
              onClick={onOpenCreateActivity}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all"
            >
              <Plus size={14} />
              <span>+ นัดหมาย</span>
            </button>
          </div>
        </div>

        {/* 3. View Mode: GRID */}
        {viewMode === 'GRID' && (
          <div className="space-y-2">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500 pb-1">
              <span className="text-rose-600">อาทิตย์</span>
              <span>จันทร์</span>
              <span>อังคาร</span>
              <span>พุธ</span>
              <span>พฤหัสบดี</span>
              <span>ศุกร์</span>
              <span className="text-blue-600">เสาร์</span>
            </div>

            {/* 7-Column Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d, index) => {
                const isToday = d.dateStr === todayStr;
                const isSelected = d.dateStr === selectedDateStr;
                const isOverdue = d.dateStr < todayStr && d.tasks.length > 0;

                return (
                  <div
                    key={`${d.dateStr}-${index}`}
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`min-h-[88px] sm:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400 shadow-xs'
                        : isToday
                        ? 'bg-blue-50/30 border-blue-300'
                        : !d.isCurrentMonth
                        ? 'bg-slate-50/60 border-slate-100 opacity-40 hover:opacity-80'
                        : d.tasks.length > 0
                        ? 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'
                        : 'bg-white border-slate-100 hover:bg-slate-50/80 hover:border-slate-200'
                    }`}
                  >
                    {/* Top Row: Day Number & Task Counter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <span
                          className={`text-xs font-bold ${
                            isToday
                              ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center -ml-0.5'
                              : isSelected
                              ? 'text-blue-700 font-extrabold'
                              : d.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {d.dayNum}
                        </span>
                        {isToday && !isSelected && (
                          <span className="hidden md:inline text-[9px] font-bold text-blue-600 bg-blue-100/70 px-1 py-0.2 rounded">
                            วันนี้
                          </span>
                        )}
                      </div>

                      {d.tasks.length > 0 && (
                        <span
                          title={`${d.tasks.length} รายการ`}
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight ${
                            isOverdue
                              ? 'bg-rose-600 text-white'
                              : isToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {d.tasks.length}
                        </span>
                      )}
                    </div>

                    {/* Task Previews (Mini Chips) */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {d.tasks.slice(0, 2).map((t) => {
                        const isTaskOverdue = d.dateStr < todayStr;
                        return (
                          <div
                            key={t.id}
                            className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate transition-colors ${
                              isTaskOverdue
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : t.status === 'WON'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                            title={`${t.companyName} (${t.nextFollowUpTime || '10:00'} น.) - ${t.nextAction || ''}`}
                          >
                            <span className="opacity-70 font-normal">{t.nextFollowUpTime ? `${t.nextFollowUpTime} ` : ''}</span>
                            {t.companyName}
                          </div>
                        );
                      })}

                      {d.tasks.length > 2 && (
                        <div className="text-[9px] text-slate-500 font-bold px-1">
                          + อีก {d.tasks.length - 2} งาน
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. View Mode: LIST */}
        {viewMode === 'LIST' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">กำหนดการติดตามเรียงตามลำดับเวลา ({upcomingList.length} รายการ)</h3>
              <span className="text-xs text-slate-500">คลิกที่รายการเพื่อดูโปรไฟล์</span>
            </div>

            {upcomingList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">ไม่มีรายการนัดหมายในระบบ</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {upcomingList.map((t) => {
                  const isTaskToday = t.nextFollowUpDate === todayStr;
                  const isTaskOverdue = Boolean(t.nextFollowUpDate) && (t.nextFollowUpDate || '') < todayStr;

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectCustomer(t)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isTaskToday
                          ? 'bg-blue-50/80 border-blue-300 hover:border-blue-400'
                          : isTaskOverdue
                          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                            isTaskToday
                              ? 'bg-blue-600 text-white'
                              : isTaskOverdue
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="text-[9px] font-normal leading-none">
                            {t.nextFollowUpDate ? t.nextFollowUpDate.slice(5, 7) : ''}
                          </span>
                          <span className="text-xs font-black leading-none mt-0.5">
                            {t.nextFollowUpDate ? t.nextFollowUpDate.slice(8, 10) : '-'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{t.companyName}</span>
                            {isTaskToday && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-600 text-white">
                                วันนี้
                              </span>
                            )}
                            {isTaskOverdue && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-600 text-white">
                                เกินกำหนด
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            <span className="font-medium">กิจกรรม:</span> {t.nextAction || 'ติดตามผลตามรอบ'}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                            <span>ผู้ติดต่อ: {t.contactName}</span>
                            <span>โทร: {t.phone}</span>
                            <span>เวลา: {t.nextFollowUpTime || '10:00'} น.</span>
                            <span>ผู้ดูแล: {t.salesOwner}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {t.phone && (
                          <a
                            href={`tel:${t.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors"
                            title="โทรออก"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => onSelectCustomer(t)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-bold text-xs hover:bg-blue-50 transition-all flex items-center space-x-1"
                        >
                          <span>ดู Profile</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Selected Day Detailed Inspector */}
      {selectedDayData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4 animate-in fade-in">
          {/* Header of Selected Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CalendarIcon size={16} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedDayData.thaiDateLabel}</h3>
                  {selectedDayData.dateStr === todayStr && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      วันนี้ (Today)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  มีรายการติดตาม {selectedDayData.tasks.length} รายการ • บันทึกกิจกรรม {selectedDayData.activities.length} รายการ
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenCreateActivity}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
              >
                + บันทึกงานวันนี้
              </button>
            </div>
          </div>

          {/* Tasks List for the Selected Day */}
          {selectedDayData.tasks.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CalendarIcon size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">ไม่มีกำหนดการนัดหมายในวันที่เลือก</p>
              <p className="text-[11px] text-slate-400 mt-0.5">สามารถกดปุ่ม "+ นัดหมาย" เพื่อเพิ่มกำหนดการติดตามลูกค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedDayData.tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectCustomer(t)}
                  className="p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors">
                          {t.companyName}
                        </h4>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          <User size={12} className="text-slate-400" />
                          <span>{t.contactName}</span>
                          <span>•</span>
                          <span>{t.phone}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 shrink-0">
                        {t.nextFollowUpTime || '10:00'} น.
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700">Next Action: </span>
                      <span className="text-slate-600">{t.nextAction || 'โทรติดตามความคืบหน้า'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                    <span>ผู้รับผิดชอบ: {t.salesOwner}</span>
                    <span className="text-blue-600 font-bold flex items-center space-x-1">
                      <span>ดูข้อมูล</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
