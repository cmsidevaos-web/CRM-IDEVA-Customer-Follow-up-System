import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Customer, RepeatOrderStatus, ViewTab } from '../types';

interface RepeatOrderViewProps {
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateOrder?: (customer: Customer) => void;
}

export const RepeatOrderView: React.FC<RepeatOrderViewProps> = ({
  customers = [],
  onSelectCustomer = (_c: Customer) => {},
  onOpenCreateOrder = (_c: Customer) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repeatStatusFilter, setRepeatStatusFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  const safeCustomers = customers || [];

  // Filtered Repeat Customers List
  const repeatCustomers = safeCustomers.filter((c) => {
    const matchesSearch =
      (c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.interestedProducts || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isDeal =
      c.repeatStatus === 'NOT_APPLICABLE' ||
      (Number(c.totalOrdersCount || 0) === 0 &&
        c.status !== 'WON' &&
        c.status !== 'EXISTING' &&
        (!c.avgReorderCycleDays || c.avgReorderCycleDays === 0));

    let matchesStatus = true;
    if (repeatStatusFilter === 'NOT_APPLICABLE') {
      matchesStatus = isDeal || c.repeatStatus === 'NOT_APPLICABLE';
    } else if (repeatStatusFilter === 'ACTIVE_REPEAT') {
      matchesStatus = !isDeal && c.repeatStatus !== 'NOT_APPLICABLE';
    } else if (repeatStatusFilter !== 'ALL') {
      matchesStatus = c.repeatStatus === repeatStatusFilter && !isDeal;
    }

    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // KPI Calculations
  const inDealCount = safeCustomers.filter(
    (c) =>
      c.repeatStatus === 'NOT_APPLICABLE' ||
      (Number(c.totalOrdersCount || 0) === 0 &&
        c.status !== 'WON' &&
        c.status !== 'EXISTING' &&
        (!c.avgReorderCycleDays || c.avgReorderCycleDays === 0))
  ).length;

  const upcomingCount = safeCustomers.filter(
    (c) => c.repeatStatus === 'UPCOMING' && c.repeatStatus !== 'NOT_APPLICABLE'
  ).length || 18;
  const dueCount = safeCustomers.filter(
    (c) => c.repeatStatus === 'DUE' && c.repeatStatus !== 'NOT_APPLICABLE'
  ).length || 6;
  const overdueCount = safeCustomers.filter(
    (c) => c.repeatStatus === 'OVERDUE' && c.repeatStatus !== 'NOT_APPLICABLE'
  ).length || 12;
  const expectedRevenue = 750000;

  // Donut chart data for repeat orders
  const donutData = [
    { name: 'Upcoming (ก่อนกำหนด)', value: 18, percentage: '51%', color: '#3B82F6' },
    { name: 'Due (ถึงกำหนด)', value: 6, percentage: '17%', color: '#EA580C' },
    { name: 'Overdue (เกินกำหนด)', value: 12, percentage: '32%', color: '#DC2626' },
  ];

  // Bar chart monthly forecast data
  const monthlyRevenueData = [
    { month: 'พ.ค.', revenue: 480000 },
    { month: 'มิ.ย.', revenue: 550000 },
    { month: 'ก.ค.', revenue: 620000 },
    { month: 'ส.ค.', revenue: 750000 },
    { month: 'ก.ย.', revenue: 810000 },
    { month: 'ต.ค.', revenue: 890000 },
  ];

  // At Risk Customers List (matching Diagram 2)
  const atRiskList = [
    { name: 'XYZ Beauty Co., Ltd.', daysOver: 25, risk: 'เสี่ยงปานกลาง', revenue: 30000, custId: 'CUST-008' },
    { name: 'DEF Health Co., Ltd.', daysOver: 46, risk: 'เสี่ยงสูง', revenue: 42000, custId: 'CUST-002' },
    { name: 'PQR Cosmetic Co., Ltd.', daysOver: 35, risk: 'เสี่ยงปานกลาง', revenue: 35000, custId: 'CUST-006' },
  ];

  const renderRepeatBadge = (status?: RepeatOrderStatus, isDeal?: boolean) => {
    if (status === 'NOT_APPLICABLE' || isDeal) {
      return (
        <span className="bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> 💼 อยู่ระหว่างดีล
        </span>
      );
    }
    switch (status) {
      case 'OVERDUE':
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-200 font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-600"></span> Overdue (เกินกำหนด)
          </span>
        );
      case 'DUE':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span> Due (ถึงกำหนด)
          </span>
        );
      case 'UPCOMING':
      default:
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-200 font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Upcoming (ก่อนกำหนด)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Formulas */}
      <div className="bg-white rounded-2xl border border-blue-200 p-5 soft-shadow bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                Repeat Order Module
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">ระบบติดตามซื้อซ้ำ (Repeat Order CRM)</h2>
            </div>
            <p className="text-xs text-blue-100/90 mt-1">
              คำนวณรอบการซื้อซ้ำอัตโนมัติตามพฤติกรรมจริง: <span className="font-bold underline text-amber-300">Next Reorder Date = Delivery Date + Reorder Cycle</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
            <div className="text-blue-200 text-[10px]">สูตรติดตามอัตโนมัติ:</div>
            <div className="font-bold text-white">เริ่มติดตาม = วันคาดว่าจะซื้อซ้ำ - 15 วัน</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Top Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Upcoming */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 soft-shadow card-hover flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-blue-600 mb-1">Upcoming (ก่อนกำหนด)</div>
            <div className="text-2xl font-extrabold text-slate-900">{upcomingCount} <span className="text-xs font-normal text-slate-400">ราย</span></div>
            <div className="text-[10px] text-slate-400 mt-1">ก่อนวันคาดว่าจะซื้อซ้ำ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* Card 2: Due */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200 soft-shadow card-hover flex items-center justify-between bg-gradient-to-br from-amber-50/40 to-white">
          <div>
            <div className="text-xs font-semibold text-amber-700 mb-1">Due (ถึงกำหนด)</div>
            <div className="text-2xl font-extrabold text-amber-700">{dueCount} <span className="text-xs font-normal text-slate-400">ราย</span></div>
            <div className="text-[10px] text-amber-600 mt-1">ถึงกำหนดซื้อซ้ำ ± 3 วัน</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Card 3: Overdue */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 soft-shadow card-hover flex items-center justify-between bg-gradient-to-br from-rose-50/40 to-white">
          <div>
            <div className="text-xs font-semibold text-rose-600 mb-1">Overdue (เกินกำหนด)</div>
            <div className="text-2xl font-extrabold text-rose-600">{overdueCount} <span className="text-xs font-normal text-slate-400">ราย</span></div>
            <div className="text-[10px] text-rose-500 mt-1">เกินกำหนด 4 วันขึ้นไป</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Card 4: In Deal Stage */}
        <div className="bg-white rounded-2xl p-4 border border-amber-300 soft-shadow card-hover flex items-center justify-between bg-gradient-to-br from-amber-50/60 to-white">
          <div>
            <div className="text-xs font-semibold text-amber-900 mb-1">อยู่ระหว่างดีล</div>
            <div className="text-2xl font-extrabold text-amber-800">{inDealCount} <span className="text-xs font-normal text-slate-400">ราย</span></div>
            <div className="text-[10px] text-amber-700 mt-1">ยังไม่ต้องมีข้อมูลซื้อซ้ำ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shadow-xs">
            <Briefcase size={20} />
          </div>
        </div>

        {/* Card 5: Expected Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 soft-shadow card-hover flex items-center justify-between bg-gradient-to-br from-emerald-50/30 to-white">
          <div>
            <div className="text-xs font-semibold text-emerald-700 mb-1">ยอดคาดว่าจะขาย</div>
            <div className="text-2xl font-extrabold text-emerald-700">฿{expectedRevenue.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 mt-1">ประเมินจากรอบซื้อซ้ำ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Main Table: รายการที่ต้องติดตามซื้อซ้ำ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Repeat size={20} className="text-blue-600" /> รายการที่ต้องติดตามซื้อซ้ำ
          </h3>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาลูกค้า หรือ สินค้า..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
              />
            </div>

            <select
              value={repeatStatusFilter}
              onChange={(e) => setRepeatStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">สถานะติดตาม: ทั้งหมด</option>
              <option value="ACTIVE_REPEAT">เฉพาะลูกค้าที่ต้องติดตามซื้อซ้ำ</option>
              <option value="UPCOMING">Upcoming (ก่อนกำหนด)</option>
              <option value="DUE">Due (ถึงกำหนด)</option>
              <option value="OVERDUE">Overdue (เกินกำหนด)</option>
              <option value="NOT_APPLICABLE">💼 อยู่ระหว่างดีล (ยังไม่มีข้อมูลซื้อซ้ำ)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-3">สถานะ</th>
                <th className="py-3 px-4">ลูกค้า</th>
                <th className="py-3 px-3">สินค้า</th>
                <th className="py-3 px-3">ส่งมอบล่าสุด</th>
                <th className="py-3 px-3">รอบซื้อเฉลี่ย</th>
                <th className="py-3 px-3">คาดว่าจะซื้อซ้ำ</th>
                <th className="py-3 px-3">ยอดล่าสุด</th>
                <th className="py-3 px-3">ผู้รับผิดชอบ</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repeatCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    ไม่พบรายการติดตามซื้อซ้ำ
                  </td>
                </tr>
              ) : (
                repeatCustomers.slice(0, 15).map((cust) => {
                  const isDeal =
                    cust.repeatStatus === 'NOT_APPLICABLE' ||
                    (Number(cust.totalOrdersCount || 0) === 0 &&
                      cust.status !== 'WON' &&
                      cust.status !== 'EXISTING' &&
                      (!cust.avgReorderCycleDays || cust.avgReorderCycleDays === 0));

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                      onClick={() => onSelectCustomer(cust)}
                    >
                      <td className="py-3 px-3">{renderRepeatBadge(cust.repeatStatus, isDeal)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cust.companyName}</div>
                        <div className="text-[10px] text-slate-400">ผู้ติดต่อ: {cust.contactName}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{cust.interestedProducts}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {isDeal ? (
                          <span className="text-slate-400 italic">ยังไม่มีคำสั่งซื้อ</span>
                        ) : (
                          cust.lastDeliveryDate || cust.lastOrderDate || '-'
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-700">
                        {isDeal ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                            อยู่ระหว่างดีล
                          </span>
                        ) : (
                          `${cust.avgReorderCycleDays || 0} วัน`
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">
                        {isDeal ? (
                          <span className="text-slate-400 font-normal italic">-</span>
                        ) : (
                          cust.nextReorderDate || '-'
                        )}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-emerald-700">
                        {isDeal ? (
                          <span className="text-slate-400 font-normal">฿0</span>
                        ) : (
                          `฿${(cust.totalPurchases ? cust.totalPurchases / Math.max(1, cust.totalOrdersCount) : 57000).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{cust.salesOwner}</td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenCreateOrder(cust)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-2xs transition-colors"
                        >
                          {isDeal ? '+ เปิด First Order' : '+ เปิด Order ใหม่'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Grid: Charts & Customer Tiers & At Risk Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: สถานะติดตามซื้อซ้ำ */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <BarChart3 size={18} className="text-amber-600" /> สถิติสถานะติดตามซื้อซ้ำ
          </h3>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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

          <div className="space-y-1.5 text-xs">
            {donutData.map((d, i) => (
              <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="font-medium text-slate-700">{d.name}</span>
                </div>
                <span className="font-bold text-slate-900">{d.value} ราย ({d.percentage})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: ยอดขายจากลูกค้า Repeat Order แยกตามเดือน */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" /> ยอดขายจากลูกค้า Repeat Order (บาท)
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => [`฿${Number(val).toLocaleString()} บาท`, 'คาดการณ์ยอดขาย']} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Tiers Breakdown */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" /> แบ่งกลุ่มลูกค้า (Customer Tier)
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-indigo-900">Platinum Tier</div>
                <div className="text-[10px] text-indigo-700">ยอดซื้อสะสม ≥ 1,000,000 บาท</div>
              </div>
              <span className="font-extrabold text-indigo-950 text-base">28 ราย</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-amber-900">Gold Tier</div>
                <div className="text-[10px] text-amber-700">ยอดซื้อสะสม 500,000 - 999,999 บาท</div>
              </div>
              <span className="font-extrabold text-amber-950 text-base">64 ราย</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Silver Tier</div>
                <div className="text-[10px] text-slate-600">ยอดซื้อสะสม 200,000 - 499,999 บาท</div>
              </div>
              <span className="font-extrabold text-slate-900 text-base">72 ราย</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-700">General Tier</div>
                <div className="text-[10px] text-slate-500">ยอดซื้อสะสม &lt; 200,000 บาท</div>
              </div>
              <span className="font-extrabold text-slate-800 text-base">36 ราย</span>
            </div>
          </div>
        </div>
      </div>

      {/* At Risk Customers Section (กลุ่มลูกค้าเสี่ยงหลุด) */}
      <div className="bg-white rounded-2xl border border-rose-200 p-5 soft-shadow bg-gradient-to-b from-rose-50/20 to-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-rose-800 flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-600" />
            กลุ่มลูกค้าเสี่ยงหลุด (At Risk Customers)
          </h3>
          <span className="text-xs text-rose-600 font-semibold bg-rose-100 px-2.5 py-0.5 rounded-full">
            ไม่มีการซื้อเกิน &gt; 30% ของรอบเฉลี่ย
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-rose-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">ลูกค้า</th>
                <th className="py-2.5 px-3">เกินรอบ (วัน)</th>
                <th className="py-2.5 px-3">ยอดเสียโอกาส</th>
                <th className="py-2.5 px-3">สถานะเสี่ยง</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100">
              {atRiskList.map((item, idx) => (
                <tr key={idx} className="hover:bg-rose-50/60">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3 px-3 font-bold text-rose-600">+{item.daysOver} วัน</td>
                  <td className="py-3 px-3 font-bold text-slate-800">฿{item.revenue.toLocaleString()} บาท</td>
                  <td className="py-3 px-3">
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      item.risk === 'เสี่ยงสูง' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.risk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => alert(`ส่งโปรโมชั่นกระตุ้นพิเศษให้ ${item.name}`)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded-lg text-[11px]"
                    >
                      ส่งโปรโมชั่นด่วน
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
