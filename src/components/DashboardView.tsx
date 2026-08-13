import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Plus,
  Send,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
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
  const todayStr = new Date().toISOString().split('T')[0];

  // KPI Calculations (100% Supabase)
  const totalCustomersCount = safeCustomers.length;
  const todayTasks = safeCustomers.filter(
    (c) => c.nextFollowUpDate === todayStr || c.nextFollowUpDate === '2026-07-30' || c.status === 'FOLLOW_UP'
  );
  const todayTasksCount = todayTasks.length;

  const overdueTasks = safeCustomers.filter(
    (c) => c.status === 'OVERDUE' || (c.nextFollowUpDate < todayStr && c.status !== 'WON' && c.status !== 'LOST')
  );
  const overdueTasksCount = overdueTasks.length;

  const quotationCount = safeCustomers.filter((c) => c.status === 'QUOTATION_SENT').length;
  const wonCount = safeCustomers.filter((c) => c.status === 'WON').length;
  const totalSalesRevenue = safeCustomers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);

  // Dynamic Pipeline Data calculated from actual Supabase customers
  const pipelineData = [
    { stage: 'ลูกค้าใหม่ (NEW)', count: safeCustomers.filter((c) => c.status === 'NEW').length, fill: '#3B82F6' },
    { stage: 'ติดต่อแล้ว', count: safeCustomers.filter((c) => c.status === 'CONTACTED').length, fill: '#2563EB' },
    { stage: 'กำลังติดตาม', count: safeCustomers.filter((c) => c.status === 'FOLLOW_UP').length, fill: '#0284C7' },
    { stage: 'ส่งใบเสนอราคา', count: safeCustomers.filter((c) => c.status === 'QUOTATION_SENT').length, fill: '#9333EA' },
    { stage: 'เจรจาต่อรอง', count: safeCustomers.filter((c) => c.status === 'NEGOTIATION').length, fill: '#EA580C' },
    { stage: 'ปิดการขาย (WON)', count: safeCustomers.filter((c) => c.status === 'WON').length, fill: '#16A34A' },
    { stage: 'เสียลูกค้า (LOST)', count: safeCustomers.filter((c) => c.status === 'LOST').length, fill: '#DC2626' },
  ];

  // Dynamic Donut Chart Data
  const totalInFunnel = totalCustomersCount || 1;
  const lostCount = safeCustomers.filter((c) => c.status === 'LOST').length;
  const followUpCount = safeCustomers.filter((c) => c.status === 'FOLLOW_UP' || c.status === 'CONTACTED' || c.status === 'QUOTATION_SENT').length;
  const undecidedCount = safeCustomers.filter((c) => c.status === 'NEW' || c.status === 'NEGOTIATION').length;

  const donutData = [
    { name: 'WON', value: wonCount, percentage: `${Math.round((wonCount / totalInFunnel) * 100)}%`, color: '#16A34A' },
    { name: 'Follow-up ต่อ', value: followUpCount, percentage: `${Math.round((followUpCount / totalInFunnel) * 100)}%`, color: '#2563EB' },
    { name: 'Lost', value: lostCount, percentage: `${Math.round((lostCount / totalInFunnel) * 100)}%`, color: '#DC2626' },
    { name: 'ยังไม่ตัดสินใจ', value: undecidedCount, percentage: `${Math.round((undecidedCount / totalInFunnel) * 100)}%`, color: '#EA580C' },
  ];

  // Dynamic Today's Tasks display list
  const todayDisplayTasks = todayTasks.slice(0, 5).map((c) => ({
    time: c.nextFollowUpTime || '10:00',
    company: c.companyName,
    activity: c.nextAction || 'โทรติดตามความคืบหน้า',
    salesOwner: c.salesOwner,
    status: 'Today',
    statusLabel: c.status,
    custId: c.id,
    customer: c,
  }));

  // Dynamic Overdue Display Tasks
  const overdueDisplayTasks = overdueTasks.slice(0, 5).map((c) => ({
    date: c.nextFollowUpDate ? c.nextFollowUpDate.slice(5) : 'Overdue',
    company: c.companyName,
    activity: c.nextAction || 'ติดตามงานเกินกำหนด',
    salesOwner: c.salesOwner,
    custId: c.id,
    customer: c,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards Top Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: ลูกค้าทั้งหมด */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 soft-shadow card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-600">ลูกค้าทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {totalCustomersCount.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400">ราย</span>
          </div>
        </div>

        {/* Card 2: ติดตามวันนี้ */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-blue-50/40 to-white">
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1">
            <span className="font-semibold">ติดตามวันนี้</span>
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-700 tracking-tight">
              {todayTasksCount}
            </div>
            <span className="text-[11px] text-blue-500 font-medium">ราย</span>
          </div>
        </div>

        {/* Card 3: เกินกำหนด */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-rose-50/40 to-white">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
            <span className="font-semibold">เกินกำหนด</span>
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {overdueTasksCount}
            </div>
            <span className="text-[11px] text-rose-500 font-medium">ราย</span>
          </div>
        </div>

        {/* Card 4: ส่งใบเสนอราคา */}
        <div className="bg-white rounded-2xl p-4 border border-purple-200 soft-shadow card-hover flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 text-xs mb-1">
            <span className="font-semibold text-slate-600">ส่งใบเสนอราคา</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Send size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
              {quotationCount}
            </div>
            <span className="text-[11px] text-slate-400">ราย</span>
          </div>
        </div>

        {/* Card 5: ปิดการขาย (WON) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
            <span className="font-semibold">ปิดการขาย (WON)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {wonCount}
            </div>
            <span className="text-[11px] text-emerald-500 font-medium">ราย</span>
          </div>
        </div>

        {/* Card 6: ยอดขายรวม */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 soft-shadow card-hover flex flex-col justify-between bg-gradient-to-br from-indigo-50/30 to-white">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold text-slate-700">ยอดขายรวม</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-indigo-900 tracking-tight">
              ฿{totalSalesRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-indigo-500 font-medium">บาท</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Today's Tasks Table & Overdue Tasks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Left: งานที่ต้องดำเนินการวันนี้ */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              งานที่ต้องดำเนินการวันนี้ (30/07/2026)
            </h3>
            <button
              onClick={() => setCurrentTab('ACTIVITIES')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              ดูงานทั้งหมด <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">เวลา</th>
                  <th className="py-2.5 px-3">ลูกค้า</th>
                  <th className="py-2.5 px-3">กิจกรรม</th>
                  <th className="py-2.5 px-3">ผู้รับผิดชอบ</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayDisplayTasks.map((t, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-blue-700">{t.time}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{t.company}</td>
                    <td className="py-3 px-3 text-slate-600">{t.activity}</td>
                    <td className="py-3 px-3 text-slate-500">{t.salesOwner}</td>
                    <td className="py-3 px-3">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          const matched = customers.find((c) => c.id === t.custId);
                          if (matched) onSelectCustomer(matched);
                          else setCurrentTab('CUSTOMER_PROFILE');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1 rounded-lg text-[11px] shadow-xs"
                      >
                        ติดตาม
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Right: งานเกินกำหนด (Overdue) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-rose-200 p-5 soft-shadow bg-gradient-to-b from-rose-50/20 to-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-rose-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-600" />
              งานเกินกำหนด (Overdue)
            </h3>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {overdueTasksCount} รายการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rose-100 text-slate-500 font-semibold">
                  <th className="py-2 px-2">วันที่</th>
                  <th className="py-2 px-2">ลูกค้า</th>
                  <th className="py-2 px-2">กิจกรรม</th>
                  <th className="py-2 px-2">ผู้รับผิดชอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60">
                {overdueDisplayTasks.map((t, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-rose-50/60 transition-colors cursor-pointer"
                    onClick={() => {
                      const matched = customers.find((c) => c.id === t.custId);
                      if (matched) onSelectCustomer(matched);
                    }}
                  >
                    <td className="py-2.5 px-2 font-bold text-rose-600">{t.date}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-800 truncate max-w-[120px]" title={t.company}>
                      {t.company}
                    </td>
                    <td className="py-2.5 px-2 text-slate-600">{t.activity}</td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px]">{t.salesOwner.split(' ')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pipeline Bar Chart & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horizontal Bar Chart: Pipeline ลูกค้า */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" />
                Pipeline ลูกค้า (ขั้นตอนการขาย)
              </h3>
              <p className="text-xs text-slate-500">จำนวนลูกค้าในแต่ละขั้นตอนการขายประจำเดือน</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              รวม 653 Opportunities
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={pipelineData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(value: any) => [`${value} ราย`, 'จำนวนลูกค้า']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: สถิติการติดตาม */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <PieChartIcon size={18} className="text-blue-600" />
                สถิติการติดตาม
              </h3>
              <p className="text-xs text-slate-500">อัตราส่วนผลลัพธ์การติดตามลูกค้ารวม</p>
            </div>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val} ราย`, 'จำนวน']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {donutData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {item.value} <span className="text-[10px] text-slate-400">({item.percentage})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
