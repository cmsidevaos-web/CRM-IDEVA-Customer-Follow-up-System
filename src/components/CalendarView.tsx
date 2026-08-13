import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus
} from 'lucide-react';
import React, { useState } from 'react';
import { Customer } from '../types';

interface CalendarViewProps {
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateActivity?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  customers = [],
  onSelectCustomer = (_c: Customer) => {},
  onOpenCreateActivity = () => {},
}) => {
  const [currentMonth, setCurrentMonth] = useState('กรกฎาคม 2026');
  const [selectedDayTasks, setSelectedDayTasks] = useState<Customer[] | null>(null);

  const safeCustomers = customers || [];

  // Generate 31 days calendar for July 2026
  const days = Array.from({ length: 31 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-07-${String(dayNum).padStart(2, '0')}`;
    const tasks = safeCustomers.filter((c) => c.nextFollowUpDate === dateStr);
    return { dayNum, dateStr, tasks };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">ปฏิทินติดตามงาน (Follow-up Calendar)</h2>
            <p className="text-xs text-slate-500">แสดงกำหนดการนัดหมายและกิจกรรมติดตามลูกค้าทั้งหมด</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-sm text-slate-800 px-3">{currentMonth}</span>
          <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100">
            <ChevronRight size={16} />
          </button>
          <button
            onClick={onOpenCreateActivity}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs"
          >
            + นัดหมายใหม่
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
        <span>อาทิตย์</span>
        <span>จันทร์</span>
        <span>อังคาร</span>
        <span>พุธ</span>
        <span>พฤหัสบดี</span>
        <span>ศุกร์</span>
        <span>เสาร์</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isToday = d.dateStr === todayStr || d.dateStr === '2026-07-30';
          const isOverdue = d.dateStr < todayStr && d.tasks.length > 0;

          return (
            <div
              key={d.dayNum}
              onClick={() => setSelectedDayTasks(d.tasks)}
              className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isToday
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                  : d.tasks.length > 0
                  ? 'bg-slate-50 border-slate-200 hover:border-blue-300'
                  : 'bg-white border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isToday ? 'text-blue-700 font-extrabold' : 'text-slate-700'}`}>
                  {d.dayNum} {isToday && '(วันนี้)'}
                </span>
                {d.tasks.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isOverdue ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {d.tasks.length}
                  </span>
                )}
              </div>

              {/* Tasks preview badges */}
              <div className="space-y-1 mt-1">
                {d.tasks.slice(0, 2).map((t) => (
                  <div
                    key={t.id}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                      t.status === 'QUOTATION_SENT'
                        ? 'bg-purple-100 text-purple-800'
                        : t.status === 'OVERDUE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                    title={t.companyName}
                  >
                    {t.companyName}
                  </div>
                ))}
                {d.tasks.length > 2 && (
                  <div className="text-[9px] text-slate-400 font-medium">+ อีก {d.tasks.length - 2} รายการ</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Modal Details */}
      {selectedDayTasks && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-800">
              รายละเอียดงานนัดหมาย ({selectedDayTasks.length} รายการ)
            </h4>
            <button
              onClick={() => setSelectedDayTasks(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ปิด ✕
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayTasks.length === 0 ? (
              <p className="text-slate-400 text-xs italic">ไม่มีนัดหมายในวันนี้</p>
            ) : (
              selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectCustomer(t)}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{t.companyName}</div>
                    <div className="text-[11px] text-slate-500">Next Action: {t.nextAction}</div>
                  </div>
                  <button className="text-xs text-blue-600 font-bold hover:underline">
                    ดู Profile →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
